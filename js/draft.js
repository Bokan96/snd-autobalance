// Draft mode: best-of-3 item picks with Elo ratings, one tier at a time.

// ── State ────────────────────────────────────────────────
let draftState = null;

function initDraftState() {
    const state = {
        currentTier: 1,
        tierRound: 0,
        nerfCarryOvers: [],   // Items nerfed +1 tier in the last review (carry to next tier)
        finalAdjustments: [], // Tracks all nerfs and buffs for final results
        items: {},   // name -> { offered, picked, skipped, elo }
        locked: false, // true between a pick and the next triplet being shown
        pairA: null,
        pairB: null,
        pairC: null
    };

    // Init all items in current session
    ITEMS_DB.forEach(item => {
        state.items[item.name] = { offered: 0, picked: 0, skipped: 0, elo: DEFAULT_ELO };
    });

    return state;
}

// Items in a tier's draft pool: base tier plus items nerfed into it
function itemsInTier(tierNum) {
    return ITEMS_DB.filter(i => i.tier === tierNum || draftState.nerfCarryOvers.includes(i.name));
}

const eloOf = name => draftState.items[name].elo;

// ── Matchmaking ──────────────────────────────────────────
function getNextTriplet(tierNum) {
    const pool = itemsInTier(tierNum).filter(i => {
        const state = draftState.items[i.name];
        return state.skipped < PICK_LIMIT && state.picked < PICK_LIMIT;
    });

    if (pool.length < 3 || draftState.tierRound >= ROUNDS_PER_TIER) {
        return pool.length < 3 ? pool : [];
    }

    // candidateA: item with lowest offered count this session
    const sorted = [...pool].sort((a, b) => {
        const ofA = draftState.items[a.name].offered;
        const ofB = draftState.items[b.name].offered;
        if (ofA !== ofB) return ofA - ofB;
        return a.name.localeCompare(b.name);
    });

    const candidateA = sorted[0];
    const candidates = pool.filter(i => i.name !== candidateA.name);

    // Sort candidates by closeness of Elo rating to candidateA
    const eloA = eloOf(candidateA.name);
    candidates.sort((x, y) => Math.abs(eloOf(x.name) - eloA) - Math.abs(eloOf(y.name) - eloA));

    let candidateB, candidateC;
    if (Math.random() < CLOSE_MATCH_PROB) {
        [candidateB, candidateC] = candidates;
    } else {
        // Randomly pick two
        [candidateB, candidateC] = shuffle([...candidates]);
    }

    // Shuffle the final 3 so A isn't always on the left
    return shuffle([candidateA, candidateB, candidateC]);
}

// ── Draft flow & UI ──────────────────────────────────────
function isTierReviewOpen() {
    return document.getElementById('tier-transition').classList.contains('active');
}

function startDraft() {
    draftState = initDraftState(); // Elo and stats start fresh every draft
    showPage('page-draft');
    buildTierDots('tier-dots');
    loadNextPair();
}

function exitDraft() {
    showPage('page-items-info');
}

function skipTier() {
    if (!draftState || draftState.locked || isTierReviewOpen()) return;
    showTierReview();
}

function updateTierDots() {
    setTierDotStates('tier-dots', t =>
        t < draftState.currentTier ? 'done' : t === draftState.currentTier ? 'active' : '');
}

