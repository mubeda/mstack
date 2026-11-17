// Tests for anonymize.mjs. Every value is from a range reserved for examples, and every value that looks
// like a credential, a home path or a private host is built from parts, so no file of the repository holds one whole.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = process.env.ANONYMIZE_SCRIPT
  || resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-anonymize/scripts/anonymize.mjs');
const FIRST = '> Identifying values in this text were replaced by rules. It may still hold personal data. Read it before you share it.';

const home = '/ho' + 'me/';
const users = '/Us' + 'ers/';
const winUsers = 'C:\\Us' + 'ers\\';
const internalHost = 'db1.billing.' + 'internal';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function box() {
  const dir = mkdtempSync(join(tmpdir(), 'anonymize-'));
  mkdirSync(join(dir, 'config'));
  return dir;
}
function files(dir) {
  const out = [];
  const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(d, e.name)) : out.push(join(d, e.name))));
  walk(dir);
  return out.sort();
}
// Runs the script in `dir` and returns the exit code, both outputs and the files the run created.
function run(dir, args, { input, env } = {}) {
  const before = new Set(files(dir));
  const r = spawnSync('node', [script, ...args], {
    cwd: dir, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: dir, XDG_CONFIG_HOME: join(dir, 'config'), ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr, created: files(dir).filter((f) => !before.has(f)) };
}
// Every planted value that is found in an output or in a file the run created.
function leaks(planted, r) {
  const texts = [r.out, r.err, ...r.created.map((f) => readFileSync(f, 'utf8'))];
  return planted.filter((v) => texts.some((t) => t.includes(v)));
}
const put = (dir, name, text) => { const p = join(dir, name); writeFileSync(p, text); return p; };
const body = (out) => out.split('\n').slice(2).join('\n');

test('1.1a a log line loses its e-mail address, IP address and host name, in every channel', () => {
  const dir = box();
  const planted = ['ana.lopez@example.com', '203.0.113.7', 'shop.example.org'];
  put(dir, 'app.log', `2026-11-17 login ${planted[0]} from ${planted[1]} via ${planted[2]}\n`);
  const r = run(dir, ['app.log']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /login \[EMAIL_1\] from \[IP_1\] via \[HOST_1\]/);
  assert.deepEqual(leaks(planted, r), []);
});

test('1.1b IPv6, URL, internal host and the user name of a home path', () => {
  const dir = box();
  put(dir, 'a.txt', [
    'peer 2001:db8::8a2e:370:7334 connected',
    'see https://shop.example.org/orders/17?x=1 for details',
    `db ${internalHost} is up`,
    `open ${home}mlopez/project/app.py`,
    `open ${users}mlopez/Documents/a.txt`,
    `open ${winUsers}mlopez\\Documents\\a.txt`,
  ].join('\n') + '\n');
  const r = run(dir, ['a.txt']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /peer \[IP_1\] connected/);
  assert.match(r.out, /see \[URL_1\] for details/);
  assert.match(r.out, /db \[HOST_1\] is up/);
  assert.ok(r.out.includes(`open ${home}[USER_1]/project/app.py`));
  assert.ok(r.out.includes(`open ${users}[USER_1]/Documents/a.txt`));
  assert.ok(r.out.includes(`open ${winUsers}[USER_1]\\Documents\\a.txt`));
  assert.deepEqual(leaks(['mlopez', internalHost, '2001:db8::8a2e:370:7334'], r), []);
});

test('1.1c file names, a class name, a version, a time and a date are left alone', () => {
  const dir = box();
  const lines = [
    'wrote report.pdf and index.js',
    'at com.example.Foo.run(Foo.java:12)',
    'running version 2.14.0.1 now',
    'started at 12:30:45 on 2026-11-17',
  ];
  put(dir, 'a.txt', lines.join('\n') + '\n');
  const r = run(dir, ['a.txt']);
  assert.equal(r.code, 0, r.err);
  for (const l of lines) assert.ok(r.out.includes(l), l);
  assert.match(r.err, /Replaced: nothing/);
});

test('1.1d the same value gets the same placeholder, another value another one', () => {
  const dir = box();
  put(dir, 'a.txt', 'a@example.com wrote to b@example.com\nreply from a@example.com\n');
  const r = run(dir, ['a.txt']);
  assert.match(r.out, /\[EMAIL_1\] wrote to \[EMAIL_2\]\nreply from \[EMAIL_1\]/);
  assert.match(r.err, /Replaced: EMAIL 3/);
});

test('1.1e first line, Markdown as Markdown, a log in one code block, byte order mark and Windows line ends', () => {
  const dir = box();
  put(dir, 'note.md', '# Title\n\nMail a@example.com\n');
  const md = run(dir, ['note.md']);
  assert.equal(md.out.split('\n')[0], FIRST);
  assert.equal(body(md.out), '# Title\n\nMail [EMAIL_1]\n');
  put(dir, 'app.log', 'one a@example.com\ntwo\nthree\n');
  const log = run(dir, ['app.log']);
  assert.equal(log.out, `${FIRST}\n\n\`\`\`text\none [EMAIL_1]\ntwo\nthree\n\`\`\`\n`);
  put(dir, 'win.txt', '\ufeffone a@example.com\r\ntwo a@example.com\r\n');
  const win = run(dir, ['win.txt']);
  assert.match(win.out, /```text\none \[EMAIL_1\]\r?\ntwo \[EMAIL_1\]\r?\n```/);
  assert.match(win.err, /Input: text, 2 lines, UTF-8/);
});

test('1.1f the report has its eight lines in order', () => {
  const dir = box();
  put(dir, 'a.txt', 'a@example.com\n');
  const r = run(dir, ['a.txt']);
  const starts = ['mstack-anonymize report', 'Input: ', 'Replaced: ', 'Replaced whole: ', 'Terms file: ', 'Additional terms: ', 'Not covered: ', 'Result: '];
  const lines = r.err.trim().split('\n');
  assert.equal(lines.length, 8, r.err);
  starts.forEach((s, i) => assert.ok(lines[i].startsWith(s), `${i}: ${lines[i]}`));
  assert.equal(lines[7], 'Result: standard output');
});

test('1.1g --out writes a file, never over an existing one without --replace, and refuses a folder it cannot write', () => {
  const dir = box();
  put(dir, 'a.txt', 'a@example.com\n');
  const r = run(dir, ['--out', 'a.anon.md', 'a.txt']);
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out, '');
  assert.match(readFileSync(join(dir, 'a.anon.md'), 'utf8'), /\[EMAIL_1\]/);
  assert.match(r.err, /Result: a\.anon\.md/);
  writeFileSync(join(dir, 'a.anon.md'), 'keep me');
  const again = run(dir, ['--out', 'a.anon.md', 'a.txt']);
  assert.equal(again.code, 1);
  assert.equal(readFileSync(join(dir, 'a.anon.md'), 'utf8'), 'keep me');
  assert.equal(run(dir, ['--out', 'a.anon.md', '--replace', 'a.txt']).code, 0);
  assert.match(readFileSync(join(dir, 'a.anon.md'), 'utf8'), /\[EMAIL_1\]/);
  assert.equal(run(dir, ['--out', 'missing/x.md', 'a.txt']).code, 1);
  if (process.platform !== 'win32' && process.getuid() !== 0) {
    mkdirSync(join(dir, 'ro'));
    chmodSync(join(dir, 'ro'), 0o555);
    const ro = run(dir, ['--out', 'ro/x.md', 'a.txt']);
    assert.equal(ro.code, 1);
    assert.match(ro.err, /cannot write/);
    assert.deepEqual(ro.created, []);
  }
});

