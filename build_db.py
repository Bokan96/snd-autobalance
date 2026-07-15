import pandas as pd
import json

df_h = pd.read_csv('heroes.csv', skiprows=4, header=None)
df_h = df_h[df_h[3].notnull()]

heroes = []
for idx, row in df_h.iterrows():
    color = str(row[0]).strip().lower()
    if color not in ['orange', 'yellow', 'gray', 'red', 'blue', 'green']:
        continue
    tier_val = str(row[1]).strip()
    try:
        tier = int(float(tier_val))
    except:
        tier = 0
        
    heroes.append({
        "name": str(row[3]).strip(),
        "tier": tier,
        "color": color
    })

df_i = pd.read_csv('items.csv', skiprows=8, header=None)
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

with open('database.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=4)
