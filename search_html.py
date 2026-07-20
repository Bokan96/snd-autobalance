import sys

with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

pats = ['confirmExit', 'exitDraft', 'rankings-modal', 'rankings-list', 'item-elo', 'K_FACTOR', 'item-icon', 'item-name', 'item-desc', 'item-fallback']

for p in pats:
    hits = [(i+1, lines[i].encode('ascii', errors='replace').decode('ascii').rstrip()) for i in range(len(lines)) if p in lines[i]]
    if hits:
        print(f'--- {p} ---')
        for ln, t in hits:
            print(f'  L{ln}: {t[:130]}')
        print()
