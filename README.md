# Slice and Dice Autobalance

A web tool for rebalancing [Slice and Dice](https://store.steampowered.com/app/1775490/Slice__Dice/) items from your own picks. You draft items tier by tier, and the tool turns your choices into tier adjustments. It then gives you a ready-to-paste `=itempool` textmod.

### Try it here: https://bokan96.github.io/snd-autobalance/

## Features

### ▶ Draft mode
- You see three items from the current tier and pick the **best** one (click, or press **A / S / D**, or **← / ↓ / →**).
- Each pick updates the items' **Elo** ratings: the picked item "wins" against the other two. Each card shows its current rating and the projected gain and loss.
- Matchmaking always offers the least-seen item first and usually pairs it with the two closest in Elo.
- An item leaves the pool once it has been picked or passed over 5 times. A tier ends after 30 rounds or when fewer than 3 items are left.
- **📊** shows the current tier's Elo rankings. **Skip tier** jumps straight to the review.

### Tier review
After each tier, the items are listed by Elo with draggable separators. On touch screens, tap an item and then tap where it should go.

| Zone | Effect |
|---|---|
| Above **▲ +1 tier nerf** | moved up one tier |
| Between the separators | unchanged |
| Below **▼ -1 tier buff** | moved down one tier |
| Below **▼▼ -2 tier buff** | moved down two tiers |

The top 5 items start in the nerf zone and the bottom 5 in the buff zone, except in tier 1, where nothing starts as a buff. Nerfed items carry into the next tier's draft with a fresh Elo rating. **Skip to results** ends the draft early.

### ✏️ Manual set
Step through every item in tier order and set its tier with **− / +**. You can skip the rest of a tier.

### 📋 Community balance mod
This copies a preset of community-agreed tier changes and shows them on the results page.

### Results and export
The results page groups every adjustment by original tier (▲ nerf, ▼ buff). **Copy item autobalance mod** copies a textmod like:

```
=itempool.Anchor.n.Anchor.tier.2+Arrow.n.Arrow.tier.1+...
```

### 📋 Hero pick-rate analyzer
Under **Paste pick rate** on the items page, paste the game's `pickRates` JSON. The tool lists your most- and least-picked heroes and builds a hero pool with suffixes added to them.

<details>
<summary>Pick-rate format</summary>

```json
{ "pickRates": [ {"n":"Berserker-hp","v":1245201}, {"n":"Medic-hp","v":2555914} ] }
```

- Hero entries end in `-hp`. Item entries (`-ip`) are ignored.
- `v & 0xFFFF` is the number of times the hero was picked, and `v >> 16` is the number of times it wasn't.
- Both counts get +1 so that rates never reach 0% or 100%: `0/8` becomes `1/10`.
- The top 3 heroes get `.n.TopPick.{suffix}` and the bottom 3 get `.n.LowPick.{suffix}`. The suffixes are defined in [js/data/hero_suffixes.js](js/data/hero_suffixes.js).
</details>

## Running locally

It's a static site with no build step. Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000   # then open http://localhost:8000
```

## Project layout

```
index.html            page markup
css/style.css         styles
js/
  util.js             shared constants (draft tuning) and helpers
  draft.js            draft mode, matchmaking, Elo
  review.js           tier review and rankings modal
  manual.js           manual set mode
  results.js          results page and textmod export
  analyzer.js         hero pick-rate analyzer
  main.js             event wiring (buttons use data-action="...")
  data/
    items.js          ITEMS_DB (generated, see below)
    balances.js       community balance preset
    hero_suffixes.js  hero pool suffixes
icons/                hero and item icons (extracted from the spreadsheet)
data/                 CSV/JSON exports of the tier list
scripts/              data pipeline (Python)
guides/               source spreadsheet and modding references
```

## Updating game data

The item list comes from `guides/Slice and Dice 3.1 Unfair Tier list.xlsx`:

```bash
pip install -r requirements.txt
python scripts/build_items.py      # regenerates js/data/items.js
python scripts/extract_icons.py    # re-extracts icons
```

See [scripts/README.md](scripts/README.md) for details.

## License

This project is open source and available for personal use.

---

**Note:** This is a fan-made tool and is not officially affiliated with Slice and Dice.
