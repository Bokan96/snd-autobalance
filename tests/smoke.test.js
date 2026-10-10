// Browser smoke tests: drive index.html in headless Chrome and check each mode end to end.
// Run with `npm test`. Set CHROME_PATH if Chrome isn't in a standard location.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const APP_URL = process.env.APP_URL || pathToFileURL(path.join(ROOT, 'index.html')).href;

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
].filter(Boolean);

// Data files, loaded the same way the page loads them
const loadGlobal = (file, name) => new Function(fs.readFileSync(path.join(ROOT, file), 'utf8') + `;return ${name};`)();
const ITEMS_DB = loadGlobal('js/data/items.js', 'ITEMS_DB');
const TIER0_ITEMS = loadGlobal('js/data/tier0_items.js', 'TIER0_ITEMS');
const COMMUNITY_BALANCES = loadGlobal('js/data/balances.js', 'COMMUNITY_BALANCES');

// Seeded Math.random, near-instant pick delay, and a clipboard that records writes
// (or rejects them when window.__clipFail is set)
const PAGE_INIT = `(() => {
    let s = 12345;
    Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const o = window.setTimeout;
    window.setTimeout = (f, ms, ...a) => o(f, ms >= 300 ? 0 : ms, ...a);
    window.__copied = [];
    window.__alerts = [];
    window.alert = m => window.__alerts.push(String(m));
    Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get() { return {
        writeText: t => window.__clipFail ? Promise.reject(new Error('denied')) : (window.__copied.push(t), Promise.resolve())
    }; } });
})();`;

let browser;
before(async () => {
    const executablePath = CHROME_CANDIDATES.find(p => fs.existsSync(p));
    if (!executablePath) throw new Error('Chrome not found; set CHROME_PATH');
    browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
});
after(() => browser && browser.close());

