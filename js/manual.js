// Manual set mode: step through every item and set its tier directly.

let manualState = null;
let manualCurrentTier = 1; // tier currently shown for the item being edited

function startManualSet() {
    // Build ordered list of all items sorted by tier then name
    const sortedItems = [...ITEMS_DB].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
    });

    manualState = {
        items: sortedItems,
        currentIndex: 0,
        finalAdjustments: []
    };

    showPage('page-manual-set');
    buildTierDots('manual-tier-dots');
    renderManualItem(true); // true = first item, trigger shine
}

function updateManualTierDots() {
    if (!manualState) return;
    const currentItem = manualState.items[manualState.currentIndex];

    // Count items per tier and processed items per tier
    const tierTotal = {};
    const tierDone = {};
    manualState.items.forEach((item, idx) => {
        tierTotal[item.tier] = (tierTotal[item.tier] || 0) + 1;
        if (idx < manualState.currentIndex) {
            tierDone[item.tier] = (tierDone[item.tier] || 0) + 1;
        }
    });

    setTierDotStates('manual-tier-dots', t => {
        const total = tierTotal[t] || 0;
        if (total > 0 && (tierDone[t] || 0) >= total) return 'done';
        if (currentItem && currentItem.tier === t) return 'active';
        return '';
    });
}

function renderManualItem(isFirst = false) {
    if (!manualState) return;
    const { items, currentIndex } = manualState;

    if (currentIndex >= items.length) {
        finishManualSet();
        return;
    }

    const item = items[currentIndex];
    manualCurrentTier = item.tier; // reset to original tier for each item

    // Progress bar
    const pct = Math.round((currentIndex / items.length) * 100);
    document.getElementById('manual-progress-fill').style.width = pct + '%';
    document.getElementById('manual-progress-text').textContent = `${currentIndex + 1} / ${items.length}`;

    // Header tier badge (shows base tier of current item)
    document.getElementById('manual-tier-num').textContent = item.tier;

    // Update skip-tier button label on both header and arena
    const skipLabel = 'SKIP TIER ' + item.tier;
    document.getElementById('btn-manual-skip-header').textContent = skipLabel;
    document.getElementById('btn-manual-skip-arena').textContent = skipLabel;

    // Icon
    const img = document.getElementById('manual-item-icon');
    const fallback = document.getElementById('manual-item-fallback');
    img.src = getIconPath(item.name);
    img.alt = item.name;
    img.style.display = '';
    fallback.style.display = 'none';

    // Tier display (editable)
    document.getElementById('manual-item-tier-display').textContent = 'TIER ' + manualCurrentTier;

    // Name
    document.getElementById('manual-item-name').textContent = item.name;

    document.getElementById('manual-item-desc').innerHTML = colorizeDescription(item.description);

    updateManualTierDots();

    // First item: trigger shine animation on +/- buttons to hint interactivity
    if (isFirst) {
        const btnMinus = document.getElementById('manual-btn-minus');
        const btnPlus  = document.getElementById('manual-btn-plus');
        // Re-trigger animation by removing and re-adding class
        [btnMinus, btnPlus].forEach(btn => {
            btn.classList.remove('shine');
            void btn.offsetWidth; // force reflow
            btn.classList.add('shine');
            // Clean up class after animation ends so hover styles work normally
            btn.addEventListener('animationend', () => btn.classList.remove('shine'), { once: true });
        });
    }
}

function adjustManualTier(delta) {
    const newTier = manualCurrentTier + delta;
    if (newTier < MIN_TIER || newTier > MAX_TIER) return;
    manualCurrentTier = newTier;
    document.getElementById('manual-item-tier-display').textContent = 'TIER ' + manualCurrentTier;
}

function confirmManualItem() {
    if (!manualState) return;
    const item = manualState.items[manualState.currentIndex];
    if (!item) return;

    // Record adjustment only if tier changed
    if (manualCurrentTier !== item.tier) {
        const type = manualCurrentTier > item.tier ? 'nerf' : 'buff';
        manualState.finalAdjustments.push({
            name: item.name,
            tier: item.tier,
            newTier: manualCurrentTier,
            type: type
        });
    }

    manualState.currentIndex++;
    renderManualItem();
}

function manualSkipTier() {
    if (!manualState) return;
    // Skip all remaining items that belong to the same base tier as the current item
    const currentTier = manualState.items[manualState.currentIndex].tier;
    while (
        manualState.currentIndex < manualState.items.length &&
        manualState.items[manualState.currentIndex].tier === currentTier
    ) {
        manualState.currentIndex++;
    }
    renderManualItem();
}

function finishManualSet() {
    // Feed into draftState so showStats renders correctly
    draftState = initDraftState();
    draftState.finalAdjustments = manualState.finalAdjustments;
    manualState = null;
    showStats();
}

function exitManualSet() {
    manualState = null;
    showPage('page-items-info');
}
