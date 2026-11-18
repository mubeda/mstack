#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/ holds a small React 18 app made with Vite that
# already uses one animation library (anime.js 4) in one component, on a click and not when the page loads, and package.sha256 (the digest of its
# manifest) outside work/. No node_modules: the case is graded from source. The app and its data are invented.
set -eu
mkdir -p work/src
cat > work/package.json <<'JSON'
{
  "name": "example-works-board",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "animejs": "^4.0.0", "react": "^18.3.1", "react-dom": "^18.3.1" },
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
    <title>Example Works Board</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
cat > work/src/main.jsx <<'JS'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
JS
cat > work/src/styles.css <<'CSS'
:root {
  --color-bg: #f7f6f2;
  --color-surface: #ffffff;
  --color-text: #1d2327;
  --color-muted: #5b6770;
  --color-line: #d5d9dc;
  --color-accent: #1f6f5c;
  --color-accent-strong: #17574a;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --radius: 8px;
}
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: var(--color-text); background: var(--color-bg); }
.page { max-width: 40rem; margin: 0 auto; padding: var(--space-6) var(--space-4); }
.banner { padding: var(--space-4); border: 1px solid var(--color-line); border-radius: var(--radius); background: var(--color-surface); }
.banner__title { margin: 0; font-size: 1.5rem; }
.tasks { list-style: none; margin: var(--space-6) 0; padding: 0; display: grid; gap: var(--space-2); }
.tasks__item { padding: var(--space-3) var(--space-4); border: 1px solid var(--color-line); border-radius: var(--radius); background: var(--color-surface); }
.button { font: inherit; min-height: 44px; padding: 0 var(--space-4); border: 0; border-radius: var(--radius); color: #ffffff; background: var(--color-accent); cursor: pointer; }
.button:focus-visible { outline: 2px solid var(--color-text); outline-offset: 2px; }
CSS
cat > work/src/Banner.jsx <<'JS'
import { useEffect, useRef } from 'react';
import { animate, createScope } from 'animejs';

// The one place that animates today: the title nudges when the user presses the preview button. Nothing moves when the
// page loads. The scope is reverted when the banner unmounts.
export default function Banner() {
  const root = useRef(null);
  const scope = useRef(null);

  useEffect(() => {
    scope.current = createScope({ root, mediaQueries: { reduce: '(prefers-reduced-motion: reduce)' } }).add((self) => {
      self.add('nudge', () => {
        if (self.matches.reduce) return;
        animate('.banner__title', { translateX: [6, 0], duration: 300, ease: 'out(3)' });
      });
    });
    return () => scope.current.revert();
  }, []);

  return (
    <header className="banner" ref={root}>
      <h1 className="banner__title">Example Works Board</h1>
      <button className="button" type="button" onClick={() => scope.current.methods.nudge()}>Preview the title motion</button>
    </header>
  );
}
JS
cat > work/src/TaskList.jsx <<'JS'
// A plain list. It has no animation yet.
export default function TaskList({ tasks }) {
  if (tasks.length === 0) return <p>No tasks yet. Add the first one.</p>;
  return (
    <ul className="tasks">
      {tasks.map((task) => (
        <li className="tasks__item" key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
JS
cat > work/src/App.jsx <<'JS'
import { useState } from 'react';
import Banner from './Banner.jsx';
import TaskList from './TaskList.jsx';

const START = [
  { id: 1, title: 'Send the quote to Example Bakery' },
  { id: 2, title: 'Order paper for the print run' },
  { id: 3, title: 'Call Example Books about the delivery' },
  { id: 4, title: 'Check the invoices of last week' },
];

export default function App() {
  const [tasks, setTasks] = useState(START);
  const add = () => setTasks((list) => [...list, { id: list.length + 1, title: `New task ${list.length + 1}` }]);

  return (
    <main className="page">
      <Banner />
      <TaskList tasks={tasks} />
      <button className="button" type="button" onClick={add}>Add</button>
    </main>
  );
}
JS
sha256sum work/package.json | cut -d' ' -f1 > package.sha256
