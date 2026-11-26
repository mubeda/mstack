import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const commandsPath = resolve(here, '../skills/mstack-vendors/references/commands.md');
const APPROVED = 'Run it as an approved command, because it needs the network and writes under the home folder.';

function section(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`^## ${escaped}\\s*$`, 'm'));
  if (parts.length < 2) return '';
  return parts[1].split(/^## /m)[0];
}

test('references/commands.md requires the approved-command sentence on both round-one and fix-round lines for host codex without hiding them from other hosts', () => {
  const text = readFileSync(commandsPath, 'utf8');
  const codexSec = section(text, 'Codex');
  const devCopySec = section(text, 'A developer in a copy');

  assert.ok(codexSec, 'missing ## Codex section');
  assert.ok(devCopySec, 'missing ## A developer in a copy section');

  assert.match(
    codexSec,
    /both\b[^.\n]*command cell[^.\n]*fix-round line[^.\n]*Run it as an approved command, because it needs the network and writes under the home folder\./i,
    '## Codex must explicitly state that both the Command-cell line and the fix-round line carry the exact approved-command sentence',
  );

  const lines = devCopySec.split(/\r?\n/);
  const roundOneLine = lines.find((l) => l.startsWith('Run the Command cell of the claude row'));
  const fixLine = lines.find((l) => l.startsWith('A fix round:'));
  assert.ok(roundOneLine, 'missing round-one Command-cell line in ## A developer in a copy');
  assert.ok(fixLine, 'missing "A fix round:" line in ## A developer in a copy');
  for (const [label, line] of [['round-one', roundOneLine], ['fix-round', fixLine]]) {
    assert.ok(
      line.includes(`(On host codex, append: ${APPROVED})`),
      `${label} line in ## A developer in a copy must carry "(On host codex, append: ${APPROVED})"`,
    );
    assert.ok(
      !line.includes('[host codex]'),
      `${label} line must not use [host codex] bracket-omission syntax, which would drop the whole line on other hosts`,
    );
  }
});