async function openApp({ width = 1280, height = 900, mobile = false } = {}) {
    const page = await browser.newPage();
    page.problems = [];
    page.on('pageerror', e => page.problems.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') page.problems.push('console: ' + m.text()); });
    page.on('requestfailed', r => page.problems.push('requestfailed: ' + r.url()));
    await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
    await page.evaluateOnNewDocument(PAGE_INIT);
    await page.goto(APP_URL, { waitUntil: 'load' });
    return page;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const activePage = page => page.evaluate(() => document.querySelector('.page.active').id);
const copied = page => page.evaluate(() => window.__copied.slice());
const text = (page, sel) => page.evaluate(s => document.querySelector(s).innerText, sel);
const progress = page => text(page, '#progress-text');
const reviewOpen = page => page.evaluate(() => document.getElementById('tier-transition').classList.contains('active'));
const rankingsOpen = page => page.evaluate(() => !document.getElementById('rankings-modal').classList.contains('hidden'));
const action = (page, name) => page.evaluate(n => {
    const el = [...document.querySelectorAll(`[data-action="${n}"]`)].find(e => e.offsetParent !== null);
    if (!el) throw new Error('no visible [data-action=' + n + ']');
    el.click();
}, name);

// "=itempool.A.n.A.tier.1+B.n.B.tier.2" -> Map(name -> tier)
function parseItempool(str) {
    assert.ok(str.startsWith('=itempool.'), 'textmod starts with =itempool.');
    const tiers = new Map();
    for (const entry of str.slice('=itempool.'.length).split('+')) {
        const m = entry.match(/^(.+)\.n\.(.+)\.tier\.(-?\d+)$/);
        assert.ok(m && m[1] === m[2], 'well-formed entry: ' + entry);
        assert.ok(!tiers.has(m[1]), 'no duplicate entry: ' + m[1]);
        tiers.set(m[1], Number(m[3]));
    }
    return tiers;
}

function assertCompleteItempool(tiers) {
    assert.equal(tiers.size, ITEMS_DB.length + TIER0_ITEMS.length);
    ITEMS_DB.forEach(i => assert.ok(tiers.has(i.name), 'includes ' + i.name));
    TIER0_ITEMS.forEach(n => assert.equal(tiers.get(n), 0, n + ' exported at tier 0'));
    tiers.forEach((t, n) => assert.ok(t >= 0 && t <= 10, `${n} tier ${t} within 0-10`));
}

test('loads without errors or missing files', async () => {
    const page = await openApp();
    await page.click('#btn-items-mode');
    assert.equal(await activePage(page), 'page-items-info');
    assert.deepEqual(page.problems, []);
    await page.close();
});

test('community balance: exports the preset and shows results', async () => {
    const page = await openApp();
    await page.click('#btn-items-mode');
    await action(page, 'copy-community');
    await wait(50);
    assert.equal(await activePage(page), 'page-stats');
    const [mod] = await copied(page);
    const tiers = parseItempool(mod);
    assertCompleteItempool(tiers);
    for (const [name, tier] of Object.entries(COMMUNITY_BALANCES)) assert.equal(tiers.get(name), tier, name);
    assert.match(await text(page, '#stats-adjustments-grid'), /Anchor\s+Tier 1 → Tier 2 ▲/);
    assert.deepEqual(page.problems, []);
    await page.close();
});

test('community balance: results still show when clipboard is denied', async () => {
    const page = await openApp();
    await page.evaluate(() => { window.__clipFail = true; });
    await page.click('#btn-items-mode');
    await action(page, 'copy-community');
    await wait(50);
    assert.equal(await activePage(page), 'page-stats');
    const alerts = await page.evaluate(() => window.__alerts);
    assert.match(alerts[0], /Copy failed[\s\S]*=itempool\./);
    await page.close();
});

test('draft: plays all 9 tiers with reviews and exports adjustments', async () => {
    const page = await openApp();
    await page.click('#btn-items-mode');
    await action(page, 'start-draft');
    let reviews = 0, picks = 0;
    while (await activePage(page) === 'page-draft') {
        assert.ok(picks < 400, 'draft finishes');
        if (await reviewOpen(page)) {
            reviews++;
            const order = await text(page, '#tier-review-container');
            assert.match(order, /▲ \+1 tier nerf[\s\S]*▼ -1 tier buff[\s\S]*▼▼ -2 tier buff/);
            await action(page, 'confirm-review');
            await wait(5);
            continue;
        }
        const before = await progress(page);
        await page.keyboard.press(['a', 's', 'd'][picks++ % 3]);
        await page.waitForFunction(b => document.getElementById('progress-text').textContent !== b
            || document.getElementById('tier-transition').classList.contains('active')
            || !document.querySelector('#page-draft.active'), { timeout: 3000 }, before);
    }
    assert.equal(reviews, 9);
    assert.equal(await activePage(page), 'page-stats');

    await action(page, 'copy-mod');
    await wait(50);
    const tiers = parseItempool((await copied(page)).at(-1));
    assertCompleteItempool(tiers);
    const changed = ITEMS_DB.filter(i => tiers.get(i.name) !== i.tier);
    assert.ok(changed.length > 0, 'default review cut-offs produce adjustments');
    // Every changed item appears in the results grid with its new tier (the "from" tier is the
    // tier it was last reviewed in, which differs from its base tier for carried-over nerfs)
    const grid = await text(page, '#stats-adjustments-grid');
    for (const i of changed) assert.match(grid, new RegExp(`${i.name}\\s+Tier \\d+ → Tier ${tiers.get(i.name)} `));
    assert.deepEqual(page.problems, []);
    await page.close();
});

test('draft: rankings modal lists the tier sorted by Elo', async () => {
    const page = await openApp();
    await page.evaluate(() => startDraft());
    for (let i = 0; i < 5; i++) { await page.keyboard.press('a'); await wait(20); }
    await action(page, 'show-rankings');
    const elos = (await text(page, '#rankings-list')).match(/\d+(?= Elo)/g).map(Number);
    assert.equal(elos.length, ITEMS_DB.filter(i => i.tier === 1).length);
    assert.deepEqual(elos, [...elos].sort((a, b) => b - a));
    assert.ok(elos[0] > 1200 && elos.at(-1) < 1200, 'picks moved ratings');
    await page.close();
});

test('draft: ignores repeated, modified and blocked key presses', async () => {
    const page = await openApp();
    await page.evaluate(() => startDraft());
    const key = (k, extra = {}) => page.evaluate((k, e) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, ...e })), k, extra);

    await page.evaluate(() => ['a', 's'].forEach(k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k }))));
    await wait(50);
    assert.equal(await progress(page), 'Round 1 / 30', 'double press counts once');

    await key('d', { ctrlKey: true });
    await wait(50);
    assert.equal(await progress(page), 'Round 1 / 30', 'Ctrl+D is not a pick');

    await action(page, 'show-rankings');
    await key('a');
    await wait(50);
    assert.equal(await progress(page), 'Round 1 / 30', 'no picks behind the rankings modal');
    await action(page, 'close-rankings');

    await action(page, 'skip-tier');
    await key('a');
    await wait(50);
    assert.ok(await reviewOpen(page), 'review stays open');
    assert.equal(await progress(page), 'Round 1 / 30', 'no picks during review');
    await page.close();
});