test('1.1h the output is never the input, directly or through a link', () => {
  const dir = box();
  const input = put(dir, 'a.txt', 'a@example.com\n');
  const before = sha(input);
  symlinkSync(input, join(dir, 'sym.md'));
  linkSync(input, join(dir, 'hard.md'));
  for (const out of ['a.txt', 'sym.md', 'hard.md']) {
    for (const extra of [[], ['--replace']]) {
      const r = run(dir, ['--out', out, ...extra, 'a.txt']);
      assert.equal(r.code, 1, `${out} ${extra}`);
      assert.equal(sha(input), before);
    }
  }
});

test('1.1i binary, Office, empty and missing inputs are refused with a fixed message and nothing is written', () => {
  const dir = box();
  const value = 'ana.lopez@example.com';
  put(dir, 'a.pdf', `%PDF-1.7 ${value}`);
  writeFileSync(join(dir, 'notes.docx'), Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from(value)]));
  writeFileSync(join(dir, 'nul.txt'), Buffer.concat([Buffer.from(value), Buffer.from([0, 1, 2])]));
  put(dir, 'empty.txt', '');
  for (const f of ['a.pdf', 'notes.docx', 'nul.txt']) {
    const r = run(dir, ['--out', 'x.md', f]);
    assert.equal(r.code, 1, f);
    assert.match(r.err, /export it as text, CSV or JSON/);
    assert.deepEqual(r.created, []);
    assert.deepEqual(leaks([value], r), []);
    assert.equal(r.err.trim().split('\n').length, 1);
  }
  const empty = run(dir, ['empty.txt']);
  assert.equal(empty.code, 1);
  assert.match(empty.err, /nothing to clean/);
  const missing = run(dir, ['nope.txt']);
  assert.equal(missing.code, 1);
  assert.equal(missing.err.trim(), 'mstack-anonymize: cannot read the input: nope.txt');
});

test('1.1j text in Windows-1252 is read, cleaned and named in the report', () => {
  const dir = box();
  writeFileSync(join(dir, 'a.txt'), Buffer.from('Gr\u00fc\u00dfe an a@example.com\n', 'latin1'));
  const r = run(dir, ['a.txt']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /Grüße an \[EMAIL_1\]/);
  assert.match(r.err, /Input: text, 1 lines, Windows-1252/);
});

test('1.1k and 1.1l inputs keep their checksum, and two runs leave only inputs and results', () => {
  const dir = box();
  const a = put(dir, 'a.txt', 'a@example.com\n');
  const b = put(dir, 'b.log', 'b@example.org from 198.51.100.4\n');
  const before = [sha(a), sha(b)];
  run(dir, ['--out', 'a.anon.md', 'a.txt']);
  run(dir, ['--out', 'b.anon.md', 'b.log']);
  assert.deepEqual([sha(a), sha(b)], before);
  assert.deepEqual(files(dir).map((f) => f.slice(dir.length + 1)), ['a.anon.md', 'a.txt', 'b.anon.md', 'b.log']);
  for (const f of ['a.anon.md', 'b.anon.md']) {
    const text = readFileSync(join(dir, f), 'utf8');
    for (const v of ['a@example.com', 'b@example.org', '198.51.100.4']) assert.ok(!text.includes(v), `${f} ${v}`);
  }
});

const tricky = (marker) => `it's "quoted" \`tick\` $(touch ${marker}) $HOME\nEOF\nmail a@example.com`;

test('1.1m standard input comes back as text, shell characters included, with no line break added', () => {
  const dir = box();
  const text = tricky(join(dir, 'marker'));
  const r = run(dir, ['--format', 'text', '-'], { input: text });
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out, `${FIRST}\n\n\`\`\`text\n${text.replace('a@example.com', '[EMAIL_1]')}\n\`\`\`\n`);
  assert.ok(!existsSync(join(dir, 'marker')));
});

test('1.1n the printf pipe of the skill passes text through a real shell unchanged and runs nothing', { skip: process.platform === 'win32' }, () => {
  const dir = box();
  for (const filler of ['', 'x'.repeat(200000)]) {
    const text = `${filler}\n${tricky(join(dir, 'marker'))}`;
    const quoted = `'${text.replaceAll("'", "'\\''")}'`;
    const program = `printf '%s' ${quoted} | node '${script}' --format text -\n`;
    const r = spawnSync('bash', ['-s'], {
      cwd: dir, input: program, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: { PATH: process.env.PATH, HOME: dir, XDG_CONFIG_HOME: join(dir, 'config') },
    });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, `${FIRST}\n\n\`\`\`text\n${text.replace('a@example.com', '[EMAIL_1]')}\n\`\`\`\n`);
    assert.ok(!existsSync(join(dir, 'marker')));
    assert.deepEqual(files(dir), []);
  }
});

test('1.1o usage errors exit 2', () => {
  const dir = box();
  put(dir, 'a.txt', 'x\n');
  assert.equal(run(dir, ['--nope', 'a.txt']).code, 2);
  assert.equal(run(dir, []).code, 2);
  assert.equal(run(dir, ['--format', 'xml', 'a.txt']).code, 2);
  assert.equal(run(dir, ['--out']).code, 2);
});

