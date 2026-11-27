Build a plain HTML page `reader.html` (HTML, CSS and inline JS, no build step or external dependencies) for Example Reader with two panels:

1. **Article summarizer:** A textarea for article text, a "Summarize" button, a "Stop" button to cancel an active summary, and an output box that uses browser Built-in AI summarization when supported and falls back gracefully when the browser or hardware does not support it.
2. **Comment HTML preview:** A textarea where a user can enter an untrusted HTML comment snippet and a "Preview comment" button that safely renders a preview without risking XSS.