function loadNextPair() {
    const tier = draftState.currentTier;

    // Get triplet
    const triplet = getNextTriplet(tier);

    // Phase transition check
    if (triplet.length < 3) {
        showTierReview();
        return;
    }

    const [a, b, c] = triplet;
    draftState.pairA = a;
    draftState.pairB = b;
    draftState.pairC = c;
    draftState.locked = false;

    // Update header
    document.getElementById('draft-tier-num').textContent = tier;
    document.querySelector('.draft-prompt').innerHTML = 'CHOOSE THE <span style="color:var(--green);font-size:1.2em;">BEST</span> ITEM';

    updateTierDots();

    // Progress bar (round progress within the tier)
    const pct = Math.round((draftState.tierRound / ROUNDS_PER_TIER) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = 'Round ' + draftState.tierRound + ' / ' + ROUNDS_PER_TIER;

    // Render cards
    renderItemCard('a', a);
    renderItemCard('b', b);
    renderItemCard('c', c);

    // Reset card states
    document.getElementById('item-card-a').className = 'item-card';
    document.getElementById('item-card-b').className = 'item-card';
    document.getElementById('item-card-c').className = 'item-card';

    // Show arena, hide transition
    document.getElementById('draft-arena').style.display = '';
    document.getElementById('tier-transition').style.display = 'none';
    document.getElementById('tier-transition').classList.remove('active');
}

function renderItemCard(side, item) {
    const suffix = `-${side}`;
    const img = document.getElementById(`item-icon${suffix}`);
    const fallback = document.getElementById(`item-fallback${suffix}`);
    const nameEl = document.getElementById(`item-name${suffix}`);
    const descEl = document.getElementById(`item-desc${suffix}`);

    // Icon
    img.src = getIconPath(item.name);
    img.alt = item.name;
    img.style.display = '';
    fallback.style.display = 'none';

    // Name and description
    nameEl.textContent = item.name;
    descEl.innerHTML = colorizeDescription(item.description);

    // Elo + projected gain/loss
    const eloEl = document.getElementById(`item-elo${suffix}`);
    if (eloEl) {
        const myElo = eloOf(item.name);
        const opponents = [draftState.pairA, draftState.pairB, draftState.pairC].filter(i => i && i.name !== item.name);
        const halfK = K_FACTOR * 0.5;
        let totalGain = 0, totalLoss = 0;
        opponents.forEach(opp => {
            const eW = expectedScore(myElo, eloOf(opp.name));
            totalGain += halfK * (1 - eW);
            totalLoss += halfK * (0 - (1 - eW));
        });
        const gain = Math.round(totalGain);
        const loss = Math.round(opponents.length > 0 ? totalLoss / opponents.length : 0);
        eloEl.innerHTML = myElo + ' <span class="elo-gain">+' + gain + '</span><span class="elo-loss">' + loss + '</span>';
    }
}

function pickItem(side) {
    // Ignore picks while the previous one is animating or the review overlay is open
    if (!draftState || draftState.locked || isTierReviewOpen()) return;
    draftState.locked = true;

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

    // 2. Elo update: the picked item wins against each skipped item
    const halfK = K_FACTOR * 0.5;
    const ratingWinner = eloOf(pickedItem.name);
    let newRatingWinner = ratingWinner;
    skippedItems.forEach(item => {
        const ratingLoser = eloOf(item.name);
        const eW = expectedScore(ratingWinner, ratingLoser);
        newRatingWinner += halfK * (1 - eW);
        draftState.items[item.name].elo = Math.round(ratingLoser + halfK * (0 - (1 - eW)));
    });
    draftState.items[pickedItem.name].elo = Math.round(newRatingWinner);

    // Visual feedback
    const cardIds = ['item-card-a', 'item-card-b', 'item-card-c'];
    cardIds.forEach((id, i) => {
        const card = document.getElementById(id);
        if (i === side) {
            card.classList.add('picked-best');
        } else {
            card.classList.add('skipped');
        }
    });

    // Advance after brief pause
    setTimeout(() => {
        loadNextPair();
    }, PICK_DELAY_MS);
}

// A/S/D or ←/↓/→ pick the left/middle/right card
const DRAFT_KEYS = { a: 0, arrowleft: 0, s: 1, arrowdown: 1, d: 2, arrowright: 2 };

function handleDraftKeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!document.getElementById('rankings-modal').classList.contains('hidden')) return;
    if (!document.getElementById('page-draft').classList.contains('active')) return;
    const side = DRAFT_KEYS[e.key.toLowerCase()];
    if (side !== undefined) pickItem(side);
}
