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
const agents = existsSync('AGENTS.md') ? readFileSync('AGENTS.md', 'utf8') : '';

const singleHost = new Map();
const hostMap = { 'Claude Code': 'claude', Codex: 'codex', Antigravity: 'antigravity' };
const singleSection = agents.split(/^## Single-host plugins\s*$/m)[1]?.split(/^## /m)[0] ?? '';
for (const raw of singleSection.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('<!--')) continue;
  const m = line.match(/^-\s+`([a-z0-9-]+)`:\s+(Claude Code|Codex|Antigravity) only$/);
  if (!m) { fails.push(`AGENTS.md: invalid Single-host plugins line "${line}"`); continue; }
  singleHost.set(m[1], hostMap[m[2]]);
}

const checkBump = (name, manifestPath, ver) => {
  const old = atHead(manifestPath);
  if (old && old.version !== ver) {
    const [a, b] = [old.version, ver].map((v) => v.split('.').map(Number));
    if (!(b[0] > a[0] || (b[0] === a[0] && (b[1] > a[1] || (b[1] === a[1] && b[2] > a[2]))))) {
      fails.push(`${name}: version ${ver} is not higher than ${old.version}`);
    }
  }
};

const plugins = readdirSync('plugins');
for (const name of plugins) {
  const base = `plugins/${name}`;
  const skill = `${base}/skills/${name}`;
  const c = `${base}/.claude-plugin/plugin.json`;
  const x = `${base}/.codex-plugin/plugin.json`;
  const a = `${base}/.antigravity-plugin/plugin.json`;
  const hasC = existsSync(c);
  const hasX = existsSync(x);
  const hasA = existsSync(a);
  const rc = claude.find((p) => p.name === name);
  const rx = codex.find((p) => p.name === name);
  const single = singleHost.get(name);

  if (single === 'claude') {
    if (!hasC) fails.push(`${name}: missing Claude manifest`);
    if (hasX || hasA) fails.push(`${name}: Claude Code only plugin must have only its Claude manifest`);
    if (!rc) fails.push(`${name}: missing Claude registry entry`);
    if (rx) fails.push(`${name}: Claude Code only plugin must not have a Codex registry entry`);
    if (hasC) {
      const vc = json(c).version;
      if (rc && rc.version !== vc) fails.push(`${name}: versions differ`);
      checkBump(name, c, vc);
    }
  } else if (single === 'codex') {
    if (!hasX) fails.push(`${name}: missing Codex manifest`);
    if (hasC || hasA) fails.push(`${name}: Codex only plugin must have only its Codex manifest`);
    if (!rx) fails.push(`${name}: missing Codex registry entry`);
    if (rc) fails.push(`${name}: Codex only plugin must not have a Claude registry entry`);
    if (hasX) {
      if (json(x).skills !== './skills/') fails.push(`${name}: Codex manifest needs "skills": "./skills/"`);
      checkBump(name, x, json(x).version);
    }
  } else if (single === 'antigravity') {
    if (!hasA) fails.push(`${name}: missing Antigravity manifest`);
    if (hasC || hasX) fails.push(`${name}: Antigravity only plugin must have only its Antigravity manifest`);
    if (rc || rx) fails.push(`${name}: Antigravity only plugin must not have a registry entry`);
    if (hasA) checkBump(name, a, json(a).version);
  } else {
    if (!hasC || !hasX) { fails.push(`${name}: missing a manifest`); continue; }
    const vc = json(c).version; const vx = json(x).version;
    if (!rc || !rx) fails.push(`${name}: missing a registry entry`);
    if (json(x).skills !== './skills/') fails.push(`${name}: Codex manifest needs "skills": "./skills/"`);
    if (rc && (rc.version !== vc || vc !== vx)) fails.push(`${name}: versions differ`);
    if (hasA && json(a).version !== vc) fails.push(`${name}: Antigravity manifest version differs`);
    checkBump(name, c, vc);
  }

  if (!existsSync(`${skill}/SKILL.md`)) fails.push(`${name}: missing SKILL.md`);
  if (!existsSync(`${skill}/LICENSE`) || readFileSync(`${skill}/LICENSE`, 'utf8') !== readFileSync('LICENSE', 'utf8')) fails.push(`${name}: LICENSE missing or different`);
  if (!existsSync(`${skill}/THIRD_PARTY_NOTICES.md`)) fails.push(`${name}: missing THIRD_PARTY_NOTICES.md`);
  if (!readme.includes(`| ${name} |`)) fails.push(`${name}: missing README row`);
}
for (const f of fails) console.log(`FAIL  ${f}`);
if (fails.length) process.exit(1);
console.log(`plugin checks passed: ${plugins.length} plugins`);
