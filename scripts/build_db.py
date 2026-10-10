import os
import pandas as pd
import json

# Run relative to the repo root regardless of the caller's cwd
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

df_h = pd.read_csv('data/heroes.csv', skiprows=4, header=None)
df_h = df_h[df_h[3].notnull()]

heroes = []
for idx, row in df_h.iterrows():
    color = str(row[0]).strip().lower()
    if color == 'gray':
        color = 'grey'
    # The sheet spells it "Grey"; Violet is the special hero Glitch
    if color not in ['orange', 'yellow', 'grey', 'red', 'blue', 'green', 'violet']:
        continue
    tier_val = str(row[1]).strip()
    try:
        tier = int(float(tier_val))
    except ValueError:
        tier = 0
        
    heroes.append({
        "name": str(row[3]).strip(),
        "tier": tier,
        "color": color
    })

df_i = pd.read_csv('data/items.csv', skiprows=8, header=None)
df_i = df_i[df_i[0].notnull()]

items = []
for idx, row in df_i.iterrows():
    name = str(row[0]).strip()
    if name == 'nan' or not name:
        continue
    tier_val = str(row[1]).strip()
    try:
        tier = int(float(tier_val))
    except:
        tier = 0
    items.append({
        "name": name,
        "tier": tier
    })

db = {
    "heroes": heroes,
    "items": items
}

with open('data/database.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=4)
