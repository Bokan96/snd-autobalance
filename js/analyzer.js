// Hero pick-rate analyzer: unpack the game's pick data and mark top/bottom heroes in the hero pool.

// Example data pre-filled into the paste box
const SAMPLE_PICK_RATES = {
    pickRates: [
        {"n":"Berserker-hp","v":1245201}, {"n":"Brute-hp","v":720926}, {"n":"Collector-hp","v":1769483}, {"n":"Gladiator-hp","v":851994},
        {"n":"Soldier-hp","v":1179681}, {"n":"Whirl-hp","v":2555908}, {"n":"Scrapper-hp","v":1048595}, {"n":"Sinew-hp","v":1507343},
        {"n":"Barbarian-hp","v":1114127}, {"n":"Brawler-hp","v":917524}, {"n":"Curator-hp","v":720914}, {"n":"Leader-hp","v":1703940},
        {"n":"Veteran-hp","v":1048593}, {"n":"Bash-hp","v":1048583}, {"n":"Eccentric-hp","v":1114116}, {"n":"Captain-hp","v":1048579},
        {"n":"Wanderer-hp","v":196639}, {"n":"Dabbler-hp","v":917523}, {"n":"Gambler-hp","v":1507330}, {"n":"Ranger-hp","v":851992},
        {"n":"Rogue-hp","v":786469}, {"n":"Trapper-hp","v":1572871}, {"n":"Spellblade-hp","v":983055}, {"n":"Ninja-hp","v":2359302},
        {"n":"Juggler-hp","v":524318}, {"n":"Ludus-hp","v":1507334}, {"n":"Assassin-hp","v":393238}, {"n":"Dancer-hp","v":1245200},
        {"n":"Fencer-hp","v":983057}, {"n":"Sharpshot-hp","v":1900546}, {"n":"Venom-hp","v":589841}, {"n":"Roulette-hp","v":983047},
        {"n":"Dabblest-hp","v":1048580}, {"n":"Agent-hp","v":327701}, {"n":"Knight-hp","v":852009}, {"n":"Armorer-hp","v":1769484},
        {"n":"Bard-hp","v":2097156}, {"n":"Cleric-hp","v":1572880}, {"n":"Guardian-hp","v":1835025}, {"n":"Pilgrim-hp","v":1703953},
        {"n":"Monk-hp","v":786457}, {"n":"Warden-hp","v":851995}, {"n":"Keeper-hp","v":917525}, {"n":"Paladin-hp","v":1245210},
        {"n":"Prince-hp","v":2031623}, {"n":"Stalwart-hp","v":1179671}, {"n":"Poet-hp","v":786451}, {"n":"Valkyrie-hp","v":1966085},
        {"n":"Stoic-hp","v":1179671}, {"n":"Druid-hp","v":1114145}, {"n":"Herbalist-hp","v":327713}, {"n":"Medic-hp","v":2555914},
        {"n":"Priestess-hp","v":2031635}, {"n":"Vampire-hp","v":524325}, {"n":"Enchanter-hp","v":2424837}, {"n":"Disciple-hp","v":1638413},
        {"n":"Fey-hp","v":2424844}, {"n":"Doctor-hp","v":1179666}, {"n":"Forsaken-hp","v":2162692}, {"n":"Prophet-hp","v":720922},
        {"n":"Shaman-hp","v":1179678}, {"n":"Witch-hp","v":1835018}, {"n":"Wraith-hp","v":2031621}, {"n":"Surgeon-hp","v":917529},
        {"n":"Fate-hp","v":1179659}, {"n":"Caldera-hp","v":786473}, {"n":"Evoker-hp","v":2031626}, {"n":"Glacia-hp","v":1769483},
        {"n":"Jester-hp","v":2293770}, {"n":"Sparky-hp","v":1310751}, {"n":"Myco-hp","v":1966089}, {"n":"Seer-hp","v":1572885},
        {"n":"Fiend-hp","v":1376283}, {"n":"Artificer-hp","v":1441798}, {"n":"Weaver-hp","v":1179654}, {"n":"Sorcerer-hp","v":262188},
        {"n":"Chronos-hp","v":1310733}, {"n":"Warlock-hp","v":458768}, {"n":"Ace-hp","v":1310726}, {"n":"Ghast-hp","v":1900549},
        {"n":"Wizard-hp","v":524315}, {"n":"Presence-hp","v":458757}, {"n":"Spine-hp","v":327685}, {"n":"Granite-hp","v":262148},
        {"n":"Statue-hp","v":327685}, {"n":"Mimic-hp","v":589826}, {"n":"Sphere-hp","v":393221}, {"n":"Coffin-hp","v":196614},
        {"n":"Alien-hp","v":65547}, {"n":"Tainted-hp","v":524290}, {"n":"Luggage-hp","v":262149}, {"n":"Vessel-hp","v":327683},
        {"n":"Jumble-hp","v":196615}, {"n":"Dice-hp","v":262148}, {"n":"Robot-hp","v":524288}, {"n":"Twin-hp","v":196613}
    ]
};