// ---- Task 1.2: forms with a check ----
// Cleans one text through standard input and returns the body of the code block.
function cleanText(text, args = []) {
  const dir = box();
  const r = run(dir, ['--format', 'text', ...args, '-'], { input: text });
  assert.equal(r.code, 0, r.err);
  return { text: r.out.split('\n').slice(3, -2).join('\n'), err: r.err, r };
}
const types = (text) => [...text.matchAll(/\[([A-Z]+)_\d+\]/g)].map((m) => m[1]);
// Values that look like credentials, built from parts.
const bearer = 'Bea' + 'rer ' + 'abc123' + 'DEF456' + 'ghi789';
const jwt = ['eyJ' + 'hbGciOiJIUzI1NiJ9', 'eyJ' + 'zdWIiOiIxMjM0NTYifQ', 'c2lnbmF0dXJl' + 'X3BhcnQ'].join('.');
const prefixed = 'gh' + 'p_' + 'a1B2c3D4e5F6g7H8i9J0k1L2';
const keyBlock = ['-----BEGIN RSA ' + 'PRIVATE KEY-----', 'MIIBOgIBAAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf9Cnzj4p4WGeKLs1Pt8Qu', '-----END RSA ' + 'PRIVATE KEY-----'].join('\n');
const pw = (key, sep, value) => `${key}${sep}${value}`;

test('1.2 phone numbers are replaced, an article number and a date are not', () => {
  const { text } = cleanText('call +1 202 555 0143 or (202) 555-0199 or 202 555 0177\narticle 123456789 on 2026-11-17 and 17.11.2026');
  assert.equal(text, 'call [PHONE_1] or [PHONE_2] or [PHONE_3]\narticle 123456789 on 2026-11-17 and 17.11.2026');
  assert.equal(cleanText('Ana (a@example.com, +1 202 555 0143) and +1 (202) 555 0199 called').text, 'Ana ([EMAIL_1], [PHONE_1]) and [PHONE_2] called');
});

test('1.2 a card number that passes the Luhn check is replaced, one that fails is not', () => {
  const { text } = cleanText('card 4111 1111 1111 1111 and 4111111111111111\nnot a card 4111 1111 1111 1112 or 1234567812345678');
  assert.equal(text, 'card [CARD_1] and [CARD_1]\nnot a card 4111 1111 1111 1112 or 1234567812345678');
});

test('1.2 an IBAN with right check digits is replaced, one with wrong digits is not', () => {
  const { text } = cleanText('pay to GB82 WEST 1234 5698 7654 32 or DE89370400440532013000 today\nwrong GB83 WEST 1234 5698 7654 32 here');
  assert.equal(text, 'pay to [IBAN_1] or [IBAN_2] today\nwrong GB83 WEST 1234 5698 7654 32 here');
});

test('1.2 credentials are replaced, the word alone and a counter are not', () => {
  const input = [
    `Authorization: ${bearer}`,
    `jwt ${jwt} end`,
    `key ${prefixed} end`,
    pw('pass' + 'word', '=', 'hunter2secret'),
    pw('"api' + '_key"', ': ', '"zx81-spectrum-48k"'),
    pw('TOK' + 'EN', ': ', 'qwertyuiop123'),
    'Please reset my password. The token_count=3 is fine.',
    keyBlock,
  ].join('\n');
  const { text, r } = cleanText(input);
  const lines = text.split('\n');
  assert.equal(lines[0], 'Authorization: Bea' + 'rer [SECRET_1]');
  assert.equal(lines[1], 'jwt [SECRET_2] end');
  assert.equal(lines[2], 'key [SECRET_3] end');
  assert.equal(lines[3], 'pass' + 'word=[SECRET_4]');
  assert.equal(lines[4], '"api' + '_key": "[SECRET_5]"');
  assert.equal(lines[5], 'TOK' + 'EN: [SECRET_6]');
  assert.equal(lines[6], 'Please reset my password. The token_count=3 is fine.');
  assert.equal(lines[7], '[SECRET_7]');
  assert.equal(lines.length, 8);
  assert.deepEqual(leaks(['abc123DEF456ghi789', jwt, prefixed, 'hunter2secret', 'zx81-spectrum-48k', 'qwertyuiop123', 'MIIBOgIBAAJBAKj34'], r), []);
});

test('1.2 a bearer token next to an e-mail address gives one SECRET and one EMAIL', () => {
  const { text } = cleanText(`auth ${bearer} for ana@example.com`);
  assert.deepEqual(types(text), ['SECRET', 'EMAIL']);
});

test('1.2 money amounts with a sign or a code are replaced, plain numbers are not', () => {
  const { text } = cleanText('paid $1,200.50 and 1.200,50 € and USD 300 and 300 EUR\nbought 300 items for 1,200.50 points');
  assert.equal(text, 'paid [AMOUNT_1] and [AMOUNT_2] and [AMOUNT_3] and [AMOUNT_4]\nbought 300 items for 1,200.50 points');
});

test('1.2 identifiers after a trigger word and codes are replaced, well-known names and bare numbers are not', () => {
  const input = [
    'order 55012 shipped', 'ticket #88120 opened', 'invoice no. 2024-0042 sent', 'Rechnung Nr. 4711 offen',
    'Kundennummer 88123 aktiv', 'factura n.º 2031 pagada', 'pedido 77001 enviado', 'see ABC-1234 and A-1 and ABC-1',
    'we have 55012 units, abc-123, 2026-11-17, UTF-8, ISO-8859-1, SHA-256 and COVID-19',
  ].join('\n');
  const lines = cleanText(input).text.split('\n');
  assert.equal(lines[0], 'order [ID_1] shipped');
  assert.equal(lines[1], 'ticket #[ID_2] opened');
  assert.equal(lines[2], 'invoice no. [ID_3] sent');
  assert.equal(lines[3], 'Rechnung Nr. [ID_4] offen');
  assert.equal(lines[4], 'Kundennummer [ID_5] aktiv');
  assert.equal(lines[5], 'factura n.º [ID_6] pagada');
  assert.equal(lines[6], 'pedido [ID_7] enviado');
  assert.equal(lines[7], 'see [ID_8] and [ID_9] and [ID_10]');
  assert.equal(lines[8], 'we have 55012 units, abc-123, 2026-11-17, UTF-8, ISO-8859-1, SHA-256 and COVID-19');
});

// ---- Task 1.3: tables and JSON ----
// The rows of the Markdown table in a result, as arrays of cells, without the separator row.
function tableOf(out) {
  return out.split('\n').filter((l) => l.startsWith('|')).filter((l) => !/^\|[\s:|-]+\|$/.test(l))
    .map((l) => l.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim()));
}
const jsonOf = (out) => JSON.parse(out.split('\n').slice(3, -2).join('\n'));

