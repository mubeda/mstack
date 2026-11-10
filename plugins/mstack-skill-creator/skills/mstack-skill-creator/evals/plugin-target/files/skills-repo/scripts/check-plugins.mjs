#!/usr/bin/env node
// Check every plugin against AGENTS.md, and that a new or changed plugin's version is higher than at HEAD.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
const fails = [];
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const atHead = (p) => { try { return JSON.parse(execFileSync('git', ['show', `HEAD:${p}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { return null; } };
const claude = json('.claude-plugin/marketplace.json').plugins;
const codex = json('.agents/plugins/marketplace.json').plugins;
const readme = readFileSync('README.md', 'utf8');
const plugins = readdirSync('plugins');
for (const name of plugins) {
  const base = `plugins/${name}`;
  const skill = `${base}/skills/${name}`;
  const c = `${base}/.claude-plugin/plugin.json`;
  const x = `${base}/.codex-plugin/plugin.json`;
  if (!existsSync(c) || !existsSync(x)) { fails.push(`${name}: missing a manifest`); continue; }
  const vc = json(c).version; const vx = json(x).version;
  const rc = claude.find((p) => p.name === name); const rx = codex.find((p) => p.name === name);
  if (!rc || !rx) fails.push(`${name}: missing a registry entry`);
  if (json(x).skills !== './skills/') fails.push(`${name}: Codex manifest needs "skills": "./skills/"`);
  if (rc && (rc.version !== vc || vc !== vx)) fails.push(`${name}: versions differ`);
  if (!existsSync(`${skill}/SKILL.md`)) fails.push(`${name}: missing SKILL.md`);
  if (!existsSync(`${skill}/LICENSE`) || readFileSync(`${skill}/LICENSE`, 'utf8') !== readFileSync('LICENSE', 'utf8')) fails.push(`${name}: LICENSE missing or different`);
  if (!existsSync(`${skill}/THIRD_PARTY_NOTICES.md`)) fails.push(`${name}: missing THIRD_PARTY_NOTICES.md`);
  if (!readme.includes(`| ${name} |`)) fails.push(`${name}: missing README row`);
  const old = atHead(c);
  if (old && old.version !== vc) {
    const [a, b] = [old.version, vc].map((v) => v.split('.').map(Number));
    if (!(b[0] > a[0] || (b[0] === a[0] && (b[1] > a[1] || (b[1] === a[1] && b[2] > a[2]))))) fails.push(`${name}: version ${vc} is not higher than ${old.version}`);
  }
}
for (const f of fails) console.log(`FAIL  ${f}`);
if (fails.length) process.exit(1);
console.log(`plugin checks passed: ${plugins.length} plugins`);