test('manual set: exports the exact tier chosen, including multi-tier moves', async () => {
    const page = await openApp();
    await page.evaluate(() => startManualSet());
    const currentItem = async () => {
        const name = await page.evaluate(() => document.getElementById('manual-item-name').textContent);
        return ITEMS_DB.find(i => i.name === name);
    };
    // First item: nerf by two tiers
    const firstItem = await currentItem();
    await page.click('#manual-btn-plus');
    await page.click('#manual-btn-plus');
    await action(page, 'manual-confirm');
    // Skip the rest of tier 1, then buff the first tier 2 item by one tier
    await action(page, 'manual-skip-tier');
    const secondItem = await currentItem();
    assert.equal(secondItem.tier, 2);
    await page.click('#manual-btn-minus');
    await action(page, 'manual-confirm');
    await page.evaluate(() => finishManualSet());
    assert.equal(await activePage(page), 'page-stats');

    await action(page, 'copy-mod');
    await wait(50);
    const tiers = parseItempool((await copied(page)).at(-1));
    assertCompleteItempool(tiers);
    assert.equal(tiers.get(firstItem.name), firstItem.tier + 2);
    assert.equal(tiers.get(secondItem.name), secondItem.tier - 1);
    await page.close();
});

test('manual set: tiers range from 0 to 10', async () => {
    const page = await openApp();
    await page.evaluate(() => startManualSet());
    const currentItem = async () => {
        const name = await page.evaluate(() => document.getElementById('manual-item-name').textContent);
        return ITEMS_DB.find(i => i.name === name);
    };
    const shownTier = () => page.evaluate(() => document.getElementById('manual-item-tier-display').textContent);

    // Tier 1 item: two buffs stop at tier 0
    const low = await currentItem();
    assert.equal(low.tier, 1);
    await page.click('#manual-btn-minus');
    await page.click('#manual-btn-minus');
    assert.equal(await shownTier(), 'TIER 0');
    await action(page, 'manual-confirm');

    // Skip ahead to tier 9: two nerfs stop at tier 10
    while ((await currentItem()).tier < 9) await action(page, 'manual-skip-tier');
    const high = await currentItem();
    await page.click('#manual-btn-plus');
    await page.click('#manual-btn-plus');
    assert.equal(await shownTier(), 'TIER 10');
    await action(page, 'manual-confirm');
    await page.evaluate(() => finishManualSet());

    await action(page, 'copy-mod');
    await wait(50);
    const tiers = parseItempool((await copied(page)).at(-1));
    assertCompleteItempool(tiers);
    assert.equal(tiers.get(low.name), 0);
    assert.equal(tiers.get(high.name), 10);
    await page.close();
});

test('hero analyzer: analyzes the sample and treats pasted names as text', async () => {
    const page = await openApp();
    await page.evaluate(() => showPage('page-paste'));
    await action(page, 'analyze');
    const pool = await page.evaluate(() => document.querySelector('#output textarea').value);
    assert.match(pool, /^Heropool\./);
    assert.equal((pool.match(/\.n\.TopPick\./g) || []).length, 3);
    assert.equal((pool.match(/\.n\.LowPick\./g) || []).length, 3);

    await page.evaluate(() => {
        document.getElementById('jsonInput').value = JSON.stringify({ pickRates: [
            { n: '<img src=x onerror="window.__xss=1">-hp', v: 5 },
            { n: 'a</textarea><img src=x onerror="window.__xss=2">-hp', v: 1 },
            { n: 'Brute-hp', v: 720926 }, { n: 'Tw(1)n-hp', v: 3 },
        ] });
    });
    await action(page, 'analyze');
    await wait(100);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.match(await text(page, '#output'), /<img src=x onerror/);
    await page.close();
});

test('keyboard access: cards and modal', async () => {
    const page = await openApp();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-items-mode');
    await page.keyboard.press('Enter');
    assert.equal(await activePage(page), 'page-items-info');

    await page.evaluate(() => startDraft());
    await page.focus('#item-card-b');
    await page.keyboard.press('Space');
    await wait(50);
    assert.equal(await progress(page), 'Round 1 / 30');

    await page.focus('[data-action="show-rankings"]');
    await page.keyboard.press('Enter');
    assert.ok(await rankingsOpen(page));
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'close-rankings');
    await page.keyboard.press('Escape');
    assert.ok(!(await rankingsOpen(page)));
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'show-rankings');

    await action(page, 'show-rankings');
    await page.mouse.click(5, 5);
    assert.ok(!(await rankingsOpen(page)), 'backdrop click closes');
    await page.close();
});

test('phone width (360px): no horizontal scrolling on any screen', async () => {
    const page = await openApp({ width: 360, height: 740, mobile: true });
    const screens = {
        landing: () => showPage('page-landing'),
        'items info': () => showPage('page-items-info'),
        draft: () => startDraft(),
        rankings: () => showTierRankings(),
        review: () => { closeTierRankings(); showTierReview(); },
        results: () => copyCommunityBalanceMod(),
        manual: () => startManualSet(),
        analyzer: () => { showPage('page-paste'); analyzeData(); },
    };
    for (const [name, show] of Object.entries(screens)) {
        await page.evaluate(show);
        await wait(50);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `${name} overflows by ${overflow}px`);
    }
    await page.close();
});
