import openpyxl, json, re

# ─── 1. Load files ───────────────────────────────────────────────────────────
with open('index.html', 'r', encoding='utf-8') as f:
    src = f.read()

# Normalize to \n for all processing
src = src.replace('\r\n', '\n').replace('\r', '\n')

# ─── 2. Fix tier-2 descriptions from xlsx ────────────────────────────────────
wb = openpyxl.load_workbook(r'guides/Slice and Dice 3.1 Unfair Tier list.xlsx', data_only=True)
ws = wb['Items Tier 1-9 3.1 ']
xlsx_t2 = {}
for row in ws.iter_rows(min_row=9, values_only=True):
    name, tier, effect = row[0], row[1], row[3]
    if name and tier == 2.0 and effect:
        xlsx_t2[name] = effect.replace('\r\n', '\n').strip()

match = re.search(r'const ITEMS_DB = (\[.*?\]);', src, re.DOTALL)
items = json.loads(match.group(1))
updated = 0
for item in items:
    if item['tier'] == 2 and item['name'] in xlsx_t2:
        new = xlsx_t2[item['name']]
        if item['description'] != new:
            item['description'] = new
            updated += 1
            print('Desc fixed:', item['name'])
new_db_json = json.dumps(items, ensure_ascii=False, separators=(',', ':'))
src = src[:match.start(1)] + new_db_json + src[match.end(1):]
print(f'{updated} tier-2 descriptions fixed.')

# ─── 3. Add CSS for new review zone classes ───────────────────────────────────
old_css = '''        .separator-buff {
            background: rgba(68, 170, 68, 0.2);
            border: 1px dashed var(--green);
            color: var(--green);
        }'''
new_css = '''        .separator-buff {
            background: rgba(68, 170, 68, 0.2);
            border: 1px dashed var(--green);
            color: var(--green);
        }
        .separator-buff2 {
            background: rgba(68, 170, 68, 0.1);
            border: 1px dashed #2a7a2a;
            color: #2a7a2a;
        }
        .draggable-item.item-nerf {
            background: rgba(204, 68, 68, 0.08);
            border-color: rgba(204, 68, 68, 0.3);
        }
        .draggable-item.item-buff {
            background: rgba(68, 170, 68, 0.08);
            border-color: rgba(68, 170, 68, 0.3);
        }
        .draggable-item.item-buff2 {
            background: rgba(68, 170, 68, 0.04);
            border-color: rgba(68, 170, 68, 0.15);
        }
        .review-item-icon {
            width: 28px;
            height: 28px;
            image-rendering: pixelated;
            margin-right: 8px;
            flex-shrink: 0;
        }'''
src = src.replace(old_css, new_css)
print('CSS added.')

# ─── 4. Update initDraftState ─────────────────────────────────────────────────
old_init = '''        currentTier: 1,
        buffCarryOvers: [], // Items buffed in previous tiers carried over
        items: {},   // name -> { bestOffered, bestPicked, bestSkipped, worstOffered, worstPicked, worstSkipped }'''
new_init = '''        currentTier: 1,
        tierRound: 0,
        buffCarryOvers: [],   // Items buffed -1 tier (carry to next tier)
        buff2CarryOvers: [],  // Items buffed -2 tiers (carry 2 tiers ahead)
        items: {},   // name -> { offered, picked, skipped }'''
src = src.replace(old_init, new_init)

old_init_items = '''    ITEMS_DB.forEach(item => {
        state.items[item.name] = { 
            bestOffered: 0, bestPicked: 0, bestSkipped: 0,
            worstOffered: 0, worstPicked: 0, worstSkipped: 0
        };
    });'''
new_init_items = '''    ITEMS_DB.forEach(item => {
        state.items[item.name] = { offered: 0, picked: 0, skipped: 0 };
    });'''
src = src.replace(old_init_items, new_init_items)
print('initDraftState updated.')

