import re

with open('index.html', 'r', encoding='utf-8') as f:
    src = f.read()

# Pattern to replace
old_code = """    // 4. Render full table breakdown
    const tbody = document.getElementById('stats-table-body');
    
    // Sort table: sort by tier first, then by bestElo descending
    const tableData = [...results].filter(r => r.offered > 0).sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.eloBest - a.eloBest;
    });

    // Update table header column for last column
    const tableHeaderLastCol = document.querySelector('#stats-table th:last-child');
    if (tableHeaderLastCol) {
        tableHeaderLastCol.textContent = useAllTime ? 'Best / Worst Elo' : 'N/A';
    }

    tbody.innerHTML = tableData.map(r => {
        const displayValue = useAllTime 
            ? `${r.eloBest} / ${r.eloWorst}`
            : `N/A`;
            
        let rateClass = 'mid';
        if (useAllTime) {
            if (r.eloBest >= 1250) rateClass = 'high';
            else if (r.eloBest <= 1150) rateClass = 'low';
        }
        return `
            <tr>
                <td class="t-tier">T${r.tier}</td>
                <td class="t-name">${r.name}</td>
                <td>${r.offered}</td>
                <td>${r.picked}</td>
                <td class="t-rate ${rateClass}">${displayValue}</td>
            </tr>
        `;
    }).join('');"""

new_code = """    // 4. Render full table breakdown
    const tbody = document.getElementById('stats-table-body');
    
    if (useAllTime) {
        // Sort table: sort by tier first, then by bestElo descending
        const tableData = [...results].filter(r => r.offered > 0).sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return b.eloBest - a.eloBest;
        });

        // Update table header column for last column
        const tableHeaderLastCol = document.querySelector('#stats-table th:last-child');
        if (tableHeaderLastCol) {
            tableHeaderLastCol.textContent = 'Best / Worst Elo';
        }

        tbody.innerHTML = tableData.map(r => {
            let rateClass = 'mid';
            if (r.eloBest >= 1250) rateClass = 'high';
            else if (r.eloBest <= 1150) rateClass = 'low';
            
            return `
                <tr>
                    <td class="t-tier">T${r.tier}</td>
                    <td class="t-name">${r.name}</td>
                    <td>${r.offered}</td>
                    <td>${r.picked}</td>
                    <td class="t-rate ${rateClass}">${r.eloBest} / ${r.eloWorst}</td>
                </tr>
            `;
        }).join('');
    } else {
        // CURRENT SESSION: Render finalAdjustments
        const tableHeaderLastCol = document.querySelector('#stats-table th:last-child');
        if (tableHeaderLastCol) {
            tableHeaderLastCol.textContent = 'Adjustment';
        }
        
        if (draftState && draftState.finalAdjustments && draftState.finalAdjustments.length > 0) {
            tbody.innerHTML = draftState.finalAdjustments.map(adj => {
                let color = '';
                let label = '';
                if (adj.type === 'nerf') { color = 'color: #e53935;font-weight:bold;'; label = 'Nerfed (higher tier)'; }
                else if (adj.type === 'buff') { color = 'color: #4caf50;font-weight:bold;'; label = 'Buffed -1 Tier'; }
                else if (adj.type === 'buff2') { color = 'color: #4caf50;font-weight:bold;'; label = 'Buffed -2 Tiers'; }
                
                return `
                    <tr>
                        <td class="t-tier">T${adj.tier}</td>
                        <td class="t-name" style="${color}">${adj.name} Tier ${adj.tier}</td>
                        <td>-</td>
                        <td>-</td>
                        <td class="t-rate" style="${color}">${label}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No buffs or nerfs recorded yet.</td></tr>`;
        }
    }"""

if old_code in src:
    src = src.replace(old_code, new_code)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(src)
    print("Successfully replaced table rendering logic!")
else:
    print("Could not find the target code to replace!")