// Base hero pool textmod; top/bottom heroes get .n.TopPick / .n.LowPick suffixes
const ORIGINAL_HEROPOOL = "Heropool.\nThief+scoundrel+lost+dabble+clumsy+fighter+brigand+lazy+hoarder+ruffian+defender+buckle+squire+alloy+wallop+healer+gardener+mystic+splint+acolyte+mage+prodigy+meddler+student+initiate+cultist+tinder+reflection+housecat+primrose+spade+pockets\n+dabbler+gambler+rogue+ranger+trapper+spellblade+ninja+juggler+berserker+brute+collector+gladiator+soldier+whirl+scrapper+sinew+knight+armorer+bard+cleric+guardian+pilgrim+monk+warden+druid+herbalist+medic+priestess+vampire+enchanter+disciple+fey+fiend+jester+sparky+caldera+evoker+glacia+myco+seer+presence+spine+granite+statue+mimic+sphere+coffin+alien\n+ludus+assassin+dancer+fencer+sharpshot+venom+roulette+dabblest+agent+barbarian+brawler+curator+leader+veteran+bash+eccentric+captain+wanderer+keeper+paladin+prince+stalwart+poet+valkyrie+stoic+doctor+forsaken+prophet+shaman+witch+wraith+surgeon+fate+warlock+ghast+artificer+weaver+sorcerer+chronos+ace+wizard+tainted+luggage+vessel+jumble+dice+robot+twin";

function generateModifiedPool(topHeroes, bottomHeroes) {
    let modifiedPool = ORIGINAL_HEROPOOL;
    topHeroes.forEach(hero => {
        const heroLower = hero.name.toLowerCase();
        const suffix = (typeof HERO_SUFFIXES !== 'undefined' && HERO_SUFFIXES[hero.name]?.topPick) || "TopPick";
        const pattern = new RegExp(`\\+${escapeRegExp(heroLower)}\\+`, 'g');
        modifiedPool = modifiedPool.replace(pattern, () => `+${heroLower}.n.TopPick.${suffix}+`);
    });
    bottomHeroes.forEach(hero => {
        const heroLower = hero.name.toLowerCase();
        const suffix = (typeof HERO_SUFFIXES !== 'undefined' && HERO_SUFFIXES[hero.name]?.lowPick) || "LowPick";
        const pattern = new RegExp(`\\+${escapeRegExp(heroLower)}\\+`, 'g');
        modifiedPool = modifiedPool.replace(pattern, () => `+${heroLower}.n.LowPick.${suffix}+`);
    });
    return modifiedPool;
}

function analyzeData() {
    const input = document.getElementById('jsonInput').value.trim();
    const outputDiv = document.getElementById('output');
    const errorDiv = document.getElementById('error');
    outputDiv.classList.remove('visible');
    errorDiv.classList.remove('visible');

    if (!input) { showError('Please paste JSON data into the text area.'); return; }

    try {
        const data = JSON.parse(input);
        if (!data.pickRates || !Array.isArray(data.pickRates)) {
            showError('Invalid JSON format. Expected a "pickRates" array.');
            return;
        }

        const heroes = data.pickRates
            .filter(item => item.n && item.n.endsWith('-hp'))
            .map(item => {
                const v = item.v;
                const rawPicked = v & 0xFFFF;
                const rawNotPicked = v >> 16;
                const picked = rawPicked + 1;
                const notPicked = rawNotPicked + 1;
                const total = picked + notPicked;
                const pickRate = (picked / total) * 100;
                return { name: item.n.slice(0, -3), picked, total, pickRate };
            })
            .filter(h => h.total > 0);

        if (heroes.length === 0) {
            showError('No heroes found. Make sure your JSON contains items ending in "-hp".');
            return;
        }

        heroes.sort((a, b) => b.picked - a.picked);
        const topHeroes = heroes.slice(0, 3);
        const bottomHeroes = heroes.slice(-3).reverse();
        displayResults(topHeroes, bottomHeroes);
    } catch (error) {
        showError('Invalid JSON: ' + error.message);
    }
}

function displayResults(topHeroes, bottomHeroes) {
    const outputDiv = document.getElementById('output');
    const modifiedPool = generateModifiedPool(topHeroes, bottomHeroes);

    const topRows = topHeroes.map((h, i) => `
<div class="hero-row">
    <span class="hero-name">${i + 1}. ${escapeHtml(h.name)}</span>
    <span class="hero-rate">${h.pickRate.toFixed(1)}%</span>
</div>`).join('');

    const bottomRows = bottomHeroes.map((h, i) => `
<div class="hero-row">
    <span class="hero-name">${i + 1}. ${escapeHtml(h.name)}</span>
    <span class="hero-rate low">${h.pickRate.toFixed(1)}%</span>
</div>`).join('');

    outputDiv.innerHTML = `
<h3>🏆 Most Picked</h3>
${topRows}
<h3 style="margin-top:20px;">📉 Least Picked</h3>
${bottomRows}
<h3 style="margin-top:20px;">📝 Modified Hero Pool</h3>
<p style="font-size:11px;color:var(--text-dim);margin-bottom:10px;">Top 3 marked .n.TopPick, bottom 3 marked .n.LowPick</p>
<textarea readonly style="width:100%;min-height:120px;padding:10px;font-family:'Share Tech Mono',monospace;font-size:11px;background:var(--bg);border:2px solid var(--border);color:var(--text);resize:vertical;"></textarea>
<button class="btn btn-accent" data-action="copy-pool" style="margin-top:10px;width:100%;">COPY TO CLIPBOARD</button>
    `;
    outputDiv.querySelector('textarea').value = modifiedPool;
    outputDiv.classList.add('visible');
}

function copyPool() {
    const textarea = document.querySelector('#output textarea');
    if (!textarea) return;
    navigator.clipboard.writeText(textarea.value).then(() => {
        const btn = document.querySelector('#output .btn-accent');
        if (btn) { btn.textContent = '✓ COPIED!'; setTimeout(() => btn.textContent = 'COPY TO CLIPBOARD', 2000); }
    }).catch(() => {
        textarea.select();
        document.execCommand('copy');
    });
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '⚠ ' + msg;
    errorDiv.classList.add('visible');
}