# ─── 5. Update getNextTriplet ─────────────────────────────────────────────────
old_triplet = '''function getNextTriplet(tierNum) {
    const isBest = draftState.phase === 'BEST';
    let pool = ITEMS_DB.filter(i => {
        if (i.tier !== tierNum) return false;
        const state = draftState.items[i.name];
        if (isBest) {
            return state.bestSkipped < 2 && state.bestPicked < 4;
        } else {
            return state.worstSkipped < 2 && state.worstPicked < 4;
        }
    });

    if (!isBest) {
        // Exclude top 20% most picked from the BEST phase
        const tierItems = ITEMS_DB.filter(i => i.tier === tierNum);
        tierItems.sort((a, b) => draftState.items[b.name].bestPicked - draftState.items[a.name].bestPicked);
        const excludeCount = Math.ceil(tierItems.length * 0.2);
        const excludeNames = new Set(tierItems.slice(0, excludeCount).map(i => i.name));
        pool = pool.filter(i => !excludeNames.has(i.name));
    }

    if (pool.length < 3) {
        return pool; // Let loadNextPair handle transition
    }

    const pStats = loadPersistentStats();

    // candidateA: the item in current tier with lowest offered count in the current session
    const sorted = [...pool].sort((a, b) => {
        const ofA = isBest ? draftState.items[a.name].bestOffered : draftState.items[a.name].worstOffered;
        const ofB = isBest ? draftState.items[b.name].bestOffered : draftState.items[b.name].worstOffered;
        if (ofA !== ofB) return ofA - ofB;
        return a.name.localeCompare(b.name);
    });

    const candidateA = sorted[0];
    let candidates = pool.filter(i => i.name !== candidateA.name);

    let candidateB;
    let candidateC;
    
    const eloA = isBest ? pStats[candidateA.name].eloBest : pStats[candidateA.name].eloWorst;
    
    // Sort candidates by closeness of Elo rating to candidateA
    candidates.sort((x, y) => {
        const eloX = isBest ? pStats[x.name].eloBest : pStats[x.name].eloWorst;
        const eloY = isBest ? pStats[y.name].eloBest : pStats[y.name].eloWorst;
        const diffX = Math.abs(eloX - eloA);
        const diffY = Math.abs(eloY - eloA);
        return diffX - diffY;
    });'''
new_triplet = '''function getNextTriplet(tierNum) {
    let pool = ITEMS_DB.filter(i => {
        if (i.tier !== tierNum
            && !draftState.buffCarryOvers.includes(i.name)
            && !draftState.buff2CarryOvers.includes(i.name)) return false;
        const state = draftState.items[i.name];
        return state.skipped < 5 && state.picked < 5;
    });

    if (pool.length < 3 || draftState.tierRound >= 30) {
        return pool.length < 3 ? pool : [];
    }

    const pStats = loadPersistentStats();

    // candidateA: item with lowest offered count this session
    const sorted = [...pool].sort((a, b) => {
        const ofA = draftState.items[a.name].offered;
        const ofB = draftState.items[b.name].offered;
        if (ofA !== ofB) return ofA - ofB;
        return a.name.localeCompare(b.name);
    });

    const candidateA = sorted[0];
    let candidates = pool.filter(i => i.name !== candidateA.name);

    let candidateB;
    let candidateC;
    
    const eloA = pStats[candidateA.name].eloBest;
    
    // Sort candidates by closeness of Elo rating to candidateA
    candidates.sort((x, y) => {
        const eloX = pStats[x.name].eloBest;
        const eloY = pStats[y.name].eloBest;
        const diffX = Math.abs(eloX - eloA);
        const diffY = Math.abs(eloY - eloA);
        return diffX - diffY;
    });'''
src = src.replace(old_triplet, new_triplet)
print('getNextTriplet updated.')

# ─── 6. Update loadNextPair ───────────────────────────────────────────────────
old_lnp = '''    // Phase transition check
    if (triplet.length < 3) {
        if (draftState.phase === 'BEST') {
            showTierTransition('WORST');
        } else {
            showTierTransition('NEXT_TIER');
        }
        return;
    }

    const [a, b, c] = triplet;
    draftState.pairA = a;
    draftState.pairB = b;
    draftState.pairC = c;

    // Update header
    document.getElementById('draft-tier-num').textContent = tier;
    
    // Update prompt
    if (draftState.phase === 'BEST') {
        document.querySelector('.draft-prompt').innerHTML = 'CHOOSE THE <span style="color:var(--green);font-size:1.2em;">BEST</span> ITEM';
    } else {
        document.querySelector('.draft-prompt').innerHTML = 'CHOOSE THE <span style="color:var(--red);font-size:1.2em;">WORST</span> ITEM';
    }

    // Remaining in pool
    const poolRemaining = ITEMS_DB.filter(i => {
        if (i.tier !== tier) return false;
        const state = draftState.items[i.name];
        return draftState.phase === 'BEST' 
            ? (state.bestSkipped < 2 && state.bestPicked < 4)
            : (state.worstSkipped < 2 && state.worstPicked < 4);
    }).length;

    document.getElementById('draft-round-cur').textContent = poolRemaining;
    document.getElementById('draft-round-max').textContent = 'remaining';
    updateTierDots();

    // Progress bar approximation (Tier progress)
    const pct = Math.round(((tier - 1) / TOTAL_TIERS) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = draftState.phase + ' PHASE';'''
