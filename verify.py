with open('index.html', encoding='utf-8') as f:
    src = f.read()

checks = [
    ('buff2CarryOvers', 'buff2 state field'),
    ('separator-buff2', 'buff2 CSS class'),
    ('review-item-icon', 'icon CSS class'),
    ('item-nerf', 'nerf zone coloring'),
    ('showTierReview', 'showTierReview function'),
    ('updateReviewColors', 'updateReviewColors function'),
    ('confirmTierReview', 'confirmTierReview function'),
    ('showTierRankings', 'showTierRankings function'),
    ('elo-gain', 'elo gain display'),
    ('elo-loss', 'elo loss display'),
    ('tierRound', 'tierRound state'),
]

for needle, label in checks:
    found = needle in src
    status = 'OK' if found else 'MISSING'
    print(status + ' - ' + label)

print()
print('File size: ' + str(len(src)) + ' chars')
print('No double CR: ' + str('\r\r' not in src))
