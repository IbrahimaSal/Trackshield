#!/usr/bin/env node
const fs = require('fs');

const NAV = (active) => {
  const items = [
    ['01-badge-popup.html', 'M1 1h12a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 13 15H1A2.5 2.5 0 0 1-1.5 12.5v-9A2.5 2.5 0 0 1 1 1z', 'Badge & Popup', ''],
    ['02-trackers-live.html', '', 'Trackers live', 'live'],
    ['03-carte-flux.html', '', 'Carte des flux', ''],
    ['04-alertes.html', '', 'Alertes', ''],
    ['05-rapport.html', '', 'Rapport d\'audit', ''],
    ['06-parametres.html', '', 'Paramètres', ''],
  ];
  return `<nav class="nav">
  <div class="nav-logo"><div class="logo-mark"><svg width="18" height="18" viewBox="0 0 19 19" fill="none"><path d="M9.5 2L3 5v5c0 3.5 2.8 6.8 6.5 7.8C13.2 16.8 16 13.5 16 10V5L9.5 2z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9.5" cy="9.5" r="2.5" fill="white" opacity=".85"/></svg></div><span style="font-size:15px;font-weight:600;letter-spacing:-.3px;">Trackshield</span></div>
  <div class="nav-label">Écrans</div>
  ${items.map(([href,_,label,pill],i)=>`<a class="nav-item${active===i?' active':''}" href="${href}" style="text-decoration:none;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none">${navIcon(i)}</svg>${label}${pill?`<span class="nav-pill">${pill}</span>`:''}</a>`).join('\n  ')}
  <div style="margin-top:auto;"><div class="nav-label">Statut</div><div style="padding:10px;background:var(--ok-bg);border:1px solid rgba(31,204,122,.2);border-radius:9px;"><div style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ok);"><div class="live-dot"></div>Protection active</div><div style="font-size:10px;color:var(--text3);margin-top:3px;">Base trackers v24.1</div></div></div>
</nav>`;
};

