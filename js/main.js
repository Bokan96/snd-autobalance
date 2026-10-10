// Event wiring: every button declares data-action="..." and is dispatched from here.

const ACTIONS = {
    'show-page': el => showPage(el.dataset.page),

    // Items info page
    'start-draft': () => startDraft(),
    'start-manual': () => startManualSet(),
    'copy-community': () => copyCommunityBalanceMod(),

    // Draft
    'pick': el => pickItem(Number(el.dataset.side)),
    'skip-tier': () => skipTier(),
    'exit-draft': () => exitDraft(),
    'show-rankings': () => showTierRankings(),
    'close-rankings': () => closeTierRankings(),
    'confirm-review': () => confirmTierReview(),
    'finish-review': () => confirmTierReview(true),

    // Manual set
    'manual-adjust': el => adjustManualTier(Number(el.dataset.delta)),
    'manual-confirm': () => confirmManualItem(),
    'manual-skip-tier': () => manualSkipTier(),
    'exit-manual': () => exitManualSet(),

    // Results
    'copy-mod': () => copyAutobalanceMod(),

    // Hero analyzer
    'analyze': () => analyzeData(),
    'copy-pool': () => copyPool(),
};

document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el) ACTIONS[el.dataset.action](el, e);
});

// Clicking the dimmed backdrop closes the rankings modal
document.getElementById('rankings-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTierRankings();
});

document.addEventListener('keydown', handleDraftKeydown);

// Image load failures (error events don't bubble, so listen in the capture phase):
//   data-fallback      → hide the image and show the sibling placeholder icon
//   data-hide-on-error → just hide the image
document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.hasAttribute('data-fallback')) {
        img.style.display = 'none';
        if (img.nextElementSibling) img.nextElementSibling.style.display = 'block';
    } else if (img.hasAttribute('data-hide-on-error')) {
        img.style.display = 'none';
    }
}, true);

document.getElementById('jsonInput').value = JSON.stringify(SAMPLE_PICK_RATES);
