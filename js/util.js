// Shared constants and helpers used across all pages.

// ── Draft tuning ─────────────────────────────────────────
const TOTAL_TIERS = 9;
const DEFAULT_ELO = 1200;
const K_FACTOR = 32;
const ROUNDS_PER_TIER = 30;     // max draft rounds before the tier review
const PICK_LIMIT = 5;           // an item leaves the pool after this many picks or skips
const REVIEW_CUT_SIZE = 5;      // items pre-placed above the nerf / below the buff separator
const CLOSE_MATCH_PROB = 0.85;  // chance the opponents are the closest-Elo items
const PICK_DELAY_MS = 350;      // pause after a pick before showing the next triplet

// ── Text & HTML ──────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KEYWORD_COLORS = [
    ['#388044', ["acidic", "channel", "groooooowth", "growth", "inspired", "poison", "plague", "rite", "weaken", "undergrowth"]],
    ['#AD1F1F', ["bloodlust", "eliminate", "evil", "flesh", "lucky", "mandatory", "pain", "regen"]],
    ['#217B91', ["boost", "charged", "duel", "duplicate", "echo", "era", "fizz", "manaGain", "picky", "stasis"]],
    ['#6A4484', ["deathwish", "decay", "exert", "inflictexert", "manacost", "possessed", "potion", "rampage", "singleCast", "sticky", "terminal"]],
    ['#C45E16', ["cooldown", "cruel", "deplete", "doubleUse", "focus", "guilt", "hoard", "quadUse", "repel", "resilient", "singleUse", "sixth", "sprint", "tall", "threesy", "vulnerable"]],
    ['#B59E09', ["critical", "defy", "dog", "dogma", "ego", "engage", "fierce", "heavy", "lead", "overdog", "petrify", "reborn", "rescue", "spellRescue", "underdog"]],
];

// Item description as HTML: escaped, line breaks kept, keywords coloured
function colorizeDescription(text) {
    let out = escapeHtml(text).replace(/\n/g, '<br>');
    KEYWORD_COLORS.forEach(([color, words]) => {
        const regex = new RegExp('\\b(' + words.join('|') + ')\\b', 'g');
        out = out.replace(regex, `<span style="color:${color};">$1</span>`);
    });
    return out;
}

function getIconPath(itemName) {
    return `icons/items/${itemName}.png`;
}

// ── Maths ────────────────────────────────────────────────
// Unbiased in-place Fisher–Yates shuffle
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Expected score of a player rated `rating` against `opponentRating`
function expectedScore(rating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

// ── UI ───────────────────────────────────────────────────
function flashCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = '✅ COPIED!';
    btn.style.color = '#4caf50';
    btn.style.borderColor = '#4caf50';
    setTimeout(() => {
        btn.textContent = orig;
        btn.style.color = '';
        btn.style.borderColor = '';
    }, 2000);
}

function copyToClipboard(str, btn) {
    return navigator.clipboard.writeText(str).then(() => {
        flashCopied(btn);
    }).catch(() => {
        alert('Copy failed — please copy manually:\n\n' + str);
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

function buildTierDots(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let t = 1; t <= TOTAL_TIERS; t++) {
        const dot = document.createElement('div');
        dot.className = 'tier-dot';
        dot.title = `Tier ${t}`;
        dot.dataset.tier = t;
        container.appendChild(dot);
    }
}

// stateOf(tier) returns '', 'done' or 'active'
function setTierDotStates(containerId, stateOf) {
    document.getElementById(containerId).querySelectorAll('.tier-dot').forEach(dot => {
        const state = stateOf(Number(dot.dataset.tier));
        dot.className = 'tier-dot' + (state ? ' ' + state : '');
    });
}
