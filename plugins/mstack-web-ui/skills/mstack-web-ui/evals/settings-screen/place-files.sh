#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/ holds a small React 18 app made with Vite, with
# design tokens, a Button and a Field component, one screen and a stand-in data module. No node_modules.
# The app, its names and its data are invented; addresses use a reserved example domain.
set -eu
mkdir -p work/src/components
cat > work/package.json <<'JSON'
{
  "name": "example-works",
  "private": true,
  "version": "0.3.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": { "@vitejs/plugin-react": "^4.3.0", "vite": "^5.4.0" }
}
JSON
cat > work/vite.config.js <<'JS'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
JS
cat > work/index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Example Works</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
cat > work/src/main.jsx <<'JS'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
JS
cat > work/src/styles.css <<'CSS'
:root {
  --color-bg: #fbfaf7;
  --color-surface: #ffffff;
  --color-text: #1d2a33;
  --color-muted: #5b6770;
  --color-border: #c9d1d6;
  --color-accent: #1f6f8b;
  --color-accent-text: #ffffff;
  --color-danger: #b3261e;
  --color-focus: #1f6f8b;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --radius-1: 6px;
  --radius-2: 10px;
  --font-body: system-ui, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-body); color: var(--color-text); background: var(--color-bg); line-height: 1.5; }
.page { max-width: 48rem; margin: 0 auto; padding: var(--space-5) var(--space-4); }
.page h1 { font-size: 1.75rem; margin: 0 0 var(--space-5); }
.stack { display: flex; flex-direction: column; gap: var(--space-4); }
.button { font: inherit; min-height: 44px; padding: 0 var(--space-4); border-radius: var(--radius-1); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; }
.button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.button--primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-text); }
.button--danger { color: var(--color-danger); }
.button[disabled] { opacity: 0.5; cursor: not-allowed; }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-weight: 600; }
.field__input { font: inherit; min-height: 44px; padding: 0 var(--space-3); border: 1px solid var(--color-muted); border-radius: var(--radius-1); background: var(--color-surface); color: var(--color-text); }
.field__input:focus-visible { outline: 2px solid var(--color-focus); outline-offset: -3px; }
.field__error { color: var(--color-danger); min-height: 1lh; }
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-2); padding: var(--space-4); }
CSS
cat > work/src/components/Button.jsx <<'JS'
// The app's one button. variant: "default" | "primary" | "danger".
export default function Button({ variant = 'default', type = 'button', children, ...rest }) {
  const cls = variant === 'default' ? 'button' : `button button--${variant}`;
  return <button type={type} className={cls} {...rest}>{children}</button>;
}
JS
cat > work/src/components/Field.jsx <<'JS'
import { useId } from 'react';

// A labelled text field with room for one error line.
export default function Field({ label, error, ...rest }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input className="field__input" id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
      <span className="field__error" id={`${id}-error`}>{error}</span>
    </div>
  );
}
JS
cat > work/src/api.js <<'JS'
// A stand-in for the server. Every call answers after a short wait, and can fail.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let members = [
  { id: 'm1', name: 'Imke Vasterling', email: 'imke@example.com' },
  { id: 'm2', name: 'Tomasz Brzezicki', email: 'tomasz@example.com' },
  { id: 'm3', name: 'Oluwaseun Adebayo-Fitzgerald', email: 'oluwaseun.adebayo-fitzgerald@example.com' },
];

export async function fetchProjects() { await wait(300); return [{ id: 'p1', name: 'Quay rebuild' }, { id: 'p2', name: 'Tide tables' }]; }
export async function fetchMembers() { await wait(600); return [...members]; }
export async function removeMember(id) { await wait(400); members = members.filter((m) => m.id !== id); }
export async function saveProfile(profile) {
  await wait(500);
  if (!profile.email.includes('@')) throw new Error('invalid email');
  return profile;
}
JS
cat > work/src/App.jsx <<'JS'
import { useEffect, useState } from 'react';
import Button from './components/Button.jsx';
import { fetchProjects } from './api.js';

function Projects() {
  const [projects, setProjects] = useState(null);
  useEffect(() => { fetchProjects().then(setProjects); }, []);
  return (
    <div className="stack">
      {projects === null ? <p>Loading projects…</p> : projects.map((p) => <div className="card" key={p.id}>{p.name}</div>)}
      <Button variant="primary">New project</Button>
    </div>
  );
}

export default function App() {
  return (
    <main className="page">
      <h1>Example Works</h1>
      <Projects />
    </main>
  );
}
JS
sha256sum work/package.json | cut -d' ' -f1 > package.sha256
