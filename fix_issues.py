"""
Comprehensive fix for index.html:
1. Remove draft-round-info div + CSS + poolRemaining JS
2. Add item-elo elements to item cards A/B/C
3. Add rankings modal HTML + 📊 button in draft header
4. Fix tier-transition: add tier-review-container + wire CONTINUE button
5. Remove confirmExitDraft warning (direct navigation)
"""

with open('index.html', encoding='utf-8') as f:
    src = f.read()

orig_len = len(src)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Remove draft-round-info CSS
# ─────────────────────────────────────────────────────────────────────────────
src = src.replace(
    '''        .draft-round-info {
            font-size: 11px;
            color: var(--text-dim);
        }
        .draft-round-info strong {
            color: var(--text);
        }
''',
    ''
)

# ─────────────────────────────────────────────────────────────────────────────
# 2. Remove draft-round-info HTML div
# ─────────────────────────────────────────────────────────────────────────────
import re
# Remove the whole div line
src = re.sub(r'\s*<div class="draft-round-info">.*?</div>\n?', '', src)

# ─────────────────────────────────────────────────────────────────────────────
# 3. Remove poolRemaining JS block (the whole const + getElementById line)
# ─────────────────────────────────────────────────────────────────────────────
src = re.sub(
    r'\n    // Unsorted count\n    const poolRemaining = ITEMS_DB\.filter\(i => \{[^}]+\}\)\.length;\n\n    document\.getElementById\(\'draft-round-cur\'\)\.textContent = poolRemaining;\n',
    '\n',
    src
)

# ─────────────────────────────────────────────────────────────────────────────
# 4. Add item-elo element to each card (after item-desc)
# ─────────────────────────────────────────────────────────────────────────────
for letter in ['a', 'b', 'c']:
    old_desc = f'                <div class="item-card__desc" id="item-desc-{letter}"></div>\n            </div>'
    new_desc = f'                <div class="item-card__desc" id="item-desc-{letter}"></div>\n                <div class="item-card__elo" id="item-elo-{letter}"></div>\n            </div>'
    if old_desc in src:
        src = src.replace(old_desc, new_desc)
        print(f'Added item-elo-{letter}')
    else:
        print(f'WARN: could not find item-desc-{letter} closing pattern')

# ─────────────────────────────────────────────────────────────────────────────
# 5. Add CSS for item-elo badge
# ─────────────────────────────────────────────────────────────────────────────
elo_css = '''
        .item-card__elo {
            margin-top: 10px;
            font-size: 11px;
            color: var(--text-dim);
            text-align: center;
            letter-spacing: 1px;
        }
        .elo-gain { color: #4caf50; margin-left: 6px; }
        .elo-loss { color: #e53935; margin-left: 4px; }
'''

if '.item-card__elo' not in src:
    src = src.replace('        .draft-header-right {', elo_css + '        .draft-header-right {')
    print('Added item-elo CSS')
else:
    print('item-elo CSS already present')

# ─────────────────────────────────────────────────────────────────────────────
# 6. Add 📊 button in draft-header-right (before tier-dots)
# ─────────────────────────────────────────────────────────────────────────────
old_header_right = '''        <div class="draft-header-right">
            <div class="tier-dots" id="tier-dots"></div>'''
new_header_right = '''        <div class="draft-header-right">
            <button class="btn btn-ghost" style="padding:6px 12px;font-size:13px;" onclick="showTierRankings()" title="Current Tier Elo Rankings">📊</button>
            <div class="tier-dots" id="tier-dots"></div>'''
if old_header_right in src:
    src = src.replace(old_header_right, new_header_right)
    print('Added stats button')
else:
    print('WARN: draft-header-right pattern not found')

# ─────────────────────────────────────────────────────────────────────────────
# 7. Fix tier-transition: add tier-review-container + wire CONTINUE button
# ─────────────────────────────────────────────────────────────────────────────
old_transition = '''    <!-- Tier transition screen (overlays the arena) -->
    <div class="tier-transition" id="tier-transition">
        <p class="section-label">tier complete</p>
        <h2 id="tt-tier-label">Tier 1 Done</h2>
        <p id="tt-tier-desc">Moving to Tier 2 items...</p>
        <div class="tier-summary-grid">
            <div class="tier-stat-box">
                <div class="tier-stat-box__num" id="tt-offered">—</div>
                <div class="tier-stat-box__label">Tier</div>
            </div>
            <div class="tier-stat-box">
                <div class="tier-stat-box__num" id="tt-picked">—</div>
                <div class="tier-stat-box__label">Phase Done</div>
            </div>
            <div class="tier-stat-box">
                <div class="tier-stat-box__num" id="tt-top">—</div>
                <div class="tier-stat-box__label">Next Phase</div>
            </div>
        </div>
        <button class="btn btn-accent" id="tt-next-btn">CONTINUE →</button>
        <button class="btn btn-ghost" onclick="showStats()" style="margin-top:12px;">SKIP TO RESULTS</button>
    </div>'''

