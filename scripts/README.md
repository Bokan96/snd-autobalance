# Data scripts

All game data comes from the community tier list spreadsheet,
`guides/Slice and Dice 3.1 Unfair Tier list.xlsx`. These scripts turn it into
the files the web app and repo use. Run them from anywhere; paths are resolved
from the repo root.

```bash
pip install -r requirements.txt
```

| Script | Reads | Writes | Used by |
|---|---|---|---|
| `build_items.py` | xlsx, sheet `Items Tier 1-9 3.1` | `js/data/items.js`, `data/items_tierlist.json` | `js/data/items.js` is loaded by `index.html` (`ITEMS_DB`) |
| `extract_icons.py` | xlsx (embedded images) | `icons/heroes/*.png`, `icons/items/*.png` | item icons in the app |
| `build_db.py` | `data/heroes.csv`, `data/items.csv` | `data/database.json` | reference only (not loaded by the app) |

## Updating item data

1. Replace the xlsx in `guides/` with the new version.
2. `python scripts/build_items.py`
3. `python scripts/extract_icons.py` if items were added or renamed.
4. Review `git diff js/data/items.js` and commit.

`python scripts/build_items.py --check` exits with code 1 if the generated
files no longer match the spreadsheet. Don't edit `js/data/items.js` by hand;
the next rebuild will overwrite it.

## Notes

- `data/heroes.csv` and `data/items.csv` are CSV exports of the hero and item
  sheets. No script in this repo produces them.
- `js/data/balances.js` (community balance tiers) and `js/data/hero_suffixes.js`
  are maintained by hand.
