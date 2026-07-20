import openpyxl, json, re

wb = openpyxl.load_workbook(r'guides/Slice and Dice 3.1 Unfair Tier list.xlsx', data_only=True)
ws = wb['Items Tier 1-9 3.1 ']

# Collect tier 2 items from xlsx
xlsx_t2 = {}
for row in ws.iter_rows(min_row=9, values_only=True):
    name = row[0]
    tier = row[1]
    effect = row[3]
    if name and tier == 2.0 and effect:
        xlsx_t2[name] = effect.replace('\r\n', '\n').strip()

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse ITEMS_DB from the line
match = re.search(r'const ITEMS_DB = (\[.*?\]);', content, re.DOTALL)
if not match:
    print('Could not find ITEMS_DB')
    exit(1)

items_json = match.group(1)
items = json.loads(items_json)

# Update tier 2 descriptions
updated = 0
for item in items:
    if item['tier'] == 2 and item['name'] in xlsx_t2:
        old = item['description']
        new = xlsx_t2[item['name']]
        if old != new:
            item['description'] = new
            updated += 1
            print('Updated: ' + item['name'])

print('Total updated: ' + str(updated))

# Serialize back (compact, no indent)
new_json = json.dumps(items, ensure_ascii=False, separators=(',', ':'))
new_content = content[:match.start(1)] + new_json + content[match.end(1):]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done')