new_lnp = '''    // Phase transition check
    if (triplet.length < 3) {
        showTierReview();
        return;
    }

    const [a, b, c] = triplet;
    draftState.pairA = a;
    draftState.pairB = b;
    draftState.pairC = c;

    // Update header
    document.getElementById('draft-tier-num').textContent = tier;
    document.querySelector('.draft-prompt').innerHTML = 'CHOOSE THE <span style="color:var(--green);font-size:1.2em;">BEST</span> ITEM';

    // Unsorted count
    const poolRemaining = ITEMS_DB.filter(i => {
        if (i.tier !== tier
            && !draftState.buffCarryOvers.includes(i.name)
            && !draftState.buff2CarryOvers.includes(i.name)) return false;
        const state = draftState.items[i.name];
        return state.skipped < 5 && state.picked < 5;
    }).length;

    document.getElementById('draft-round-cur').textContent = poolRemaining;
    updateTierDots();

    // Progress bar (round progress: max 30)
    const pct = Math.round((draftState.tierRound / 30) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = 'Round ' + draftState.tierRound + ' / 30';'''
src = src.replace(old_lnp, new_lnp)
print('loadNextPair updated.')

# ─── 7. Fix renderItemCard ────────────────────────────────────────────────────
old_render_end = '''    const colorize = (words, color) => {
        const regex = new RegExp('\\\\b(' + words.join('|') + ')\\\\b', 'gi');
        out = out.replace(regex, `<span style="color:${color};">$1</span>`);
    };
    colorize(greens, '#388044');
    colorize(reds, '#AD1F1F');
    colorize(purples, '#6A4484');
    descEl.innerHTML = out;
}'''
new_render_end = '''    const colorize = (words, color) => {
        const regex = new RegExp('\\\\b(' + words.join('|') + ')\\\\b', 'gi');
        out = out.replace(regex, `<span style="color:${color};">$1</span>`);
    };
    colorize(greens, '#388044');
    colorize(reds, '#AD1F1F');
    colorize(purples, '#6A4484');
    descEl.innerHTML = out;

    // Elo + projected gain/loss
    const eloEl = document.getElementById(`item-elo${suffix}`);
    if (eloEl) {
        const pStats = loadPersistentStats();
        const myElo = (pStats[item.name] || {eloBest: 1200}).eloBest;
        const opponents = [draftState.pairA, draftState.pairB, draftState.pairC].filter(i => i && i.name !== item.name);
        const halfK = K_FACTOR * 0.5;
        let totalGain = 0, totalLoss = 0;
        opponents.forEach(opp => {
            const oppElo = (pStats[opp.name] || {eloBest: 1200}).eloBest;
            const eW = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
            totalGain += halfK * (1 - eW);
            totalLoss += halfK * (0 - (1 - eW));
        });
        const gain = Math.round(totalGain);
        const loss = Math.round(opponents.length > 0 ? totalLoss / opponents.length : 0);
        eloEl.innerHTML = `${myElo} <span class="elo-gain">+${gain}</span><span class="elo-loss">${loss}</span>`;
    }
}'''
src = src.replace(old_render_end, new_render_end)
print('renderItemCard updated.')

