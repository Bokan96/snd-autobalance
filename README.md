# Slice and Dice Pick Rate Analyzer

🎮 A web-based tool for analyzing Slice and Dice hero pick rates and generating modified hero pools.

## 📋 Overview
This tool analyzes your Slice and Dice hero pick rates and generates a modified hero pool with unique suffixes for your most and least picked heroes.

## 🚀 Quick Start

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

## 📁 File Structure

```
.
├── index.html          # Main analyzer webpage
├── hero_suffixes.js    # Hero suffix mappings (96 heroes)
└── README.md          # This file
```

## 🔧 Customizing Hero Suffixes

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

## 📝 Data Format

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

## 🎯 Usage Example

1. Copy your pick rate data from the game
2. Paste it into the text area
3. Click "Analyze Pick Rates"
4. View your statistics
5. Copy the modified hero pool

**Sample Output:**
```
📊 Analysis Results

Your most picked heroes are: Soldier, Brute, Medic
1. Soldier: 34/52 picks (65.4%)
2. Brute: 31/42 picks (73.8%)
3. Medic: 11/50 picks (22.0%)

Your least picked heroes are: Twin, Alien, Coffin
1. Twin: 1/2 picks (50.0%)
2. Alien: 1/2 picks (50.0%)
3. Coffin: 1/4 picks (25.0%)
```

## 🎲 Pickable Heroes

96 heroes are tracked (32 starter heroes excluded):
- Fighter Class: Berserker, Brute, Collector, Gladiator, Soldier, Whirl, Scrapper, Sinew...
- Rogue Class: Barbarian, Brawler, Curator, Leader, Veteran, Bash, Eccentric, Captain...
- Cleric Class: Knight, Armorer, Bard, Cleric, Guardian, Pilgrim, Monk, Warden...
- Mage Class: Druid, Herbalist, Medic, Priestess, Vampire, Enchanter, Disciple, Fey...

See `hero_suffixes.js` for the complete list.

## 🛠️ Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Browser Support**: Modern browsers with ES6 support
- **Hosting**: GitHub Pages compatible
- **File Size**: ~50KB total

## 📦 Deployment to GitHub Pages

1. Fork or clone this repository
2. Go to repository Settings → Pages
3. Set Source to "main" branch
4. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## 🤝 Contributing

Feel free to:
- Report issues
- Suggest features
- Submit pull requests
- Customize hero suffixes

## 📄 License

This project is open source and available for personal use.

## 🎮 About Slice and Dice

[Slice and Dice](https://store.steampowered.com/app/1775490/Slice__Dice/) is a streamlined tactics game by tann.

---

**Note:** This is a fan-made tool and is not officially affiliated with Slice and Dice.