function navIcon(i) {
  const icons = [
    '<rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.2"/>',
    '<circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3l2 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    '<circle cx="2.5" cy="7" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="11.5" cy="2.5" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="11.5" cy="11.5" r="1.8" stroke="currentColor" stroke-width="1.2"/><path d="M4.2 7L8.5 2.5M4.2 7L8.5 11.5" stroke="currentColor" stroke-width="1.2"/>',
    '<path d="M7 1.5L1 12h12L7 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 5.5v3M7 10.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    '<rect x="2" y="1" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    '<circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M7 1.5v1.2M7 11.3V12.5M1.5 7h1.2M11.3 7h1.2M3 3l.85.85M10.15 10.15L11 11M11 3l-.85.85M3.85 10.15L3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  ];
  return icons[i];
}

const HEAD = (title) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Trackshield — ${title}</title>
<link rel="stylesheet" href="tokens.css">
<style>body{display:flex;}</style>
</head>
<body>`;

// ── SCREEN 03 ─────────────────────────────────────────────
const s03 = HEAD('03 Carte des Flux') + NAV(2) + `
<main class="main" style="flex:1;">
  <div class="topbar">
    <div><h1>Carte des flux</h1><div class="topbar-sub">Quelle donnée · vers qui · depuis où</div></div>
    <div class="mono" style="font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border2);padding:7px 12px;border-radius:9px;">siteauhasard.com</div>
  </div>

  <div style="display:flex;gap:20px;align-items:flex-start;">
    <div style="flex:1;">
      <div class="stitle" style="margin-top:0;">Flux actifs — session en cours</div>
      <div class="card" style="padding:22px 24px;">

        <!-- Source -->
        <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(0,77,152,.08);border:1px solid rgba(0,77,152,.28);border-radius:11px;margin-bottom:8px;">
          <div class="logo-mark" style="width:38px;height:38px;border-radius:10px;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 19 19" fill="none"><path d="M9.5 2L3 5v5c0 3.5 2.8 6.8 6.5 7.8C13.2 16.8 16 13.5 16 10V5L9.5 2z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9.5" cy="9.5" r="2.5" fill="white" opacity=".8"/></svg></div>
          <div><div style="font-size:13px;font-weight:600;">Vous · siteauhasard.com</div><div style="font-size:11px;color:var(--text3);">Données saisies + comportement de navigation</div></div>
        </div>

        <!-- Tree -->
        <div style="margin-left:18px;padding-left:20px;border-left:2px solid rgba(0,77,152,.2);">

          ${[
            { tags:[['TEL','pt-danger'],['EMAIL','pt-danger']], dest:'Meta / Facebook', domain:'pixel.facebook.com', co:'f', coC:'rgba(24,119,242,.12)', coCt:'#1877F2', rc:'var(--danger)', rl:'b-danger', rpm:'3 req/min' },
            { tags:[['COMPORT.','pt-info'],['ID_PUB','pt-info']], dest:'Google Analytics', domain:'analytics.google.com', co:'G', coC:'rgba(234,67,53,.12)', coCt:'#EA4335', rc:'var(--warn)', rl:'b-warn', rpm:'12 req/min' },
            { tags:[['EMAIL','pt-warn'],['ID_PUB','pt-warn']], dest:'DoubleClick', domain:'doubleclick.net', co:'DC', coC:'rgba(234,67,53,.12)', coCt:'#EA4335', rc:'var(--warn)', rl:'b-warn', rpm:'5 req/min' },
            { tags:[['COMPORT.','pt-info']], dest:'Pinterest', domain:'ct.pinterest.com', co:'P', coC:'rgba(230,0,35,.12)', coCt:'#E60023', rc:'var(--info)', rl:'b-info', rpm:'2 req/min' },
          ].map(b => `
          <div style="margin-top:12px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
              <div style="width:8px;height:8px;background:${b.rc};border-radius:50%;margin-left:-25px;border:2px solid var(--bg);"></div>
              ${b.tags.map(([t,cls])=>`<span class="ptag ${cls}">${t}</span>`).join('')}
              <span style="font-size:10px;color:var(--text3);">transmis à</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;">
              <div class="co" style="background:${b.coC};color:${b.coCt};">${b.co}</div>
              <div style="flex:1;"><div style="font-size:12px;font-weight:600;">${b.dest}</div><div class="mono" style="font-size:10px;color:var(--text3);">${b.domain}</div></div>
              <div style="text-align:right;"><span class="badge ${b.rl}" style="font-size:9px;">USA</span><div style="font-size:10px;color:var(--text3);margin-top:3px;">${b.rpm}</div></div>
            </div>
          </div>`).join('')}

        </div>
      </div>
    </div>

    <!-- Side -->
    <div style="width:230px;flex-shrink:0;">
      <div class="stitle" style="margin-top:0;">Légende des types</div>
      <div class="card" style="margin-bottom:14px;">
        ${[['TEL','pt-danger','Téléphone'],['EMAIL','pt-danger','E-mail'],['ID_PUB','pt-warn','Identifiant pub'],['COMPORT.','pt-info','Navigation'],['DEVICE','pt-pink','Empreinte device']].map(([t,c,l])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span class="ptag ${c}">${t}</span><span style="font-size:12px;color:var(--text2);">${l}</span></div>`).join('')}
      </div>

      <div class="stitle">Destinations</div>
      <div class="card" style="margin-bottom:14px;">
        ${[['États-Unis',85,'var(--danger)'],['Union Européenne',10,'var(--ok)'],['Autre',5,'var(--text3)']].map(([l,p,c])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:12px;color:var(--text2);">${l}</span>
          <div style="display:flex;align-items:center;gap:7px;">
            <div class="pbar" style="width:72px;"><div class="pfill" style="width:${p}%;background:${c};"></div></div>
            <span style="font-size:11px;color:${c};min-width:28px;text-align:right;">${p}%</span>
          </div>
        </div>`).join('')}
      </div>

      <div class="stitle">Session</div>
      <div class="card">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${[['247','Requêtes','var(--text)'],['14','Trackers','var(--danger)'],['2','PII','var(--warn)'],['4','Entreprises','var(--text)']].map(([v,l,c])=>`<div style="text-align:center;padding:10px;background:var(--surface2);border-radius:9px;"><div style="font-size:22px;font-weight:700;color:${c};">${v}</div><div style="font-size:10px;color:var(--text3);">${l}</div></div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</main>
</body></html>`;

// ── SCREEN 04 ─────────────────────────────────────────────
const TOAST = (borderC, iconSvg, iconBg, title, body, btnLabel, btnClass) => `
<div style="width:320px;background:var(--surface2);border:1px solid ${borderC};border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 20px 60px rgba(0,0,0,.7);">
  <div style="width:36px;height:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg}</div>
  <div style="flex:1;">
    <div style="font-size:13px;font-weight:600;margin-bottom:3px;">${title}</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.55;">${body}</div>
    <div style="display:flex;gap:7px;margin-top:9px;"><button class="btn ${btnClass} btn-sm">${btnLabel}</button><button class="btn btn-ghost btn-sm">Ignorer</button></div>
  </div>
  <span style="font-size:10px;color:var(--text3);flex-shrink:0;">14:32</span>
</div>`;

const s04 = HEAD('04 Alertes') + NAV(3) + `
<main class="main" style="flex:1;">
  <div class="topbar"><div><h1>Alertes</h1><div class="topbar-sub">Notifications temps réel · historique des détections</div></div></div>

  <div class="stitle" style="margin-top:0;">Alertes actives</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">
    ${TOAST('rgba(255,59,92,.3)','<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 1.5L1 15h15L8.5 1.5z" stroke="#FF3B5C" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 6.5v3M8.5 11.5v.5" stroke="#FF3B5C" stroke-width="1.6" stroke-linecap="round"/></svg>','var(--danger-bg)','Téléphone partagé avec Facebook','Votre numéro <span class="mono" style="color:var(--danger);font-size:10px;">+336••••5678</span> transmis à <strong>pixel.facebook.com</strong>','Voir le détail','btn-danger')}
    ${TOAST('rgba(255,176,32,.25)','<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7" stroke="#FFB020" stroke-width="1.4"/><path d="M8.5 5v4M8.5 11.5v.5" stroke="#FFB020" stroke-width="1.6" stroke-linecap="round"/></svg>','var(--warn-bg)','Transfert hors Union Européenne','Données envoyées vers des serveurs aux <strong>États-Unis</strong> · doubleclick.net','Voir le détail','btn-ghost')}
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:36px;">
    ${TOAST('var(--border2)','<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7" stroke="#3B9EFF" stroke-width="1.4"/><circle cx="8.5" cy="5.5" r="1" fill="#3B9EFF"/><path d="M8.5 8v4" stroke="#3B9EFF" stroke-width="1.6" stroke-linecap="round"/></svg>','var(--info-bg)','12 trackers détectés','Google Analytics, Meta Pixel, TikTok Pixel et 9 autres scripts de suivi actifs','Voir la liste','btn-ghost')}
    ${TOAST('rgba(255,95,168,.25)','<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2" y="4" width="13" height="9" rx="2" stroke="#FF5FA8" stroke-width="1.4"/><path d="M5 8h7M5 10.5h4" stroke="#FF5FA8" stroke-width="1.2" stroke-linecap="round"/></svg>','var(--pink-bg)','Fingerprinting canvas détecté','Ce site identifie votre navigateur de façon unique via canvas, polices et résolution','En savoir plus','btn-ghost')}
  </div>

  <div class="stitle">Historique des alertes</div>
  <div class="card" style="padding:0;overflow:hidden;">
    <table class="tbl">
      <thead><tr><th>Heure</th><th>Type</th><th>Description</th><th>Site</th><th></th></tr></thead>
      <tbody>
        ${[
          ['14:32','b-danger','PII','Numéro de téléphone partagé','siteauhasard.com'],
          ['14:31','b-warn','Geo','Transfert hors UE détecté','siteauhasard.com'],
          ['14:30','b-info','Tracker','12 trackers détectés','siteauhasard.com'],
          ['14:29','b-pink','Device','Canvas fingerprinting','siteauhasard.com'],
          ['13:10','b-ok','OK','Aucune collecte détectée','wikipedia.org'],
        ].map(([h,bc,t,d,s])=>`<tr><td class="mono" style="font-size:10px;color:var(--text3);">${h}</td><td><span class="badge ${bc}">${t}</span></td><td style="font-size:12px;">${d}</td><td class="mono" style="font-size:11px;color:var(--text2);">${s}</td><td><button class="btn btn-ghost btn-sm">Détail</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</main>
</body></html>`;

// ── SCREEN 05 ─────────────────────────────────────────────
const s05 = HEAD('05 Rapport d\'audit') + NAV(4) + `
<main class="main" style="flex:1;">
  <div class="topbar">
    <div><h1>Rapport d'audit</h1><div class="topbar-sub">Résumé exportable par site · section dédiée</div></div>
    <button class="btn btn-bb"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M4 6l2.5 2.5L9 6M1.5 10.5h10" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Exporter PDF</button>
  </div>

  <!-- Hero -->
  <div style="background:linear-gradient(135deg,rgba(0,77,152,.16),rgba(165,0,68,.1));border:1px solid rgba(0,77,152,.22);border-radius:16px;padding:24px;display:flex;align-items:center;gap:24px;margin-bottom:20px;flex-wrap:wrap;">
    <div style="position:relative;width:88px;height:88px;flex-shrink:0;">
      <svg width="88" height="88" viewBox="0 0 88 88" style="transform:rotate(-90deg);">
        <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,59,92,.12)" stroke-width="8"/>
        <circle cx="44" cy="44" r="38" fill="none" stroke="#FF3B5C" stroke-width="8" stroke-dasharray="120 119" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:26px;font-weight:700;color:var(--danger);">D</div>
    </div>
    <div style="flex:1;">
      <div class="mono" style="font-size:11px;color:var(--text3);margin-bottom:4px;">siteauhasard.com · 29 juin 2025 · 14:30</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Score RGPD : D — Préoccupant</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.65;max-width:500px;">Votre numéro de téléphone et votre email ont été transmis à <strong style="color:var(--text);">3 entreprises situées aux États-Unis</strong>. 14 trackers publicitaires actifs détectés.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0;">
      ${[['14','Trackers','var(--danger)'],['2','PII','var(--warn)'],['4','Entreprises','var(--text)'],['85%','Hors UE','var(--danger)']].map(([v,l,c])=>`<div style="text-align:center;padding:12px 16px;background:rgba(0,0,0,.22);border-radius:10px;"><div style="font-size:22px;font-weight:700;color:${c};">${v}</div><div style="font-size:10px;color:var(--text3);">${l}</div></div>`).join('')}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
    <div>
      <div class="stitle" style="margin-top:0;">Données personnelles exposées</div>
      <div class="card" style="padding:0;overflow:hidden;">
        <table class="tbl"><thead><tr><th>Type</th><th>Valeur</th><th>Reçu par</th><th>Pays</th></tr></thead><tbody>
          <tr><td><span class="badge b-danger">Téléphone</span></td><td class="mono" style="font-size:10px;color:var(--danger);">+336••••5678</td><td style="font-size:12px;">pixel.facebook.com</td><td><span class="badge b-danger">USA</span></td></tr>
          <tr><td><span class="badge b-warn">Email</span></td><td class="mono" style="font-size:10px;color:var(--warn);">j••••@gmail.com</td><td style="font-size:12px;">doubleclick.net</td><td><span class="badge b-danger">USA</span></td></tr>
        </tbody></table>
      </div>
    </div>
    <div>
      <div class="stitle" style="margin-top:0;">Trackers détectés</div>
      <div class="card" style="padding:0;overflow:hidden;">
        <table class="tbl"><thead><tr><th>Tracker</th><th>Catégorie</th><th>Req.</th></tr></thead><tbody>
          ${[['Google Analytics','b-info','Analytique','48'],['Meta Pixel','b-danger','Pub + PII','31'],['DoubleClick','b-warn','Publicitaire','22'],['Pinterest Tag','b-info','Analytique','8'],['+ 10 autres','','','138']].map(([n,bc,t,r])=>`<tr><td style="font-size:12px;${!bc?'color:var(--text3);':''}">${n}</td><td>${bc?`<span class="badge ${bc}">${t}</span>`:''}</td><td style="font-size:12px;color:var(--text2);">${r}</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
  </div>

  <div class="stitle">Recommandations</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
    ${[['danger','Action immédiate','Évitez de saisir des données personnelles sur ce site tant que sa politique de confidentialité n\'est pas clarifiée.'],['warn','Conseil','85% des données partent aux États-Unis. Vérifiez si une option de refus des cookies tiers est disponible.'],['info','À savoir','Vous pouvez exercer votre droit d\'accès auprès de Meta et Google en vertu du RGPD.']].map(([c,t,d])=>`<div style="padding:14px;background:var(--surface2);border:1px solid rgba(var(--${c}-rgb,255,59,92),.15);border-radius:11px;border-left:3px solid var(--${c});"><div style="font-size:10px;font-weight:600;color:var(--${c});margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">${t}</div><div style="font-size:12px;color:var(--text2);line-height:1.6;">${d}</div></div>`).join('')}
  </div>
</main>
</body></html>`;

// ── SCREEN 06 ─────────────────────────────────────────────
const s06 = HEAD('06 Paramètres') + NAV(5) + `
<main class="main" style="flex:1;">
  <div class="topbar">
    <div><h1>Paramètres</h1><div class="topbar-sub">Configuration de Trackshield</div></div>
    <button class="btn btn-bb btn-sm">Sauvegarder</button>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
    <div>
      <div class="stitle" style="margin-top:0;">Alertes &amp; notifications</div>
      <div class="card" style="margin-bottom:16px;">
        ${[['Alertes activées','Notifications dans le navigateur',true],['PII détectée','Email, téléphone, nom exposés',true],['Transfert hors UE','Données hors Union Européenne',true],['Fingerprinting','Identification navigateur',true],['Nouveaux trackers','Alerte à chaque page',false]].map(([n,d,on])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
          <div><div style="font-size:13px;font-weight:500;">${n}</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">${d}</div></div>
          <div class="tog${on?' on':''}" onclick="this.classList.toggle('on')"></div>
        </div>`).join('')}
        <div style="padding-top:12px;display:flex;align-items:center;justify-content:space-between;">
          <div><div style="font-size:13px;font-weight:500;">Stockage 100% local</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">Aucune donnée vers un serveur externe</div></div>
          <div class="tog on" style="opacity:.4;pointer-events:none;"></div>
        </div>
      </div>

      <div class="stitle">Sync cloud</div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:14px;">
          <div><div style="font-size:13px;font-weight:500;">Activer la synchronisation</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">Sauvegarde chiffrée sur vos appareils</div></div>
          <div class="tog" onclick="this.classList.toggle('on')"></div>
        </div>
        <div style="background:rgba(0,77,152,.06);border:1px solid rgba(0,77,152,.18);border-radius:9px;padding:12px;">
          <div style="font-size:11px;font-weight:500;color:#5BA8FF;margin-bottom:5px;">Consentement explicite requis</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.6;">En activant la sync, vos données de navigation anonymisées seront chiffrées et stockées sur nos serveurs (PostgreSQL · EU). Vous pouvez supprimer vos données à tout moment.</div>
          <button class="btn btn-ghost btn-sm" style="margin-top:10px;font-size:11px;">Lire la politique de confidentialité</button>
        </div>
      </div>

      <div class="stitle">Confidentialité</div>
      <div class="card">
        ${[['Mode discret','Pas de badge sur la liste blanche',false],['Export auto rapport','PDF généré en fin de session',false]].map(([n,d,on])=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);">
          <div><div style="font-size:13px;font-weight:500;">${n}</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">${d}</div></div>
          <div class="tog${on?' on':''}" onclick="this.classList.toggle('on')"></div>
        </div>`).join('')}
        <div style="padding-top:11px;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:13px;font-weight:500;">Effacer tout l'historique</div><div style="font-size:11px;color:var(--text2);margin-top:2px;">247 entrées · 1.2 MB</div></div>
          <button class="btn btn-danger btn-sm">Effacer</button>
        </div>
      </div>
    </div>

    <div>
      <div class="stitle" style="margin-top:0;">Conservation des données</div>
      <div class="card" style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:500;margin-bottom:3px;">Durée de l'historique</div>
        <div style="font-size:11px;color:var(--text2);margin-bottom:12px;">Effacement automatique après ce délai</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm">7 jours</button>
          <button class="btn btn-bb btn-sm">30 jours</button>
          <button class="btn btn-ghost btn-sm">90 jours</button>
          <button class="btn btn-ghost btn-sm">Jamais</button>
        </div>
      </div>

      <div class="stitle">Sites exclus (liste blanche)</div>
      <div class="card" style="margin-bottom:16px;">
        <div style="font-size:11px;color:var(--text2);margin-bottom:12px;">Trackshield ne surveille pas ces sites</div>
        <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">
          ${['banque-en-ligne.fr','mon-medecin.fr'].map(s=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:var(--surface2);border-radius:7px;"><span class="mono" style="font-size:12px;">${s}</span><button class="btn btn-ghost btn-sm" style="color:var(--text3);padding:3px 7px;">✕</button></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <input placeholder="ajouter-un-site.com" style="flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:7px;padding:7px 10px;font-family:'DM Mono',monospace;font-size:12px;color:var(--text);outline:none;">
          <button class="btn btn-ghost btn-sm">Ajouter</button>
        </div>
      </div>

      <div class="stitle">Bases de données trackers</div>
      <div class="card">
        ${[['EasyList','MAJ il y a 3h','ok'],['Disconnect.me','MAJ il y a 3h','ok'],['EasyPrivacy','MAJ il y a 8h',null]].map(([n,d,s])=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
          <div><div style="font-size:13px;font-weight:500;">${n}</div><div style="font-size:11px;color:var(--text3);">${d}</div></div>
          ${s?`<span class="badge b-ok">À jour</span>`:`<button class="btn btn-ghost btn-sm">Mettre à jour</button>`}
        </div>`).join('')}
        <div style="padding-top:10px;text-align:center;"><button class="btn btn-ghost btn-sm">Tout mettre à jour</button></div>
      </div>
    </div>
  </div>
</main>
</body></html>`;

fs.writeFileSync('/home/claude/trackshield-screens/03-carte-flux.html', s03);
fs.writeFileSync('/home/claude/trackshield-screens/04-alertes.html', s04);
fs.writeFileSync('/home/claude/trackshield-screens/05-rapport.html', s05);
fs.writeFileSync('/home/claude/trackshield-screens/06-parametres.html', s06);
console.log('Screens 03–06 generated');