test('1.3a a CSV becomes one table, with name, e-mail and identifier columns replaced whole', () => {
  const dir = box();
  const rows = ['Kundenname,email,order_id,created,message'];
  for (let i = 1; i <= 40; i++) rows.push(`Person Nummer${i},p${i}@example.com,${50000 + i},2026-11-${String((i % 28) + 1).padStart(2, '0')},hello ${i}`);
  put(dir, 'tickets.csv', rows.join('\n') + '\n');
  const r = run(dir, ['tickets.csv']);
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out.split('\n')[0], FIRST);
  const t = tableOf(r.out);
  assert.equal(t.length, 41);
  assert.deepEqual(t[0], ['Kundenname', 'email', 'order_id', 'created', 'message']);
  assert.deepEqual(t[1], ['[NAME_1]', '[EMAIL_1]', '[ID_1]', '2026-11-02', 'hello 1']);
  assert.deepEqual(t[40].slice(0, 3), ['[NAME_40]', '[EMAIL_40]', '[ID_40]']);
  assert.match(r.err, /Input: csv, 40 rows, UTF-8/);
  assert.match(r.err, /Replaced whole: Kundenname, email, order_id/);
  assert.deepEqual(leaks(['Person Nummer7', 'p7@example.com', '50007'], r), []);
});

test('1.3b a name from a column is replaced where it stands in free text too', () => {
  const dir = box();
  put(dir, 't.csv', 'customer,message\nMarta Quintanilla,first\nOther Person,Marta Quintanilla called again\n');
  const r = run(dir, ['t.csv']);
  const t = tableOf(r.out);
  assert.equal(t[1][0], '[NAME_1]');
  assert.equal(t[2][1], '[NAME_1] called again');
  assert.deepEqual(leaks(['Marta Quintanilla'], r), []);
});

test('1.3c a first row with a number, a date, an e-mail address or a term is data, a row of words is a header', () => {
  const firstRows = { number: 'alpha,42', date: 'alpha,2026-11-17', email: 'alpha,ana@example.com', term: 'alpha,Quintanilla Logistics' };
  for (const [kind, first] of Object.entries(firstRows)) {
    const dir = box();
    mkdirSync(join(dir, 'config', 'mstack'));
    put(dir, 'config/mstack/anonymize-terms.txt', 'company: Quintanilla Logistics\n');
    put(dir, 't.csv', `${first}\nbeta,7\n`);
    const r = run(dir, ['t.csv']);
    assert.equal(r.code, 0, r.err);
    const t = tableOf(r.out);
    assert.equal(t.length, 3, kind);
    assert.equal(t[1][0], 'alpha', kind);
    assert.match(r.err, /Replaced whole: no header recognized/, kind);
    assert.deepEqual(leaks(['ana@example.com', 'Quintanilla Logistics'], r), [], kind);
  }
  const dir = box();
  put(dir, 't.csv', 'alpha,beta\none,two\n');
  const r = run(dir, ['t.csv']);
  assert.deepEqual(tableOf(r.out), [['alpha', 'beta'], ['one', 'two']]);
  assert.match(r.err, /Replaced whole: none/);
});

test('1.3d column names in three languages are matched by whole words', () => {
  const kept = ['product_name', 'filename', 'hostname_count', 'status'];
  const replaced = ['first_name', 'Nachname', 'nombre', 'apellido', 'Firma', 'empresa', 'Telefon', 'teléfono', 'Straße', 'dirección',
    'PLZ', 'Geburtsdatum', 'fecha_nacimiento', 'Kundennummer', 'importe', 'Betrag', 'username', 'customerEmail'];
  const dir = box();
  const header = [...kept, ...replaced];
  put(dir, 't.csv', `${header.join(',')}\n${header.map((_, i) => `value${i}`).join(',')}\n`);
  const r = run(dir, ['t.csv']);
  assert.equal(r.code, 0, r.err);
  const row = tableOf(r.out)[1];
  kept.forEach((name, i) => assert.equal(row[i], `value${i}`, name));
  replaced.forEach((name, i) => assert.match(row[kept.length + i], /^\[[A-Z]+_\d+\]$/, name));
});

test('1.3e and 1.3f cells with a line break or a bar, semicolons, tabs and quoted separators', () => {
  const dir = box();
  put(dir, 'a.csv', 'note,other\n"line one\nline | two",x\n');
  assert.deepEqual(tableOf(run(dir, ['a.csv']).out)[1], ['line one<br>line \\| two', 'x']);
  put(dir, 'b.csv', 'note;other\n"a; b";7\n');
  assert.deepEqual(tableOf(run(dir, ['b.csv']).out), [['note', 'other'], ['a; b', '7']]);
  put(dir, 'c.tsv', 'note\tother\n"a\tb"\tx\n');
  assert.deepEqual(tableOf(run(dir, ['c.tsv']).out), [['note', 'other'], ['a\tb', 'x']]);
});

test('1.3g a CSV in Windows-1252 has its customer column replaced and the rest readable', () => {
  const dir = box();
  writeFileSync(join(dir, 'k.csv'), Buffer.from('Kunde,Notiz\nJürgen Müllerbeispiel,Grüße\n', 'latin1'));
  const r = run(dir, ['k.csv']);
  assert.deepEqual(tableOf(r.out)[1], ['[NAME_1]', 'Grüße']);
  assert.match(r.err, /Windows-1252/);
});

