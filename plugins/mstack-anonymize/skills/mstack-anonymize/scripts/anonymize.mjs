#!/usr/bin/env node
// Replace identifying values in a text, a table or JSON with placeholders, and print the result as Markdown.
//   node anonymize.mjs [--out <file>] [--replace] [--format text|markdown|csv|tsv|json|jsonl]
//                      [--terms <file>] [--extra-terms <n>] <input-file | ->
//   node anonymize.mjs --print-terms-path
// The result goes to standard output, or to --out. The report goes to standard error and holds counts, never values.
// Exit 0: a result was produced. Exit 1: refused, nothing written. Exit 2: usage error.
// Every message is a fixed sentence with at most a path as the caller gave it: nothing from the input,
// from the terms file or from a runtime error is ever printed. No original value is written to any file.
import { closeSync, existsSync, fstatSync, ftruncateSync, openSync, readFileSync, realpathSync, statSync, writeSync } from 'node:fs';
import { isIPv4, isIPv6 } from 'node:net';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIRST_LINE = '> Identifying values in this text were replaced by rules. It may still hold personal data. Read it before you share it.';
const FORMATS = ['text', 'markdown', 'csv', 'tsv', 'json', 'jsonl'];
const BY_EXTENSION = { '.csv': 'csv', '.tsv': 'tsv', '.json': 'json', '.jsonl': 'jsonl', '.ndjson': 'jsonl', '.md': 'markdown', '.markdown': 'markdown' };
const NOT_TEXT = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.zip', '.png', '.jpg', '.jpeg', '.gif']);
const SIGNATURES = [[0x25, 0x50, 0x44, 0x46], [0x50, 0x4b, 0x03, 0x04], [0xd0, 0xcf, 0x11, 0xe0], [0x89, 0x50, 0x4e, 0x47], [0xff, 0xd8, 0xff], [0x47, 0x49, 0x46, 0x38]];
const USAGE = 'usage: node anonymize.mjs [--out <file>] [--replace] [--format text|markdown|csv|tsv|json|jsonl] [--terms <file>] [--extra-terms <n>] <input-file | ->';

// Endings that make a dotted name a host name. File endings that are also country codes (md, sh, py, pl, rs) are left out.
const TLDS = new Set(('com org net edu gov mil int io dev app ai co uk de es fr it nl eu ch at se dk fi pt ie cn jp au nz ca mx ar br cl '
  + 'info biz tv cloud tech online site xyz local internal lan corp intranet localdomain example test invalid arpa').split(' '));

// ---- Rules that find a value by its form. Order matters: an earlier rule keeps its match. ----
// { type, re, group (the capture that is the value), ok (a check on the match) }
const luhn = (digits) => {
  let sum = 0;
  for (let i = digits.length - 1, double = false; i >= 0; i--, double = !double) {
    const d = Number(digits[i]) * (double ? 2 : 1);
    sum += d > 9 ? d - 9 : d;
  }
  return sum % 10 === 0;
};
// The first digits and the length of the large card schemes, so that a long number which happens to pass
// the Luhn check, such as a timestamp in milliseconds, is not taken for a card.
const cardShape = (d) => {
  const n = d.length;
  const p2 = Number(d.slice(0, 2));
  const p4 = Number(d.slice(0, 4));
  if (d[0] === '4') return n === 13 || n === 16 || n === 19;
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return n === 16;
  if (p2 === 34 || p2 === 37) return n === 15;
  if (p2 === 36 || p2 === 38 || p2 === 30) return n === 14 || n === 16;
  if (p2 === 35 || p4 === 6011 || p2 === 65 || p2 === 64) return n === 16;
  if (p2 === 62) return n >= 16 && n <= 19;
  if (p2 === 50 || (p2 >= 56 && p2 <= 69)) return n >= 12 && n <= 19; // Maestro
  return false;
};
// The check digits of an IBAN: the first four characters go to the end, letters become numbers, the rest modulo 97 is 1.
const ibanOk = (compact) => {
  if (compact.length < 15 || compact.length > 34) return false;
  let rest = 0;
  for (const ch of compact.slice(4) + compact.slice(0, 4)) {
    const n = ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of n) rest = (rest * 10 + Number(d)) % 97;
  }
  return rest === 1;
};
// A match can run into the next word; drop words from its end until the check digits are right.
const fitIban = (value) => {
  for (let v = value; v.length >= 15; v = v.slice(0, v.lastIndexOf(' '))) {
    if (ibanOk(v.replaceAll(' ', ''))) return v;
    if (!v.includes(' ')) break;
  }
  return null;
};
const digitsOf = (v) => v.replace(/\D/g, '');
// A number with an optional sign, written with separators (1,200.50) or with spaces between groups of three (1 234,56).
const NUMBER = '[-+]?(?:\\d{1,3}(?:[ \\u00a0]\\d{3})+(?:[.,]\\d+)?|\\d[\\d.,]*)';
const CURRENCY = 'USD|EUR|GBP|CHF|JPY|CAD|AUD|MXN|ARS|BRL|CLP|COP|PEN|UYU';
const SECRET_KEYS = 'password|passwd|passwort|kennwort|contraseña|clave|secret|token|api[_-]?key|apikey|access[_-]?key|client[_-]?secret|authorization';
const ID_WORDS = 'order|ticket|invoice|account|customer|case|booking|reference|bestellung|bestellnummer|auftrag|auftragsnummer|rechnung|rechnungsnummer'
  + '|kundennummer|kunde|kontonummer|konto|vorgang|vorgangsnummer|pedido|factura|cuenta|cliente|expediente|referencia|reserva';