new_transition = '''    <!-- Tier transition / review screen (overlays the arena) -->
    <div class="tier-transition" id="tier-transition">
        <p class="section-label">tier complete</p>
        <h2 id="tt-tier-label">Tier 1 Review</h2>
        <p id="tt-tier-desc">Drag to reorder. Separators define nerf/buff targets.</p>
        <div id="tier-review-container" class="tier-review-container"></div>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
            <button class="btn btn-accent" onclick="confirmTierReview()">CONFIRM &amp; CONTINUE →</button>
            <button class="btn btn-ghost" onclick="showStats()">SKIP TO RESULTS</button>
        </div>
    </div>'''

if old_transition in src:
    src = src.replace(old_transition, new_transition)
    print('Fixed tier-transition HTML')
else:
    print('WARN: tier-transition old pattern not found, trying partial...')
    # Try to at least insert tier-review-container
    if 'tier-review-container' not in src:
        src = src.replace(
            '<button class="btn btn-accent" id="tt-next-btn">CONTINUE →</button>',
            '<div id="tier-review-container" class="tier-review-container"></div>\n        <button class="btn btn-accent" onclick="confirmTierReview()">CONFIRM &amp; CONTINUE →</button>'
        )
        print('Partial fix: added tier-review-container + wired button')

# ─────────────────────────────────────────────────────────────────────────────
# 8. Add CSS for tier-review-container
# ─────────────────────────────────────────────────────────────────────────────
review_css = '''
        .tier-review-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
            max-width: 480px;
            max-height: 55vh;
            overflow-y: auto;
            padding: 8px;
            background: var(--surface);
            border-radius: 10px;
            border: 1px solid var(--border);
        }
        .draggable-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            border-radius: 6px;
            background: var(--bg);
            border: 1px solid var(--border);
            cursor: grab;
            font-size: 13px;
            transition: background 0.15s;
        }
        .draggable-item:hover { background: var(--surface-2, #2a2a2a); }
        .draggable-item.dragging { opacity: 0.4; }
        .item-nerf  { background: rgba(220,50,50,0.10) !important; }
        .item-buff  { background: rgba(50,180,80,0.10) !important; }
        .item-buff2 { background: rgba(50,150,220,0.08) !important; }
        .separator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            cursor: grab;
        }
        .separator-nerf  { background: rgba(220,50,50,0.18); color:#e05050; border: 1px dashed rgba(220,50,50,0.4); }
        .separator-buff  { background: rgba(50,180,80,0.18); color:#50c870; border: 1px dashed rgba(50,180,80,0.4); }
        .separator-buff2 { background: rgba(50,150,220,0.18); color:#60b0e8; border: 1px dashed rgba(50,150,220,0.4); }
        .review-item-icon { width: 22px; height: 22px; object-fit: contain; border-radius: 3px; }
'''

if '.tier-review-container' not in src:
    src = src.replace('        .draft-header-right {', review_css + '        .draft-header-right {')
    print('Added review CSS')
else:
    print('Review CSS already present')

# ─────────────────────────────────────────────────────────────────────────────
# 9. Add rankings modal HTML (before closing </body>)
# ─────────────────────────────────────────────────────────────────────────────
rankings_modal = '''
<!-- Rankings Modal -->
<div id="rankings-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.classList.add('hidden')">
    <div style="background:var(--surface,#1e1e1e);border:1px solid var(--border,#333);border-radius:14px;padding:24px 20px;width:340px;max-height:80vh;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
            <h3 style="margin:0;font-size:15px;letter-spacing:1px;">TIER ELO RANKINGS</h3>
            <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="document.getElementById('rankings-modal').classList.add('hidden')">✕</button>
        </div>
        <div id="rankings-list" style="overflow-y:auto;max-height:60vh;display:flex;flex-direction:column;gap:4px;"></div>
    </div>
</div>
'''

if 'id="rankings-modal"' not in src:
    src = src.replace('</body>', rankings_modal + '\n</body>')
    print('Added rankings modal HTML')
else:
    print('Rankings modal already present')

# ─────────────────────────────────────────────────────────────────────────────
# 10. Add CSS for tier-list-item (used in showTierRankings)
# ─────────────────────────────────────────────────────────────────────────────
if '.tier-list-item' not in src:
    tli_css = '''
        .tier-list-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            border-radius: 6px;
            background: var(--bg, #141414);
            border: 1px solid var(--border, #2a2a2a);
            font-size: 12px;
        }
'''
    src = src.replace('        .draft-header-right {', tli_css + '        .draft-header-right {')
    print('Added tier-list-item CSS')

# ─────────────────────────────────────────────────────────────────────────────
# 11. Remove confirm() dialog in confirmExitDraft
# ─────────────────────────────────────────────────────────────────────────────
src = src.replace(
    '''function confirmExitDraft() {
    if (confirm('Exit the current draft? Progress will be lost.')) {
        showPage('page-items-info');
    }
}''',
    '''function confirmExitDraft() {
    showPage('page-items-info');
}'''
)
print('Removed exit confirm dialog')

# ─────────────────────────────────────────────────────────────────────────────
# Write result
# ─────────────────────────────────────────────────────────────────────────────
with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(src)

print(f'\nDone. Size: {len(src)} chars (was {orig_len})')