test('1.3h and 1.3j a broken CSV and broken JSON are cleaned as plain text, with a fixed reason', () => {
  const dir = box();
  put(dir, 'bad.csv', 'a,b\n"never closed,ana@example.com\n');
  const csv = run(dir, ['bad.csv']);
  assert.equal(csv.code, 0, csv.err);
  assert.match(csv.out, /```text\n/);
  assert.match(csv.out, /\[EMAIL_1\]/);
  assert.match(csv.err, /read as plain text: no table could be read/);
  put(dir, 'bad.json', '{"email": "ana@example.com", "list": [1, 2\n');
  const json = run(dir, ['bad.json']);
  assert.equal(json.code, 0, json.err);
  assert.match(json.out, /\[EMAIL_1\]/);
  assert.match(json.err, /read as plain text: no JSON could be read/);
  assert.ok(!/position|Unexpected|token/i.test(json.err), json.err);
  assert.deepEqual(leaks(['ana@example.com'], json), []);
});

test('1.3i JSON: keys at any depth, objects and lists under a key, keys that are values, JSON Lines', () => {
  const dir = box();
  put(dir, 'a.json', JSON.stringify({
    id: 7,
    items: [{ customer: { first: 'Marta', last: 'Quintanilla', tags: ['vip', 'b2b'] }, note: 'mail ana@example.com', qty: 3, ok: true }],
    'bea@example.org': { visits: 2 },
  }));
  const r = run(dir, ['a.json']);
  assert.equal(r.code, 0, r.err);
  const j = jsonOf(r.out);
  assert.equal(j.id, '[ID_1]');
  assert.deepEqual(j.items[0].customer, { first: '[NAME_1]', last: '[NAME_2]', tags: ['[NAME_3]', '[NAME_4]'] });
  assert.equal(j.items[0].note, 'mail [EMAIL_1]');
  assert.equal(j.items[0].qty, 3);
  assert.equal(j.items[0].ok, true);
  assert.deepEqual(j['[EMAIL_2]'], { visits: 2 });
  assert.match(r.out, /```json\n/);
  assert.deepEqual(leaks(['Quintanilla', 'bea@example.org', 'ana@example.com'], r), []);
  put(dir, 'b.jsonl', '{"email":"a@example.com","n":1}\n{"email":"b@example.com","n":2}\n');
  const l = run(dir, ['b.jsonl']);
  const lines = l.out.split('\n').slice(3, -2);
  assert.deepEqual(lines.map((x) => JSON.parse(x)), [{ email: '[EMAIL_1]', n: 1 }, { email: '[EMAIL_2]', n: 2 }]);
  assert.match(l.err, /Input: jsonl, 2 records/);
});

test('1.3k only birth dates are replaced', () => {
  const dir = box();
  put(dir, 't.csv', 'order_date,date_of_birth,note\n2026-11-17,1980-05-03,ok\n');
  assert.deepEqual(tableOf(run(dir, ['t.csv']).out)[1], ['2026-11-17', '[BIRTHDATE_1]', 'ok']);
  const { text } = cleanText('born 3 May 1980 in a town\ngeboren am 03.05.1980 dort\nnacido el 3 de mayo de 1980 aquí\nshipped on 3 May 2026');
  assert.equal(text, 'born [BIRTHDATE_1] in a town\ngeboren am [BIRTHDATE_2] dort\nnacido el [BIRTHDATE_3] aquí\nshipped on 3 May 2026');
});

test('1.3l a table of about 5 megabytes is cleaned', () => {
  const dir = box();
  const rows = ['customer_name,email,message'];
  for (let i = 0; rows.length < 60000; i++) rows.push(`Person Nummer${i % 500},p${i % 500}@example.com,"order ${10000 + i} from 198.51.100.${i % 250} with some longer filler text here"`);
  put(dir, 'big.csv', rows.join('\n') + '\n');
  const size = statSync(join(dir, 'big.csv')).size;
  const start = Date.now();
  const r = run(dir, ['--out', 'big.anon.md', 'big.csv']);
  assert.equal(r.code, 0, r.err);
  console.log(`1.3l: ${(size / 1e6).toFixed(1)} MB cleaned in ${Date.now() - start} ms`);
  assert.ok(size > 4.5e6);
});

// ---- Task 1.4: the terms file and additional terms ----
function withTerms(text) {
  const dir = box();
  mkdirSync(join(dir, 'config', 'mstack'));
  const terms = put(dir, 'config/mstack/anonymize-terms.txt', text);
  return { dir, terms };
}
const TERMS = '# made-up names\ncustomer: Quintanilla Logistics\ncompany: Farolito Software\n\nProject Heron\n';

test('1.4a terms are replaced by type, in any case, and counted', () => {
  const { dir } = withTerms(TERMS);
  put(dir, 'a.log', 'call from QUINTANILLA LOGISTICS about farolito software and Project Heron\n');
  const r = run(dir, ['a.log']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /call from \[CUSTOMER_1\] about \[COMPANY_1\] and \[TERM_1\]/);
  assert.match(r.err, /Terms file: 3 terms\n/);
  assert.match(r.err, /Not covered: names in free text that are in no column, no key and not in the terms file/);
});

test('1.4b a term inside a longer word is not replaced', () => {
  const { dir } = withTerms('Heron\n');
  put(dir, 'a.txt', 'Heron and Heronsgate and aHeron\n');
  assert.match(run(dir, ['a.txt']).out, /\[TERM_1\] and Heronsgate and aHeron/);
  const two = withTerms('Project Heron\n');
  put(two.dir, 'a.txt', 'Project Heronsgate, then Project Heron.\n');
  assert.match(run(two.dir, ['a.txt']).out, /Project Heronsgate, then \[TERM_1\]\./);
});

test('1.4c --terms is used instead of the default file, and a missing one is refused', () => {
  const { dir } = withTerms('Heron\n');
  put(dir, 'other.txt', 'person: Marta Quintanilla\n');
  put(dir, 'a.txt', 'Heron met Marta Quintanilla\n');
  const r = run(dir, ['--terms', 'other.txt', 'a.txt']);
  assert.match(r.out, /Heron met \[PERSON_1\]/);
  assert.match(r.err, /Terms file: 1 terms/);
  const missing = run(dir, ['--terms', 'nope.txt', 'a.txt']);
  assert.equal(missing.code, 1);
  assert.equal(missing.err.trim(), 'mstack-anonymize: cannot read the terms file: nope.txt');
});

test('1.4d without a terms file the result is produced and the report says what was not covered', () => {
  const dir = box();
  put(dir, 'a.txt', 'hello Marta\n');
  const r = run(dir, ['a.txt']);
  assert.equal(r.code, 0);
  assert.match(r.err, new RegExp(`Terms file: none found \\(expected at ${join(dir, 'config', 'mstack', 'anonymize-terms.txt').replaceAll('\\', '\\\\')}\\)`));
  assert.match(r.err, /Not covered: names of people and companies in free text/);
});

test('1.4e additional terms for a file input are used once and stored nowhere', () => {
  const { dir, terms } = withTerms(TERMS);
  const input = put(dir, 'a.txt', 'Marta Quintanilla met Bruno Farolito\n');
  const before = [sha(input), sha(terms)];
  const r = run(dir, ['--extra-terms', '2', '--out', 'a.anon.md', 'a.txt'], { input: 'Marta Quintanilla\nBruno Farolito\n' });
  assert.equal(r.code, 0, r.err);
  assert.match(readFileSync(join(dir, 'a.anon.md'), 'utf8'), /\[TERM_1\] met \[TERM_2\]/);
  assert.match(r.err, /Additional terms: 2/);
  assert.deepEqual([sha(input), sha(terms)], before);
  assert.deepEqual(r.created.map((f) => f.slice(dir.length + 1)), ['a.anon.md']);
  assert.deepEqual(leaks(['Marta Quintanilla', 'Bruno Farolito'], r), []);
});

