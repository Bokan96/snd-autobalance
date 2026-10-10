// Tier review: drag items between nerf/buff separators after each tier, plus the rankings modal.

function showTierReview() {
    const tier = draftState.currentTier;

    // Get all items for this tier's pool, best Elo first
    const tierItems = itemsInTier(tier).sort((a, b) => eloOf(b.name) - eloOf(a.name));

    document.getElementById('tt-tier-label').textContent = 'Tier ' + tier + ' Review';
    document.getElementById('tt-tier-desc').textContent = 'Drag to reorder. Separators define nerf/buff targets.\nSeparators are draggable.';

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
        icon.src = getIconPath(item.name);
        icon.className = 'review-item-icon';
        icon.dataset.hideOnError = '';
        const nameSpan = document.createElement('span');
        nameSpan.style.flex = '1';
        nameSpan.textContent = item.name;
        const eloSpan = document.createElement('span');
        eloSpan.style.color = 'var(--accent)';
        eloSpan.textContent = eloOf(item.name);
        el.appendChild(icon);
        el.appendChild(nameSpan);
        el.appendChild(eloSpan);
        return el;
    }

    const nerfSep = makeSep('nerf', '▲ +1 tier nerf', 'separator-nerf');
    const buffSep = makeSep('buff', '▼ -1 tier buff', 'separator-buff');
    const buff2Sep = makeSep('buff2', '▼▼ -2 tier buff', 'separator-buff2');

    const nerfCut = Math.min(REVIEW_CUT_SIZE, tierItems.length);
    let buffCut = Math.max(0, tierItems.length - REVIEW_CUT_SIZE);
    if (tier === 1) {
        buffCut = tierItems.length;
    }

    tierItems.forEach((item, index) => {
        if (index === nerfCut) container.appendChild(nerfSep);
        if (index === buffCut && buffCut > nerfCut) container.appendChild(buffSep);
        container.appendChild(makeItemEl(item));
    });

    if (!container.contains(nerfSep)) container.appendChild(nerfSep);
    if (!container.contains(buffSep)) container.appendChild(buffSep);
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
        if (el.dataset.type === 'nerf') { zone = 'mid'; return; }
        if (el.dataset.type === 'buff') { zone = 'buff'; return; }
        if (el.dataset.type === 'buff2') { zone = 'buff2'; return; }
        if (el.dataset.name) {
            el.classList.remove('item-nerf', 'item-buff', 'item-buff2');
            if (zone === 'nerf') el.classList.add('item-nerf');
            else if (zone === 'buff') el.classList.add('item-buff');
            else if (zone === 'buff2') el.classList.add('item-buff2');
        }
    });
}

function setupDragAndDrop(container) {
    let selectedEl = null;

    container.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', () => el.classList.add('dragging'));
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            updateReviewColors(container);
        });

        // Click/Tap to move fallback for mobile
        el.addEventListener('click', () => {
            if (el.classList.contains('dragging')) return;

            if (!selectedEl) {
                selectedEl = el;
                el.classList.add('selected-for-move');
            } else if (selectedEl === el) {
                selectedEl.classList.remove('selected-for-move');
                selectedEl = null;
            } else {
                selectedEl.classList.remove('selected-for-move');
                container.insertBefore(selectedEl, el);
                selectedEl = null;
                updateReviewColors(container);
            }
        });
    });
    // The container persists across tiers, so only attach this once
    if (!container.dataset.dragoverBound) {
        container.dataset.dragoverBound = '1';
        container.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;
            const after = getDragAfterElement(container, e.clientY);
            after ? container.insertBefore(dragging, after) : container.appendChild(dragging);
        });
    }
}

function getDragAfterElement(container, y) {
    return [...container.querySelectorAll('[draggable="true"]:not(.dragging)')]
        .reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function confirmTierReview(endDraftEarly = false) {
    const container = document.getElementById('tier-review-container');
    const elements = [...container.children];

    const buffIdx = elements.findIndex(el => el.dataset.type === 'buff');
    const buff2Idx = elements.findIndex(el => el.dataset.type === 'buff2');

    const buffItems = [];
    const end1 = buff2Idx > buffIdx ? buff2Idx : elements.length;
    for (let i = buffIdx + 1; i < end1; i++)
        if (elements[i].dataset.name) buffItems.push(elements[i].dataset.name);

    const buff2Items = [];
    if (buff2Idx >= 0)
        for (let i = buff2Idx + 1; i < elements.length; i++)
            if (elements[i].dataset.name) buff2Items.push(elements[i].dataset.name);

    const tier = draftState.currentTier;

    // Save to final adjustments
    const nerfIdx = elements.findIndex(el => el.dataset.type === 'nerf');
    const nerfItems = [];
    if (nerfIdx >= 0) {
        for (let i = 0; i < nerfIdx; i++) {
            if (elements[i].dataset.name) {
                nerfItems.push(elements[i].dataset.name);
                draftState.finalAdjustments.push({
                    name: elements[i].dataset.name,
                    type: 'nerf',
                    tier: tier
                });
            }
        }
    }

    buffItems.forEach(name => draftState.finalAdjustments.push({ name, type: 'buff', tier }));
    buff2Items.forEach(name => draftState.finalAdjustments.push({ name, type: 'buff2', tier }));

    // Logic Fix: Carry over the NERFED items to the next tier (since they are too strong and should move up)
    draftState.nerfCarryOvers = nerfItems;

    // Reset Elo for nerfed items that are carried over to the next tier
    nerfItems.forEach(name => { draftState.items[name].elo = DEFAULT_ELO; });

    if (tier >= TOTAL_TIERS || endDraftEarly) {
        showStats();
    } else {
        draftState.currentTier++;
        draftState.tierRound = 0;
        loadNextPair();
    }
}

// ── Rankings modal ───────────────────────────────────────
function showTierRankings() {
    const offered = new Set(
        [draftState.pairA, draftState.pairB, draftState.pairC]
            .filter(Boolean).map(i => i.name)
    );
    const pool = itemsInTier(draftState.currentTier).sort((a, b) => eloOf(b.name) - eloOf(a.name));

    const list = document.getElementById('rankings-list');
    list.innerHTML = '';
    pool.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'tier-list-item';
        const isNow = offered.has(item.name);
        if (isNow) {
            el.style.background = 'rgba(200,168,75,0.02)';
            el.style.borderColor = 'var(--accent)';
            el.style.boxShadow = '0 0 6px rgba(200,168,75,0.15)';
        }
        el.innerHTML = '<span>' + (index + 1) + '. <img src="' + escapeHtml(getIconPath(item.name)) + '" style="width:18px;height:18px;vertical-align:middle;margin:0 6px 0 2px;" data-hide-on-error>' + escapeHtml(item.name) + '</span>'
            + '<span style="color:var(--accent);">' + eloOf(item.name) + ' Elo</span>';
        list.appendChild(el);
    });
    document.getElementById('rankings-modal').classList.remove('hidden');
}

function closeTierRankings() {
    document.getElementById('rankings-modal').classList.add('hidden');
}