# ─── 8. Update pickItem ───────────────────────────────────────────────────────
old_pick = '''function pickItem(side) {
    const items = [draftState.pairA, draftState.pairB, draftState.pairC];
    const pickedItem = items[side];
    const skippedItems = items.filter((_, i) => i !== side);
    const isBest = draftState.phase === 'BEST';

    // 1. Session statistics update
    if (isBest) {
        draftState.items[pickedItem.name].bestOffered++;
        draftState.items[pickedItem.name].bestPicked++;
        skippedItems.forEach(item => {
            draftState.items[item.name].bestOffered++;
            draftState.items[item.name].bestSkipped++;
        });
    } else {
        draftState.items[pickedItem.name].worstOffered++;
        draftState.items[pickedItem.name].worstPicked++;
        skippedItems.forEach(item => {
            draftState.items[item.name].worstOffered++;
            draftState.items[item.name].worstSkipped++;
        });
    }

    // 2. All-Time persistent Elo stats update
    const pStats = loadPersistentStats();
    pStats[pickedItem.name].offered++;
    pStats[pickedItem.name].picked++;
    
    // We compute Elo updates based on 1v1 against each skipped item, with a half K factor.
    let ratingWinner = isBest ? pStats[pickedItem.name].eloBest : pStats[pickedItem.name].eloWorst;
    let newRatingWinner = ratingWinner;

    skippedItems.forEach(item => {
        pStats[item.name].offered++;
        
        let ratingLoser = isBest ? pStats[item.name].eloBest : pStats[item.name].eloWorst;
        
        let expectedWinner = 1 / (1 + Math.pow(10, (ratingLoser - ratingWinner) / 400));
        let expectedLoser = 1 - expectedWinner;
        
        let halfK = K_FACTOR * 0.5;
        
        // If BEST phase, picked item wins. If WORST phase, picked item loses to the skipped items.
        if (isBest) {
            newRatingWinner += halfK * (1 - expectedWinner);
            pStats[item.name].eloBest = Math.round(ratingLoser + halfK * (0 - expectedLoser));
        } else {
            newRatingWinner += halfK * (0 - expectedWinner);
            pStats[item.name].eloWorst = Math.round(ratingLoser + halfK * (1 - expectedLoser));
        }
    });
    
    if (isBest) {
        pStats[pickedItem.name].eloBest = Math.round(newRatingWinner);
    } else {
        pStats[pickedItem.name].eloWorst = Math.round(newRatingWinner);
    }

    savePersistentStats(pStats);

    // Visual feedback
    const cardIds = ['item-card-a', 'item-card-b', 'item-card-c'];
    cardIds.forEach((id, i) => {
        const card = document.getElementById(id);
        if (i === side) {
            card.classList.add(isBest ? 'picked-best' : 'picked-worst');
        } else {
            card.classList.add('skipped');
        }
    });'''
new_pick = '''function pickItem(side) {
    const items = [draftState.pairA, draftState.pairB, draftState.pairC];
    const pickedItem = items[side];
    const skippedItems = items.filter((_, i) => i !== side);

    draftState.tierRound++;

    // 1. Session statistics update
    draftState.items[pickedItem.name].offered++;
    draftState.items[pickedItem.name].picked++;
    skippedItems.forEach(item => {
        draftState.items[item.name].offered++;
        draftState.items[item.name].skipped++;
    });

    // 2. All-Time persistent Elo stats update (picked wins against each skipped)
    const pStats = loadPersistentStats();
    pStats[pickedItem.name].offered++;
    pStats[pickedItem.name].picked++;
    let ratingWinner = pStats[pickedItem.name].eloBest;
    let newRatingWinner = ratingWinner;

    skippedItems.forEach(item => {
        pStats[item.name].offered++;
        let ratingLoser = pStats[item.name].eloBest;
        let eW = 1 / (1 + Math.pow(10, (ratingLoser - ratingWinner) / 400));
        let halfK = K_FACTOR * 0.5;
        newRatingWinner += halfK * (1 - eW);
        pStats[item.name].eloBest = Math.round(ratingLoser + halfK * (0 - (1 - eW)));
    });
    pStats[pickedItem.name].eloBest = Math.round(newRatingWinner);

    savePersistentStats(pStats);

    // Visual feedback
    const cardIds = ['item-card-a', 'item-card-b', 'item-card-c'];
    cardIds.forEach((id, i) => {
        const card = document.getElementById(id);
        if (i === side) {
            card.classList.add('picked-best');
        } else {
            card.classList.add('skipped');
        }
    });'''
src = src.replace(old_pick, new_pick)
print('pickItem updated.')