test('1.4f with standard input the first lines are terms and the rest is the text, byte for byte', () => {
  const dir = box();
  const r = run(dir, ['--extra-terms', '1', '--format', 'text', '-'], { input: 'Marta Quintanilla\n\nfirst line was empty, Marta Quintanilla said' });
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out, `${FIRST}\n\n\`\`\`text\n\nfirst line was empty, [TERM_1] said\n\`\`\`\n`);
});

test('1.4g a wrong frame of standard input is a usage error and nothing is written', () => {
  const dir = box();
  put(dir, 'a.txt', 'x a@example.com\n');
  const cases = [
    [['--extra-terms', '0', 'a.txt'], 'one\n'],
    [['--extra-terms', '1.5', 'a.txt'], 'one\n'],
    [['--extra-terms', 'two', 'a.txt'], 'one\n'],
    [['--extra-terms', '2', 'a.txt'], 'one\n'],
    [['--extra-terms', '1', 'a.txt'], '\n'],
    [['--extra-terms', '1', 'a.txt'], 'one\nmore\n'],
    [['--extra-terms', '2', '--format', 'text', '-'], 'only one line'],
  ];
  for (const [args, input] of cases) {
    const r = run(dir, ['--out', 'x.md', ...args], { input });
    assert.equal(r.code, 2, args.join(' '));
    assert.deepEqual(r.created, []);
  }
});

test('1.4h a term in a name column keeps the type of the term', () => {
  const { dir } = withTerms(TERMS);
  put(dir, 't.csv', 'customer_name,note\nQuintanilla Logistics,x\n');
  assert.deepEqual(tableOf(run(dir, ['t.csv']).out)[1], ['[CUSTOMER_1]', 'x']);
});

test('1.4i no term and no line of the terms file reaches the report, also with a line that is skipped', () => {
  const { dir } = withTerms(`${TERMS}supplier: Farolito Imports\n`);
  put(dir, 'a.txt', 'Quintanilla Logistics and Farolito Imports\n');
  const r = run(dir, ['--out', 'a.anon.md', 'a.txt']);
  assert.match(r.err, /Terms file: 3 terms, 1 lines skipped/);
  for (const v of ['Quintanilla', 'Farolito', 'Heron', 'supplier']) assert.ok(!r.err.includes(v), v);
});

test('1.4j the output is never the terms file, directly or through a link', () => {
  const { dir, terms } = withTerms(TERMS);
  put(dir, 'a.txt', 'hello\n');
  const before = sha(terms);
  symlinkSync(terms, join(dir, 'sym.md'));
  linkSync(terms, join(dir, 'hard.md'));
  for (const out of ['config/mstack/anonymize-terms.txt', 'sym.md', 'hard.md']) {
    for (const extra of [[], ['--replace']]) {
      assert.equal(run(dir, ['--out', out, ...extra, 'a.txt']).code, 1, `${out} ${extra}`);
      assert.equal(sha(terms), before);
    }
  }
});

test('1.4k the default terms path per platform, and --print-terms-path', async () => {
  const { termsPath } = await import(script);
  assert.equal(termsPath('linux', { XDG_CONFIG_HOME: '/x' }), '/x/mstack/anonymize-terms.txt');
  assert.equal(termsPath('linux', { HOME: '/h' }), '/h/.config/mstack/anonymize-terms.txt');
  assert.equal(termsPath('darwin', { HOME: '/h' }), '/h/.config/mstack/anonymize-terms.txt');
  assert.equal(termsPath('win32', { APPDATA: 'C:\\a' }), 'C:\\a\\mstack\\anonymize-terms.txt');
  const dir = box();
  const r = run(dir, ['--print-terms-path']);
  assert.equal(r.code, 0);
  assert.equal(r.out, `${join(dir, 'config', 'mstack', 'anonymize-terms.txt')}\n`);
  assert.equal(r.err, '');
});

// ---- Findings of the final review ----
function cleanAs(format, text, terms) {
  const dir = box();
  if (terms) { mkdirSync(join(dir, 'config', 'mstack')); put(dir, 'config/mstack/anonymize-terms.txt', terms); }
  const r = run(dir, ['--format', format, '-'], { input: text });
  assert.equal(r.code, 0, r.err);
  return r;
}

test('review 1 a letter whose lower case is longer does not switch the terms off, in a key or in the report', () => {
  const r = cleanAs('json', '{"İ Jane Example email":"a@example.com"}', 'Jane Example\n');
  assert.deepEqual(leaks(['Jane Example'], r), []);
  assert.match(cleanAs('text', 'İstanbul: Jane Example called', 'Jane Example\n').out, /İstanbul: \[TERM_1\] called/);
});

test('review 2 a number in JSON is checked by form', () => {
  const j = jsonOf(cleanAs('json', '{"card":4111111111111111,"note":"4111111111111111","qty":3}').out);
  assert.deepEqual(j, { card: '[CARD_1]', note: '[CARD_1]', qty: 3 });
});

test('review 3 a quoted credential goes to its closing quote, and a short one is replaced too', () => {
  const key = 'pass' + 'word';
  const { text } = cleanText(`${key}="one two three" then ${key}=ab then Authorization: Bea` + 'rer abcdef end');
  assert.equal(text, `${key}="[SECRET_1]" then ${key}=[SECRET_2] then Authorization: Bea` + 'rer [SECRET_3] end');
  assert.equal(cleanText('the bearer of bad news uses Basic settings').text, 'the bearer of bad news uses Basic settings');
});

test('review 4 a value from a column is replaced everywhere, short values and amounts included', () => {
  const t = tableOf(cleanAs('csv', 'name,id,amount,note\nLi,42,123.45,Li paid 123.45 for 42\n').out);
  assert.deepEqual(t[1], ['[NAME_1]', '[ID_1]', '[AMOUNT_1]', '[NAME_1] paid [AMOUNT_1] for [ID_1]']);
});

test('review 5 a value with a line break is found in another cell', () => {
  const r = cleanAs('csv', 'customer,message\n"Jane\nExample",first\nOther Person,"Jane\nExample called"\n');
  assert.deepEqual(leaks(['Jane', 'Example called'], r), []);
  assert.equal(tableOf(r.out)[2][1], '[NAME_1] called');
});

