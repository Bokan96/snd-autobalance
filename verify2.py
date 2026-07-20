with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

checks = [
    ('item-elo-a', 'elo element a', True),
    ('item-elo-b', 'elo element b', True),
    ('item-elo-c', 'elo element c', True),
    ('item-elo${suffix}', 'elo lookup in renderItemCard', True),
    ('rankings-modal', 'rankings modal', True),
    ('tier-review-container', 'review container', True),
    ('confirmTierReview', 'CONTINUE wired', True),
    ('showTierRankings()', 'stats button', True),
    ('draft-round-info', 'round-info REMOVED', False),
    ('poolRemaining', 'poolRemaining REMOVED', False),
    ("confirm('Exit", 'exit confirm REMOVED', False),
]

for needle, label, should_exist in checks:
    hits = [i+1 for i, l in enumerate(lines) if needle in l]
    if should_exist:
        status = ('OK at L' + str(hits[0])) if hits else 'MISSING'
    else:
        status = 'OK (absent)' if not hits else ('STILL PRESENT at L' + str(hits))
    print(status + ' - ' + label)