# ─── 9. Replace showTierTransition with showTierReview ───────────────────────
old_transition = '''function showTierTransition(nextStep) {
    const tier = draftState.currentTier;

    if (nextStep === 'WORST') {
        document.getElementById('tt-tier-label').textContent = `Tier ${tier} Best Phase Done`;
        document.getElementById('tt-tier-desc').textContent = 'Moving to the Worst Item selection...';
        const nextBtn = document.getElementById('tt-next-btn');
        nextBtn.textContent = `CONTINUE TO WORST PHASE →`;
        nextBtn.onclick = () => {
            draftState.phase = 'WORST';
            loadNextPair();
        };
    } else {
        document.getElementById('tt-tier-label').textContent = `Tier ${tier} Worst Phase Done`;
        const isLast = tier >= TOTAL_TIERS;
        document.getElementById('tt-tier-desc').textContent = isLast
            ? 'All tiers complete! View your results.'
            : `Moving to Tier ${tier + 1} Best items...`;
        const nextBtn = document.getElementById('tt-next-btn');
        if (isLast) {
            nextBtn.textContent = 'VIEW RESULTS';
            nextBtn.onclick = () => showStats(false);
        } else {
            nextBtn.textContent = `CONTINUE TO TIER ${tier + 1} →`;
            nextBtn.onclick = () => {
                draftState.currentTier++;
                draftState.phase = 'BEST';
                loadNextPair();
            };
        }
    }

    // Populate summary boxes with phase info
    document.getElementById('tt-offered').textContent = tier;
    document.getElementById('tt-picked').textContent = nextStep === 'WORST' ? 'BEST' : 'WORST';
    document.getElementById('tt-top').textContent = nextStep === 'WORST' ? 'WORST' : (tier >= TOTAL_TIERS ? 'DONE' : 'BEST');

    document.getElementById('draft-arena').style.display = 'none';
    document.getElementById('tier-transition').style.display = 'flex';
    document.getElementById('tier-transition').classList.add('active');
}'''
new_transition = '''function showTierReview() {
    const tier = draftState.currentTier;
    const pStats = loadPersistentStats();

    // Get all items offered in this tier's pool
    let tierItems = ITEMS_DB.filter(i => {
        if (i.tier !== tier
            && !draftState.buffCarryOvers.includes(i.name)
            && !draftState.buff2CarryOvers.includes(i.name)) return false;
        return draftState.items[i.name].offered > 0;
    });
    tierItems.sort((a, b) => pStats[b.name].eloBest - pStats[a.name].eloBest);

    document.getElementById('tt-tier-label').textContent = 'Tier ' + tier + ' Review';
    document.getElementById('tt-tier-desc').textContent = 'Drag to reorder. Separators define nerf/buff targets.';

    const container = document.getElementById('tier-review-container');
    container.innerHTML = '';

    function makeSep(type, label, cssClass) {
        const el = document.createElement('div');
        el.className = 'separator ' + cssClass;
        el.draggable = true;
        el.dataset.type = type;
        el.textContent = label;
        return el;
    }

    function makeItemEl(item) {
        const el = document.createElement('div');
        el.className = 'draggable-item';
        el.draggable = true;
        el.dataset.name = item.name;
        const icon = document.createElement('img');
        icon.src = 'icons/items/' + item.name + '.png';
        icon.className = 'review-item-icon';
        icon.onerror = function() { this.style.display='none'; };
        const nameSpan = document.createElement('span');
        nameSpan.style.flex = '1';
        nameSpan.textContent = item.name;
        const eloSpan = document.createElement('span');
        eloSpan.style.color = 'var(--accent)';
        eloSpan.textContent = pStats[item.name].eloBest;
        el.appendChild(icon);
        el.appendChild(nameSpan);
        el.appendChild(eloSpan);
        return el;
    }

    const nerfSep  = makeSep('nerf',  '▲ +1 tier nerf',  'separator-nerf');
    const buffSep  = makeSep('buff',  '▼ -1 tier buff',  'separator-buff');
    const buff2Sep = makeSep('buff2', '▼▼ -2 tier buff', 'separator-buff2');

    const nerfCut = Math.min(5, tierItems.length);
    const buffCut = Math.max(0, tierItems.length - 5);

    tierItems.forEach((item, index) => {
        if (index === nerfCut) container.appendChild(nerfSep);
        if (index === buffCut && buffCut > nerfCut) container.appendChild(buffSep);
        container.appendChild(makeItemEl(item));
    });

    if (!container.contains(nerfSep))  container.appendChild(nerfSep);
    if (!container.contains(buffSep))  container.appendChild(buffSep);
    container.appendChild(buff2Sep);

    updateReviewColors(container);
    setupDragAndDrop(container);

    document.getElementById('draft-arena').style.display = 'none';
    document.getElementById('tier-transition').style.display = 'flex';
    document.getElementById('tier-transition').classList.add('active');
}

function updateReviewColors(container) {
    let zone = 'nerf';
    [...container.children].forEach(el => {
        if (el.dataset.type === 'nerf')  { zone = 'mid';   return; }
        if (el.dataset.type === 'buff')  { zone = 'buff';  return; }
        if (el.dataset.type === 'buff2') { zone = 'buff2'; return; }
        if (el.dataset.name) {
            el.classList.remove('item-nerf', 'item-buff', 'item-buff2');
            if (zone === 'nerf')  el.classList.add('item-nerf');
            else if (zone === 'buff')  el.classList.add('item-buff');
            else if (zone === 'buff2') el.classList.add('item-buff2');
        }
    });
}

function setupDragAndDrop(container) {
    container.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', () => el.classList.add('dragging'));
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            updateReviewColors(container);
        });
    });
    container.addEventListener('dragover', e => {
        e.preventDefault();
        const after = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;
        after ? container.insertBefore(dragging, after) : container.appendChild(dragging);
    });
}

function getDragAfterElement(container, y) {
    return [...container.querySelectorAll('[draggable="true"]:not(.dragging)')]
        .reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function confirmTierReview() {
    const container = document.getElementById('tier-review-container');
    const elements = [...container.children];

    const buffIdx  = elements.findIndex(el => el.dataset.type === 'buff');
    const buff2Idx = elements.findIndex(el => el.dataset.type === 'buff2');

    const buffItems = [];
    const end1 = buff2Idx > buffIdx ? buff2Idx : elements.length;
    for (let i = buffIdx + 1; i < end1; i++)
        if (elements[i].dataset.name) buffItems.push(elements[i].dataset.name);

    const buff2Items = [];
    if (buff2Idx >= 0)
        for (let i = buff2Idx + 1; i < elements.length; i++)
            if (elements[i].dataset.name) buff2Items.push(elements[i].dataset.name);

    draftState.buffCarryOvers  = buffItems;
    draftState.buff2CarryOvers = buff2Items;

    const tier = draftState.currentTier;
    if (tier >= TOTAL_TIERS) {
        showStats(false);
    } else {
        draftState.currentTier++;
        draftState.tierRound = 0;
        // Promote buff2 -> buff1 after one tier
        const promoted = draftState.buff2CarryOvers;
        draftState.buff2CarryOvers = [];
        draftState.buffCarryOvers = [...draftState.buffCarryOvers, ...promoted];
        loadNextPair();
    }
}

function showTierRankings() {
    const pStats = loadPersistentStats();
    const offered = new Set(
        [draftState.pairA, draftState.pairB, draftState.pairC]
            .filter(Boolean).map(i => i.name)
    );
    let pool = ITEMS_DB.filter(i =>
        i.tier === draftState.currentTier
        || draftState.buffCarryOvers.includes(i.name)
        || draftState.buff2CarryOvers.includes(i.name)
    );
    pool.sort((a, b) => pStats[b.name].eloBest - pStats[a.name].eloBest);

    const list = document.getElementById('rankings-list');
    list.innerHTML = '';
    pool.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'tier-list-item';
        const isNow = offered.has(item.name);
        if (isNow) {
            el.style.background = 'rgba(200,168,75,0.12)';
            el.style.borderColor = 'var(--accent)';
            el.style.boxShadow  = '0 0 6px rgba(200,168,75,0.25)';
        }
        el.innerHTML = '<span>' + (isNow ? '▶ ' : '') + '#' + (index+1) + '. ' + item.name + '</span>'
                     + '<span style="color:var(--accent);">' + pStats[item.name].eloBest + ' Elo</span>';
        list.appendChild(el);
    });
    document.getElementById('rankings-modal').classList.remove('hidden');
}'''
src = src.replace(old_transition, new_transition)
print('showTierReview (replaced showTierTransition) updated.')

# ─── 10. Update stats session mapping ────────────────────────────────────────
old_session = '''        } else {
            const s = (draftState ? draftState.items[item.name] : { bestOffered: 0, worstOffered: 0, bestPicked: 0, worstPicked: 0 });
            return {
                ...item,
                offered: s.bestOffered + s.worstOffered,
                picked: s.bestPicked + s.worstPicked,
                eloBest: DEFAULT_ELO,
                eloWorst: DEFAULT_ELO
            };
        }'''
new_session = '''        } else {
            const s = (draftState ? draftState.items[item.name] : { offered: 0, picked: 0 });
            return {
                ...item,
                offered: s.offered || 0,
                picked: s.picked || 0,
                eloBest: DEFAULT_ELO,
                eloWorst: DEFAULT_ELO
            };
        }'''
src = src.replace(old_session, new_session)
print('Stats session mapping updated.')

# ─── 11. Write output ─────────────────────────────────────────────────────────
with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(src)
print('Done — index.html written.')