test('review 6 a term inside a credential or an address does not leave the rest visible', () => {
  const r = cleanAs('text', 'Authorization: Bea' + 'rer abc123.longsecretvalue and abc123@example.com', 'abc123\n');
  assert.deepEqual(leaks(['longsecretvalue', 'example.com'], r), []);
  assert.deepEqual(types(r.out), ['SECRET', 'EMAIL']);
});

test('review 7 a new output is created exclusively, and a replaced one is checked after it is opened', () => {
  const dir = box();
  const input = put(dir, 'a.txt', 'a@example.com\n');
  put(dir, 'out.md', 'old');
  assert.equal(run(dir, ['--out', 'out.md', '--replace', 'a.txt']).code, 0);
  assert.match(readFileSync(join(dir, 'out.md'), 'utf8'), /\[EMAIL_1\]/);
  symlinkSync(join(dir, 'missing-target.md'), join(dir, 'dangling.md'));
  const r = run(dir, ['--out', 'dangling.md', 'a.txt']);
  assert.equal(r.code, 1);
  assert.ok(!existsSync(join(dir, 'missing-target.md')));
  assert.equal(readFileSync(input, 'utf8'), 'a@example.com\n');
});

test('review 11 Kontakt and nombre_completo are name columns, nombre_producto is not', () => {
  const j = jsonOf(cleanAs('json', '{"Kontakt":"Mia Muster","nombre_completo":"Mia Muster","nombre_producto":"Lampe"}').out);
  assert.deepEqual(j, { Kontakt: '[NAME_1]', nombre_completo: '[NAME_1]', nombre_producto: 'Lampe' });
});

test('review 12 any number after a trigger word, a code in capitals, and no match inside a longer word', () => {
  const { text } = cleanText('order 7, ticket 42, order ABC, orderly123, order confirmed, case closed');
  assert.equal(text, 'order [ID_1], ticket [ID_2], order [ID_3], orderly123, order confirmed, case closed');
});

test('review 13 amounts with a sign and with spaces between groups are replaced whole', () => {
  const { text } = cleanText('EUR -15.00 and €-15.00 and EUR 1 234,56 and 1 234,56 € end');
  assert.equal(text, '[AMOUNT_1] and [AMOUNT_2] and [AMOUNT_3] and [AMOUNT_4] end');
});

test('review 14 one value under two columns has one placeholder', () => {
  assert.deepEqual(tableOf(cleanAs('csv', 'name,company,note\nExample Corp,Example Corp,Example Corp\n').out)[1], ['[NAME_1]', '[NAME_1]', '[NAME_1]']);
});

test('review 15 two links that differ in the case of their path are two values, in the case of their host one', () => {
  const { text } = cleanText('https://shop.example.org/Abc https://shop.example.org/abc https://SHOP.example.org/abc');
  assert.equal(text, '[URL_1] [URL_2] [URL_2]');
});

test('review 16 two JSON keys that clean to the same placeholder both keep their entry', () => {
  const j = jsonOf(cleanAs('json', '{"a@example.com":1,"A@example.com":2,"x":3}').out);
  assert.deepEqual(Object.values(j).sort(), [1, 2, 3]);
  assert.equal(Object.keys(j).length, 3);
});

test('review 17 many rows and many backtick runs do not break the run', () => {
  const rows = ['a,b'];
  for (let i = 0; i < 150000; i++) rows.push('x,y');
  assert.equal(cleanAs('csv', rows.join('\n')).code, 0);
  assert.equal(cleanAs('text', '`a` '.repeat(150000)).code, 0);
});

test('review 18 a first row with a full timestamp is data', () => {
  const r = cleanAs('csv', '2026-11-17T12:30:45.123Z,customer\n2026-11-18T08:00:00+01:00,other\n');
  assert.match(r.err, /Replaced whole: no header recognized/);
});

test('review 19 text after a closing quote makes the table unreadable, and the file is cleaned as text', () => {
  const r = cleanAs('csv', 'name,note\n"Jane Example"junk,a@example.com\n');
  assert.match(r.err, /read as plain text: no table could be read/);
  assert.match(r.out, /\[EMAIL_1\]/);
});

test('review 21 the printf pipe through bash -c works for a text with many single quotes under the stated limit', { skip: process.platform === 'win32' }, () => {
  const dir = box();
  const text = `${"it's ".repeat(10000)}mail a@example.com`;
  const command = `printf '%s' '${text.replaceAll("'", "'\\''")}' | node '${script}' --format text -`;
  assert.ok(Buffer.byteLength(command) < 100000);
  const r = spawnSync('bash', ['-c', command], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: dir, XDG_CONFIG_HOME: join(dir, 'config') } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /mail \[EMAIL_1\]/);
});

test('review 22 the leak check finds an accented value in a result file', () => {
  const dir = box();
  put(dir, 'x.md', 'Jürgen €120.50');
  assert.deepEqual(leaks(['Jürgen', '€120.50'], { out: '', err: '', created: [join(dir, 'x.md')] }), ['Jürgen', '€120.50']);
});

// ---- Findings of the second reviewer's read, after the fixes above ----
test('a short number from a column does not break a date, a time, a version or a decimal number apart', () => {
  const t = tableOf(cleanAs('csv', 'id,created,note\n11,2026-11-17 08:11:02,"build 3.11.2 took 11,5 s for 11 files, see 11."\n').out);
  assert.deepEqual(t[1], ['[ID_1]', '2026-11-17 08:11:02', 'build 3.11.2 took [ID_1],5 s for [ID_1] files, see [ID_1].']);
});

test('a value with a line break is found after a letter whose lower case is longer', () => {
  const r = cleanAs('csv', 'customer,message\n"Jane\nExample",first\nOther Person,"İ then Jane\nExample called"\n');
  assert.equal(tableOf(r.out)[2][1], 'İ then [NAME_1] called');
});

test('timestamps in milliseconds are not card numbers, in text and as JSON numbers', () => {
  const stamps = Array.from({ length: 100 }, (_, i) => 1763380000000 + i * 7919);
  const r = cleanAs('json', JSON.stringify(stamps.map((ts) => ({ ts }))));
  assert.match(r.err, /Replaced: nothing/);
  assert.match(cleanAs('text', stamps.join('\n')).err, /Replaced: nothing/);
  assert.equal(cleanText('amex 3782 822463 10005 and visa 4111 1111 1111 1111').text, 'amex [CARD_1] and visa [CARD_2]');
});

