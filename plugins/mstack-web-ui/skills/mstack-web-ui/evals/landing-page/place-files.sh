#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/ with a two-line README and the product picture.
# The product and every fact in the prompt are invented.
set -eu
mkdir -p work
printf '# Example Pantry site\n\nThe landing page goes here as index.html.\n' > work/README.md
cat > work/product.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480" role="img" aria-label="A phone showing a shared grocery list">
  <rect x="10" y="10" width="300" height="460" rx="36" fill="#f4efe6" stroke="#22303a" stroke-width="6"/>
  <text x="40" y="80" font-family="sans-serif" font-size="26" fill="#22303a">This week</text>
  <g font-family="sans-serif" font-size="20" fill="#22303a">
    <rect x="40" y="110" width="24" height="24" rx="6" fill="#2f7d6b"/><text x="78" y="129">Oat milk</text>
    <rect x="40" y="158" width="24" height="24" rx="6" fill="none" stroke="#22303a" stroke-width="2"/><text x="78" y="177">Tomatoes</text>
    <rect x="40" y="206" width="24" height="24" rx="6" fill="none" stroke="#22303a" stroke-width="2"/><text x="78" y="225">Dish soap</text>
    <rect x="40" y="254" width="24" height="24" rx="6" fill="#2f7d6b"/><text x="78" y="273">Bread</text>
  </g>
</svg>
SVG
