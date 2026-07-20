import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = '''function renderItemCard(side, item) {
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

    // Name
    nameEl.textContent = item.name;

    // Description (replace \\n with <br>)
    let out = item.description.replace(/\\n/g, '<br>');
    const greens = ["acidic", "channel", "groooooowth", "growth", "inspired", "poison", "plague", "rite", "weaken", "undergrowth"];
    const reds = ["bloodlust", "eliminate", "evil", "flesh", "lucky", "mandatory", "regen", "pain"];
    const purples = ["deathwish", "decay", "exert", "inflictexert", "manacost", "possessed", "potion", "rampage", "singleCast", "sticky", "terminal"];
    const colorize = (words, color) => {
        const regex = new RegExp('\\\\\\\\b(' + words.join('|') + ')\\\\\\\\b', 'gi');
        out = out.replace(regex, `<span style="color:${color};">\\$1</span>`);
    };
    colorize(greens, '#388044');
    colorize(reds, '#AD1F1F');
    colorize(purples, '#6A4484');
    descEl.innerHTML = out;
}'''

new_func = '''function renderItemCard(side, item) {
    const suffix = `-${side}`;
    const img = document.getElementById(`item-icon${suffix}`);
    const fallback = document.getElementById(`item-fallback${suffix}`);
    const nameEl = document.getElementById(`item-name${suffix}`);
    const descEl = document.getElementById(`item-desc${suffix}`);
    const eloEl = document.getElementById(`item-elo${suffix}`);

    // Icon
    img.src = getIconPath(item.name);
    img.alt = item.name;
    img.style.display = '';
    fallback.style.display = 'none';

    // Name
    nameEl.textContent = item.name;

    // Description (replace \\n with <br>)
    let out = item.description.replace(/\\n/g, '<br>');
    const greens = ["acidic", "channel", "groooooowth", "growth", "inspired", "poison", "plague", "rite", "weaken", "undergrowth"];
    const reds = ["bloodlust", "eliminate", "evil", "flesh", "lucky", "mandatory", "regen", "pain"];
    const purples = ["deathwish", "decay", "exert", "inflictexert", "manacost", "possessed", "potion", "rampage", "singleCast", "sticky", "terminal"];
    const colorize = (words, color) => {
        const regex = new RegExp('\\\\b(' + words.join('|') + ')\\\\b', 'gi');
        out = out.replace(regex, `<span style="color:${color};">$1</span>`);
    };
    colorize(greens, '#388044');
    colorize(reds, '#AD1F1F');
    colorize(purples, '#6A4484');
    descEl.innerHTML = out;

    // Elo + projected gain/loss
    if (eloEl) {
        const pStats = loadPersistentStats();
        const myElo = (pStats[item.name] || {eloBest: 1200}).eloBest;
        const opponents = [draftState.pairA, draftState.pairB, draftState.pairC].filter(i => i && i.name !== item.name);
        const halfK = K_FACTOR * 0.5;
        let totalGain = 0;
        let totalLoss = 0;
        opponents.forEach(opp => {
            const oppElo = (pStats[opp.name] || {eloBest: 1200}).eloBest;
            const expectedWin = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
            const expectedLoss = 1 - expectedWin;
            totalGain += halfK * (1 - expectedWin);
            totalLoss += halfK * (0 - expectedLoss);
        });
        const gain = Math.round(totalGain);
        const loss = Math.round(opponents.length > 0 ? totalLoss / opponents.length : 0);
        eloEl.innerHTML = `${myElo} <span class="elo-gain">+${gain}</span><span class="elo-loss">${loss}</span>`;
    }
}'''

# Normalize line endings for comparison
content_norm = content.replace('\r\n', '\n')
old_func_norm = old_func.replace('\r\n', '\n')
new_func_norm = new_func.replace('\r\n', '\n')

if old_func_norm in content_norm:
    new_content = content_norm.replace(old_func_norm, new_func_norm)
    # Restore \r\n line endings
    new_content = new_content.replace('\n', '\r\n')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Done - renderItemCard updated')
else:
    print('NOT FOUND - looking for partial match...')
    # Try to find where the function is
    idx = content_norm.find('function renderItemCard')
    print('function found at:', idx)
    print(repr(content_norm[idx:idx+200]))
