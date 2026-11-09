#!/usr/bin/env node
// Check a lane table against the model and effort rules of SKILL.md section 3, before any lane starts.
//   node check-lanes.mjs [--forbid <model>]... [--allow <tier>=<model>[,<model>]]... <lane-table.md>
// The lane table is the first markdown table in the file whose header has a Lane column. It needs at least the
// columns Lane, Tier, Model and Effort, and usually Plan tier and Reason. Other columns and other tables are
// ignored. Rules:
//   - every lane names a tier (cheap, standard, most capable), a model and an effort (low, medium, high);
//   - a model given with --forbid is never used for a lane;
//   - with --allow for a tier, a lane on that tier uses one of those models, or gives a Reason for another;
//   - effort above medium needs the most capable tier and a Reason that says the lane was escalated;
//   - the most capable tier needs a Reason;
//   - a lane whose Tier differs from its Plan tier needs a Reason.
// Prints one line per problem. Exits 1 when there is any, 2 on a usage error, 0 when the table passes.
import { existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const forbidden = [];
const allowed = new Map();
let file = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--forbid' && args[i + 1]) forbidden.push(args[++i].toLowerCase());
  else if (args[i] === '--allow' && /^[^=]+=.+/.test(args[i + 1] ?? '')) {
    const [tier, models] = args[++i].split('=');
    allowed.set(tier.trim().toLowerCase(), models.split(',').map((m) => m.trim().toLowerCase()));
  }
  else if (!args[i].startsWith('--') && !file) file = args[i];
  else { console.error(`unknown option: ${args[i]}`); process.exit(2); }
}
if (!file) { console.error('usage: node check-lanes.mjs [--forbid <model>]... [--allow <tier>=<model>[,<model>]]... <lane-table.md>'); process.exit(2); }
if (!existsSync(file)) { console.log(`FAIL  ${file} does not exist`); process.exit(1); }

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/^`|`$/g, ''));
// Split the file into tables (runs of lines that start with a pipe) and take the first one with a Lane column.
const tables = [];
let run = null;
for (const l of readFileSync(file, 'utf8').split('\n')) {
  if (l.trim().startsWith('|')) { if (!run) tables.push(run = []); run.push(l); } else run = null;
}
const lines = tables.find((t) => cells(t[0]).some((h) => h.toLowerCase() === 'lane')) ?? tables[0] ?? [];
const problems = [];
const fail = (msg) => problems.push(msg);
const header = lines.length ? cells(lines[0]).map((h) => h.toLowerCase()) : [];
const col = Object.fromEntries(['lane', 'plan tier', 'tier', 'model', 'effort', 'reason'].map((n) => [n, header.indexOf(n)]));
for (const n of ['lane', 'tier', 'model', 'effort']) if (col[n] < 0) fail(`the table has no "${n}" column`);
const rows = lines.slice(1).map(cells).filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
if (!problems.length && !rows.length) fail('the table has no lanes');

const TIERS = ['cheap', 'standard', 'most capable'];
const empty = (v) => !v || /^(-|none|n\/a)$/i.test(v) || /^<.*>$/.test(v);
if (!problems.length) {
  for (const r of rows) {
    const get = (n) => (col[n] >= 0 ? r[col[n]] ?? '' : '');
    const lane = get('lane') || '(unnamed lane)';
    const tier = get('tier').toLowerCase();
    const model = get('model');
    const effort = get('effort').toLowerCase();
    const planTier = get('plan tier').toLowerCase();
    const reason = get('reason');
    if (!TIERS.includes(tier)) fail(`lane ${lane}: Tier "${get('tier')}" must be cheap, standard or most capable`);
    if (empty(model)) fail(`lane ${lane}: no model; set it explicitly on every lane`);
    else if (forbidden.some((f) => model.toLowerCase().includes(f))) fail(`lane ${lane}: model ${model} is never used for a lane`);
    if (!['low', 'medium', 'high'].includes(effort)) fail(`lane ${lane}: Effort "${get('effort')}" must be low, medium or high`);
    if (effort === 'high' && (tier !== 'most capable' || !/\bescalated\b/i.test(reason) || /\bnot escalated\b/i.test(reason))) {
      fail(`lane ${lane}: effort high is allowed only for a most capable lane whose Reason says it was escalated after two failed rounds`);
    }
    if (!empty(model) && allowed.has(tier) && !allowed.get(tier).includes(model.toLowerCase()) && empty(reason)) {
      fail(`lane ${lane}: model ${model} is not the ${tier} tier's (${allowed.get(tier).join(', ')}), so it needs a Reason`);
    }
    if (tier === 'most capable' && empty(reason)) fail(`lane ${lane}: a most capable lane needs a Reason`);
    if (!empty(planTier)) {
      if (!TIERS.includes(planTier)) fail(`lane ${lane}: Plan tier "${get('plan tier')}" must be cheap, standard or most capable`);
      else if (TIERS.includes(tier) && planTier !== tier && empty(reason)) fail(`lane ${lane}: Tier ${tier} differs from the plan's ${planTier}, so it needs a Reason`);
    }
  }
}
for (const p of problems) console.log(`FAIL  ${p}`);
if (problems.length) process.exit(1);
console.log(`lane table check passed: ${rows.length} lane${rows.length === 1 ? '' : 's'}`);
