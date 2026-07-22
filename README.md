# Slice and Dice Pick Rate Analyzer

 A web-based tool for analyzing Slice and Dice hero pick rates and generating modified hero pools.

##  Overview
This tool analyzes your Slice and Dice hero pick rates and generates a modified hero pool with unique suffixes for your most and least picked heroes.

##  Quick Start

### Try it here: https://bokan96.github.io/snd-autobalance/

## 📊 How It Works

### Pick Rate Encoding
The game stores pick data in a compact binary format:
- **Lower 16 bits** (`v & 0xFFFF`) = times picked
- **Upper bits** (`v >> 16`) = times NOT picked
- **Total opportunities** = picked + not picked

**Example:** Berserker with v=1245201
```
Picked: 17 times
Not picked: 19 times
Total: 36 opportunities
Pick rate: 47.2%
```

### Normalization
To avoid extreme percentages, the analyzer adds +1 to both picked and not picked counts:
- `0/8` becomes `1/10` (10% instead of 0%)
- `13/13` becomes `14/15` (93.3% instead of 100%)

### Hero Pool Modification
The analyzer identifies your:
- **Top 3 heroes** (most picked) → marked with `.n.TopPick.{UniqueSuffix}`
- **Bottom 3 heroes** (least picked) → marked with `.n.LowPick.{UniqueSuffix}`

**Example transformations:**
```
Original: +soldier+
Top Pick: +soldier.n.TopPick.soldier.n.SoldierTop+

Original: +medic+
Low Pick: +medic.n.LowPick.medic.n.MedicLow+
```

##  Customizing Hero Suffixes

To customize the suffixes for each hero, edit `hero_suffixes.js`:

```javascript
const HERO_SUFFIXES = {
    "Soldier": { 
        topPick: "soldier.n.CustomTopSuffix", 
        lowPick: "soldier.n.CustomLowSuffix" 
    },
    // ... modify other heroes
};
```

##  Data Format

The analyzer expects JSON in this format:
```json
{
  "pickRates": [
    {"n":"Berserker-hp","v":1245201},
    {"n":"Medic-hp","v":2555914},
    {"n":"Wizard-hp","v":524315}
  ]
}
```

- Heroes end with `-hp`
- Items end with `-ip` (ignored by analyzer)
- The `v` value contains encoded pick data

##  License

This project is open source and available for personal use.

##  About Slice and Dice

[Slice and Dice](https://store.steampowered.com/app/1775490/Slice__Dice/) is a streamlined tactics game by tann.

---

**Note:** This is a fan-made tool and is not officially affiliated with Slice and Dice.
