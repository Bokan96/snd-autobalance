// Results page and textmod export.

// ── Adjustments ──────────────────────────────────────────
// Target tier for a recorded adjustment
function adjustmentToTier(adj) {
    // Manual and community adjustments carry an explicit target tier
    if (adj.newTier !== undefined) return adj.newTier;
    if (adj.type === 'nerf') return adj.tier + 1;
    if (adj.type === 'buff') return adj.tier - 1;
    if (adj.type === 'buff2') return adj.tier - 2;
    return adj.tier;
}

// Last recorded adjustment per item name
function latestAdjustments(adjustments) {
    const seen = new Map();
    adjustments.forEach(adj => seen.set(adj.name, adj));
    return seen;
}

// =itempool textmod with each item at its base tier, or the tier from tierOverrides,
// followed by the tier 0 items (never adjusted)
function buildItempoolString(tierOverrides) {
    const entries = ITEMS_DB.map(item => {
        const effectiveTier = tierOverrides.hasOwnProperty(item.name)
            ? tierOverrides[item.name]
            : item.tier;
        return `${item.name}.n.${item.name}.tier.${effectiveTier}`;
    });
    TIER0_ITEMS.forEach(name => entries.push(`${name}.n.${name}.tier.0`));
    return '=itempool.' + entries.join('+');
}

// ── Textmod export ───────────────────────────────────────
function copyAutobalanceMod() {
    // Build a map of name -> adjusted tier from finalAdjustments
    const adjustedTiers = {};
    if (draftState && draftState.finalAdjustments) {
        latestAdjustments(draftState.finalAdjustments).forEach((adj, name) => {
            adjustedTiers[name] = adjustmentToTier(adj);
        });
    }
    copyToClipboard(buildItempoolString(adjustedTiers), document.getElementById('btn-copy-mod'));
}

function copyCommunityBalanceMod() {
    // Generate finalAdjustments representation for community balances
    draftState = initDraftState();
    ITEMS_DB.forEach(item => {
        if (COMMUNITY_BALANCES.hasOwnProperty(item.name)) {
            const newT = COMMUNITY_BALANCES[item.name];
            if (newT !== item.tier) {
                draftState.finalAdjustments.push({
                    name: item.name,
                    tier: item.tier,
                    newTier: newT,
                    type: newT > item.tier ? 'nerf' : 'buff'
                });
            }
        }
    });

    // Show the results whether or not the clipboard write succeeds
    showStats();
    copyToClipboard(buildItempoolString(COMMUNITY_BALANCES), document.getElementById('btn-copy-community'));
}

// ── Results page ─────────────────────────────────────────
function showStats() {
    showPage('page-stats');
    document.getElementById('stats-subtitle').textContent = 'Draft complete — here are your final item adjustments';

    const grid = document.getElementById('stats-adjustments-grid');
    const adjustments = draftState ? [...latestAdjustments(draftState.finalAdjustments).values()] : [];

    if (adjustments.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:30px; border: 2px dashed var(--border); border-radius:8px;">No buffs or nerfs recorded yet.</div>`;
        return;
    }

    // Group by original tier
    const groups = {};
    adjustments.forEach(adj => {
        if (!groups[adj.tier]) groups[adj.tier] = [];
        groups[adj.tier].push(adj);
    });
    const sortedTiers = Object.keys(groups).map(Number).sort((a, b) => a - b);

    grid.innerHTML = sortedTiers.map(tier => {
        const itemsHtml = groups[tier].map(adj => {
            const newTier = adjustmentToTier(adj);
            const isNerf = newTier > adj.tier;
            const color = isNerf ? '#e53935' : '#4caf50';
            // Arrow + title so nerf/buff isn't conveyed by colour alone
            const marker = isNerf ? '<span title="Nerf">▲</span>' : '<span title="Buff">▼</span>';
            const tierLabel = `<span style="font-size:13px;"><s style="color:#888;">Tier ${adj.tier}</s> → Tier ${newTier} ${marker}</span>`;

            return `
            <div style="display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid var(--border);">
                <img src="${escapeHtml(getIconPath(adj.name))}" alt="" loading="lazy" style="width:24px;height:24px;object-fit:contain;flex-shrink:0;" data-hide-on-error>
                <span style="color:${color}; font-size:14px; font-weight:bold; flex:1;">${escapeHtml(adj.name)}</span>
                <span style="color:${color}; font-weight:bold;">${tierLabel}</span>
            </div>
        `;
        }).join('');

        return `
        <div style="border:2px solid var(--border); border-radius:8px; background:var(--bg2); padding:12px; display:flex; flex-direction:column;">
            <div style="font-family:'Orbitron', monospace; font-size:15px; font-weight:bold; color:var(--accent); border-bottom:2px solid var(--accent); padding-bottom:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>TIER ${tier}</span>
                <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">${groups[tier].length} items</span>
            </div>
            <div>
                ${itemsHtml}
            </div>
        </div>
    `;
    }).join('');
}