// ---- Findings of the review of the fixes ----
test('fixes 1 a name that ends in a number is found in front of a slash, and an identifier in a list', () => {
  const r = cleanAs('json', '{"customer_name":"Jane Example 42","Jane Example 42/43 email":"a@example.com","id":1001,"note":"ids 1001,1002 on 2026-10-01"}');
  assert.deepEqual(leaks(['Jane Example'], r), []);
  assert.equal(jsonOf(r.out).note, 'ids [ID_1],1002 on 2026-10-01');
});

test('fixes 2 a credential that is a scheme word is replaced, and a quoted one with an escaped quote goes to its end', () => {
  const key = 'pass' + 'word';
  assert.equal(cleanText(`${key}=token sec` + 'ret=basic').text, `${key}=[SECRET_1] sec` + 'ret=[SECRET_2]');
  assert.equal(cleanText(`${key}="one\\" two three" end`).text, `${key}="[SECRET_1]" end`);
  assert.equal(cleanText('Authorization: Bea' + 'rer').text, 'Authorization: Bea' + 'rer');
});

test('fixes 3 a bearer token without a key in front is replaced, however short', () => {
  assert.equal(cleanText('Bea' + 'rer abc123 and Bea' + 'rer exampletoken').text, 'Bea' + 'rer [SECRET_1] and Bea' + 'rer [SECRET_2]');
});

test('fixes 4 a term that crosses a credential leaves no part of it visible', () => {
  const dir = box();
  const r = run(dir, ['--extra-terms', '1', '-'], { input: 'Bea' + 'rer abc123\nBea' + 'rer abc123.longsecretvalue\n' });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(leaks(['longsecretvalue', 'abc123'], r), []);
});

test('fixes 5 a JSON number too large for a number keeps its digits and is found again as text', () => {
  const r = cleanAs('json', '{"id":9007199254740993,"note":"9007199254740993","n":12345678901234567890,"s":"12 \\"x\\" 9007199254740993"}');
  const j = jsonOf(r.out);
  assert.deepEqual(leaks(['9007199254740993'], r), []);
  assert.equal(j.note, j.id);
  assert.equal(j.n, '12345678901234567890');
  assert.equal(j.s, `12 "x" ${j.id}`);
});

test('fixes 6 a Maestro card number is replaced', () => {
  assert.equal(cleanText('card 6759649826438453').text, 'card [CARD_1]');
});

test('fixes 7 a code in capitals after a trigger word in capitals, and a code of one letter', () => {
  assert.equal(cleanText('ORDER ABC, order A, order #A, the order I placed').text, 'ORDER [ID_1], order [ID_2], order #[ID_2], the order I placed');
  assert.equal(cleanText('SELECT a FROM t ORDER BY a, CASE WHEN b THEN 1 END').text, 'SELECT a FROM t ORDER BY a, CASE WHEN b THEN 1 END');
});

test('fixes 9 of two values with a line break that start alike, the longer one is taken', () => {
  const r = cleanAs('csv', 'customer,note\n"Jane\nExample",a\n"Jane\nExample Jr",b\nx,"Jane\nExample Jr called"\n');
  assert.equal(tableOf(r.out)[3][1], '[NAME_2] called');
});

test('fixes 10 many JSON keys that clean to one placeholder all keep their entry, in linear time', () => {
  const o = {};
  for (let i = 0; i < 16000; i++) o[`${Array.from({ length: 14 }, (_, b) => ((i >> b) & 1 ? 'A' : 'a')).join('')}@example.com`] = 1;
  const started = Date.now();
  const r = cleanAs('json', JSON.stringify(o));
  assert.ok(Date.now() - started < 6000, `${Date.now() - started} ms`);
  assert.equal(Object.keys(jsonOf(r.out)).length, 16000);
});

test('fixes 11 two links that differ in the case of the user name are two values', () => {
  assert.equal(cleanText('https://Ana@example.com/x https://ana@example.com/x https://ana@EXAMPLE.com/x').text, '[URL_1] [URL_2] [URL_2]');
});

test('fixes 12 a carriage return and more text after a closing quote make the table unreadable', () => {
  assert.match(cleanAs('csv', 'name,note\n"Jane Example"\rjunk,ok\n').err, /read as plain text: no table could be read/);
});

test('fixes 13 an output that became the input between the check and the opening is refused and not written', async () => {
  const { writeResult } = await import(script);
  const dir = box();
  const input = put(dir, 'a.txt', 'a@example.com\n');
  const out = put(dir, 'out.md', 'old');
  assert.throws(() => writeResult({ out, replace: true }, 'new', [input], () => { unlinkSync(out); linkSync(input, out); }), /would overwrite/);
  assert.equal(readFileSync(input, 'utf8'), 'a@example.com\n');
});

test('a fraction with many digits stays a number and the file stays JSON', () => {
  const r = cleanAs('json', '{"customer_name":"Jane Example","score":1.0000000000000002,"e":1e-1234567890123456,"f":12345678901234567890.5,"neg":-9007199254740993}');
  const j = jsonOf(r.out);
  assert.equal(j.customer_name, '[NAME_1]');
  assert.equal(j.score, 1.0000000000000002);
  assert.equal(j.neg, '-9007199254740993');
});

// ---- Findings of the second review of the fixes ----
test('a value with a line break that starts inside a quoted credential leaves no part of the credential', () => {
  const key = 'pass' + 'word';
  const r = cleanAs('json', JSON.stringify({ customer_name: 'Example"\nTraders', [`${key}="example-prefix Example"\nTraders email`]: 'a@example.com' }));
  assert.deepEqual(leaks(['example-prefix', 'Traders'], r), []);
});

test('many values on one line are replaced in linear time', () => {
  const started = Date.now();
  const r = cleanAs('text', 'a@example.com '.repeat(128000));
  assert.ok(Date.now() - started < 3000, `${Date.now() - started} ms`);
  assert.match(r.err, /Replaced: EMAIL 128000/);
});

test('a table that its own separator cannot read is not read with another separator', () => {
  assert.match(cleanAs('csv', 'product_name,note\nExample,"ok"junk\n').err, /read as plain text: no table could be read/);
  assert.equal(tableOf(cleanAs('csv', 'a;b\n1;"x,y"\n').out)[1][1], 'x,y');
  const r = cleanAs('csv', '"Kunde";"Adresse, Ort"\n"Jane Example";"Hauptstr. 1, Berlin"\n');
  assert.equal(tableOf(r.out)[1][0], '[NAME_1]');
});