// Well-known technical names that have the form of a code and are kept as they are.
const KEPT_CODES = new Set(['UTF-8', 'UTF-16', 'UTF-32', 'ISO-8859', 'SHA-1', 'SHA-256', 'SHA-512', 'MD-5', 'HTTP-2', 'COVID-19']);
const DATE_LIKE = /^(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}-\d{1,2}-\d{2,4})$/;
const BIRTH_WORDS = '(?:born(?:\\s+on)?|date\\s+of\\s+birth|birth\\s?date|birthday|d\\.?o\\.?b\\.?|geboren(?:\\s+am)?|geburtsdatum|geb\\.|nacid[oa](?:\\s+el)?|fecha\\s+de\\s+nacimiento)';
const DATE = '\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4}|\\d{1,2}\\.?\\s+(?:de\\s+)?\\p{L}+\\.?\\s+(?:de\\s+)?\\d{4}|\\p{L}+\\s+\\d{1,2},?\\s+\\d{4}';
const VERSION_BEFORE = /(?:\bv|\bversion|\bver\.?|\brelease|\bbuild)\s*$/i;
const FORM_RULES = [
  { type: 'SECRET', re: /(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g },
  // After an Authorization key every token counts, however short, and so does the word after "Bearer".
  // "Basic" alone is an ordinary word ("Basic settings"), so its token needs a digit or 16 characters.
  { type: 'SECRET', re: /authorization["']?\s*[=:]\s*["']?(?:Bearer|Basic|Token)\s+([^\s"',;]+)/gid, group: 1 },
  { type: 'SECRET', re: /\bBearer\s+([A-Za-z0-9._~+/=-]+)/gd, group: 1 },
  { type: 'SECRET', re: /\bBasic\s+([A-Za-z0-9._~+/=-]{8,})/gd, group: 1, ok: (v) => /\d/.test(v) || v.length >= 16 },
  {
    type: 'SECRET',
    re: /(?<![A-Za-z0-9_])(?:(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|glpat-[A-Za-z0-9_-]{20,})/g,
  },
  {
    // A quoted value runs to its closing quote, over escaped quotes; an unquoted one to the next space or separator.
    // After an Authorization key the scheme word alone is not the credential.
    type: 'SECRET', group: [1, 2, 3],
    re: new RegExp(`(?<![A-Za-z0-9])["']?(?:${SECRET_KEYS})["']?\\s*[=:]\\s*(?:"((?:[^"\\\\\\n]|\\\\.)*)"|'((?:[^'\\\\\\n]|\\\\.)*)'|([^\\s"',;&]+))`, 'giud'),
    ok: (v, line, at, m) => !(/^["']?authorization/i.test(m[0]) && /^(?:bearer|basic|token)$/i.test(v)),
  },
  { type: 'BIRTHDATE', re: new RegExp(`(?<![\\p{L}\\p{N}])${BIRTH_WORDS}["']?[:=\\s]*["']?(${DATE})`, 'giud'), group: 1 },
  { type: 'URL', re: /\b(?:https?|wss?|s?ftp|ssh|file):\/\/[^\s<>"'`)\]]+/gi, trim: /[.,;:!?]+$/ },
  // The look-behind keeps a long unbroken line from being rescanned at every position.
  { type: 'EMAIL', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g },
  { type: 'IP', re: /(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?!\w|\.\d)/g, ok: (v, line, at) => isIPv4(v) && !VERSION_BEFORE.test(line.slice(Math.max(0, at - 12), at)) },
  { type: 'IP', re: /(?<![\w:.])(?:[A-Fa-f0-9]{0,4}:){2,7}[A-Fa-f0-9]{0,4}(?![\w:])/g, ok: (v) => v.length > 2 && isIPv6(v) },
  { type: 'IBAN', re: /(?<![A-Za-z0-9])[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?(?![A-Za-z0-9])/g, fit: fitIban },
  { type: 'CARD', re: /(?<![\w-])(?:\d[ -]?){12,18}\d(?![\w-])/g, ok: (v) => cardShape(digitsOf(v)) && luhn(digitsOf(v)) },
  {
    type: 'PHONE', re: /(?<![\w+])\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){2,5}(?![ .-]?\d)/g,
    // A closing bracket without its opening one belongs to the sentence, not to the number.
    fit: (v) => (v.endsWith(')') && !v.includes('(') ? v.slice(0, -1) : v),
    ok: (v) => digitsOf(v).length >= 8 && digitsOf(v).length <= 15,
  },
  // A national number is two to four digits, then two groups of three or four, split by a space or a hyphen.
  { type: 'PHONE', re: /(?<![\w.-])(?<!\d[ .-])\(?\d{2,4}\)?[ -]\d{3,4}[ -]\d{3,4}(?![\w-])(?![ .-]?\d)/g },
  { type: 'AMOUNT', re: new RegExp(`(?<!\\w)[$€£¥]\\s?${NUMBER}`, 'g'), trim: /[.,]+$/ },
  { type: 'AMOUNT', re: new RegExp(`(?<![\\w.,])${NUMBER}\\s?[$€£¥](?!\\w)`, 'g') },
  { type: 'AMOUNT', re: new RegExp(`\\b(?:${CURRENCY})\\s?${NUMBER}`, 'g'), trim: /[.,]+$/ },
  { type: 'AMOUNT', re: new RegExp(`(?<![\\w.,])${NUMBER}\\s?(?:${CURRENCY})\\b`, 'g') },
  { type: 'USER', re: /(\/(?:home|Users)\/)([^/\s:"'<>|]+)/gd, group: 2 },
  { type: 'USER', re: /([A-Za-z]:\\Users\\)([^\\\s:"'<>|]+)/gd, group: 2 },
  { type: 'HOST', re: /\blocalhost\b/g },
  {
    type: 'HOST', re: /(?<![\w@.-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+([A-Za-z]{2,})(?![\w-]|\.\w)/g,
    ok: (v, line, at, m) => TLDS.has(m[1].toLowerCase()) && (m[1] === m[1].toLowerCase() || v === v.toUpperCase()),
  },
  {
    type: 'ID', group: 1,
    // After a whole trigger word: a number of any length, or a code that holds a digit or is written in capitals.
    // A plain word stays ("order confirmed"), and so do "I" ("the order I placed") and the SQL words of ORDER BY and CASE WHEN.
    re: new RegExp(`(?<![\\p{L}\\p{N}_])(?:${ID_WORDS})(?![\\p{L}\\p{N}_])\\s*(?:(?:number|no\\.?|nr\\.?|num\\.?|n\\.?[º°]|número|numero|id|#)\\s*)?[:#]?\\s*([A-Za-z0-9][A-Za-z0-9-]*)`, 'giud'),
    // The number may be the start of a date written with dots or slashes (order 17.11.2026), which stays.
    ok: (v, line, at) => !DATE_LIKE.test(v) && !/^(?:id|no|nr|num|number)$/i.test(v) && !/^\d{1,4}[./]\d{1,2}[./]\d{1,4}(?!\d)/.test(line.slice(at))
      && (/\d/.test(v) || (/^[A-Z][A-Z0-9-]*$/.test(v) && !['I', 'BY', 'WHEN'].includes(v))),
  },
  { type: 'ID', re: /(?<![\p{L}\p{N}_-])[A-Z]+-\d+(?![\p{L}\p{N}_]|-\w)/gu, ok: (v) => !KEPT_CODES.has(v) },
];
const KEY_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const LOWER_KEY = new Set(['EMAIL', 'HOST']);

// ---- Values known by themselves: the terms of the terms file, and values learned from a column or key. ----
// A dictionary is indexed by the first word of each value, so a line is scanned once however many values there are.
const WORD = /[\p{L}\p{N}_]+/gu;
const GLUE = '-:./';
const escapeRegExp = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordChar = (ch) => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch);
function newDict() { return { byWord: new Map(), exact: new Map(), multi: [] }; }
function addToDict(dict, value, type) {
  const lower = value.toLowerCase();
  const first = value.match(/[\p{L}\p{N}_]+/u);
  if (!first || dict.exact.has(lower)) return;
  const entry = { value, lower, type, offset: first.index };
  dict.exact.set(lower, entry);
  if (value.includes('\n')) { dict.multi.push(entry); return; } // found over the whole text, see clean()
  const word = first[0].toLowerCase();
  if (!dict.byWord.has(word)) dict.byWord.set(word, []);
  dict.byWord.get(word).push(entry);
}
// True when the text holds the value at this place, in any case, as a whole word.
function standsAt(text, start, e) {
  const end = start + e.value.length;
  if (start < 0 || text.slice(start, end).toLowerCase() !== e.lower) return false;
  if (isWordChar(e.value[0]) && isWordChar(text[start - 1])) return false;
  if (isWordChar(e.value[e.value.length - 1]) && isWordChar(text[end])) return false;
  // A value that is only digits is not taken out of a longer number: 11 is not a part of 2026-11-17,
  // of 08:11:02 or of 3.11.2. A comma is no such join, because it also separates the numbers of a list.
  if (!/^\d+$/.test(e.value)) return true;
  const digit = (ch) => ch !== undefined && ch >= '0' && ch <= '9';
  const glue = (ch) => ch !== undefined && GLUE.includes(ch);
  return !(glue(text[start - 1]) && digit(text[start - 2])) && !(glue(text[end]) && digit(text[end + 1]));
}
// Every place in a line where a value of the dictionary stands as a whole word, in any case.
function dictSpans(line, dict) {
  const found = [];
  if (dict.byWord.size === 0) return found;
  for (const m of line.matchAll(WORD)) {
    for (const e of dict.byWord.get(m[0].toLowerCase()) || []) {
      const start = m.index - e.offset;
      if (standsAt(line, start, e)) found.push({ start, end: start + e.value.length, type: e.type, value: e.value });
    }
  }
  return found.sort((a, b) => (b.end - b.start) - (a.end - a.start));
}

export function newState() {
  return { table: new Map(), next: {}, counts: {}, terms: newDict(), learned: newDict(), termCount: 0, skipped: 0, extra: 0 };
}

// The placeholder of a value: the same value of the same type always gets the same one in a run.
function placeholder(state, type, value) {
  // One value written in two ways (with and without spaces, in another case) is one value.
  let norm = value;
  if (type === 'URL') norm = value.replace(/^([a-z][a-z0-9+.-]*:\/\/)([^/?#@]*@)?([^/?#]*)/i, (_, scheme, user, host) => scheme.toLowerCase() + (user || '') + host.toLowerCase()); // the user name and the path keep their case
  else if (LOWER_KEY.has(type)) norm = value.toLowerCase();
  else if (type === 'CARD' || type === 'IBAN' || type === 'PHONE') norm = value.replace(/[\s().-]/g, '').toUpperCase();
  const key = `${type}\u0000${norm}`;
  if (!state.table.has(key)) {
    state.next[type] = (state.next[type] || 0) + 1;
    state.table.set(key, `[${type}_${state.next[type]}]`);
  }
  state.counts[type] = (state.counts[type] || 0) + 1;
  return state.table.get(key);
}

// Spans in the order of the text, without overlaps. A span inside another one is dropped: a term inside a
// token or an address must not leave the rest of it visible. Spans that cross become one, of the longest
// one's type. Of two spans of the same place the one added first stays. One sorted pass, so a line with
// very many values takes no longer per value.
function resolveSpans(spans) {
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (!last || s.start >= last.end) { out.push({ ...s, longest: s.end - s.start }); continue; }
    if (s.end <= last.end) continue;
    if (s.end - s.start > last.longest) { last.type = s.type; last.longest = s.end - s.start; }
    last.end = s.end;
    last.value = undefined;
  }
  return out;
}

// Every span of one line that a rule replaces: known values first, then the rules by form.
function spansOf(line, state) {
  const spans = [];
  for (const dict of [state.terms, state.learned]) for (const d of dictSpans(line, dict)) spans.push({ start: d.start, end: d.end, type: d.type, value: d.value });
  for (const rule of FORM_RULES) {
    for (const m of line.matchAll(rule.re)) {
      let start = m.index;
      let value = m[0];
      const group = Array.isArray(rule.group) ? rule.group.find((g) => m[g] !== undefined) : rule.group;
      if (group) { [start] = m.indices[group]; value = m[group]; }
      if (rule.trim) value = value.replace(rule.trim, '');
      if (rule.fit) value = rule.fit(value);
      if (!value) continue;
      if (rule.ok && !rule.ok(value, line, start, m)) continue;
      spans.push({ start, end: start + value.length, type: rule.type });
    }
  }
  return resolveSpans(spans);
}

// Apply every rule to a text and return the cleaned text. A key block and a known value that holds a line
// break are found over the whole text, everything else line by line, and all of it is resolved together,
// so a value over two lines cannot cut a match on one of them in two.
export function clean(text, state) {
  const all = [];
  for (const m of text.matchAll(KEY_BLOCK)) all.push({ start: m.index, end: m.index + m[0].length, type: 'SECRET', value: m[0] });
  if (text.includes('\n')) {
    for (const dict of [state.terms, state.learned]) {
      for (const e of dict.multi) {
        // A pattern, not a search in the lower-cased text: lower case can change the length of a text.
        e.re ??= new RegExp(escapeRegExp(e.value), 'giu');
        for (const m of text.matchAll(e.re)) {
          if (standsAt(text, m.index, e)) all.push({ start: m.index, end: m.index + m[0].length, type: e.type, value: e.value });
        }
      }
    }
  }
  let offset = 0;
  for (const line of text.split('\n')) {
    for (const s of spansOf(line, state)) all.push({ start: s.start + offset, end: s.end + offset, type: s.type, value: s.value });
    offset += line.length + 1;
  }
  let out = '';
  let at = 0;
  for (const s of resolveSpans(all)) {
    out += text.slice(at, s.start) + placeholder(state, s.type, s.value ?? text.slice(s.start, s.end));
    at = s.end;
  }
  return out + text.slice(at);
}

// ---- Output ----
function fenced(lang, text) {
  let longest = 2;
  for (const run of text.match(/`+/g) || []) if (run.length > longest) longest = run.length;
  const fence = '`'.repeat(longest + 1);
  return `${fence}${lang}\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}\n`;
}
const countLines = (text) => (text === '' ? 0 : text.replace(/\n$/, '').split('\n').length);

// ---- Column and key names. A name is split into words and matched by whole words, in English, German and Spanish. ----
const words = (list) => new Set(list.split(' '));
const NAME_SETS = [
  ['EMAIL', words('email mail correo emailadresse mailadresse emailaddress')],
  ['PHONE', words('phone telephone tel mobile cell cellphone fax telefon telefonnummer handy handynummer mobil mobilnummer mobiltelefon teléfono telefono móvil movil celular')],
  ['BIRTHDATE', words('birthdate birthday birth dob geburtsdatum geburtstag geburt nacimiento cumpleaños')],
  ['SECRET', words('password passwd passwort kennwort contraseña clave secret token apikey')],
  ['ADDRESS', words('address street city town zip zipcode postcode postal adresse anschrift straße strasse hausnummer plz postleitzahl ort wohnort stadt dirección direccion calle ciudad domicilio localidad población poblacion cp')],
  ['AMOUNT', words('amount price total subtotal revenue cost salary balance payment fee betrag preis summe gesamt gesamtbetrag umsatz kosten gehalt saldo importe precio monto coste costo salario ingresos pago')],
];
const ID_LAST = words('id ids nr nummer number no num número numero uuid guid ref reference referenz referencia');
const ID_ANY = words('account konto cuenta iban bic ssn passport reisepass ausweis pasaporte dni nif nie');
const USER_WORDS = words('username user login benutzer benutzername nutzername loginname usuario nick nickname handle');
const COMPANY_WORDS = words('company firma firmenname unternehmen empresa compañía compania organization organisation employer arbeitgeber empleador business vendor supplier lieferant proveedor');
const PERSON_WORDS = words('customer client contact kunde kundin kunden cliente contacto ansprechpartner employee mitarbeiter empleado patient paciente person persona owner recipient empfänger destinatario assignee requester reporter sender absender remitente author autor agent member mitglied miembro kontakt kontaktperson ansprechperson titular');
const NAME_WORDS = words('firstname lastname fullname surname forename vorname nachname familienname zuname kundenname apellido apellidos nombres');
const BARE_NAME = words('name names nombre');
const NAME_QUALIFIERS = words('first last full middle given family sur vor nach display completo completa apellido apellidos');
// A name that ends in one of these words describes the value, it does not hold it: email_status, phone_type, total_count.
const DESCRIBING = words('count counts anzahl cantidad length size type typ tipo status flag format lang language version');

function typeOfName(name) {
  if (String(name).includes('@')) return null; // a key that is itself an address is a value, not a name
  const w = String(name).normalize('NFC').replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (w.length === 0 || DESCRIBING.has(w[w.length - 1])) return null;
  const has = (set) => w.some((x) => set.has(x));
  for (const [type, set] of NAME_SETS) if (has(set)) return type;
  if ((w.includes('api') || w.includes('access')) && w.includes('key')) return 'SECRET';
  const last = w[w.length - 1];
  if (ID_LAST.has(last) || /(?:nummer|número|numero)$/u.test(last) || has(ID_ANY)) return 'ID';
  if (has(USER_WORDS)) return 'USER';
  if (has(COMPANY_WORDS)) return 'COMPANY';
  if (has(NAME_WORDS) || has(PERSON_WORDS)) return 'NAME';
  if (has(BARE_NAME) && (w.length === 1 || has(NAME_QUALIFIERS))) return 'NAME';
  return null;
}

// A whole cell or leaf under a matching name. A value keeps the type it got first: from the terms file,
// or from the first column or key it was learned from, so one value has one placeholder.
function wholeValue(state, type, value) {
  const known = state.terms.exact.get(value.toLowerCase()) || state.learned.exact.get(value.toLowerCase());
  return known ? placeholder(state, known.type, known.value) : placeholder(state, type, value);
}
// A value replaced because of its column or key is replaced, as a whole word, everywhere in the input.
function learn(state, type, value) {
  if (!state.terms.exact.has(value.toLowerCase())) addToDict(state.learned, value, type);
}

// ---- Tables ----
// Parse separated text with quoted cells. Returns null when a quote is never closed.
function parseTable(text, sep) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') {
        quoted = false;
        const next = text[i + 1]; // after a closing quote only a separator or the end of the row may follow
        const rowEnd = next === '\n' || (next === '\r' && (text[i + 2] === '\n' || text[i + 2] === undefined));
        if (next !== undefined && next !== sep && !rowEnd) return null;
      } else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; } else if (ch === '\n') {
      row.push(cell.endsWith('\r') ? cell.slice(0, -1) : cell);
      rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (quoted) return null;
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
function readTable(text, kind) {
  const candidates = kind === 'tsv' ? ['\t'] : [',', ';', '\t'];
  // The separator the first line uses most must read the whole table. When it cannot, the table is broken,
  // and another separator would only read it as one column.
  const head = text.split('\n', 1)[0].replace(/"[^"]*"/g, '""'); // a separator inside a quoted cell does not count
  const uses = (sep) => head.split(sep).length - 1;
  const main = candidates.reduce((a, b) => (uses(b) > uses(a) ? b : a));
  if (uses(main) > 0 && !parseTable(text, main)) return null;
  let best = null;
  for (const sep of candidates) {
    const rows = parseTable(text, sep);
    if (!rows || rows.length === 0) continue;
    const width = rows[0].length;
    const even = rows.slice(0, 10).every((r) => r.length === width);
    if (!best || (even && width > best.width) || (even && !best.even)) best = { rows, width, even };
  }
  return best ? best.rows : null;
}
const NUMBER_LIKE = /^[-+]?[\d.,\s]*\d[\d.,\s]*%?$/;
const DATE_CELL = new RegExp(`^(?:${DATE})(?:[T ]\\d{1,2}:\\d{2}(?::\\d{2}(?:[.,]\\d+)?)?\\s?(?:Z|[+-]\\d{2}:?\\d{2})?)?$`, 'u');
const isHeader = (row, state) => row.some((c) => c.trim() !== '')
  && !row.some((c) => NUMBER_LIKE.test(c.trim()) || DATE_CELL.test(c.trim()) || spansOf(c, state).length > 0);
const mdCell = (c) => c.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');

function renderTable(rows, state, info) {
  let width = 0;
  for (const r of rows) if (r.length > width) width = r.length;
  const header = isHeader(rows[0], state) ? rows[0] : null;
  const data = header ? rows.slice(1) : rows;
  const typesOfColumns = Array.from({ length: width }, (_, i) => (header ? typeOfName(header[i] ?? '') : null));
  for (const r of data) r.forEach((c, i) => { if (typesOfColumns[i] && c.trim() !== '') learn(state, typesOfColumns[i], c.trim()); });
  const names = header ? Array.from({ length: width }, (_, i) => clean(header[i] ?? '', state)) : Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
  const line = (cells) => `| ${cells.map(mdCell).join(' | ')} |`;
  const out = [line(names), line(names.map(() => '---'))];
  for (const r of data) {
    out.push(line(Array.from({ length: width }, (_, i) => {
      const c = r[i] ?? '';
      if (typesOfColumns[i]) return c.trim() === '' ? c : wholeValue(state, typesOfColumns[i], c.trim());
      return clean(c, state);
    })));
  }
  info.count = `${data.length} rows`;
  info.whole = header ? (names.filter((_, i) => typesOfColumns[i]).join(', ') || 'none') : 'no header recognized';
  return `${out.join('\n')}\n`;
}

// ---- JSON ----
function walkJson(node, type, visit) {
  if (Array.isArray(node)) return node.map((x) => walkJson(x, type, visit));
  if (node && typeof node === 'object') {
    const seen = new Set();
    const nextSuffix = new Map(); // per cleaned key, so many keys that collide do not search from 2 each time
    return Object.fromEntries(Object.entries(node).map(([k, v]) => {
      const cleaned = visit.key(k);
      let key = cleaned; // two keys that clean to one placeholder both keep their entry
      if (seen.has(key)) {
        let n = nextSuffix.get(cleaned) || 2;
        do key = `${cleaned} (${n++})`; while (seen.has(key));
        nextSuffix.set(cleaned, n);
      }
      seen.add(key);
      return [key, walkJson(v, type || typeOfName(k), visit)];
    }));
  }
  return visit.leaf(node, type);
}
function renderJson(docs, state, info, lines) {
  const wholeKeys = new Set();
  const noteKeys = (node) => {
    if (Array.isArray(node)) node.forEach(noteKeys);
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) { if (typeOfName(k)) wholeKeys.add(k); noteKeys(v); }
  };
  const isValue = (v) => typeof v === 'string' || typeof v === 'number';
  const learning = { key: (k) => k, leaf: (v, t) => { if (t && isValue(v) && String(v).trim() !== '') learn(state, t, String(v).trim()); return v; } };
  const cleaning = {
    key: (k) => clean(k, state),
    leaf: (v, t) => {
      if (t && isValue(v) && String(v).trim() !== '') return wholeValue(state, t, String(v).trim());
      if (typeof v === 'string') return clean(v, state);
      if (typeof v !== 'number') return v;
      const text = clean(String(v), state); // a number is a value too: a card number, an identifier
      return text === String(v) ? v : text;
    },
  };
  docs.forEach((d) => { noteKeys(d); walkJson(d, null, learning); });
  const cleaned = docs.map((d) => walkJson(d, null, cleaning));
  info.count = `${lines ? docs.length : (Array.isArray(docs[0]) ? docs[0].length : 1)} records`;
  info.whole = [...wholeKeys].map((k) => clean(k, state)).join(', ') || 'none';
  return fenced('json', lines ? cleaned.map((d) => JSON.stringify(d)).join('\n') : JSON.stringify(cleaned[0], null, 2));
}
// A whole number that a JavaScript number cannot hold exactly is read as a string, so its digits stay as written.
const exactNumbers = (text) => text.replace(/"(?:[^"\\]|\\.)*"|(?<![\d.eE+-])-?\d{16,}(?![\d.eE])/g, (m) => (m[0] === '"' || String(Number(m)) === m ? m : `"${m}"`));
function parseJson(text, lines) {
  try {
    JSON.parse(lines ? '0' : text); // an input that is no JSON stays one, whatever the step above would make of it
    return lines ? text.split('\n').filter((l) => l.trim() !== '').map((l) => { JSON.parse(l); return JSON.parse(exactNumbers(l)); }) : [JSON.parse(exactNumbers(text))];
  } catch { return null; }
}

function render(kind, text, state, info) {
  if (kind === 'csv' || kind === 'tsv') {
    const rows = readTable(text, kind);
    if (rows) return renderTable(rows, state, info);
    info.fallback = 'no table could be read';
  } else if (kind === 'json' || kind === 'jsonl') {
    const docs = parseJson(text, kind === 'jsonl');
    if (docs && docs.length) return renderJson(docs, state, info, kind === 'jsonl');
    info.fallback = 'no JSON could be read';
  }
  info.count = `${countLines(text)} lines`;
  if (kind === 'markdown') return clean(text, state);
  return fenced('text', clean(text, state));
}

// ---- The terms file ----
// The path of the default terms file, for a platform name as process.platform gives it and an environment.
export function termsPath(platform, env) {
  const sep = platform === 'win32' ? '\\' : '/';
  const base = platform === 'win32'
    ? (env.APPDATA || `${env.USERPROFILE || ''}\\AppData\\Roaming`)
    : (env.XDG_CONFIG_HOME || `${env.HOME || ''}/.config`);
  return [base, 'mstack', 'anonymize-terms.txt'].join(sep);
}

// One term per line, optionally with person:, customer: or company: in front; # starts a comment.
function loadTerms(state, text) {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z]+)\s*:\s*(.+)$/);
    const type = m ? { person: 'PERSON', customer: 'CUSTOMER', company: 'COMPANY' }[m[1].toLowerCase()] : 'TERM';
    const value = (m ? m[2] : line).trim();
    if (!type || !/[\p{L}\p{N}]/u.test(value)) { state.skipped++; continue; }
    if (!state.terms.exact.has(value.toLowerCase())) state.termCount++;
    addToDict(state.terms, value, type);
  }
}

// ---- The command line ----
class Refusal extends Error { constructor(code, message) { super(message); this.code = code; } }
const refuse = (message) => { throw new Refusal(1, `mstack-anonymize: ${message}`); };
const usage = () => { throw new Refusal(2, USAGE); };

function parseArgs(argv) {
  const o = { out: null, replace: false, format: null, input: null, terms: null, extraTerms: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--replace') o.replace = true;
    else if (a === '--out' || a === '--format' || a === '--terms' || a === '--extra-terms') {
      if (argv[i + 1] === undefined) usage();
      o[a === '--extra-terms' ? 'extraTerms' : a.slice(2)] = argv[++i];
    } else if (a === '-' || !a.startsWith('--')) {
      if (o.input !== null) usage();
      o.input = a;
    } else usage();
  }
  if (o.input === null || (o.format && !FORMATS.includes(o.format))) usage();
  if (o.extraTerms !== null) {
    if (!/^[1-9]\d*$/.test(o.extraTerms)) usage();
    o.extraTerms = Number(o.extraTerms);
  }
  return o;
}

// Standard input holds the additional terms first, one per line, then the text when the input is "-".
// A frame that does not fit is a usage error, before anything is read from a file or written.
function readStdin(o) {
  if (o.input !== '-' && o.extraTerms === null) return { extra: [], rest: null };
  let bytes;
  try { bytes = readFileSync(0); } catch { usage(); }
  if (o.extraTerms === null) return { extra: [], rest: bytes };
  const extra = [];
  let at = 0;
  for (let i = 0; i < o.extraTerms; i++) {
    let end = bytes.indexOf(0x0a, at);
    if (end === -1) {
      if (o.input === '-' || at >= bytes.length || i !== o.extraTerms - 1) usage();
      end = bytes.length; // the last term of a file input may come without a line break
    }
    const term = new TextDecoder('utf-8').decode(bytes.subarray(at, end)).trim();
    if (term === '') usage();
    extra.push(term);
    at = Math.min(end + 1, bytes.length);
  }
  const rest = bytes.subarray(at);
  if (o.input !== '-' && rest.length > 0) usage();
  return { extra, rest: o.input === '-' ? rest : null };
}

function readInput(o, stdin) {
  let bytes = stdin;
  if (o.input !== '-') {
    try { bytes = readFileSync(o.input); } catch { refuse(`cannot read the input: ${o.input}`); }
  }
  const ext = o.input === '-' ? '' : extname(o.input).toLowerCase();
  const binary = NOT_TEXT.has(ext) || bytes.includes(0) || SIGNATURES.some((sig) => sig.every((b, i) => bytes[i] === b));
  if (binary) refuse(`this file is not text; export it as text, CSV or JSON first: ${o.input}`);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) bytes = bytes.subarray(3);
  let text;
  let encoding = 'UTF-8';
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch {
    text = new TextDecoder('windows-1252').decode(bytes);
    encoding = 'Windows-1252';
  }
  if (text.trim() === '') refuse('the input is empty, there is nothing to clean');
  return { text, encoding, kind: o.format || BY_EXTENSION[ext] || 'text' };
}

// True when two paths name the same file, directly, through a symbolic link or through a hard link.
function sameFile(a, b) {
  try {
    if (realpathSync(a) === realpathSync(b)) return true;
    const [x, y] = [statSync(a), statSync(b)];
    return x.ino !== 0 && x.ino === y.ino && x.dev === y.dev;
  } catch { return false; }
}

// `beforeOpen` is for the tests only: it runs between the checks and the opening.
export function writeResult(o, result, protectedFiles, beforeOpen = () => {}) {
  if (!o.out) { process.stdout.write(result); return; }
  const kept = protectedFiles.filter((p) => p && existsSync(p));
  const overwrite = `the output would overwrite the input or the terms file: ${o.out}`;
  const cannot = `cannot write the output; name another folder or print the result: ${o.out}`;
  if (kept.some((p) => resolve(p) === resolve(o.out) || sameFile(p, o.out))) refuse(overwrite);
  if (existsSync(o.out) && !o.replace) refuse(`the output file exists; name another file or pass --replace: ${o.out}`);
  if (!existsSync(dirname(resolve(o.out)))) refuse(cannot);
  // A new file is created exclusively, so a second run or a link put there in the meantime is not written through.
  // A file to replace is opened without truncating, and checked again by its identity before anything is written.
  let fd;
  beforeOpen();
  try { fd = openSync(o.out, o.replace && existsSync(o.out) ? 'r+' : 'wx'); } catch (e) {
    refuse(e && e.code === 'EEXIST' ? `the output file exists; name another file or pass --replace: ${o.out}` : cannot);
  }
  try {
    const opened = fstatSync(fd);
    const same = kept.some((p) => { try { const st = statSync(p); return st.ino !== 0 && st.ino === opened.ino && st.dev === opened.dev; } catch { return false; } });
    if (same) refuse(overwrite);
    ftruncateSync(fd, 0);
    writeSync(fd, result, 0);
  } catch (e) {
    if (e instanceof Refusal) throw e;
    refuse(cannot);
  } finally { closeSync(fd); }
}

function report(o, input, state, info, terms) {
  const counts = Object.entries(state.counts).map(([t, n]) => `${t} ${n}`).join(', ') || 'nothing';
  const termsLine = terms.found
    ? `${state.termCount} terms${state.skipped ? `, ${state.skipped} lines skipped` : ''}`
    : `none found (expected at ${terms.path})`;
  const notCovered = terms.found
    ? 'names in free text that are in no column, no key and not in the terms file; dates other than birth dates; numbers without a trigger word.'
    : 'names of people and companies in free text that are in no column and no key, because no terms file was found; dates other than birth dates; numbers without a trigger word.';
  return [
    'mstack-anonymize report',
    `Input: ${input.kind}, ${info.count}, ${input.encoding}${info.fallback ? `, read as plain text: ${info.fallback}` : ''}`,
    `Replaced: ${counts}`,
    `Replaced whole: ${info.whole || 'none'}`,
    `Terms file: ${termsLine}`,
    `Additional terms: ${state.extra}`,
    `Not covered: ${notCovered}`,
    `Result: ${o.out || 'standard output'}`,
  ].join('\n') + '\n';
}

function main(argv) {
  if (argv.length === 1 && argv[0] === '--print-terms-path') {
    process.stdout.write(`${termsPath(process.platform, process.env)}\n`);
    return;
  }
  const o = parseArgs(argv);
  const stdin = readStdin(o);
  const input = readInput(o, stdin.rest);
  const state = newState();
  const terms = { found: false, path: o.terms || termsPath(process.platform, process.env) };
  if (o.terms && !existsSync(o.terms)) refuse(`cannot read the terms file: ${o.terms}`);
  if (existsSync(terms.path)) {
    let text;
    try { text = new TextDecoder('utf-8').decode(readFileSync(terms.path)); } catch { refuse(`cannot read the terms file: ${terms.path}`); }
    loadTerms(state, text);
    terms.found = true;
  }
  for (const term of stdin.extra) addToDict(state.terms, term, 'TERM');
  state.extra = stdin.extra.length;
  const info = {};
  const result = `${FIRST_LINE}\n\n${render(input.kind, input.text, state, info)}`;
  writeResult(o, result, [o.input === '-' ? null : o.input, terms.found ? terms.path : null]);
  process.stderr.write(report(o, input, state, info, terms));
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) {
    if (!(e instanceof Refusal)) { process.stderr.write('mstack-anonymize: the run failed and wrote nothing\n'); process.exit(1); }
    process.stderr.write(`${e.message}\n`);
    process.exit(e.code);
  }
}
