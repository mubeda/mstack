#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/checkout.html with seven planted flaws,
# planted.txt (one flaw per line with the line number it stands on) and files.sha256 (every file under work/
# with its checksum), both outside work/. The shop and its data are invented.
set -eu
mkdir -p work
cat > work/checkout.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checkout - Example Seeds</title>
<style>
  :root { --ink: #20262b; --paper: #ffffff; --line: #d7dde1; --accent: #2e6f4e; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  main { max-width: 40rem; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 1.75rem; margin: 0 0 16px; }
  h2 { font-size: 1.25rem; margin: 32px 0 12px; }
  .item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .item__name { flex: 1; }
  .hint { color: #a9b1b6; font-size: 0.875rem; }
  .icon-button { width: 44px; height: 44px; border: 0; background: none; cursor: pointer; }
  input { font: inherit; width: 100%; min-height: 44px; padding: 0 12px; border: 1px solid #8a949b; border-radius: 6px; }
  input:focus { outline: none; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-weight: 600; margin-bottom: 4px; }
  .pay { display: inline-block; min-height: 44px; padding: 10px 20px; border-radius: 6px; background: var(--accent); color: #ffffff; cursor: pointer; }
  #addresses { list-style: none; margin: 0; padding: 0; }
  #addresses li { padding: 8px 0; border-bottom: 1px solid var(--line); }
</style>
</head>
<body>
<main>
  <h1>Checkout</h1>

  <h2>Your order</h2>
  <div class="item">
    <img src="seed-packet.svg" alt="A packet of wild garlic seeds">
    <span class="item__name">Wild garlic seeds, 2 g</span>
    <span>4,50 EUR</span>
    <button class="icon-button" type="button"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none"/></svg></button>
  </div>
  <p class="hint">Seeds are sent by letter post and arrive within five working days.</p>

  <h2>Saved addresses</h2>
  <ul id="addresses"></ul>

  <h2>Delivery</h2>
  <form id="delivery">
    <div class="field">
      <label for="name">Full name</label>
      <input id="name" name="name" autocomplete="name" required>
    </div>
    <div class="field">
      <input name="email" type="email" autocomplete="email" placeholder="E-mail address" required>
    </div>
    <div class="pay" onclick="document.getElementById('delivery').submit()">Pay 4,50 EUR</div>
  </form>
</main>
<script>
  const saved = JSON.parse(localStorage.getItem('addresses') || '[]');
  const list = document.getElementById('addresses');
  for (const address of saved) {
    const item = document.createElement('li');
    item.textContent = address;
    list.appendChild(item);
  }
</script>
</body>
</html>
HTML
cat > work/seed-packet.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e6efe9"/><rect x="18" y="10" width="28" height="44" fill="#2e6f4e"/></svg>
SVG
line() { grep -n -F -- "$1" work/checkout.html | head -1 | cut -d: -f1; }
{
  echo "$(line '<button class="icon-button"'): the remove button shows only an icon and has no readable name"
  echo "$(line '<img src="seed-packet.svg"'): the image has no width and height, so its size is not reserved"
  echo "$(line '.hint { color: #a9b1b6'): the hint text has a contrast of about 2.2 to 1 on white"
  echo "$(line 'placeholder="E-mail address"'): the e-mail field has a placeholder and no label"
  echo "$(line 'input:focus { outline: none; }'): the focus outline is removed with nothing in its place"
  echo "$(line '<div class="pay"'): the pay control is a div with a click handler, not a button"
  echo "$(line 'for (const address of saved)'): the list of saved addresses shows nothing when there are none (no empty state)"
} > planted.txt
(cd work && find . -type f | sort | xargs sha256sum) > files.sha256
