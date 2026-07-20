with open('index.html', encoding='utf-8') as f:
    src = f.read()

# Find the end of renderItemCard and insert the Elo block before the closing }
# The function ends after descEl.innerHTML = out;
old_end = '''    descEl.innerHTML = out;
}

function pickItem'''

new_end = '''    descEl.innerHTML = out;

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
        eloEl.innerHTML = myElo + ' <span class="elo-gain">+' + gain + '</span><span class="elo-loss">' + loss + '</span>';
    }
}

function pickItem'''

if old_end in src:
    src = src.replace(old_end, new_end)
    print('Elo block inserted into renderItemCard.')
else:
    print('ERROR: target not found')
    # Show what we have around descEl.innerHTML
    idx = src.find('descEl.innerHTML = out;')
    print('Context:', repr(src[idx:idx+100]))

with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(src)
print('Done.')
