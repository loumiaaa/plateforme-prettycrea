(() => {
'use strict';

/* =========================================================
   Outils
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clone = (o) => JSON.parse(JSON.stringify(o));
const num = (s) => { const n = parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const round2 = (n) => Math.round(n * 100) / 100;

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => toISO(new Date());
const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const addMonths = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
const weekday = (iso) => (fromISO(iso).getDay() + 6) % 7; // 0 = lundi … 6 = dimanche
const startOfWeek = (iso) => addDays(iso, -weekday(iso));
const monthKey = (iso) => iso.slice(0, 7);
const fmt = (iso, o) => new Intl.DateTimeFormat('fr-FR', o).format(fromISO(iso));
const fmtDay = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = (iso) => fmt(iso, { day: 'numeric', month: 'short' });
const fmtLong = (iso) => fmt(iso, { day: 'numeric', month: 'long' });
const fmtMonth = (mk) => cap(fmt(mk + '-01', { month: 'long', year: 'numeric' }));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const money = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(round2(n)) ? 0 : 2, maximumFractionDigits: 2 }).format(n || 0);
const pct = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n) + ' %';
const tMin = (t) => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };
const minT = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':'); return Number(h) + 'h' + (m === '00' ? '' : m); };
const endTime = (p) => minT(Math.min(24 * 60 - 1, tMin(p.time) + Math.round((p.duration || 0) * 60)));
const rel = (n) => n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : n === -1 ? 'hier' : n > 0 ? `dans ${n} jours` : `il y a ${-n} jours`;
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const isNarrow = () => matchMedia('(max-width: 980px)').matches;
const WD_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const ICONS = {
  library: '<path d="M4 20h16"/><path d="M5.5 20V6.5h3V20"/><path d="M10.5 20V4.5h3V20"/><path d="M15.2 20 14 8.2l3-.5 2 12"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  ledger: '<path d="M6 4.5h10.5a2.5 2.5 0 0 1 2.5 2.5v13H8.5A2.5 2.5 0 0 1 6 17.5z"/><path d="M6 17.5A2.5 2.5 0 0 1 8.5 15H19"/><path d="M10 8.5h5"/>',
  jar: '<path d="M8.5 3.5h7"/><path d="M9.5 3.5v3L7 9.5v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-2.5-3v-3"/><path d="M7 13.5h10"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  door: '<path d="M6 20.5V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 5v15.5"/><path d="M4 20.5h16"/><path d="M14.5 12.5v.01"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="m14.5 6-6 6 6 6"/>',
  right: '<path d="m9.5 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4M12 17v.01"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8.5 8"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>',
  pencil: '<path d="m4.5 19.5 1-4L16 5l3 3L8.5 18.5z"/><path d="m14 7 3 3"/>',
  euro: '<path d="M17 6.5a6.5 6.5 0 1 0 0 11"/><path d="M4.5 10.5h8M4.5 13.5h8"/>',
  needle: '<path d="M4.5 19.5 17 7"/><path d="m15.5 5.5 3 3"/><path d="M17.5 3.5 20.5 6.5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  feather: '<path d="M19.5 4.5c-6.5.5-11 5-12 12.5L5 20"/><path d="M8.5 14.5c3.5 0 6.5-1.5 8.5-4.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.5"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.6c2.6-.2 4.4 1.3 5 4.4"/>',
  inbox: '<path d="M4 13.5 6.5 5h11L20 13.5V19H4z"/><path d="M4 13.5h4.5l1.2 2.2h4.6l1.2-2.2H20"/>',
  layers: '<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4"/><path d="m4 16 8 4 8-4"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5z"/><path d="M12 6.5v13"/>',
};
const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

/* ---------- V3 · Gravures fines (traits seuls, couleur = currentColor) ----------
   Ornements de marge et d'en-tête uniquement : jamais derrière du texte courant. */
const ART = (() => {
  const f1 = (n) => +n.toFixed(1);
  const svg = (vb, body, cls = '') => `<svg class="art ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const leaf = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0C6-7 16-8 23-4C16 3 7 4 0 0Z"/><path d="M3-.6C9-2.6 15-3.4 20-3.8" stroke-width=".7"/></g>`;
  const star = (x, y, r = 3) => `<path d="M${x} ${y - r}L${f1(x + r * .22)} ${f1(y - r * .22)}L${x + r} ${y}L${f1(x + r * .22)} ${f1(y + r * .22)}L${x} ${y + r}L${f1(x - r * .22)} ${f1(y + r * .22)}L${x - r} ${y}L${f1(x - r * .22)} ${f1(y - r * .22)}Z" fill="currentColor" stroke="none"/>`;
  const moth = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0-14C-3.2-11-3.2 12 0 17C3.2 12 3.2-11 0-14Z" fill="currentColor" fill-opacity=".22"/>
    <path d="M-1.5-8C-12-21-31-21-31-8C-31 1-16 4-1.5 0"/><path d="M1.5-8C12-21 31-21 31-8C31 1 16 4 1.5 0"/>
    <path d="M-1.5 2C-11 4-21 12-17 20C-13 25-5 17-1.5 8"/><path d="M1.5 2C11 4 21 12 17 20C13 25 5 17 1.5 8"/>
    <circle cx="-18" cy="-8.5" r="3.6"/><circle cx="18" cy="-8.5" r="3.6"/>
    <circle cx="-18" cy="-8.5" r="1.2" fill="currentColor"/><circle cx="18" cy="-8.5" r="1.2" fill="currentColor"/>
    <path d="M-25-13C-18-15-10-12-4-6M25-13C18-15 10-12 4-6M-12 10C-9 8-6 6-3 4M12 10C9 8 6 6 3 4" stroke-width=".6"/>
    <path d="M-1-14C-4-20-8-23-13-23M1-14C4-20 8-23 13-23"/></g>`;
  const moon = (cx, cy, r, f) => {
    let lit = '';
    if (Math.abs(f - .5) < .01) lit = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" fill-opacity=".45" stroke="none"/>`;
    else if (f > .01 && f < .99) {
      const wax = f < .5, cres = Math.abs(f - .5) > .25;
      const rx = f1(Math.abs(Math.cos(2 * Math.PI * f)) * r);
      lit = `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 ${wax ? 1 : 0} ${cx} ${cy + r}A${rx} ${r} 0 0 ${wax ? (cres ? 0 : 1) : (cres ? 1 : 0)} ${cx} ${cy - r}Z" fill="currentColor" fill-opacity=".45" stroke="none"/>`;
    }
    return lit + `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  };
  const crescent = (x, y, r) => `<path d="M${x + r * .35} ${y - r}A${r} ${r} 0 1 0 ${x + r * .35} ${y + r}A${f1(r * .78)} ${f1(r * .78)} 0 1 1 ${x + r * .35} ${y - r}Z" fill="currentColor" fill-opacity=".3"/>`;
  const sprig = (x, y, h, lean = 10) => {
    let s = `<path d="M${x} ${y}C${x + 2} ${y - h * .4} ${x + lean * .5} ${y - h * .75} ${x + lean} ${y - h}"/>`;
    for (let i = 0; i < 9; i++) {
      const t = .35 + i * .075, px = f1(x + lean * t * t), py = f1(y - h * t);
      s += `<ellipse cx="${f1(px - 3)}" cy="${py}" rx="2.6" ry="1.5" transform="rotate(-35 ${f1(px - 3)} ${py})"/><ellipse cx="${f1(px + 3)}" cy="${f1(py - 1)}" rx="2.6" ry="1.5" transform="rotate(35 ${f1(px + 3)} ${f1(py - 1)})"/>`;
    }
    return s;
  };

  const bouquet = svg('0 0 340 160', `
    ${crescent(54, 44, 18)}${star(88, 28, 3.4)}${star(30, 76, 2.6)}${star(98, 62, 2)}${star(300, 104, 2.6)}${star(250, 20, 2)}
    <path d="M152 104h36"/><path d="M156 104C140 116 140 136 162 144M184 104C200 116 200 136 178 144"/>
    <path d="M162 144h16M160 150h20M162 144l-2 6M178 144l2 6M154 155h32M160 150l-6 5M180 150l6 5"/>
    <path d="M147 116Q170 123 193 116" stroke-width=".8"/><path d="M188 112l3 4M190 120l3 4M190 128l2 4M187 136l2 3M184 141l2 2" stroke-width=".7"/>
    <path d="M164 104C158 86 146 70 133 58M170 104C171 82 172 60 170 42M176 104C184 86 198 72 212 64M160 104C138 100 118 108 104 124M180 104C204 100 226 110 238 128"/>
    <path d="M128 52m-2 0a2 2 0 1 1 4 0a5 5 0 1 1-10 0a8 7.5 0 1 1 16 .5a11 10 0 1 1-22-.5"/><path d="M115 50C112 40 122 35 128 39C134 35 145 40 141 50" stroke-width=".8"/>
    <path d="M156 37C150 25 160 15 166 21C168 13 178 15 178 21C186 17 193 29 184 37C178 43 162 43 156 37Z"/><path d="M162 31C164 25 176 25 178 31M166 35C168 31 174 31 176 35" stroke-width=".8"/>
    <path d="M208 66C204 54 208 46 212 44L216 52L220 44C226 46 228 54 224 66C220 70 212 70 208 66Z"/>
    <path d="M104 124C98 122 94 128 98 134C102 136 106 130 104 124Z" fill="currentColor" fill-opacity=".25"/>
    ${leaf(152, 84, 200, .9)}${leaf(171, 70, -70, .85)}${leaf(192, 84, -25, .9)}${leaf(124, 110, 160, .8)}${leaf(220, 112, 30, .8)}${leaf(236, 127, 70, .65)}
    <ellipse cx="252" cy="150" rx="5" ry="2.4" transform="rotate(-20 252 150)"/>
    ${moth(290, 50, .95)}`, 'art-bouquet');

  const phases = [.1, .22, .36, .5, .64, .78, .9];
  const moons = svg('0 0 340 150', `
    ${phases.map((f, i) => moon(34 + i * 45, f1(76 - 24 * Math.sin(Math.PI * i / 6)), 15, f)).join('')}
    <path d="M20 122H320" stroke-width=".8"/><path d="M20 127H320" stroke-width=".5"/>
    ${phases.map((_, i) => `<circle cx="${34 + i * 45}" cy="124.5" r="1.6" fill="currentColor" stroke="none"/>`).join('')}
    ${star(60, 26, 3)}${star(286, 26, 3)}${star(170, 18, 2.2)}${star(118, 34, 1.8)}${star(226, 36, 1.8)}${star(14, 46, 2)}${star(328, 50, 2)}`, 'art-moons');

  const quill = svg('0 0 340 150', `
    <path d="M86 140h56q4 0 4-4v-12q0-10-14-12h-28q-14 2-14 12v12q0 4 4 4z"/><path d="M100 112v-7h28v7M97 105h34"/>
    <path d="M138 118l3 4M140 126l3 4M138 133l2 3" stroke-width=".7"/><ellipse cx="114" cy="103" rx="9" ry="2" stroke-width=".7"/>
    <path d="M112 104C150 70 210 38 286 12"/>
    <path d="M286 12C262 18 222 34 190 54C172 66 158 78 148 88C172 82 206 70 232 54C256 38 274 24 286 12Z"/>
    ${[...Array(9)].map((_, i) => { const t = .22 + i * .085, x = 112 + 174 * t, y = 104 - 92 * t - 10 * Math.sin(Math.PI * t); return `<path d="M${f1(x)} ${f1(y)}l${f1(-10 + i * .6)} ${f1(8 - i * .3)}" stroke-width=".55"/>`; }).join('')}
    <ellipse cx="238" cy="140" rx="24" ry="6"/><path d="M214 140v-7M262 140v-7"/><ellipse cx="238" cy="133" rx="24" ry="6"/><path d="M214 133v-7M262 133v-7"/><ellipse cx="238" cy="126" rx="24" ry="6"/>
    <circle cx="288" cy="124" r="15"/><circle cx="288" cy="124" r="11" stroke-width=".7"/><path d="M292 118a6 6 0 1 0 0 12M282 122.5h7M282 125.5h7" stroke-width=".9"/>
    ${star(50, 40, 3)}${star(30, 90, 2.2)}${star(318, 70, 2.2)}${star(196, 104, 1.8)}`, 'art-quill');

  const needlesArt = [-20, -7, 6].map((a) => `<g transform="rotate(${a} 262 146)"><rect x="257" y="62" width="10" height="46" rx="2"/><path d="M257 72h10M257 79h10M257 86h10" stroke-width=".7"/><path d="M262 108v30"/><path d="M262 62v-8" stroke-width=".8"/><circle cx="262" cy="52" r="2" stroke-width=".8"/></g>`).join('');
  const jar = svg('0 0 340 150', `
    <circle cx="160" cy="31" r="5"/><path d="M137 36h46v10h-46z"/><path d="M142 46v8M178 46v8"/>
    <path d="M142 54C120 58 118 74 118 84V128Q118 140 130 140H190Q202 140 202 128V84C202 74 200 58 178 54"/>
    <rect x="133" y="82" width="54" height="34" rx="2"/><rect x="137" y="86" width="46" height="26" rx="1" stroke-width=".6"/>
    <path d="M144 95h32M148 103h24" stroke-width=".8"/><path d="M196 86v38M193 80v48" stroke-width=".6"/>
    ${needlesArt}
    ${sprig(64, 144, 104, 16)}${sprig(84, 144, 78, -10)}
    ${star(232, 28, 2.6)}${star(306, 36, 2.2)}${star(100, 26, 2.2)}${star(30, 60, 2)}`, 'art-jar');

  let rose = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 - 90) * Math.PI / 180, L = i % 2 ? 36 : 64, w = i % 2 ? 6 : 9;
    const tx = 190 + Math.cos(a) * L, ty = 76 + Math.sin(a) * L;
    const lx = 190 + Math.cos(a - Math.PI / 2) * w, ly = 76 + Math.sin(a - Math.PI / 2) * w;
    const rx = 190 + Math.cos(a + Math.PI / 2) * w, ry = 76 + Math.sin(a + Math.PI / 2) * w;
    rose += `<path d="M190 76L${f1(tx)} ${f1(ty)}L${f1(lx)} ${f1(ly)}Z" fill="currentColor" fill-opacity=".4"/><path d="M190 76L${f1(tx)} ${f1(ty)}L${f1(rx)} ${f1(ry)}Z"/>`;
  }
  let ticks = '';
  for (let i = 0; i < 48; i++) { const a = i * 7.5 * Math.PI / 180, r1 = i % 6 ? 53 : 50; ticks += `<path d="M${f1(190 + Math.cos(a) * r1)} ${f1(76 + Math.sin(a) * r1)}L${f1(190 + Math.cos(a) * 57)} ${f1(76 + Math.sin(a) * 57)}" stroke-width=".6"/>`; }
  const compass = svg('0 0 340 150', `
    <circle cx="190" cy="76" r="57"/><circle cx="190" cy="76" r="50" stroke-width=".7"/><circle cx="190" cy="76" r="22" stroke-width=".6"/>${ticks}${rose}<circle cx="190" cy="76" r="2.5" fill="currentColor"/>
    <g transform="rotate(-14 80 116)"><circle cx="52" cy="116" r="12"/><circle cx="52" cy="116" r="5"/><path d="M64 116H126M112 116v8h4v-4h4v6h4v-10"/><path d="M70 112v8M76 112v8" stroke-width=".7"/></g>
    ${star(292, 30, 3)}${star(312, 92, 2.2)}${star(40, 40, 2.4)}${star(104, 30, 1.8)}`, 'art-compass');

  const candle = svg('0 0 120 300', `
    <path d="M60 30C51 44 53 58 60 61C67 58 69 44 60 30Z"/><path d="M60 45C57 51 58 56 60 57C62 56 63 51 60 45Z" fill="currentColor" fill-opacity=".45" stroke="none"/>
    <path d="M60 61v8"/><path d="M50 70h20v88h-20z"/><path d="M50 78q4 9 0 16M70 76q-4 11 0 18" stroke-width=".8"/><path d="M66 82v70" stroke-width=".6"/>
    <path d="M30 158h60M33 158c4 12 50 12 54 0"/>
    <path d="M55 167C49 179 61 187 53 199C47 209 59 217 55 228M65 167C71 179 59 187 67 199C73 209 61 217 65 228"/><ellipse cx="60" cy="199" rx="10" ry="4"/>
    <path d="M55 228C43 234 33 242 29 254h62C87 242 77 234 65 228"/><path d="M24 254h72M28 260h64" />
    ${star(24, 40, 2.6)}${star(98, 60, 2)}${star(90, 18, 1.8)}`, 'art-candle');

  const night = svg('0 0 140 300', `
    ${crescent(76, 46, 22)}${star(30, 30, 3)}${star(116, 84, 2.4)}${star(24, 110, 2)}${star(110, 22, 1.8)}
    ${moth(70, 156, 1.45)}
    ${sprig(58, 290, 70, 10)}${sprig(80, 290, 56, -8)}${star(112, 240, 2.2)}`, 'art-night');

  const mothSmall = svg('-34 -26 68 52', moth(0, 0, 1), 'art-moth');

  // Timbre-poste dentelé + oblitération (écran d'entrée)
  let bites = '';
  for (let i = 0; i <= 10; i++) { const x = 4 + i * 9.2; bites += `<circle cx="${f1(x)}" cy="4" r="2.6"/><circle cx="${f1(x)}" cy="116" r="2.6"/>`; }
  for (let i = 0; i <= 12; i++) { const y = 4 + i * 9.333; bites += `<circle cx="4" cy="${f1(y)}" r="2.6"/><circle cx="96" cy="${f1(y)}" r="2.6"/>`; }
  const stamp = (date) => `<svg class="art stamp" viewBox="-30 0 130 128" aria-hidden="true" focusable="false">
    <defs><mask id="pc-perf"><rect x="0" y="0" width="100" height="120" fill="#ffffff"/><g fill="#000000">${bites}</g></mask></defs>
    <rect x="0" y="0" width="100" height="120" fill="#f6f0ff" mask="url(#pc-perf)"/>
    <rect x="10" y="10" width="80" height="100" fill="#5c24be"/>
    <rect x="14" y="14" width="72" height="92" fill="none" stroke="#d2bbfb" stroke-opacity=".7" stroke-width=".8"/>
    <g fill="none" stroke="#f0e7ff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${moth(50, 60, .95)}</g>
    <text x="50" y="27" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="8.5" letter-spacing="1" fill="#f0e7ff">PRETTYCREA</text>
    <text x="50" y="100" text-anchor="middle" font-family="'Special Elite', monospace" font-size="8" fill="#f0e7ff">poste privée</text>
    <g fill="none" stroke="#261642" stroke-opacity=".62" stroke-width="1.3">
      <circle cx="14" cy="96" r="25"/><circle cx="14" cy="96" r="20" stroke-width=".7"/>
      <path d="M-28 70q8-5 16 0t16 0t16 0t16 0t16 0M-28 78q8-5 16 0t16 0t16 0t16 0t16 0M-28 86q8-5 16 0t16 0t16 0"/>
    </g>
    <text x="14" y="99" text-anchor="middle" font-family="'Special Elite', monospace" font-size="8.5" fill="#261642" fill-opacity=".72">${date}</text>
  </svg>`;

  return { bouquet, moons, quill, jar, compass, candle, night, moth: mothSmall, stamp };
})();
window.PC_ART = ART;

/* =========================================================
   Chiffrement & stockage (tout reste dans le navigateur)
   ========================================================= */
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const PBKDF2_ITER = 310000;

async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal(key, salt, iter, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { app: 'prettycrea', v: 1, iter, salt: b64(salt), iv: b64(iv), data: b64(ct), savedAt: new Date().toISOString() };
}
async function unseal(key, blob) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.data));
  return JSON.parse(dec.decode(pt));
}

const kv = {
  db: null,
  async open() {
    if (this.db !== null) return this.db;
    this.db = await new Promise((resolve) => {
      try {
        const req = indexedDB.open('prettycrea', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
    return this.db;
  },
  async tx(mode, fn) {
    const db = await this.open();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const t = db.transaction('kv', mode);
      const r = fn(t.objectStore('kv'));
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = () => reject(t.error);
    });
  },
  async get(k) {
    const db = await this.open();
    if (db) return this.tx('readonly', (s) => s.get(k));
    try { const v = localStorage.getItem('prettycrea.' + k); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  async set(k, v) {
    const db = await this.open();
    if (db) return this.tx('readwrite', (s) => s.put(v, k));
    localStorage.setItem('prettycrea.' + k, JSON.stringify(v));
  },
  async del(k) {
    const db = await this.open();
    if (db) return this.tx('readwrite', (s) => s.delete(k));
    try { localStorage.removeItem('prettycrea.' + k); } catch {}
  },
};

const DEMO_KEY = 'prettycrea.demo.v2';
const PREFS_KEY = 'prettycrea.prefs.v2';
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

/* =========================================================
   État
   ========================================================= */
const DEFAULT_SETTINGS = {
  urssafRate: 25.6,
  urssafBase: 'brut',      // 'brut' = sur tout l'encaissé · 'apres-shop' = après la part du shop
  shopRate: 30,
  shopBase: 'total',       // 'total' = 30 % du prix du projet · 'solde' = 30 % du paiement final seulement
  dayStart: 9,
  dayEnd: 20,
  defaultTime: '10:00',
  defaultDuration: 3,
  defaultRemind: 3,
  defaultMethod: 'paypal',
  ambiance: 'parchemin',
  font: 'lisible',
  orn: 'riche',
  size: 'm',
  motion: 'douce',
  autoLock: 15,
  autoNeedle: false,
  calView: '',
  profileName: '',
  profilePhoto: '',
  notifDaily: true,
  notifHour: '08:30',
  notifBefore: 0,
  notifDetail: 'discret',
};

const APP = {
  mode: null,            // 'demo' | 'private'
  state: null,
  key: null, salt: null, iter: PBKDF2_ITER,
  saveTimer: null, lockTimer: null,
  route: 'bibliotheque',
  cal: { view: null, cursor: null },
  finMonth: null,
  quote: null, showFr: false,
  pendingImport: null,
};

function newItem(o = {}) {
  return { id: uid(), name: 'Aiguilles', unit: 'aiguilles', qty: 0, base: 0, perProject: 1, deliveryDays: 7, alertAt: 10, ...o };
}
function emptyState() {
  return { v: 2, projects: [], clients: [], requests: [], rest: {}, tomb: {}, settingsAt: 0, inventory: { items: [newItem({ updatedAt: Date.now() })], log: [] }, settings: { ...DEFAULT_SETTINGS } };
}
function normProject(p) {
  p.client = { name: '', instagram: '', other: '', ...(p.client || {}) };
  p.deposit = { enabled: false, amount: 0, due: '', paidOn: '', ...(p.deposit || {}) };
  p.final = { paidOn: '', ...(p.final || {}) };
  p.sketch = { due: '', remindDays: null, remindDate: '', remindTime: '', sent: false, ...(p.sketch || {}) };
  p.status ||= 'prevu';
  p.method ||= 'paypal';
  p.duration = num(p.duration) || 3;
  p.price = num(p.price);
  p.updatedAt = p.updatedAt || 0;
  return p;
}
function normalize(s) {
  s = s && typeof s === 'object' ? s : emptyState();
  s.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
  if (!['lisible', 'livre'].includes(s.settings.font)) s.settings.font = 'lisible';
  if (!['parchemin', 'nuit'].includes(s.settings.ambiance)) s.settings.ambiance = 'parchemin';
  s.projects = (s.projects || []).map(normProject);
  // Jours de repos : { 'AAAA-MM-JJ': { on, at } } (l'ancien format liste est converti)
  if (!s.rest) { s.rest = {}; (s.restDays || []).forEach((d) => { s.rest[d] = { on: true, at: 0 }; }); }
  delete s.restDays;
  s.tomb = s.tomb || {};
  s.clients = (s.clients || []).map((c) => ({ name: '', instagram: '', other: '', notes: '', createdAt: '', updatedAt: 0, ...c }));
  s.requests = (s.requests || []).map((r) => ({ name: '', instagram: '', idea: '', placement: '', size: '', budget: '', wanted: '', notes: '', status: 'nouvelle', projectId: '', clientId: '', createdAt: new Date().toISOString(), updatedAt: 0, ...r }));
  // Chaque projet est rattaché à une fiche cliente (identifiant stable, le même sur tous les appareils).
  for (const p of s.projects) if (!p.clientId && (p.client.name || p.client.instagram)) p.clientId = ensureClientIn(s, p.client).id;
  s.settingsAt = s.settingsAt || 0;
  s.inventory = s.inventory || { items: [], log: [] };
  s.inventory.log = (s.inventory.log || []).map((l) => ({ at: 0, ...l }));
  s.inventory.items = (s.inventory.items || []).map((i) => {
    const it = { ...newItem(), updatedAt: 0, ...i };
    // Le stock se calcule depuis l'historique : deux appareils peuvent ajouter/retirer sans s'écraser.
    if (typeof it.base !== 'number' || Number.isNaN(it.base)) it.base = num(it.qty) - s.inventory.log.filter((l) => l.itemId === it.id).reduce((t, l) => t + num(l.delta), 0);
    return it;
  });
  recomputeStock(s);
  s.v = 2;
  return s;
}
const S = () => APP.state.settings;

/* ---------- Fiches clientes ---------- */
function hashKey(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
function ensureClientIn(s, info, touch = false) {
  const name = String(info.name || '').trim(), ig = String(info.instagram || '').replace(/^@+/, '').trim();
  const low = (x) => String(x || '').trim().toLowerCase();
  let c = (ig && s.clients.find((x) => low(x.instagram) === low(ig))) || (name && s.clients.find((x) => low(x.name) === low(name) && (!ig || !x.instagram)));
  if (!c) {
    c = { id: 'cl_' + hashKey(ig ? 'ig:' + low(ig) : 'nm:' + low(name)), name, instagram: ig, other: info.other || '', notes: '', createdAt: new Date().toISOString(), updatedAt: touch ? Date.now() : 0 };
    const twin = s.clients.find((x) => x.id === c.id);
    if (twin) return twin;
    s.clients.push(c);
  } else if (touch && ((ig && !c.instagram) || (info.other && !c.other))) {
    if (ig && !c.instagram) c.instagram = ig;
    if (info.other && !c.other) c.other = info.other;
    c.updatedAt = Date.now();
  }
  return c;
}
const clientById = (id) => APP.state.clients.find((c) => c.id === id);
const projectsOfClient = (c) => APP.state.projects.filter((p) => p.clientId === c.id);

/* ---------- Projets en plusieurs séances ---------- */
function sessionsOf(p) {
  if (!p.groupId) return [p];
  const all = APP.state.projects.filter((x) => x.groupId === p.groupId);
  if (!all.some((x) => x.id === p.id)) all.push(p);
  return all.sort(byDateTime);
}
function sessionInfo(p) {
  const all = sessionsOf(p);
  return all.length < 2 ? null : { n: all.length, i: all.findIndex((x) => x.id === p.id) + 1, all };
}
/* Rappel de croquis : X jours avant le rendu, ou à une date précise, à l'heure choisie. */
function sketchRemindOn(p) {
  const k = p.sketch;
  if (!k.due || k.sent) return null;
  if (k.remindDate) return k.remindDate;
  if (k.remindDays === null || k.remindDays === '') return null;
  return addDays(k.due, -Number(k.remindDays));
}
const sketchRemindTime = (p) => p.sketch.remindTime || S().notifHour || '08:30';
function recomputeStock(s = APP.state) {
  for (const it of s.inventory.items) {
    it.qty = Math.max(0, Math.round(it.base + s.inventory.log.filter((l) => l.itemId === it.id).reduce((t, l) => t + num(l.delta), 0)));
  }
}

/* ---------- Requêtes métier ---------- */
const byDateTime = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const active = () => APP.state.projects.filter((p) => p.status !== 'annule');
const projectsOn = (d) => APP.state.projects.filter((p) => p.date === d).sort(byDateTime);
const activeOn = (d, excludeId) => active().some((p) => p.date === d && p.id !== excludeId);
const sketchesOn = (d) => active().filter((p) => p.sketch.due === d && !p.sketch.sent);
const upcoming = () => active().filter((p) => p.status === 'prevu' && (p.date > today() || (p.date === today() && tMin(endTime(p)) >= nowMin()))).sort(byDateTime);
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const findP = (id) => APP.state.projects.find((p) => p.id === id);
const clientLabel = (p) => p.client.name || 'Cliente sans prénom';
const projLabel = (p) => { const si = APP.state ? sessionInfo(p) : null; return (p.title || 'Projet sans titre') + (si ? ` · séance ${si.i}/${si.n}` : ''); };
const isRestMarked = (d) => !!(APP.state.rest[d] && APP.state.rest[d].on);
const methodLabel = (m) => (m === 'virement' ? 'Virement' : 'PayPal');

const finalAmount = (p) => Math.max(0, round2(p.price - (p.deposit.enabled ? p.deposit.amount : 0)));

/** Liste des paiements d'un projet (acompte éventuel + paiement final). */
function paymentsOf(p) {
  const out = [];
  if (p.deposit.enabled && p.deposit.amount > 0) {
    // Un acompte reçu reste acquis même si le projet est annulé.
    if (p.status !== 'annule' || p.deposit.paidOn) {
      out.push({ kind: 'deposit', p, amount: p.deposit.amount, due: p.deposit.due || p.date, paidOn: p.deposit.paidOn });
    }
  }
  if (p.status !== 'annule' && finalAmount(p) > 0) {
    out.push({ kind: 'final', p, amount: finalAmount(p), due: p.date, paidOn: p.final.paidOn });
  }
  return out;
}
const allPayments = () => APP.state.projects.flatMap(paymentsOf);
const shopCutFor = (pay) => (pay.kind !== 'final' ? 0 : round2((S().shopRate / 100) * (S().shopBase === 'solde' ? pay.amount : pay.p.price)));

/** Résumé d'un mois. withPending = simulation « si tout ce qui est prévu ce mois est reçu ». */
function monthSummary(mk, withPending = false) {
  let gross = 0, dep = 0, fin = 0, shop = 0, nFinal = 0;
  for (const pay of allPayments()) {
    const date = pay.paidOn || (withPending ? pay.due : '');
    if (!date || monthKey(date) !== mk) continue;
    gross += pay.amount;
    if (pay.kind === 'deposit') dep += pay.amount;
    else { fin += pay.amount; shop += shopCutFor(pay); nFinal++; }
  }
  const base = S().urssafBase === 'apres-shop' ? gross - shop : gross;
  const urssaf = round2(Math.max(0, base) * S().urssafRate / 100);
  return { gross: round2(gross), dep: round2(dep), fin: round2(fin), shop: round2(shop), urssaf, net: round2(gross - shop - urssaf), nFinal };
}

/** Repos : en plus du dimanche, il faut au moins un jour sans rendez-vous du lundi au samedi. */
function restInfo(ws, extra) {
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const busy = (d) => activeOn(d, extra && extra.excludeId) || (extra && extra.date === d);
  const free = days.slice(0, 6).filter((d) => !busy(d));
  const sundayBusy = busy(days[6]);
  return { ws, days, free, sundayBusy, ok: free.length >= 1 && !sundayBusy };
}
function restMessage(info) {
  const parts = [];
  if (info.free.length === 0) parts.push('pas encore de jour libre en plus du dimanche');
  if (info.sundayBusy) parts.push('un rendez-vous tombe un dimanche');
  return `Semaine du ${fmtLong(info.ws)} : ${parts.join(' et ')}. Garde-toi deux jours de repos : tu peux en protéger un depuis la vue Jour.`;
}

/** Prévision de stock pour un article consommé par projet. */
function weeklyRate() {
  const t = today();
  const past = active().filter((p) => p.date < t && p.date >= addDays(t, -56)).length / 8;
  const next = active().filter((p) => p.date >= t && p.date < addDays(t, 28)).length / 4;
  return Math.max(past, next);
}
function forecast(item) {
  const c = item.perProject || 0;
  const t = today();
  const up = active().filter((p) => p.status === 'prevu' && p.date >= t).sort(byDateTime);
  if (c <= 0) return { status: item.qty <= item.alertAt ? 'soon' : 'ok', runout: null, orderBy: null, up: up.length, covers: Infinity, basis: 'none' };
  const covers = Math.floor(item.qty / c);
  let runout = null, basis = 'none', shortFor = null;
  if (covers < up.length) { shortFor = up[covers]; runout = shortFor.date; basis = 'scheduled'; }
  else {
    const left = item.qty - up.length * c;
    const r = weeklyRate();
    if (r > 0) {
      const from = up.length ? up[up.length - 1].date : t;
      runout = addDays(from, Math.max(1, Math.floor((left / (c * r)) * 7)));
      basis = 'estimate';
    }
  }
  const orderBy = runout ? addDays(runout, -(num(item.deliveryDays) + 2)) : null;
  let status = 'ok';
  if (item.qty <= 0 || (orderBy && orderBy <= t)) status = 'now';
  else if (item.qty <= item.alertAt || (orderBy && diffDays(t, orderBy) <= 7)) status = 'soon';
  return { status, runout, orderBy, up: up.length, covers, basis, shortFor };
}
const needles = () => APP.state.inventory.items[0];

/** Rappels à afficher (croquis, paiements, repos, stock). */
function reminders() {
  const t = today();
  const out = [];
  for (const p of active()) {
    const sk = p.sketch;
    const on = sketchRemindOn(p);
    if (on && t >= on) {
      const n = diffDays(t, sk.due);
      out.push({ rank: n, level: n < 0 ? 'late' : 'soon', icon: 'pencil', id: p.id,
        title: `Croquis pour ${clientLabel(p)}`, sub: n < 0 ? `En retard : prévu le ${fmtLong(sk.due)}` : `À envoyer ${rel(n)} (${fmtShort(sk.due)})` });
    }
  }
  for (const pay of allPayments()) {
    if (pay.paidOn || pay.p.status === 'annule') continue;
    const n = diffDays(t, pay.due);
    if (pay.kind === 'deposit' && n <= 3) {
      out.push({ rank: n, level: n < 0 ? 'late' : 'soon', icon: 'euro', id: pay.p.id, kind: 'deposit', amt: money(pay.amount),
        title: `Acompte de ${clientLabel(pay.p)}`, sub: n < 0 ? `Attendu depuis le ${fmtLong(pay.due)}` : `Attendu ${rel(n)}` });
    } else if (pay.kind === 'final' && n < 0) {
      out.push({ rank: n, level: 'late', icon: 'euro', id: pay.p.id, kind: 'final', amt: money(pay.amount),
        title: `Paiement final de ${clientLabel(pay.p)}`, sub: 'Pas encore noté comme reçu' });
    }
  }
  const nouv = APP.state.requests.filter((r) => r.status === 'nouvelle');
  if (nouv.length) out.push({ rank: 0.5, level: 'soon', icon: 'inbox', action: 'client-tab', view: 'demandes', title: nouv.length > 1 ? `${nouv.length} nouvelles demandes de projet` : `Nouvelle demande de ${nouv[0].name}`, sub: 'À lire dans Clientes' });
  const ws = startOfWeek(t);
  for (const w of [ws, addDays(ws, 7)]) {
    const info = restInfo(w);
    if (!info.ok) out.push({ rank: diffDays(t, w), level: 'warn', icon: 'moon', date: w, title: `Repos : semaine du ${fmtLong(w)}`, sub: restMessage(info) });
  }
  const it = needles();
  if (it) {
    const f = forecast(it);
    if (f.status !== 'ok') out.push({ rank: f.status === 'now' ? -99 : 5, level: f.status === 'now' ? 'late' : 'soon', icon: 'needle',
      title: `Commander des ${it.name.toLowerCase()}`, sub: f.status === 'now' ? `Il en reste ${it.qty}` : f.orderBy ? `Avant le ${fmtLong(f.orderBy)}` : 'Bientôt' });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

/* =========================================================
   Sauvegarde
   ========================================================= */
function save() {
  if (SYNC.email) SYNC.rev++;
  clearTimeout(APP.saveTimer);
  setSaveStatus('saving');
  APP.saveTimer = setTimeout(persist, 300);
}
async function persist() {
  try {
    if (APP.mode === 'demo') {
      if (!lsSet(DEMO_KEY, APP.state)) { setSaveStatus('session'); return; }
    } else if (APP.mode === 'private' && APP.key && SYNC.email) {
      await persistLocal();
      setSaveStatus('saved');
      if (SYNC.on) { setSync(navigator.onLine ? 'pending' : 'offline'); scheduleSync(); }
      return;
    } else if (APP.mode === 'private' && APP.key) {
      await kv.set('vault', await seal(APP.key, APP.salt, APP.iter, APP.state));
    }
    setSaveStatus('saved');
  } catch (e) {
    console.error(e);
    setSaveStatus('error');
  }
}
function setSaveStatus(s) {
  const el = $('#save-status');
  if (!el) return;
  el.classList.toggle('err', s === 'error');
  el.innerHTML = s === 'saving' ? 'Enregistrement…'
    : s === 'error' ? `${icon('alert')} Non enregistré`
    : s === 'session' ? 'Gardé pour cette visite'
    : `${icon('check')} Enregistré`;
}
function savePrefs() {
  const s = S();
  lsSet(PREFS_KEY, { ambiance: s.ambiance, font: s.font, size: s.size, motion: s.motion, orn: s.orn });
}
function applyDisplay(s = APP.state ? S() : (lsGet(PREFS_KEY) || DEFAULT_SETTINGS)) {
  const r = document.documentElement;
  r.dataset.ambiance = s.ambiance || 'parchemin';
  r.dataset.font = s.font || 'lisible';
  r.dataset.orn = s.orn || 'riche';
  r.dataset.size = s.size || 'm';
  r.dataset.motion = s.motion || 'douce';
}

/* =========================================================
   Données de démonstration (dates relatives à aujourd'hui)
   ========================================================= */
function seedDemo() {
  const s = emptyState();
  const t = today();
  const ws = startOfWeek(t);
  const d = (w, wd) => addDays(ws, w * 7 + wd);
  const mk = (w, wd, time, dur, name, insta, title, price, dep, method, extra = {}) => {
    const date = d(w, wd);
    const past = date < t;
    const p = normProject({
      id: uid(), title, date, time, duration: dur, price, method,
      status: past ? 'fait' : 'prevu',
      client: { name, instagram: insta, other: '' },
      deposit: dep ? { enabled: true, amount: dep, due: addDays(date, -21), paidOn: addDays(date, -20) } : { enabled: false, amount: 0, due: '', paidOn: '' },
      final: { paidOn: past ? date : '' },
      sketch: { due: addDays(date, -4), remindDays: 2, sent: date < addDays(t, 8) },
      notes: '', photo: '',
      ...extra,
    });
    s.projects.push(p);
    return p;
  };
  mk(-4, 1, '10:00', 3, 'Emma', 'emma.inkdreams', 'Pivoines et dague, avant-bras', 380, 100, 'paypal', { notes: 'Fine line, ombrages légers. Retouche offerte à 1 mois.' });
  mk(-3, 3, '14:00', 2, 'Jade', 'jade.moonchild', 'Lune et fougères, cheville', 220, 0, 'virement');
  mk(-2, 2, '10:00', 4, 'Léna', 'lena.reads', 'Serpent et roses, mollet', 520, 150, 'virement', { notes: 'Grande pièce, prévoir une pause à mi-séance.' });
  mk(-1, 1, '15:00', 3, 'Inès', 'ines.noctua', 'Papillon de nuit, sternum', 420, 120, 'paypal');
  mk(-1, 4, '11:00', 2.5, 'Chloé', 'chloe.grimoire', 'Clé ancienne, poignet', 180, 60, 'paypal');
  mk(0, 0, '10:00', 4, 'Manon', 'manon.wildflower', 'Bouquet sauvage, omoplate', 450, 150, 'virement');
  mk(0, 2, '14:00', 2, 'Sarah', 'sarah.phases', 'Phases de lune, nuque', 160, 0, 'paypal');
  const cam = mk(0, 4, '15:00', 3.5, 'Camille', 'camille.ravenbook', 'Corbeau sur grimoire, épaule', 480, 150, 'paypal',
    { notes: 'Elle veut des plumes qui débordent sur la clavicule. Apporter la version 2 du croquis.' });
  if (cam.date <= t) cam.status = cam.date < t ? 'fait' : 'prevu';
  // Semaine prochaine : complète du lundi au samedi → avertissement repos
  mk(1, 0, '10:00', 3, 'Alice', 'alice.inwonderink', 'Théière et lapin, mollet', 340, 100, 'paypal', { sketch: { due: addDays(t, 1), remindDays: 2, sent: false } });
  mk(1, 1, '14:00', 2, 'Louise', 'louise.botanica', 'Branche d’olivier, avant-bras', 200, 0, 'virement');
  mk(1, 2, '10:30', 3, 'Zoé', 'zoe.darkacademia', 'Bibliothèque en arche, bras', 460, 140, 'paypal',
    { deposit: { enabled: true, amount: 140, due: addDays(t, -1), paidOn: '' }, sketch: { due: addDays(t, 2), remindDays: 1, sent: false } });
  mk(1, 3, '13:00', 2, 'Margaux', 'margaux.fae', 'Ailes de fée, nuque', 190, 60, 'paypal');
  mk(1, 4, '11:00', 3, 'Nina', 'nina.thorns', 'Couronne d’épines, cuisse', 390, 120, 'virement');
  mk(1, 5, '10:00', 2, 'Rose', 'rose.quill', 'Plume et encrier, poignet', 170, 0, 'paypal');
  mk(2, 1, '14:00', 2.5, 'Agathe', 'agathe.stars', 'Constellation, clavicule', 210, 60, 'paypal');
  mk(2, 3, '10:00', 5, 'Élise', 'elise.wyvern', 'Dragon lové, avant-bras', 650, 200, 'virement',
    { deposit: { enabled: true, amount: 200, due: addDays(t, 4), paidOn: '' }, sketch: { due: d(2, 0), remindDays: 7, sent: false } });
  // Grande pièce en deux séances (même projet, même cliente)
  const ely = s.projects[s.projects.length - 1];
  ely.groupId = ely.id;
  mk(5, 1, '10:00', 4, 'Élise', 'elise.wyvern', 'Dragon lové, avant-bras', 450, 0, 'virement',
    { groupId: ely.id, sketch: { due: '', remindDays: null, sent: false }, notes: 'Séance 2 : couleur et ombrages.' });
  mk(3, 2, '15:00', 3, 'Mila', 'mila.gothrose', 'Rose gothique, cuisse', 350, 100, 'paypal', { deposit: { enabled: true, amount: 100, due: d(2, 2), paidOn: '' } });
  mk(5, 4, '11:00', 2, 'Ophélie', 'ophelie.letters', 'Lettrage ancien, côtes', 260, 0, 'virement');
  const ago = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const rq = (n, name, insta, idea, extra = {}) => s.requests.push({ id: uid(), status: 'nouvelle', createdAt: ago(n), updatedAt: Date.now() - n * 864e5,
    name, instagram: insta, idea, placement: '', size: '', budget: '', wanted: '', notes: '', projectId: '', clientId: '', ...extra });
  rq(0, 'Lou', 'lou.nightshade', 'Chauve-souris et lune croissante', { placement: 'Derrière l’oreille', size: '5 cm', budget: '120 €' });
  rq(2, 'Anaïs', 'anais.folklore', 'Renard et champignons, style conte', { placement: 'Mollet', wanted: 'Avant l’été', notes: 'A envoyé 3 références sur Instagram.' });
  rq(5, 'Jade', 'jade.moonchild', 'Rajouter des étoiles autour de la lune', { status: 'discussion', placement: 'Cheville', budget: '80 €' });
  rq(9, 'Capucine', 'capucine.inkwell', 'Épée et lierre le long de la colonne', { status: 'croquis', size: '25 cm', budget: '500 €', wanted: 'Septembre' });
  rq(20, 'Romane', 'romane.ink', 'Portrait réaliste', { status: 'refusee', notes: 'Pas mon style, redirigée vers une collègue.' });
  for (const p of s.projects) p.clientId = ensureClientIn(s, p.client).id;
  for (const r of s.requests) r.clientId = ensureClientIn(s, { name: r.name, instagram: r.instagram, other: '' }).id;
  const emma = s.clients.find((c) => c.instagram === 'emma.inkdreams');
  if (emma) emma.notes = 'Peau réactive : appliquer la crème après chaque séance. Aime le fine line et les fleurs.';
  s.rest = Object.fromEntries([d(0, 3), d(2, 2), d(2, 4)].map((x) => [x, { on: true, at: 0 }]));
  s.inventory.items = [newItem({ qty: 9, alertAt: 10, base: undefined })];
  s.inventory.log = [
    { id: uid(), itemId: s.inventory.items[0].id, date: addDays(t, -30), delta: 25, note: 'Livraison' },
    { id: uid(), itemId: s.inventory.items[0].id, date: addDays(t, -2), delta: -1, note: 'Projet de Sarah' },
  ];
  return s;
}

/* =========================================================
   Synchronisation chiffrée (Supabase)
   ---------------------------------------------------------
   - Une clé de données aléatoire (DEK) chiffre l'état et les photos.
   - La DEK est elle-même chiffrée par une clé tirée du mot de passe (KEK).
   - Le serveur ne reçoit qu'un « secret de connexion » dérivé du mot de passe
     (jamais le mot de passe lui-même) et des blocs chiffrés.
   - Chaque appareil garde une copie chiffrée locale : tout marche hors ligne.
   - Les modifications de plusieurs appareils sont fusionnées élément par élément.
   ========================================================= */
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const TABLE = 'prettycrea_coffres';
const BUCKET = 'prettycrea-photos';
const SYNC_ON = () => !!(window.PC_CONFIG && PC_CONFIG.supabaseUrl && PC_CONFIG.supabaseAnonKey);
const SYNC = { on: false, uid: null, email: null, secret: null, cle: null, secours: null, base: 0, rev: 0, synced: 0, busy: false, timer: null, status: 'idle' };
let SB = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve; s.onerror = () => reject(new Error('script'));
    document.head.appendChild(s);
  });
}
async function sbClient() {
  if (SB) return SB;
  if (!SYNC_ON()) return null;
  if (!window.supabase) await loadScript(SUPABASE_JS);
  SB = window.supabase.createClient(PC_CONFIG.supabaseUrl, PC_CONFIG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'prettycrea.auth' },
  });
  return SB;
}

/* ---------- Clés ---------- */
async function authSecret(email, password) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('prettycrea/auth/v1/' + email.trim().toLowerCase()), iterations: 200000, hash: 'SHA-256' }, base, 256);
  return 'pc1.' + b64(bits).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function newDataKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function wrapKey(dek, kek) {
  const raw = await crypto.subtle.exportKey('raw', dek);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, raw);
  return b64(iv) + '.' + b64(ct);
}
async function unwrapKey(cle, kek) {
  const [iv, ct] = cle.split('.');
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, kek, unb64(ct));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}
const normEmail = (e) => String(e || '').trim().toLowerCase();

/* ---------- Fusion de deux états (plusieurs appareils) ---------- */
function mergeStates(a, b) {
  const out = clone(a);
  const tomb = { ...(a.tomb || {}) };
  for (const [k, v] of Object.entries(b.tomb || {})) tomb[k] = Math.max(tomb[k] || 0, v);
  const mergeList = (la = [], lb = []) => {
    const map = new Map(la.map((x) => [x.id, x]));
    for (const x of lb) {
      const cur = map.get(x.id);
      if (!cur || (x.updatedAt || 0) > (cur.updatedAt || 0)) map.set(x.id, clone(x));
    }
    return [...map.values()].filter((x) => !(tomb[x.id] >= (x.updatedAt || 0)));
  };
  out.tomb = tomb;
  out.projects = mergeList(a.projects, b.projects);
  out.clients = mergeList(a.clients, b.clients);
  out.requests = mergeList(a.requests, b.requests);
  out.inventory.items = mergeList(a.inventory.items, b.inventory.items);
  const logs = new Map((a.inventory.log || []).map((l) => [l.id, l]));
  for (const l of b.inventory.log || []) if (!logs.has(l.id)) logs.set(l.id, l);
  out.inventory.log = [...logs.values()].sort((x, y) => (y.at || 0) - (x.at || 0) || y.date.localeCompare(x.date));
  out.rest = { ...(a.rest || {}) };
  for (const [d, r] of Object.entries(b.rest || {})) if (!out.rest[d] || (r.at || 0) > (out.rest[d].at || 0)) out.rest[d] = r;
  if ((b.settingsAt || 0) > (a.settingsAt || 0)) { out.settings = clone(b.settings); out.settingsAt = b.settingsAt; }
  return out;
}

/* ---------- Copie locale chiffrée ---------- */
async function persistLocal() {
  const blob = await seal(APP.key, APP.salt, APP.iter, APP.state);
  await kv.set('vault', { ...blob, v: 2, email: SYNC.email, uid: SYNC.uid, cle: SYNC.cle, secours: SYNC.secours, base: SYNC.base, dirty: SYNC.rev !== SYNC.synced });
}
function scheduleSync(delay = 1200) {
  if (!SYNC.on) return;
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(syncNow, delay);
}
function setSync(status) {
  SYNC.status = status;
  const el = $('#save-status');
  if (!el) return;
  el.classList.toggle('err', status === 'error' || status === 'key');
  const label = {
    syncing: 'Synchronisation…',
    ok: `${icon('check')} <span>Synchronisé</span>`,
    pending: `${icon('clock')} <span>En attente de synchro</span>`,
    offline: `${icon('clock')} <span>Hors ligne · gardé sur l'appareil</span>`,
    error: `${icon('alert')} <span>Synchro impossible, nouvel essai bientôt</span>`,
    key: `${icon('alert')} <span>Reconnecte-toi pour synchroniser</span>`,
  }[status];
  if (label) el.innerHTML = label;
}

async function syncNow() {
  if (!SYNC.on || APP.mode !== 'private' || !APP.key || SYNC.busy) return;
  if (!navigator.onLine) { setSync('offline'); return; }
  SYNC.busy = true;
  setSync('syncing');
  try {
    const sb = await sbClient();
    let merged = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const startRev = SYNC.rev;
      const { data: row, error } = await sb.from(TABLE).select('version, iv, donnees, sel, iterations, cle, sel_secours, cle_secours').eq('user_id', SYNC.uid).maybeSingle();
      if (error) throw error;
      if (row) {
        // Mot de passe changé sur un autre appareil : la clé des données ne change pas, seule son enveloppe.
        if (row.sel !== b64(APP.salt) || row.cle !== SYNC.cle) { APP.salt = unb64(row.sel); APP.iter = row.iterations; SYNC.cle = row.cle; }
        if (row.cle_secours) SYNC.secours = { sel_secours: row.sel_secours, cle_secours: row.cle_secours };
        if (row.version !== SYNC.base) {
          const remote = normalize(await unseal(APP.key, { iv: row.iv, data: row.donnees }));
          APP.state = normalize(mergeStates(APP.state, remote));
          SYNC.base = row.version;
          merged = true;
        }
      }
      if (row && SYNC.rev === SYNC.synced) break;
      const blob = await seal(APP.key, APP.salt, APP.iter, APP.state);
      if (!row) {
        const { error: e2 } = await sb.from(TABLE).insert({ user_id: SYNC.uid, sel: blob.salt, iterations: blob.iter, cle: SYNC.cle, ...(SYNC.secours || {}), iv: blob.iv, donnees: blob.data, version: 1 });
        if (e2) { if (e2.code === '23505') continue; throw e2; }
        SYNC.base = 1;
      } else {
        const next = row.version + 1;
        const { data: upd, error: e3 } = await sb.from(TABLE).update({ iv: blob.iv, donnees: blob.data, version: next }).eq('user_id', SYNC.uid).eq('version', row.version).select('version');
        if (e3) throw e3;
        if (!upd || !upd.length) continue; // un autre appareil vient d'écrire : on refusionne
        SYNC.base = next;
      }
      SYNC.synced = startRev;
      if (SYNC.rev === startRev) break;
    }
    await persistLocal();
    setSync(SYNC.rev === SYNC.synced ? 'ok' : 'pending');
    if (merged) softRender();
    flushPhotoQueue();
    pushPlan().catch(() => {});
  } catch (e) {
    console.error(e);
    const auth = e && (e.status === 401 || /jwt|token/i.test(e.message || ''));
    setSync(!navigator.onLine ? 'offline' : auth ? 'key' : 'error');
    if (auth && SYNC.secret) connectSync(true);
  } finally {
    SYNC.busy = false;
  }
}
function softRender() {
  const a = document.activeElement;
  if ($('#sheet').open || (a && /INPUT|SELECT|TEXTAREA/.test(a.tagName))) { APP.pendingRender = true; return; }
  render();
}

/* Ouvre la session Supabase en arrière-plan (après déverrouillage local). */
async function connectSync(force = false) {
  try {
    const sb = await sbClient();
    let { data: { session } } = await sb.auth.getSession();
    if (force || !session || normEmail(session.user.email) !== SYNC.email) {
      const { data, error } = await sb.auth.signInWithPassword({ email: SYNC.email, password: SYNC.secret });
      if (error) throw error;
      session = data.session;
    }
    SYNC.uid = session.user.id;
    SYNC.on = true;
    await syncNow();
  } catch (e) {
    console.error(e);
    SYNC.on = true;
    setSync(navigator.onLine ? 'key' : 'offline');
  }
}

/* Connexion « en ligne » : récupère le coffre du serveur (ou en crée un). */
async function openRemote(sb, user, email, pw, secret) {
  const err = $('#unlock-error');
  const member = await sb.rpc('prettycrea_est_membre');
  if (member.error) throw member.error;
  if (!member.data) {
    await sb.auth.signOut();
    APP.lockTab = 'login';
    await renderLock();
    $('#acc-email').value = email;
    $('#unlock-error').innerHTML = `Ton compte <strong>${esc(email)}</strong> existe, mais il n'est pas encore autorisé. Dernière étape : exécuter la ligne « insert into prettycrea_membres » du script SQL avec cette adresse, puis te connecter ici.`;
    return false;
  }
  const { data: row, error } = await sb.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (row) {
    const kek = await deriveKey(pw, unb64(row.sel), row.iterations);
    APP.key = await unwrapKey(row.cle, kek);
    APP.salt = unb64(row.sel); APP.iter = row.iterations;
    APP.state = normalize(await unseal(APP.key, { iv: row.iv, data: row.donnees }));
    SYNC.cle = row.cle; SYNC.base = row.version; SYNC.rev = SYNC.synced = 0;
    SYNC.secours = row.cle_secours ? { sel_secours: row.sel_secours, cle_secours: row.cle_secours } : null;
  } else {
    APP.salt = crypto.getRandomValues(new Uint8Array(16));
    APP.iter = PBKDF2_ITER;
    const kek = await deriveKey(pw, APP.salt, APP.iter);
    APP.key = await newDataKey();
    SYNC.cle = await wrapKey(APP.key, kek);
    APP.state = normalize(emptyState());
    const prefs = lsGet(PREFS_KEY);
    if (prefs) Object.assign(APP.state.settings, prefs);
    // Reprend un ancien espace local (version sans synchro) s'il s'ouvre avec ce mot de passe.
    try {
      const legacy = await kv.get('vault');
      if (legacy && !legacy.email && legacy.data) {
        const old = normalize(await unseal(await deriveKey(pw, unb64(legacy.salt), legacy.iter || PBKDF2_ITER), legacy));
        APP.state = touchAll(old);
      }
    } catch {}
    SYNC.base = 0; SYNC.rev = 1; SYNC.synced = 0;
  }
  SYNC.email = normEmail(email); SYNC.uid = user.id; SYNC.secret = secret; SYNC.on = true;
  if (!SYNC.secours) {
    // Nouveau coffre (ou coffre sans clé de secours) : on en crée une et on la montre avant d'entrer.
    const code = newRecoveryCode();
    SYNC.secours = await recoveryWrap(APP.key, code);
    if (row) await sb.from(TABLE).update(SYNC.secours).eq('user_id', user.id);
    await persistLocal();
    renderRecoveryKey(code, () => { enterApp('private'); syncNow(); });
    return true;
  }
  enterApp('private');
  await persistLocal();
  syncNow();
  return true;
}
/* Marque tout comme modifié maintenant (import, reprise) pour que ce contenu l'emporte à la fusion. */
function touchAll(s) {
  const now = Date.now();
  s.projects.forEach((p) => { p.updatedAt = now; });
  s.inventory.items.forEach((i) => { i.updatedAt = now; });
  s.settingsAt = now;
  return s;
}

async function onLogin(e) {
  e.preventDefault();
  const email = normEmail($('#acc-email').value), pw = $('#acc-pw').value;
  const err = $('#unlock-error');
  const btn = $('button[type="submit"]', e.target);
  if (!email || !pw) { err.textContent = 'Indique ton adresse e-mail et ton mot de passe.'; return; }
  btn.disabled = true; err.textContent = 'Connexion…';
  try {
    const sb = await sbClient();
    const secret = await authSecret(email, pw);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: secret });
    if (error) {
      err.textContent = /confirm/i.test(error.message) ? "Ton adresse n'est pas encore confirmée : clique sur le lien reçu par e-mail, puis réessaie." : 'Adresse e-mail ou mot de passe incorrect.';
      btn.disabled = false; return;
    }
    if (!(await openRemote(sb, data.user, email, pw, secret))) btn.disabled = false;
  } catch (ex) {
    console.error(ex);
    btn.disabled = false;
    err.textContent = ex && ex.message === 'script' ? 'Impossible de joindre le serveur. Vérifie ta connexion internet.' : 'La connexion a échoué. Vérifie ta connexion internet et réessaie.';
  }
}

async function onSignup(e) {
  e.preventDefault();
  const email = normEmail($('#acc-email').value), pw = $('#acc-pw').value, pw2 = $('#acc-pw2').value;
  const err = $('#unlock-error');
  if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Cette adresse e-mail ne semble pas valide.'; $('#acc-email').focus(); return; }
  if (pw.length < 10) { err.textContent = 'Le mot de passe doit faire au moins 10 caractères.'; $('#acc-pw').focus(); return; }
  if (pw !== pw2) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; $('#acc-pw2').focus(); return; }
  const btn = $('button[type="submit"]', e.target);
  btn.disabled = true; err.textContent = 'Création du compte…';
  try {
    const sb = await sbClient();
    const secret = await authSecret(email, pw);
    const { data, error } = await sb.auth.signUp({ email, password: secret, options: { emailRedirectTo: location.href.split('#')[0] } });
    if (error) {
      btn.disabled = false;
      err.textContent = /registered|exists/i.test(error.message) ? 'Un compte existe déjà avec cette adresse : choisis « J’ai déjà un compte ».'
        : /disabled|not allowed/i.test(error.message) ? 'Les inscriptions sont fermées sur le projet Supabase. Active-les le temps de créer ton compte (Authentication › Sign In / Providers › Email).'
        : 'La création du compte a échoué : ' + error.message;
      return;
    }
    if (!data.session) {
      APP.lockTab = 'login';
      renderLock();
      $('#unlock-error').textContent = `Presque fini ! Un e-mail de confirmation vient d'être envoyé à ${email}. Clique sur le lien qu'il contient, puis reviens ici pour te connecter.`;
      $('#acc-email').value = email;
      return;
    }
    if (!(await openRemote(sb, data.user, email, pw, secret))) btn.disabled = false;
  } catch (ex) {
    console.error(ex);
    btn.disabled = false;
    err.textContent = 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
  }
}

/* Déverrouillage sur un appareil déjà connecté : hors ligne possible. */
async function onUnlockSynced(e) {
  e.preventDefault();
  const pw = $('#pw').value;
  const err = $('#unlock-error');
  const btn = $('button[type="submit"]', e.target);
  btn.disabled = true; err.textContent = 'Ouverture…';
  const cache = await kv.get('vault');
  try {
    const kek = await deriveKey(pw, unb64(cache.salt), cache.iter || PBKDF2_ITER);
    APP.key = await unwrapKey(cache.cle, kek);
    APP.salt = unb64(cache.salt); APP.iter = cache.iter || PBKDF2_ITER;
    APP.state = normalize(await unseal(APP.key, cache));
    Object.assign(SYNC, { email: cache.email, uid: cache.uid, cle: cache.cle, secours: cache.secours || null, base: cache.base || 0, rev: cache.dirty ? 1 : 0, synced: 0, secret: await authSecret(cache.email, pw) });
    enterApp('private');
    connectSync();
  } catch {
    // Le mot de passe a peut-être été changé sur un autre appareil : on tente en ligne.
    if (navigator.onLine) {
      try {
        const sb = await sbClient();
        const secret = await authSecret(cache.email, pw);
        const { data, error } = await sb.auth.signInWithPassword({ email: cache.email, password: secret });
        if (!error && (await openRemote(sb, data.user, cache.email, pw, secret))) return;
      } catch {}
    }
    btn.disabled = false;
    err.textContent = 'Mot de passe incorrect. Vérifie les majuscules et réessaie.';
    $('#pw').select();
  }
}

async function changePasswordSynced(cur, n1) {
  const kekOld = await deriveKey(cur, APP.salt, APP.iter);
  await unwrapKey(SYNC.cle, kekOld); // vérifie le mot de passe actuel
  const sb = await sbClient();
  const newSecret = await authSecret(SYNC.email, n1);
  const { error } = await sb.auth.updateUser({ password: newSecret });
  if (error) throw Object.assign(new Error('auth'), { cause: error });
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cle = await wrapKey(APP.key, await deriveKey(n1, salt, PBKDF2_ITER));
  const { error: e2 } = await sb.from(TABLE).update({ sel: b64(salt), iterations: PBKDF2_ITER, cle }).eq('user_id', SYNC.uid);
  if (e2) throw e2;
  APP.salt = salt; APP.iter = PBKDF2_ITER; SYNC.cle = cle; SYNC.secret = newSecret;
  await persistLocal();
}

async function forgetDevice() {
  try { const sb = await sbClient(); if (sb) await sb.auth.signOut(); } catch {}
  await kv.del('vault');
  await kv.del('photoQueue');
  Object.assign(SYNC, { on: false, uid: null, email: null, secret: null, cle: null, secours: null, base: 0, rev: 0, synced: 0 });
}

/* ---------- Clé de secours : rouvrir le coffre après un mot de passe oublié ---------- */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function newRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = '', out = '';
  bytes.forEach((b) => { bits += b.toString(2).padStart(8, '0'); });
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out.match(/.{4}/g).join('-');
}
const normCode = (c) => String(c || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
async function recoveryWrap(dek, code) {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const kek = await deriveKey(normCode(code), sel, PBKDF2_ITER);
  return { sel_secours: b64(sel), cle_secours: await wrapKey(dek, kek) };
}
async function recoveryUnwrap(row, code) {
  const kek = await deriveKey(normCode(code), unb64(row.sel_secours), PBKDF2_ITER);
  return unwrapKey(row.cle_secours, kek);
}

/* Écran qui présente la clé de secours (création du compte ou nouvelle clé). */
function renderRecoveryKey(code, next) {
  root().innerHTML = `
  <main class="lock wrap" id="view">
    <div class="lock-desk"><div class="letter-wrap"><article class="letter">
      <header class="letter-head"><div class="letter-id">
        <p class="letter-kicker">À garder précieusement</p>
        <h1 class="h-title">Ta clé de secours</h1>
        <p class="letter-tag">Elle remplace ton mot de passe si tu l'oublies</p>
      </div></header>
      <div class="compass-rule" aria-hidden="true"></div>
      <section class="door">
        <p>Si tu oublies ton mot de passe, cette clé est <strong>le seul moyen</strong> de retrouver tes données : personne d'autre (ni Lamia, ni le serveur) ne peut les ouvrir.</p>
        <p class="recovery-code" id="rk-code" aria-label="Clé de secours">${esc(code)}</p>
        <div class="btn-row">
          <button class="btn" type="button" id="rk-copy">${icon('check')} Copier</button>
          <button class="btn" type="button" id="rk-dl">${icon('download')} Télécharger</button>
        </div>
        <p class="small muted">Range-la ailleurs que sur cet appareil : imprimée chez toi, dans un gestionnaire de mots de passe ou dans les notes d'un autre appareil.</p>
        <label class="check"><input type="checkbox" id="rk-ok"> J'ai noté ma clé de secours en lieu sûr</label>
        <button class="btn primary" type="button" id="rk-next" disabled>${icon('door')} Continuer</button>
      </section>
    </article></div></div>
  </main>`;
  $('#rk-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(code); toast('Clé copiée'); }
    catch { const r = document.createRange(); r.selectNodeContents($('#rk-code')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  };
  $('#rk-dl').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`PrettyCrea — clé de secours\nCompte : ${SYNC.email}\nCréée le : ${fmtLong(today())}\n\n${code}\n\nÀ utiliser via « Mot de passe oublié ? » sur l'écran de connexion.\n`], { type: 'text/plain' }));
    a.download = 'prettycrea-cle-de-secours.txt';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  $('#rk-ok').onchange = (e) => { $('#rk-next').disabled = !e.target.checked; };
  $('#rk-next').onclick = next;
  $('#rk-copy').focus();
}

async function regenerateRecovery() {
  const code = newRecoveryCode();
  SYNC.secours = await recoveryWrap(APP.key, code);
  const sb = await sbClient();
  const { error } = await sb.from(TABLE).update(SYNC.secours).eq('user_id', SYNC.uid);
  if (error) throw error;
  await persistLocal();
  renderRecoveryKey(code, () => { renderShell(); route(); toast('Nouvelle clé de secours enregistrée. L’ancienne ne fonctionne plus.'); });
}

async function onForgot(e) {
  e.preventDefault();
  const email = normEmail($('#acc-email').value);
  const err = $('#unlock-error');
  if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Indique l’adresse e-mail de ton compte.'; return; }
  const btn = $('button[type="submit"]', e.target);
  btn.disabled = true; err.textContent = 'Envoi…';
  try {
    const sb = await sbClient();
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    if (error) throw error;
    err.textContent = `C'est envoyé. Ouvre le lien reçu à ${email} (pense aux indésirables), puis garde ta clé de secours à portée de main.`;
  } catch (ex) {
    console.error(ex);
    btn.disabled = false;
    err.textContent = /rate|seconds/i.test((ex && ex.message) || '') ? 'Trop de demandes rapprochées : réessaie dans quelques minutes.' : 'L’envoi a échoué. Vérifie ta connexion et réessaie.';
  }
}

/* Arrivée depuis le lien de l'e-mail « mot de passe oublié ». */
async function handleRecoveryLanding() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get('error_code') || params.get('error')) {
    history.replaceState(null, '', location.pathname);
    APP.lockTab = 'forgot';
    return renderLock('Ce lien a expiré ou a déjà servi. Redemande un e-mail ci-dessous.');
  }
  try {
    const sb = await sbClient();
    const { data: { session } } = await sb.auth.getSession();
    history.replaceState(null, '', location.pathname);
    if (!session) { APP.lockTab = 'forgot'; return renderLock('Ce lien n’est plus valable. Redemande un e-mail ci-dessous.'); }
    renderRecoveryForm(session.user);
  } catch (ex) {
    console.error(ex);
    renderLock('Impossible de joindre le serveur. Vérifie ta connexion internet.');
  }
}
function renderRecoveryForm(user) {
  root().innerHTML = `
  <main class="lock wrap" id="view">
    <div class="lock-desk"><div class="letter-wrap"><article class="letter">
      <header class="letter-head"><div class="letter-id">
        <p class="letter-kicker">Mot de passe oublié</p>
        <h1 class="h-title">Nouveau mot de passe</h1>
        <p class="letter-tag">${esc(user.email)}</p>
      </div></header>
      <div class="compass-rule" aria-hidden="true"></div>
      <section class="door">
        <form id="recover-form" novalidate>
          <div class="field">
            <label for="rc-code">Clé de secours</label>
            <input class="input recovery-input" id="rc-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX">
          </div>
          <div class="field">
            <label for="rc-pw">Nouveau mot de passe <span class="hint">(10 caractères minimum)</span></label>
            <input class="input" id="rc-pw" type="password" autocomplete="new-password">
          </div>
          <div class="field">
            <label for="rc-pw2">Le même, une seconde fois</label>
            <input class="input" id="rc-pw2" type="password" autocomplete="new-password">
          </div>
          <label class="check"><input type="checkbox" id="pw-show" data-show-pw> Afficher le mot de passe</label>
          <p class="error" id="unlock-error" role="alert"></p>
          <button class="btn primary" type="submit">${icon('lock')} Enregistrer et ouvrir mon espace</button>
        </form>
        <p class="small muted">Sans la clé de secours, les données chiffrées ne peuvent pas être rouvertes, même avec un nouveau mot de passe.</p>
      </section>
    </article></div></div>
  </main>`;
  $('#recover-form').addEventListener('submit', (e) => onRecover(e, user));
  $('#rc-code').focus();
}
async function onRecover(e, user) {
  e.preventDefault();
  const err = $('#unlock-error');
  const code = $('#rc-code').value, pw = $('#rc-pw').value, pw2 = $('#rc-pw2').value;
  if (normCode(code).length !== 32) { err.textContent = 'La clé de secours compte 32 caractères (les tirets sont facultatifs).'; $('#rc-code').focus(); return; }
  if (pw.length < 10) { err.textContent = 'Le mot de passe doit faire au moins 10 caractères.'; $('#rc-pw').focus(); return; }
  if (pw !== pw2) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; $('#rc-pw2').focus(); return; }
  const btn = $('button[type="submit"]', e.target);
  btn.disabled = true; err.textContent = 'Vérification de la clé…';
  try {
    const sb = await sbClient();
    const { data: row, error } = await sb.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!row || !row.cle_secours) { err.textContent = 'Aucun coffre avec clé de secours n’a été trouvé pour ce compte.'; btn.disabled = false; return; }
    let dek;
    try { dek = await recoveryUnwrap(row, code); }
    catch { err.textContent = 'Cette clé de secours ne correspond pas. Vérifie chaque caractère.'; btn.disabled = false; return; }
    err.textContent = 'Enregistrement du nouveau mot de passe…';
    const email = normEmail(user.email);
    const secret = await authSecret(email, pw);
    const { error: e1 } = await sb.auth.updateUser({ password: secret });
    if (e1) throw e1;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const cle = await wrapKey(dek, await deriveKey(pw, salt, PBKDF2_ITER));
    const { error: e2 } = await sb.from(TABLE).update({ sel: b64(salt), iterations: PBKDF2_ITER, cle }).eq('user_id', user.id);
    if (e2) throw e2;
    APP.key = dek; APP.salt = salt; APP.iter = PBKDF2_ITER;
    APP.state = normalize(await unseal(dek, { iv: row.iv, data: row.donnees }));
    Object.assign(SYNC, { email, uid: user.id, secret, cle, secours: { sel_secours: row.sel_secours, cle_secours: row.cle_secours }, base: row.version, rev: 0, synced: 0, on: true });
    enterApp('private');
    await persistLocal();
    syncNow();
    toast('Mot de passe changé. Il vaut maintenant sur tous tes appareils.');
  } catch (ex) {
    console.error(ex);
    btn.disabled = false;
    err.textContent = 'La modification a échoué. Vérifie ta connexion et réessaie.';
  }
}

/* ---------- Notifications (Web Push) ----------
   L'appareil prépare les rappels des 3 prochaines semaines et les dépose sur le serveur,
   qui les envoie à l'heure prévue sur tous les appareils inscrits. Le serveur ne lit
   jamais le coffre chiffré : il ne voit que le texte des rappels (discret par défaut). */
const NOTIF_TABLE = 'prettycrea_notifications';
const DEVICE_TABLE = 'prettycrea_appareils';
const PUSH_OK = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!(window.PC_CONFIG && PC_CONFIG.vapidPublicKey);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const deviceLabel = () => { const u = navigator.userAgent; return /iPad/.test(u) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Téléphone Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'PC Windows' : 'Appareil'; };
const b64uToBytes = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
let lastPlanHash = '';

async function pushSubscription() {
  if (!PUSH_OK()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}
async function enableNotifications() {
  if (!PUSH_OK()) throw new Error('unsupported');
  if (isIOS() && !isStandalone()) throw new Error('ios-install');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('denied');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(PC_CONFIG.vapidPublicKey) });
  const j = sub.toJSON();
  const sb = await sbClient();
  const { error } = await sb.from(DEVICE_TABLE).upsert({ endpoint: j.endpoint, user_id: SYNC.uid, p256dh: j.keys.p256dh, auth: j.keys.auth, appareil: deviceLabel() }, { onConflict: 'endpoint' });
  if (error) throw error;
  lastPlanHash = '';
  await pushPlan();
}
async function disableNotifications() {
  const sub = await pushSubscription();
  if (!sub) return;
  try { const sb = await sbClient(); await sb.from(DEVICE_TABLE).delete().eq('endpoint', sub.endpoint); } catch {}
  await sub.unsubscribe();
}

/* Construit les rappels à venir (heure locale de l'appareil). */
function notifPlan() {
  const s = S();
  if (s.notifDaily === false && !Number(s.notifBefore)) return [];
  const named = s.notifDetail === 'prenoms';
  const t = today();
  const out = [];
  const [hh, mm] = String(s.notifHour || '08:30').split(':').map(Number);
  const at = (iso, h, m) => { const d = fromISO(iso); d.setHours(h, m, 0, 0); return d; };
  const plural2 = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  for (let i = 0; i < 21; i++) {
    const d = addDays(t, i);
    const when = at(d, hh, mm);
    if (s.notifDaily !== false && when > new Date()) {
      const parts = [];
      const rdv = active().filter((p) => p.date === d && p.status === 'prevu').sort(byDateTime);
      if (rdv.length) parts.push(named ? `Rendez-vous : ${rdv.map((p) => `${clientLabel(p)} ${fmtTime(p.time)}`).join(', ')}` : `${plural2(rdv.length, 'rendez-vous', 'rendez-vous')} (${rdv.map((p) => fmtTime(p.time)).join(', ')})`);
      const sk = active().filter((p) => { const on = sketchRemindOn(p); return on && d >= on && d <= p.sketch.due; });
      if (sk.length) parts.push(named ? `Croquis à envoyer : ${sk.map(clientLabel).join(', ')}` : plural2(sk.length, 'croquis à envoyer', 'croquis à envoyer'));
      const dep = allPayments().filter((x) => !x.paidOn && x.kind === 'deposit' && x.p.status !== 'annule' && x.due <= d && diffDays(x.due, d) <= 3);
      if (dep.length) parts.push(named ? `Acompte attendu : ${dep.map((x) => `${clientLabel(x.p)} (${money(x.amount)})`).join(', ')}` : plural2(dep.length, 'acompte attendu', 'acomptes attendus'));
      const fin = allPayments().filter((x) => !x.paidOn && x.kind === 'final' && x.p.status !== 'annule' && x.due === addDays(d, -1));
      if (fin.length) parts.push(named ? `Paiement final à noter : ${fin.map((x) => clientLabel(x.p)).join(', ')}` : plural2(fin.length, 'paiement final à noter', 'paiements finaux à noter'));
      const it = needles();
      if (it) { const f = forecast(it); if (f.orderBy && (f.orderBy === d || (i === 0 && f.orderBy < d))) parts.push(`Commander des ${it.name.toLowerCase()}`); }
      if (weekday(d) === 0 && !restInfo(d).ok) parts.push('Pas encore de 2e jour de repos cette semaine');
      if (parts.length) out.push({ cle: 'jour:' + d, envoyer_le: when.toISOString(), titre: weekday(d) === weekday(t) && i === 0 ? 'Ta journée' : `Ta journée · ${fmt(d, { weekday: 'long', day: 'numeric' })}`, corps: parts.join(' · '), lien: './#bibliotheque' });
    }
    for (const p of active().filter((x) => sketchRemindOn(x) && (sketchRemindOn(x) === d || x.sketch.due === d))) {
      const [h, m] = sketchRemindTime(p).split(':').map(Number);
      const w = at(d, h, m);
      if (w <= new Date()) continue;
      const isDue = p.sketch.due === d;
      const when = isDue ? "aujourd'hui" : `le ${fmt(p.sketch.due, { weekday: 'long', day: 'numeric', month: 'long' })}`;
      out.push({ cle: `croquis:${p.id}:${d}`, envoyer_le: w.toISOString(), titre: isDue ? 'Croquis à rendre aujourd’hui' : 'Rappel croquis', corps: named ? `Croquis pour ${clientLabel(p)} (${projLabel(p)}) à rendre ${when}.` : `Un croquis est à rendre ${when}.`, lien: './#agenda' });
    }
    const before = Number(s.notifBefore) || 0;
    if (before) {
      for (const p of active().filter((x) => x.date === d && x.status === 'prevu')) {
        const w = at(d, ...p.time.split(':').map(Number));
        w.setMinutes(w.getMinutes() - before);
        if (w > new Date()) out.push({ cle: `rdv:${p.id}:${p.date}T${p.time}`, envoyer_le: w.toISOString(), titre: `Rendez-vous à ${fmtTime(p.time)}`, corps: named ? `${clientLabel(p)} · ${projLabel(p)}` : `Dans ${before >= 60 ? before / 60 + ' h' : before + ' min'}`, lien: './#agenda' });
      }
    }
  }
  return out;
}
/* Remplace les rappels à venir sur le serveur (seulement si quelque chose a changé). */
async function pushPlan() {
  if (!SYNC.on || !navigator.onLine || !(await pushSubscription())) return;
  const plan = notifPlan();
  const hash = JSON.stringify(plan);
  if (hash === lastPlanHash) return;
  const sb = await sbClient();
  const { error } = await sb.from(NOTIF_TABLE).delete().eq('user_id', SYNC.uid).is('envoye_le', null);
  if (error) return;
  if (plan.length) {
    const { error: e2 } = await sb.from(NOTIF_TABLE).upsert(plan.map((n) => ({ ...n, user_id: SYNC.uid, envoye_le: null })), { onConflict: 'user_id,cle' });
    if (e2) return;
  }
  lastPlanHash = hash;
}
async function sendTestNotification() {
  const sb = await sbClient();
  const cle = 'test:' + Date.now();
  await sb.from(NOTIF_TABLE).insert({ user_id: SYNC.uid, cle, envoyer_le: new Date().toISOString(), titre: 'PrettyCrea', corps: 'Les notifications fonctionnent sur cet appareil.', lien: './#reglages' });
  try { await sb.functions.invoke('prettycrea-notifier', { body: {} }); } catch {}
}
function renderNotifPreview() {
  const box = $('#notif-preview');
  if (!box) return;
  const next = notifPlan()[0];
  box.innerHTML = next
    ? `<p class="eyebrow">Aperçu de la prochaine notification</p>
       <div class="notif-card"><span class="notif-ic">${icon('alert')}</span><div><strong>${esc(next.titre)}</strong><p>${esc(next.corps)}</p>
       <p class="faint small">${esc(cap(new Date(next.envoyer_le).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })))}</p></div></div>`
    : `<p class="small muted">Rien à signaler pour les trois prochaines semaines.</p>`;
}
async function renderNotifStatus() {
  const box = $('#notif-status');
  if (!box) return;
  renderNotifPreview();
  let html;
  if (APP.mode === 'demo') html = `<p class="small">Dans la démo, tu peux régler les notifications et voir leur aperçu, mais pas les recevoir. Dans l'espace privé, Lucile les active sur chacun de ses appareils.</p>`;
  else if (!PUSH_OK()) html = `<p class="small">Ce navigateur ne gère pas les notifications. Sur ordinateur, utilise Chrome ou Edge ; sur iPhone et iPad, installe d'abord la plateforme.</p>`;
  else if (isIOS() && !isStandalone()) html = `<p class="small"><strong>Sur iPhone et iPad, il faut d'abord installer la plateforme :</strong> bouton Partager › « Sur l'écran d'accueil ». Ouvre-la ensuite depuis son icône et reviens ici.</p>`;
  else if (Notification.permission === 'denied') html = `<p class="small">Les notifications sont bloquées pour ce site. Autorise-les dans les réglages du navigateur (ou de l'appareil), puis reviens ici.</p>`;
  else {
    const sub = await pushSubscription();
    html = sub
      ? `<div class="restline"><span class="ic">${icon('check')}</span><span>Notifications activées sur cet appareil (${esc(deviceLabel())}).</span></div>
         <div class="btn-row"><button type="button" class="btn sm" data-action="notif-test">Envoyer une notification de test</button><button type="button" class="btn sm ghost" data-action="notif-off">Désactiver sur cet appareil</button></div>`
      : `<p class="small">Active les notifications sur chaque appareil où tu veux les recevoir (téléphone, iPad, ordinateur).</p>
         <div class="btn-row"><button type="button" class="btn primary sm" data-action="notif-on">${icon('alert')} Activer sur cet appareil</button></div>`;
  }
  box.innerHTML = html;
}

/* ---------- Photos chiffrées (stockage séparé, synchronisé) ---------- */
const PHOTO_URLS = {};
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const isPhotoRef = (v) => typeof v === 'string' && v.startsWith('ph_');
function photoImg(v, cls = '', alt = '') {
  if (!v) return '';
  if (!isPhotoRef(v)) return `<img class="${cls}" src="${v}" alt="${alt}">`;
  return `<img class="${cls}" data-photo="${v}" src="${PHOTO_URLS[v] || BLANK}" alt="${alt}">`;
}
async function photoURL(id) {
  if (PHOTO_URLS[id]) return PHOTO_URLS[id];
  let bytes = await kv.get('photo:' + id);
  if (!bytes && SYNC.on && navigator.onLine) {
    try {
      const sb = await sbClient();
      const { data, error } = await sb.storage.from(BUCKET).download(`${SYNC.uid}/${id}`);
      if (!error && data) { bytes = new Uint8Array(await data.arrayBuffer()); await kv.set('photo:' + id, bytes); }
    } catch {}
  }
  if (!bytes || !APP.key) return null;
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, APP.key, bytes.slice(12));
    return (PHOTO_URLS[id] = URL.createObjectURL(new Blob([pt], { type: 'image/jpeg' })));
  } catch { return null; }
}
async function hydratePhotos(scope = document) {
  const ids = [...new Set($$('img[data-photo]', scope).filter((i) => i.src === BLANK || !i.src).map((i) => i.dataset.photo))];
  for (const id of ids) {
    const url = await photoURL(id);
    if (url) $$(`img[data-photo="${id}"]`).forEach((i) => { i.src = url; });
  }
}
async function storePhoto(blob) {
  const id = 'ph_' + uid() + uid();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, APP.key, await blob.arrayBuffer()));
  const bytes = new Uint8Array(12 + ct.length);
  bytes.set(iv); bytes.set(ct, 12);
  await kv.set('photo:' + id, bytes);
  PHOTO_URLS[id] = URL.createObjectURL(blob);
  const q = (await kv.get('photoQueue')) || [];
  q.push(id);
  await kv.set('photoQueue', q);
  return id;
}
async function flushPhotoQueue() {
  if (!SYNC.on || !navigator.onLine) return;
  const q = (await kv.get('photoQueue')) || [];
  if (!q.length) return;
  const sb = await sbClient();
  const left = [];
  for (const id of q) {
    const bytes = await kv.get('photo:' + id);
    if (!bytes) continue;
    const { error } = await sb.storage.from(BUCKET).upload(`${SYNC.uid}/${id}`, new Blob([bytes], { type: 'application/octet-stream' }), { upsert: true });
    if (error) left.push(id);
  }
  await kv.set('photoQueue', left);
}

window.addEventListener('online', () => { if (SYNC.on) syncNow(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && SYNC.on) syncNow(); });
setInterval(() => { if (SYNC.on && !document.hidden) syncNow(); }, 45000);

/* =========================================================
   Démarrage, écran d'entrée, verrouillage
   ========================================================= */
const root = () => $('#root');

async function boot() {
  document.documentElement.lang = 'fr';
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  applyDisplay();
  APP.showFr = lsGet('prettycrea.quoteFr') === true;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}
  let mode = null;
  try { mode = sessionStorage.getItem('prettycrea.mode'); } catch {}
  if (SYNC_ON() && /type=recovery|error_code=|access_token=/.test(location.hash)) return handleRecoveryLanding();
  if (mode === 'demo') return enterDemo();
  renderLock();
}

async function renderLock(message = '') {
  APP.mode = null;
  let cache = null;
  try { cache = await kv.get('vault'); } catch {}
  const hasVault = !!cache;
  const synced = SYNC_ON();
  const syncedCache = synced && cache && cache.email;
  const tab = APP.lockTab || 'login';
  const cryptoOk = !!(window.crypto && crypto.subtle);
  root().innerHTML = `
  <main class="lock wrap" id="view">
    <div class="lock-desk">
      <div class="lock-art lock-art-l">${ART.candle}</div>
      <div class="letter-wrap"><article class="letter">
        <header class="letter-head">
          <div class="letter-id">
            <p class="letter-kicker">Correspondance privée · studio de Lucile</p>
            <h1 class="h-title">PrettyCrea</h1>
            <p class="letter-tag">Agenda, comptes &amp; réserves</p>
          </div>
          ${ART.stamp(fmt(today(), { day: 'numeric', month: 'short' }).toUpperCase())}
        </header>
        <div class="compass-rule" aria-hidden="true"></div>
        <section class="door" aria-labelledby="door-private">
          <h2 id="door-private">${icon('lock')} Espace privé</h2>
          ${synced
            ? `<p class="muted">Réservé à Lucile. Tes données sont chiffrées sur l'appareil, puis synchronisées entre ton iPad, ton téléphone et ton ordinateur.</p>`
            : `<p class="muted">Réservé à Lucile. Les données sont chiffrées avec ton mot de passe et restent dans ce navigateur, sur cet appareil.</p>`}
          ${!cryptoOk ? `<div class="notice warn">${icon('alert')}<p>Ce navigateur ne permet pas le chiffrement. Ouvre la plateforme dans Chrome, Firefox, Safari ou Edge à jour.</p></div>`
          : synced && tab === 'forgot' ? `
          <form id="acc-forgot" novalidate>
            <p>Indique l'adresse de ton compte : tu recevras un lien pour choisir un nouveau mot de passe. Il te faudra ta <strong>clé de secours</strong>.</p>
            <div class="field">
              <label for="acc-email">Adresse e-mail</label>
              <input class="input" id="acc-email" type="email" autocomplete="email" inputmode="email" value="${esc((cache && cache.email) || '')}" required>
            </div>
            <p class="error" id="unlock-error" role="alert">${esc(message)}</p>
            <button class="btn primary" type="submit">${icon('door')} Recevoir le lien</button>
            <button class="linkish" type="button" data-action="lock-tab" data-view="login">Retour à la connexion</button>
          </form>`
          : syncedCache ? `
          <form id="unlock-form" novalidate>
            <p class="small">Connectée : <strong>${esc(cache.email)}</strong></p>
            <div class="field">
              <label for="pw">Mot de passe</label>
              <input class="input" id="pw" name="pw" type="password" autocomplete="current-password" required>
            </div>
            <label class="check"><input type="checkbox" id="pw-show" data-show-pw> Afficher le mot de passe</label>
            <p class="error" id="unlock-error" role="alert">${esc(message)}</p>
            <button class="btn primary" type="submit">${icon('door')} Ouvrir mon espace</button>
            <button class="linkish" type="button" data-action="lock-tab" data-view="forgot">Mot de passe oublié ?</button>
          </form>
          <details>
            <summary>Changer de compte ou d'appareil</summary>
            <div>
              <p>Déconnecter cet appareil efface la copie locale. Tes données restent en sécurité sur ton compte et sur tes autres appareils. Ce qui n'a pas encore été synchronisé depuis cet appareil serait perdu.</p>
              <button class="btn danger sm" type="button" data-action="forget-device">${icon('door')} Déconnecter cet appareil</button>
            </div>
          </details>`
          : synced ? `
          <div class="seg" role="group" aria-label="Connexion ou création de compte">
            <button type="button" data-action="lock-tab" data-view="login" aria-pressed="${tab === 'login'}">J'ai déjà un compte</button>
            <button type="button" data-action="lock-tab" data-view="signup" aria-pressed="${tab === 'signup'}">Première fois</button>
          </div>
          <form id="${tab === 'login' ? 'acc-login' : 'acc-signup'}" novalidate>
            <div class="field">
              <label for="acc-email">Adresse e-mail</label>
              <input class="input" id="acc-email" type="email" autocomplete="email" inputmode="email" required>
            </div>
            <div class="field">
              <label for="acc-pw">Mot de passe ${tab === 'signup' ? '<span class="hint">(10 caractères minimum)</span>' : ''}</label>
              <input class="input" id="acc-pw" type="password" autocomplete="${tab === 'login' ? 'current-password' : 'new-password'}" required>
            </div>
            ${tab === 'signup' ? `<div class="field">
              <label for="acc-pw2">Le même, une seconde fois</label>
              <input class="input" id="acc-pw2" type="password" autocomplete="new-password" required>
            </div>` : ''}
            <label class="check"><input type="checkbox" id="pw-show" data-show-pw> Afficher le mot de passe</label>
            ${tab === 'signup' ? `<p class="hint muted">Ce mot de passe chiffre tes données : il ne peut pas être récupéré. Note-le dans un endroit sûr.</p>` : ''}
            <p class="error" id="unlock-error" role="alert">${esc(message)}</p>
            <button class="btn primary" type="submit">${icon(tab === 'login' ? 'door' : 'lock')} ${tab === 'login' ? 'Me connecter' : 'Créer mon compte'}</button>
            ${tab === 'login' ? `<button class="linkish" type="button" data-action="lock-tab" data-view="forgot">Mot de passe oublié ?</button>` : ''}
          </form>`
          : hasVault ? `
          <form id="unlock-form" novalidate>
            <div class="field">
              <label for="pw">Mot de passe</label>
              <div class="input-affix">
                <input class="input" id="pw" name="pw" type="password" autocomplete="current-password" required>
              </div>
            </div>
            <label class="check"><input type="checkbox" id="pw-show" data-show-pw> Afficher le mot de passe</label>
            <p class="error" id="unlock-error" role="alert">${esc(message)}</p>
            <button class="btn primary" type="submit">${icon('door')} Ouvrir mon espace</button>
          </form>
          <details>
            <summary>Mot de passe oublié ?</summary>
            <div>
              <p>Le mot de passe ne peut pas être récupéré : c'est ce qui protège tes données. Si tu as une sauvegarde, tu pourras la restaurer après avoir recréé un espace.</p>
              <div class="field"><label for="wipe-confirm">Pour tout effacer et repartir de zéro, écris EFFACER</label><input class="input" id="wipe-confirm" autocomplete="off"></div>
              <button class="btn danger sm" type="button" data-action="wipe-vault">${icon('trash')} Effacer l'espace privé</button>
            </div>
          </details>` : `
          <form id="create-form" novalidate>
            <p>Première visite : choisis un mot de passe pour protéger ton espace.</p>
            <div class="field">
              <label for="pw-new">Mot de passe <span class="hint">(8 caractères minimum)</span></label>
              <input class="input" id="pw-new" name="pw" type="password" autocomplete="new-password" minlength="8" required>
            </div>
            <div class="field">
              <label for="pw-new2">Le même, une seconde fois</label>
              <input class="input" id="pw-new2" name="pw2" type="password" autocomplete="new-password" required>
            </div>
            <label class="check"><input type="checkbox" id="pw-show" data-show-pw> Afficher le mot de passe</label>
            <p class="hint muted">Note-le dans un endroit sûr : sans lui, personne (même pas toi) ne peut rouvrir l'espace.</p>
            <p class="error" id="unlock-error" role="alert">${esc(message)}</p>
            <button class="btn primary" type="submit">${icon('lock')} Créer mon espace privé</button>
          </form>`}
        </section>
        <div class="letter-or" aria-hidden="true"><span>ou</span></div>
        <section class="door door-demo" aria-labelledby="door-demo">
          <div><h2 id="door-demo">${icon('eye')} Démo</h2>
          <p class="muted">Des données fictives pour découvrir la plateforme, sans accès à l'espace privé.</p></div>
          <button class="btn" type="button" data-action="enter-demo">${icon('eye')} Visiter la démo</button>
        </section>
        <footer class="letter-foot">${ART.moth}<p>Un pas après l’autre.</p></footer>
      </article></div>
      <div class="lock-art lock-art-r">${ART.night}</div>
    </div>
  </main>`;
  const f = $('#acc-forgot') || $('#unlock-form') || $('#create-form') || $('#acc-login') || $('#acc-signup');
  if (f) {
    const handler = { 'acc-forgot': onForgot, 'unlock-form': syncedCache ? onUnlockSynced : onUnlock, 'create-form': onCreate, 'acc-login': onLogin, 'acc-signup': onSignup }[f.id];
    f.addEventListener('submit', handler);
    $('input', f).focus();
  }
}

async function onCreate(e) {
  e.preventDefault();
  const pw = $('#pw-new').value, pw2 = $('#pw-new2').value;
  const err = $('#unlock-error');
  if (pw.length < 8) { err.textContent = 'Le mot de passe doit faire au moins 8 caractères.'; $('#pw-new').focus(); return; }
  if (pw !== pw2) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; $('#pw-new2').focus(); return; }
  err.textContent = 'Création…';
  APP.salt = crypto.getRandomValues(new Uint8Array(16));
  APP.iter = PBKDF2_ITER;
  APP.key = await deriveKey(pw, APP.salt, APP.iter);
  APP.state = emptyState();
  const prefs = lsGet(PREFS_KEY);
  if (prefs) Object.assign(APP.state.settings, prefs);
  await kv.set('vault', await seal(APP.key, APP.salt, APP.iter, APP.state));
  enterApp('private');
}

async function onUnlock(e) {
  e.preventDefault();
  const pw = $('#pw').value;
  const err = $('#unlock-error');
  const btn = $('button[type="submit"]', e.target);
  btn.disabled = true;
  err.textContent = 'Ouverture…';
  try {
    const blob = await kv.get('vault');
    const salt = unb64(blob.salt);
    const key = await deriveKey(pw, salt, blob.iter || PBKDF2_ITER);
    const state = await unseal(key, blob);
    APP.key = key; APP.salt = salt; APP.iter = blob.iter || PBKDF2_ITER;
    APP.state = normalize(state);
    enterApp('private');
  } catch {
    btn.disabled = false;
    err.textContent = 'Mot de passe incorrect. Vérifie les majuscules et réessaie.';
    $('#pw').select();
  }
}

function enterDemo() {
  APP.state = normalize(lsGet(DEMO_KEY) || seedDemo());
  try { sessionStorage.setItem('prettycrea.mode', 'demo'); } catch {}
  enterApp('demo');
}

function enterApp(mode) {
  APP.mode = mode;
  APP.cal = { view: S().calView || null, cursor: today() };
  APP.finMonth = monthKey(today());
  applyDisplay();
  savePrefs();
  renderShell();
  if (!location.hash || location.hash === '#') history.replaceState(null, '', '#bibliotheque');
  route();
  window.scrollTo(0, 0);
  armAutoLock();
  if (mode === 'demo') persist();
}

function lock() {
  clearTimeout(APP.lockTimer);
  if (APP.mode === 'private') {
    clearTimeout(APP.saveTimer);
    persist();
  }
  try { sessionStorage.removeItem('prettycrea.mode'); } catch {}
  const sheet = $('#sheet');
  if (sheet.open) sheet.close();
  APP.key = null; APP.state = null; APP.mode = null;
  SYNC.on = false; SYNC.secret = null; clearTimeout(SYNC.timer);
  Object.keys(PHOTO_URLS).forEach((k) => { URL.revokeObjectURL(PHOTO_URLS[k]); delete PHOTO_URLS[k]; });
  renderLock();
}

function armAutoLock() {
  clearTimeout(APP.lockTimer);
  if (APP.mode !== 'private') return;
  const min = Number(S().autoLock) || 0;
  if (min > 0) APP.lockTimer = setTimeout(() => { if (APP.mode === 'private') lock(); }, min * 60000);
}
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => { if (APP.mode === 'private') armAutoLock(); }, { passive: true }));

/* =========================================================
   Coquille & navigation
   ========================================================= */
const NAV = [
  { id: 'bibliotheque', label: 'Accueil', icon: 'library' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'clientes', label: 'Clientes', icon: 'users' },
  { id: 'comptes', label: 'Comptes', icon: 'ledger' },
  { id: 'reserves', label: 'Réserves', icon: 'jar' },
  { id: 'reglages', label: 'Réglages', icon: 'sliders' },
];

function renderShell() {
  const demo = APP.mode === 'demo';
  root().innerHTML = `
  <a class="skip" href="#view" data-action="skip">Aller au contenu</a>
  <header class="topbar">
    <div class="topbar-in wrap">
      <a class="brand" href="#bibliotheque">${S().profilePhoto ? photoImg(S().profilePhoto, 'brand-avatar', '') : '<span class="brand-mark" aria-hidden="true">PC</span>'}<span class="brand-text"><span class="brand-name">${esc(S().profileName || 'PrettyCrea')}</span>${S().profileName ? '<span class="brand-sub">PrettyCrea</span>' : ''}</span></a>
      <button class="btn primary quick-new" type="button" data-action="new-project" aria-label="Nouveau projet" title="Nouveau projet">${icon('plus')}<span class="quick-new-label">Nouveau projet</span></button>
      <nav class="tabs" aria-label="Espaces">
        <p class="nav-label" aria-hidden="true">Espaces</p>
        ${NAV.map((n) => `${n.id === 'reglages' ? '<p class="nav-label nav-label-end" aria-hidden="true">Paramètres</p>' : ''}<a class="tab" href="#${n.id}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`).join('')}
      </nav>
      <div class="top-actions">
        <span id="save-status" class="save-status" aria-live="polite"></span>
        <a class="round mobile-only" href="#reglages" aria-label="Réglages" title="Réglages">${icon('sliders')}</a>
        <button class="round" type="button" data-action="lock" aria-label="${demo ? 'Quitter la démo' : 'Verrouiller'}" title="${demo ? 'Quitter la démo' : 'Verrouiller'}">${icon(demo ? 'door' : 'lock')}<span class="lock-label">${demo ? 'Quitter la démo' : 'Verrouiller'}</span></button>
      </div>
    </div>
  </header>
  ${demo ? `<div class="demo-banner"><div class="wrap">${icon('eye')}<span><strong>Mode démo.</strong><span class="demo-more"> Données fictives, sans lien avec l'espace privé de Lucile.</span></span><button class="linkish" type="button" data-action="reset-demo">Remettre la démo à zéro</button></div></div>` : ''}
  <main id="view" class="wrap" tabindex="-1"></main>`;
  setSaveStatus('saved');
}

function route() {
  if (!APP.state) return;
  const h = (location.hash || '#bibliotheque').slice(1);
  APP.route = NAV.some((n) => n.id === h) ? h : 'bibliotheque';
  $$('.tabs a').forEach((a) => { if (a.dataset.nav === APP.route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  render(true);
}
window.addEventListener('hashchange', () => {
  if (!APP.state) return;
  route();
  window.scrollTo(0, 0);
  $('#view')?.focus({ preventScroll: true });
});

const VIEWS = { bibliotheque: viewLibrary, agenda: viewAgenda, clientes: viewClientes, comptes: viewComptes, reserves: viewReserves, reglages: viewReglages };
const TITLES = { bibliotheque: 'Accueil', agenda: 'Agenda', clientes: 'Clientes', comptes: 'Comptes', reserves: 'Réserves', reglages: 'Réglages' };

function render(fresh = false) {
  const v = $('#view');
  if (!v || !APP.state) return;
  // Garder le focus clavier sur le même contrôle après un nouveau rendu.
  const a = document.activeElement;
  const focusKey = !fresh && a && v.contains(a) ? (a.id ? '#' + CSS.escape(a.id) : a.dataset.action ? `[data-action="${a.dataset.action}"]${a.dataset.id ? `[data-id="${a.dataset.id}"]` : ''}${a.dataset.date ? `[data-date="${a.dataset.date}"]` : ''}${a.dataset.view ? `[data-view="${a.dataset.view}"]` : ''}${a.dataset.kind ? `[data-kind="${a.dataset.kind}"]` : ''}` : null) : null;
  v.innerHTML = VIEWS[APP.route]();
  hydratePhotos(document);
  if (APP.route === 'reglages') renderNotifStatus();
  document.title = `${TITLES[APP.route]} · PrettyCrea`;
  if (focusKey) { const el = $(focusKey, v); if (el) el.focus({ preventScroll: true }); }
}

/* ---------- Gabarits communs ---------- */
const STAR = (() => {
  let d = '';
  for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2, r = k % 2 ? 46 : 49.5; d += `${k ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`; }
  // V3 : sceau de cire sur deux rubans de velours
  return `<svg class="accent-star seal" viewBox="0 0 100 138" aria-hidden="true"><defs><radialGradient id="wax" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#aa7df8"/><stop offset=".55" stop-color="#793be5"/><stop offset="1" stop-color="#361372"/></radialGradient></defs>
    <path d="M34 70L22 134L33 124L42 136L50 74Z" fill="#290f55"/><path d="M66 70L78 134L67 124L58 136L50 74Z" fill="#361372"/>
    <path d="M36 76L27 124M64 76L73 124" stroke="#b68ff9" stroke-opacity=".45" stroke-width="1" fill="none"/>
    <path d="${d}Z" fill="url(#wax)"/><circle cx="50" cy="50" r="33" fill="none" stroke="#361372" stroke-opacity=".55" stroke-width="2.5"/><circle cx="50" cy="50" r="33" fill="none" stroke="#cfb3ff" stroke-opacity=".25" stroke-width="1" transform="translate(-.8 -.8)"/><text x="50" y="59" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="26" fill="#290f55" fill-opacity=".85">PC</text><text x="49.2" y="58.2" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="26" fill="#dfccff" fill-opacity=".5">PC</text></svg>`;
})();
ART.seal = STAR; // exposé pour la planche « Direction artistique » des maquettes
function spread(id, left, right) {
  const [head, body] = left.includes('<!--/head-->') ? left.split('<!--/head-->') : ['', left];
  return `<div class="space" data-space="${id}">
    ${head ? `<div class="space-head">${head}</div>` : ''}
    ${right === null ? `<div class="col">${body}</div>` : `<div class="cols"><div class="col">${body}</div><div class="col">${right}</div></div>`}
  </div>`;
}
const initial = (t) => `<span class="initial" aria-hidden="true">${t.charAt(0)}</span><span class="sr-only">${t.charAt(0)}</span>${t.slice(1)}`;
// V3 : chaque espace a son bandeau éditorial (numéro de catalogue, accroche, gravure).
const SPACES = {
  bibliotheque: { no: 'I', tag: 'Bienvenue à l’atelier', art: 'bouquet' },
  agenda: { no: 'II', tag: 'Le temps des rendez-vous', art: 'moons' },
  clientes: { no: 'III', tag: 'Celles qui te confient leur peau', art: 'candle' },
  comptes: { no: 'IV', tag: 'Ce qui entre, ce qui reste', art: 'quill' },
  reserves: { no: 'V', tag: 'Le cabinet des aiguilles', art: 'jar' },
  reglages: { no: 'VI', tag: 'L’atelier à ta façon', art: 'compass' },
};
const pageHead = (eyebrow, title, aside = '', tag = 'h1', extra = '') => {
  if (tag !== 'h1') return `<header class="page-head"><div class="page-head-text"><p class="eyebrow">${eyebrow}</p><${tag} class="h-title">${title}</${tag}></div>${aside ? `<div class="page-head-aside">${aside}</div>` : ''}</header>`;
  const m = SPACES[APP.route] || {};
  return `<header class="page-head masthead">
    <div class="mh-text">
      <p class="eyebrow">${m.no ? `<span class="cat-no">N° ${m.no}</span>` : ''}<span>${eyebrow}</span></p>
      <h1 class="h-title">${initial(title)}</h1>
      ${m.tag ? `<p class="mh-tag">${m.tag}</p>` : ''}
      ${extra}
      ${aside ? `<div class="page-head-aside">${aside}</div>` : ''}
    </div>
    ${m.art ? `<div class="mh-art">${ART[m.art]}</div>` : ''}
  </header>`;
};
const cardHead = (ic, title, aside = '', id = '') => `<div class="card-head"><h2 class="card-title" ${id ? `id="${id}"` : ''}><span class="ic">${icon(ic)}</span>${title}</h2>${aside}</div>`;
const bar = (frac, cls = '') => `<div class="bar ${cls}" aria-hidden="true"><span style="width:${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%"></span></div>`;
const row = ({ ic, title, sub = '', id, amt = '', amtCls = '', check = '', level = '', action = 'open-project', view = '' }) => `<li class="row ${level}"><span class="ic">${icon(ic)}</span>
  <button class="row-main" type="button" data-action="${action}" data-id="${id || ''}" ${view ? `data-view="${view}"` : ''}><span class="row-title">${esc(title)}</span>${sub ? `<span class="row-sub">${esc(sub)}</span>` : ''}</button>
  ${amt ? `<span class="row-amt ${amtCls}">${amt}</span>` : '<span></span>'}
  ${check ? `<button class="round sm ok" type="button" data-action="mark-paid" data-id="${id}" data-kind="${check}" aria-label="Noter comme reçu : ${esc(title)}" title="Noter comme reçu">${icon('check')}</button>` : '<span></span>'}</li>`;
const statusPill = (f) => f.status === 'now' ? `<span class="pill bad">${icon('alert')} À commander</span>` : f.status === 'soon' ? `<span class="pill warn">${icon('clock')} À commander bientôt</span>` : `<span class="pill ok">${icon('check')} Suffisant</span>`;

/* =========================================================
   Accueil
   ========================================================= */
const QUOTES = (window.PC_QUOTES || []).filter((q) => q && q.text);
function quoteOfDay() {
  if (!QUOTES.length) return null;
  if (APP.quote === null) APP.quote = Math.floor(fromISO(today()).getTime() / 86400000) % QUOTES.length;
  return QUOTES[APP.quote];
}

function weekStrip(ws) {
  const t = today();
  return `<ol class="week-strip">${[...Array(7)].map((_, i) => {
    const d = addDays(ws, i);
    const n = active().filter((p) => p.date === d).length;
    const rest = i === 6 || isRestMarked(d);
    const state = n ? 'busy' : rest ? 'rest' : 'free';
    const lab = n ? plural(n, 'rendez-vous', 'rendez-vous') : rest ? 'repos' : 'libre';
    return `<li><button type="button" class="day-pill ${state} ${d === t ? 'is-today' : ''}" data-action="goto-day" data-date="${d}" aria-label="${esc(cap(fmtDay(d)))} : ${lab}">
      <span class="dp-wd">${WD_SHORT[i]}</span><span class="dp-n">${fromISO(d).getDate()}</span><span class="dp-s">${n ? `${n}<span class="dp-u">&nbsp;rdv</span>` : rest ? icon('moon') : '<span class="dp-u">libre</span>'}</span></button></li>`;
  }).join('')}</ol>`;
}

function viewLibrary() {
  const t = today();
  const ws = startOfWeek(t);
  const info = restInfo(ws);
  const todayList = active().filter((p) => p.date === t).sort(byDateTime);
  const next = upcoming()[0];
  const mk = monthKey(t);
  const done = monthSummary(mk), sim = monthSummary(mk, true);
  const it = needles();
  const f = it ? forecast(it) : null;
  const rems = reminders().filter((r) => r.icon !== 'moon' && r.icon !== 'needle').slice(0, 4);
  const q = quoteOfDay();
  const lede = todayList.length
    ? `Aujourd'hui : ${todayList.map((p) => `${clientLabel(p)} à ${fmtTime(p.time)}`).join(', ')}.`
    : isRestMarked(t) || weekday(t) === 6 ? "Aujourd'hui est un jour de repos. Prends soin de toi." : "Aucun rendez-vous aujourd'hui.";

  const left = `
    ${pageHead(cap(fmtDay(t)), `Hello, ${esc(S().profileName || 'PrettyCrea')}`, '', 'h1', `<p class="lede">${esc(lede)}</p>`)}<!--/head-->

    <section class="card" aria-labelledby="c-next">
      ${cardHead('clock', 'Prochain rendez-vous', `<a class="pill-link" href="#agenda">Agenda ${icon('right')}</a>`, 'c-next')}
      ${next ? `<div class="next">
          <div class="next-when"><span class="big">${fmtTime(next.time)}</span><span class="muted">${cap(rel(diffDays(t, next.date)))}<br>${fmt(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
          <div class="next-who"><strong>${esc(clientLabel(next))}</strong>${next.client.instagram ? `<span class="muted">@${esc(next.client.instagram)}</span>` : ''}<span>${esc(projLabel(next))}</span></div>
          ${next.photo ? photoImg(next.photo, 'next-photo') : ''}
        </div>
        <div class="btn-row">
          <button class="btn primary" type="button" data-action="open-project" data-id="${next.id}">Ouvrir la fiche</button>
          ${next.deposit.enabled && next.deposit.amount > 0 ? `<span class="pill ${next.deposit.paidOn ? 'ok' : 'warn'}">Acompte ${next.deposit.paidOn ? 'reçu' : 'attendu'}</span>` : ''}
          <span class="pill">${money(next.price)}</span>
        </div>` : `<div class="empty-box"><p>Aucun rendez-vous prévu pour l'instant.</p><button class="btn sm" type="button" data-action="new-project">${icon('plus')} Ajouter un projet</button></div>`}
    </section>

    <section class="card" aria-labelledby="c-todo">
      ${cardHead('feather', 'À ne pas oublier', rems.length ? `<span class="count">${rems.length}</span>` : '', 'c-todo')}
      ${rems.length ? `<ul class="rows">${rems.map((r) => row({ ic: r.icon, title: r.title, sub: r.sub, id: r.id, check: r.kind || '', level: r.level, amt: r.amt || '', action: r.action || 'open-project', view: r.view || '' })).join('')}</ul>`
        : `<p class="empty">Rien d'urgent. Tout est en ordre.</p>`}
    </section>

    <section class="card" aria-labelledby="c-week">
      ${cardHead('moon', 'Ta semaine', `<span class="pill ${info.ok ? 'ok' : 'rest'}">${info.ok ? 'Repos respecté' : 'Repos à prévoir'}</span>`, 'c-week')}
      ${weekStrip(ws)}
      <p class="small ${info.ok ? 'muted' : ''}">${info.ok ? `${cap(plural(info.free.length, 'jour libre', 'jours libres'))} en plus du dimanche. Touche un jour pour l'ouvrir.` : esc(restMessage(info))}</p>
    </section>`;

  const right = `
    <section class="card card-accent" aria-labelledby="c-month">
      ${STAR}
      <div class="card-head"><span class="pill pill-on-accent">${fmtMonth(mk)}</span><a class="round on-accent" href="#comptes" aria-label="Ouvrir les comptes">${icon('right')}</a></div>
      <p class="accent-label" id="c-month">Il te reste ce mois-ci</p>
      <p class="accent-big">${money(done.net)}</p>
      <p class="accent-note">Après la part du shop et l'URSSAF estimée.${sim.net !== done.net ? ` <strong>${money(sim.net)}</strong> prévus en fin de mois.` : ''}</p>
      <div class="accent-tiles">
        <div class="tile"><span>Encaissé</span><strong>${money(done.gross)}</strong></div>
        <div class="tile"><span>À garder pour l'URSSAF</span><strong>${money(done.urssaf)}</strong></div>
      </div>
    </section>

    ${it ? `<section class="card" aria-labelledby="c-stock">
      ${cardHead('needle', esc(it.name), statusPill(f), 'c-stock')}
      <div class="stat-row"><span class="big">${it.qty}</span><span class="muted">${esc(it.unit)} en stock</span></div>
      ${it.perProject > 0 && f.up ? `${bar(f.covers / f.up, f.status === 'ok' ? 'good' : f.status === 'now' ? 'bad' : 'gold')}<p class="small muted">Assez pour ${Math.min(f.covers, f.up)} des ${plural(f.up, 'projet prévu', 'projets prévus')}.</p>` : ''}
      ${f.orderBy ? `<p class="small">Commande au plus tard le <strong>${fmtLong(f.orderBy)}</strong>.</p>` : ''}
      <div><a class="pill-link" href="#reserves">Réserves ${icon('right')}</a></div>
    </section>` : ''}

    ${q ? `<figure class="card quote" aria-label="Citation du jour">
      <blockquote lang="en"><p>« ${esc(q.text)} »</p></blockquote>
      ${APP.showFr && q.fr ? `<p class="quote-fr">${esc(q.fr)} <span class="faint">(traduction libre)</span></p>` : ''}
      <figcaption><cite>${esc(q.book)}</cite>${q.series && q.series !== q.book ? `, ${esc(q.series)}` : ''} · ${esc(q.author)}</figcaption>
      <div class="quote-actions">
        <button class="linkish" type="button" data-action="quote-next">Une autre citation</button>
        ${q.fr ? `<button class="linkish" type="button" data-action="quote-fr" aria-pressed="${APP.showFr}">${APP.showFr ? 'Masquer la traduction' : 'Lire en français'}</button>` : ''}
      </div>
    </figure>` : ''}`;
  return spread('accueil', left, right);
}

/* =========================================================
   Agenda
   ========================================================= */
const WD_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function viewAgenda() {
  const c = APP.cal;
  if (!c.view) c.view = 'week';
  if (!c.cursor) c.cursor = today();
  const ws = startOfWeek(c.cursor);
  const label = c.view === 'month' ? fmtMonth(monthKey(c.cursor))
    : c.view === 'week' ? `Semaine du ${fmtLong(ws)}`
    : cap(fmt(c.cursor, { weekday: 'long', day: 'numeric', month: 'long' }));
  const head = pageHead('Rendez-vous & projets', 'Agenda');
  const toolbar = `<div class="toolbar">
      <div class="seg" role="group" aria-label="Vue de l'agenda">
        ${[['month', 'Mois'], ['week', 'Semaine'], ['day', 'Jour']].map(([v, l]) => `<button type="button" data-action="cal-view" data-view="${v}" aria-pressed="${c.view === v}">${l}</button>`).join('')}
      </div>
      <div class="period">
        <button class="round sm" type="button" data-action="cal-prev" aria-label="Période précédente">${icon('left')}</button>
        <span class="period-label" aria-live="polite">${esc(label)}</span>
        <button class="round sm" type="button" data-action="cal-next" aria-label="Période suivante">${icon('right')}</button>
        <button class="btn ghost sm" type="button" data-action="cal-today">Aujourd'hui</button>
      </div>
    </div>`;
  let left, right;
  if (c.view === 'month') {
    const weeks = [];
    for (let w = startOfWeek(monthKey(c.cursor) + '-01'); monthKey(w) <= monthKey(c.cursor); w = addDays(w, 7)) weeks.push(w);
    left = `${head}${toolbar}<!--/head--><p class="hint">${isNarrow() ? 'Touche un jour pour voir son détail juste en dessous.' : 'Touche un jour pour voir son détail à droite. Le bouton + ajoute directement un projet.'}</p>${monthGrid(weeks)}
      <div class="legend" aria-hidden="true"><span><i class="l-busy"></i> Rendez-vous</span><span><i class="l-sketch"></i> Croquis à rendre</span><span><i class="l-rest"></i> Repos</span></div>`;
    right = dayDetails(c.cursor) + weekNotes(ws);
  } else if (c.view === 'week') {
    const days = [...Array(7)].map((_, i) => addDays(ws, i));
    left = `${head}${toolbar}<!--/head--><p class="hint">Touche un jour pour y ajouter un projet, ou un rendez-vous pour l'ouvrir.</p><div class="week-grid">${days.map(plannerDay).join('')}</div>${weekNotes(ws)}`;
    right = null;
  } else {
    left = `${head}${toolbar}<!--/head--><p class="hint">Touche un créneau pour y ajouter un projet à cette heure-là.</p>${timeGrid(c.cursor)}`;
    right = dayDetails(c.cursor);
  }
  return spread('agenda', left, right);
}

function monthGrid(weeks) {
  const c = APP.cal.cursor, t = today(), curWeek = startOfWeek(t);
  return `<div class="month">
    <div class="m-head" aria-hidden="true">${WD_SHORT.map((w) => `<div>${w}</div>`).join('')}</div>
    ${weeks.map((ws) => {
      const flag = ws >= curWeek && !restInfo(ws).ok;
      return `<div class="m-row ${flag ? 'needs-rest' : ''}">${[...Array(7)].map((_, i) => {
        const d = addDays(ws, i);
        const list = projectsOn(d);
        const sk = sketchesOn(d);
        const rest = isRestMarked(d);
        const cls = [monthKey(d) !== monthKey(c) && 'out', d === t && 'today', i === 6 && 'sun', rest && 'rest', d === c && 'is-sel'].filter(Boolean).join(' ');
        const items = [...list.map((p) => `<span class="m-name ${p.status}"><b>${esc(clientLabel(p))}</b> ${fmtTime(p.time)}</span>`), ...sk.map((p) => `<span class="m-name sketch">Croquis ${esc(clientLabel(p))}</span>`)];
        const aria = cap(fmtDay(d)) + (rest || i === 6 ? ', repos' : '') + (list.length ? `, ${plural(list.length, 'rendez-vous', 'rendez-vous')}` : '');
        return `<div class="m-cell ${cls}" data-action="cell" data-date="${d}">
          <button type="button" class="m-num" data-action="cell" data-date="${d}" aria-label="${esc(aria)}" aria-pressed="${d === c}">${fromISO(d).getDate()}</button>
          <button type="button" class="round sm m-add" tabindex="-1" data-action="new-at" data-date="${d}" aria-label="Ajouter un projet le ${esc(fmtDay(d))}">${icon('plus')}</button>
          ${items.slice(0, 2).join('')}${items.length > 2 ? `<span class="m-more">+ ${items.length - 2}</span>` : ''}
          <span class="m-dots" aria-hidden="true">${list.filter((p) => p.status !== 'annule').map(() => '<i></i>').join('')}${sk.map(() => '<i class="s"></i>').join('')}</span>
        </div>`;
      }).join('')}</div>`;
    }).join('')}
  </div>`;
}

function plannerDay(d) {
  const t = today();
  const list = projectsOn(d), sk = sketchesOn(d);
  const rest = weekday(d) === 6 || isRestMarked(d);
  return `<section class="pday ${d === t ? 'is-today' : ''} ${rest ? 'is-rest' : ''}" data-action="new-at" data-date="${d}" aria-label="${esc(cap(fmtDay(d)))}">
    <header class="pday-head">
      <button type="button" class="pday-title" data-action="goto-day" data-date="${d}"><span class="pd-wd">${WD_LONG[weekday(d)]}</span> <span class="pd-d">${fromISO(d).getDate()} ${fmt(d, { month: 'short' })}</span></button>
      ${rest ? `<span class="pill rest">${icon('moon')} Repos</span>` : ''}
      <button type="button" class="round sm" data-action="new-at" data-date="${d}" aria-label="Ajouter un projet le ${esc(fmtDay(d))}">${icon('plus')}</button>
    </header>
    ${list.length || sk.length ? `<div class="pday-items">
      ${list.map((p) => `<button type="button" class="ev-row ${p.status}" data-action="open-project" data-id="${p.id}"><span class="ev-time">${fmtTime(p.time)}</span><span class="ev-main"><strong>${esc(clientLabel(p))}${p.status === 'annule' ? ' (annulé)' : ''}</strong><span>${esc(projLabel(p))}</span></span></button>`).join('')}
      ${sk.map((p) => `<button type="button" class="ev-row sketch" data-action="open-project" data-id="${p.id}"><span class="ev-time">${icon('pencil')}</span><span class="ev-main"><strong>Croquis pour ${esc(clientLabel(p))}</strong><span>À envoyer ce jour</span></span></button>`).join('')}
    </div>` : `<p class="pday-empty">${rest ? 'Jour de repos.' : 'Libre. Touche pour ajouter un projet.'}</p>`}
  </section>`;
}

function weekNotes(ws) {
  const info = restInfo(ws);
  const we = addDays(ws, 6);
  const sk = active().filter((p) => p.sketch.due && !p.sketch.sent && p.sketch.due >= ws && p.sketch.due <= we);
  const deps = allPayments().filter((x) => !x.paidOn && x.kind === 'deposit' && x.due >= ws && x.due <= we);
  return `<section class="card" aria-labelledby="c-notes">
    ${cardHead('feather', 'Notes de la semaine', '', 'c-notes')}
    <div class="restline ${info.ok ? '' : 'is-warn'}"><span class="ic">${icon('moon')}</span><span>${info.ok ? `Repos respecté : ${plural(info.free.length, 'jour libre', 'jours libres')} en plus du dimanche.` : esc(restMessage(info))}</span></div>
    ${sk.length || deps.length ? `<ul class="rows">
      ${sk.map((p) => row({ ic: 'pencil', title: `Croquis pour ${clientLabel(p)}`, sub: `À envoyer le ${fmtLong(p.sketch.due)}`, id: p.id, level: p.sketch.due < today() ? 'late' : '' })).join('')}
      ${deps.map((x) => row({ ic: 'euro', title: `Acompte de ${clientLabel(x.p)}`, sub: `Attendu le ${fmtLong(x.due)}`, id: x.p.id, amt: money(x.amount), check: 'deposit', level: x.due < today() ? 'late' : '' })).join('')}
    </ul>` : `<p class="small muted">Aucun croquis ni acompte attendu cette semaine.</p>`}
  </section>`;
}

function evCard(p) {
  const dep = p.deposit.enabled && p.deposit.amount > 0;
  return `<article class="ev-card ${p.status}">
    <button class="ev-card-main" type="button" data-action="open-project" data-id="${p.id}">
      <span class="ev-time">${fmtTime(p.time)}<small>à ${fmtTime(endTime(p))}</small></span>
      <span class="ev-body"><strong>${esc(clientLabel(p))}${p.client.instagram ? ` <span class="muted">@${esc(p.client.instagram)}</span>` : ''}</strong><span>${esc(projLabel(p))}</span></span>
      ${p.photo ? photoImg(p.photo) : '<span></span>'}
    </button>
    <div class="ev-pay">
      ${dep ? `<span class="pill ${p.deposit.paidOn ? 'ok' : 'warn'}">Acompte ${money(p.deposit.amount)} ${p.deposit.paidOn ? 'reçu' : 'attendu'}</span>` : ''}
      <span class="pill ${p.final.paidOn ? 'ok' : ''}">Paiement final ${money(finalAmount(p))} ${p.final.paidOn ? 'reçu' : 'le jour J'}</span>
      ${p.status === 'fait' ? '<span class="pill ok">Réalisé</span>' : p.status === 'annule' ? '<span class="pill bad">Annulé</span>' : ''}
    </div>
  </article>`;
}

function dayDetails(d) {
  const t = today();
  const list = projectsOn(d), sk = sketchesOn(d);
  const deps = allPayments().filter((x) => !x.paidOn && x.kind === 'deposit' && x.due === d);
  const sun = weekday(d) === 6, rest = isRestMarked(d);
  const status = sun ? 'Dimanche : ton jour de repos fixe.' : rest ? 'Jour de repos.' : list.some((p) => p.status !== 'annule') ? 'Jour travaillé.' : 'Jour libre.';
  return `
  ${pageHead(d === t ? "Aujourd'hui" : 'Jour choisi', cap(fmtDay(d)), `<button class="btn primary sm" type="button" data-action="new-at" data-date="${d}">${icon('plus')} Ajouter</button>`, 'h2')}
  <div class="restline ${sun || rest ? 'is-rest' : ''}"><span class="ic">${icon('moon')}</span><span>${status}${rest && list.length ? ' Attention : un rendez-vous y est prévu.' : ''}</span>
    ${sun ? '' : `<button class="btn ghost sm" type="button" data-action="toggle-rest" data-date="${d}" aria-pressed="${rest}">${rest ? 'Retirer le repos' : 'Marquer en repos'}</button>`}</div>
  ${list.length ? list.map(evCard).join('') : `<div class="empty-box"><p>Aucun rendez-vous ce jour-là.</p><button class="btn sm" type="button" data-action="new-at" data-date="${d}">${icon('plus')} Ajouter un projet</button></div>`}
  ${sk.length || deps.length ? `<section class="card">${cardHead('pencil', 'Aussi ce jour-là')}<ul class="rows">
    ${sk.map((p) => row({ ic: 'pencil', title: `Croquis pour ${clientLabel(p)}`, sub: `${projLabel(p)} · RDV le ${fmtLong(p.date)}`, id: p.id })).join('')}
    ${deps.map((x) => row({ ic: 'euro', title: `Acompte de ${clientLabel(x.p)}`, sub: 'Attendu ce jour', id: x.p.id, amt: money(x.amount), check: 'deposit' })).join('')}
  </ul></section>` : ''}`;
}

function layoutLanes(list) {
  const lanes = [];
  const placed = list.map((p) => {
    const start = tMin(p.time), end = start + Math.max(30, Math.round(p.duration * 60));
    let lane = lanes.findIndex((e) => e <= start);
    if (lane === -1) { lane = lanes.length; lanes.push(end); } else lanes[lane] = end;
    return { p, start, end, lane };
  });
  return { placed, count: Math.max(1, lanes.length) };
}

function timeGrid(d) {
  const s = S(), t = today();
  const h0 = Number(s.dayStart), h1 = Math.max(h0 + 1, Number(s.dayEnd));
  const H = h1 - h0;
  const { placed, count } = layoutLanes(projectsOn(d));
  const w = 100 / count;
  const now = d === t && nowMin() >= h0 * 60 && nowMin() <= h1 * 60 ? `<div class="tg-now" style="top:${((nowMin() - h0 * 60) / (H * 60)) * 100}%"></div>` : '';
  return `<div class="tg" style="--rows:${H}">
    <div class="tg-hours" aria-hidden="true">${[...Array(H)].map((_, i) => `<div>${h0 + i}h</div>`).join('')}</div>
    <div class="tg-col ${weekday(d) === 6 ? 'sun' : ''} ${isRestMarked(d) ? 'rest' : ''}" data-action="new-slot" data-date="${d}">
      ${now}
      ${placed.map(({ p, start, end, lane }) => {
        const top = Math.max(0, (start - h0 * 60) / (H * 60)) * 100;
        const height = Math.max(5, (Math.min(end, h1 * 60) - Math.max(start, h0 * 60)) / (H * 60) * 100);
        return `<button type="button" class="ev ${p.status}" data-action="open-project" data-id="${p.id}" style="top:${top}%;height:${height}%;left:calc(${lane * w}% + 4px);width:calc(${w}% - 8px)">
          <strong>${esc(clientLabel(p))} · ${fmtTime(p.time)}–${fmtTime(endTime(p))}</strong><span>${esc(projLabel(p))}</span></button>`;
      }).join('')}
    </div>
  </div>`;
}

/* =========================================================
   Fiche projet
   ========================================================= */
function newProject(preset = {}) {
  const s = S();
  return normProject({
    id: uid(), title: '', date: preset.date || today(), time: preset.time || s.defaultTime, duration: s.defaultDuration,
    status: 'prevu', price: 0, method: s.defaultMethod,
    client: { name: '', instagram: '', other: '' },
    deposit: { enabled: true, amount: 0, due: '', paidOn: '' },
    final: { paidOn: '' },
    sketch: { due: '', remindDays: s.defaultRemind, sent: false },
    notes: '', photo: '', createdAt: new Date().toISOString(),
  });
}

let draft = null;        // projet en cours d'édition dans la fenêtre
let draftSnap = '';      // état à l'ouverture, pour repérer une saisie non enregistrée
let draftOrigDate = null;

function openProject(id, preset) {
  const existing = id ? findP(id) : null;
  draft = existing ? clone(existing) : preset && preset.template ? normProject(clone(preset.template)) : newProject(preset);
  draftOrigDate = existing ? existing.date : null;
  const p = draft;
  const isNew = !existing;
  const durOpts = [];
  for (let h = 0.5; h <= 10; h += 0.5) durOpts.push(h);
  const remOpts = [['', 'Pas de rappel'], ['0', 'Le jour même'], ['1', '1 jour avant'], ['2', '2 jours avant'], ['3', '3 jours avant'], ['5', '5 jours avant'], ['7', '1 semaine avant'], ['14', '2 semaines avant']];
  const rd = p.sketch.remindDate ? 'date' : p.sketch.remindDays === null ? '' : String(p.sketch.remindDays);
  if (rd && rd !== 'date' && !remOpts.some(([v]) => v === rd)) remOpts.push([rd, `${rd} jours avant`]);
  remOpts.push(['date', 'À une date précise…']);
  const hasExtra = !!(p.notes || p.photo);
  const sheet = $('#sheet');
  sheet.innerHTML = `<form class="sheet-form" id="pf" novalidate>
    <div class="sheet-handle" aria-hidden="true"></div>
    <header class="sheet-head">
      <span class="sheet-medal" aria-hidden="true">${icon('feather')}</span>
      <div>
        <p class="sheet-kicker">Catalogue des projets${isNew ? ' · nouvelle entrée' : ''}</p>
        <h2 class="title-gold" id="pf-title" tabindex="-1">${isNew ? 'Nouveau projet' : 'Fiche projet'}</h2>
        <p class="form-summary" id="pf-summary"></p>
      </div>
      <button type="button" class="icon-btn" data-action="close-sheet" aria-label="Fermer">${icon('close')}</button>
    </header>
    <nav class="sheet-steps" aria-label="Aller à une section de la fiche">
      ${[['fs-client', 'Cliente'], ['fs-rdv', 'Rendez-vous'], ['fs-pay', 'Paiement'], ['fs-sketch', 'Croquis'], ['fs-notes', 'Notes']].map(([id, l], k) => `<button type="button" class="step" data-action="sheet-jump" data-target="${id}"><span class="step-n" aria-hidden="true">${['I', 'II', 'III', 'IV', 'V'][k]}</span>${l}</button>`).join('')}
    </nav>
    <div class="sheet-body">
      <div id="pf-warn" class="notice-list" aria-live="polite"></div>

      <fieldset id="fs-client" tabindex="-1">
        <legend>Cliente & projet</legend>
        <div class="grid-3">
          <div class="field">
            <label for="f-client">Prénom <span class="hint">(obligatoire)</span></label>
            <input class="input" id="f-client" name="client" value="${esc(p.client.name)}" autocomplete="off" list="dl-clients" required aria-describedby="e-client">
            <datalist id="dl-clients">${APP.state.clients.map((c) => `<option value="${esc(c.name)}">${c.instagram ? '@' + esc(c.instagram) : ''}</option>`).join('')}</datalist>
            <p class="error" id="e-client"></p>
          </div>
          <div class="field">
            <label for="f-insta">Instagram</label>
            <div class="input-affix pre"><span class="affix">@</span><input class="input" id="f-insta" name="insta" value="${esc(p.client.instagram)}" placeholder="pseudo" autocomplete="off"></div>
          </div>
          <div class="field">
            <label for="f-other">Autre réseau</label>
            <input class="input" id="f-other" name="other" value="${esc(p.client.other)}" placeholder="TikTok, Facebook…" autocomplete="off">
          </div>
        </div>
        ${p.clientId && clientById(p.clientId) ? `<p class="small"><button type="button" class="linkish" data-action="client-open" data-id="${p.clientId}">${icon('users')} Voir sa fiche cliente</button></p>` : ''}
        <div class="field">
          <label for="f-title">Nom du projet</label>
          <input class="input" id="f-title" name="title" value="${esc(p.title)}" placeholder="Ex. : Papillon de nuit, avant-bras">
        </div>
      </fieldset>

      <fieldset id="fs-rdv" tabindex="-1">
        <legend>Rendez-vous</legend>
        <div class="grid-3">
          <div class="field">
            <label for="f-date">Jour</label>
            <input class="input" type="date" id="f-date" name="date" value="${esc(p.date)}" required aria-describedby="e-date">
            <p class="error" id="e-date"></p>
          </div>
          <div class="field">
            <label for="f-time">Heure</label>
            <input class="input" type="time" id="f-time" name="time" value="${esc(p.time)}" step="900" required>
          </div>
          <div class="field">
            <label for="f-duration">Durée</label>
            <select class="select" id="f-duration" name="duration">${durOpts.map((h) => `<option value="${h}" ${h === p.duration ? 'selected' : ''}>${String(h).replace('.', ',')} h</option>`).join('')}</select>
          </div>
        </div>
        ${isNew ? '<input type="hidden" name="status" value="prevu">' : `<div class="field">
          <span class="label" id="l-status">Statut</span>
          <div class="seg" role="radiogroup" aria-labelledby="l-status">
            ${[['prevu', 'Prévu'], ['fait', 'Réalisé'], ['annule', 'Annulé']].map(([v, l]) => `<label><input type="radio" name="status" value="${v}" ${p.status === v ? 'checked' : ''}>${l}</label>`).join('')}
          </div>
        </div>`}
      </fieldset>

      ${(() => {
        const si = isNew && !p.groupId ? null : sessionInfo(p);
        const total = si ? si.all.reduce((t, x) => t + (x.status === 'annule' ? 0 : x.price), 0) : 0;
        const paid = si ? si.all.flatMap(paymentsOf).filter((x) => x.paidOn).reduce((t, x) => t + x.amount, 0) : 0;
        const st = (x) => x.status === 'fait' ? 'réalisée' : x.status === 'annule' ? 'annulée' : 'prévue';
        return `<div class="sessions" id="pf-sessions">
          ${si ? `<p class="label">${icon('layers')} Projet en ${si.n} séances</p>
          <ol class="session-list">${si.all.map((x, k) => `<li><button type="button" class="session ${x.id === p.id ? 'is-current' : ''}" data-action="open-session" data-id="${x.id}" ${x.id === p.id ? 'aria-current="true" disabled' : ''}>
            <span class="session-n">Séance ${k + 1}</span><span>${cap(fmt(x.date, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${fmtTime(x.time)}</span><span class="faint small">${st(x)} · ${money(x.price)}</span></button></li>`).join('')}</ol>
          <p class="small">Total du projet : <strong>${money(total)}</strong> · déjà réglé : <strong>${money(paid)}</strong> · reste : <strong>${money(Math.max(0, total - paid))}</strong></p>` : ''}
          <button type="button" class="btn sm" data-action="add-session">${icon('plus')} ${si ? 'Ajouter une séance' : 'Projet en plusieurs séances ? Ajouter une séance'}</button>
        </div>`;
      })()}

      <fieldset id="fs-pay" tabindex="-1">
        <legend>Paiement</legend>
        <div class="grid-2">
          <div class="field">
            <label for="f-price">Prix total</label>
            <div class="input-affix"><input class="input num" id="f-price" name="price" inputmode="decimal" value="${p.price || ''}" aria-describedby="e-price"><span class="affix">€</span></div>
            <p class="error" id="e-price"></p>
          </div>
          <div class="field">
            <span class="label" id="l-method">Paiement par</span>
            <div class="seg" role="radiogroup" aria-labelledby="l-method">
              ${[['paypal', 'PayPal'], ['virement', 'Virement bancaire']].map(([v, l]) => `<label><input type="radio" name="method" value="${v}" ${p.method === v ? 'checked' : ''}>${l}</label>`).join('')}
            </div>
          </div>
        </div>
        <label class="check"><input type="checkbox" id="f-dep-on" name="depOn" ${p.deposit.enabled ? 'checked' : ''}> Ce projet a un acompte</label>
        <div class="subbox" id="dep-box" ${p.deposit.enabled ? '' : 'hidden'}>
          <div class="grid-2">
            <div class="field">
              <label for="f-dep">Montant de l'acompte</label>
              <div class="input-affix"><input class="input num" id="f-dep" name="depAmount" inputmode="decimal" value="${p.deposit.amount || ''}" aria-describedby="e-dep"><span class="affix">€</span></div>
              <p class="error" id="e-dep"></p>
            </div>
            <div class="field">
              <label for="f-dep-due">À demander pour le <span class="hint">(facultatif)</span></label>
              <input class="input" type="date" id="f-dep-due" name="depDue" value="${esc(p.deposit.due)}">
            </div>
          </div>
          <div class="grid-2">
            <label class="check"><input type="checkbox" id="f-dep-paid" name="depPaid" ${p.deposit.paidOn ? 'checked' : ''}> Acompte reçu</label>
            <div class="field" id="dep-paid-box" ${p.deposit.paidOn ? '' : 'hidden'}>
              <label for="f-dep-paidon">Reçu le</label>
              <input class="input" type="date" id="f-dep-paidon" name="depPaidOn" value="${esc(p.deposit.paidOn || today())}">
            </div>
          </div>
        </div>
        <div class="subbox">
          <div class="calc-line"><span>Paiement final, le jour du rendez-vous</span><span class="num" id="final-amt">${money(finalAmount(p))}</span></div>
          <div class="grid-2">
            <label class="check"><input type="checkbox" id="f-fin-paid" name="finPaid" ${p.final.paidOn ? 'checked' : ''}> Paiement final reçu</label>
            <div class="field" id="fin-paid-box" ${p.final.paidOn ? '' : 'hidden'}>
              <label for="f-fin-paidon">Reçu le</label>
              <input class="input" type="date" id="f-fin-paidon" name="finPaidOn" value="${esc(p.final.paidOn || p.date)}">
            </div>
          </div>
          <p class="faint" id="shop-line"></p>
        </div>
      </fieldset>

      <fieldset id="fs-sketch" tabindex="-1">
        <legend>Croquis</legend>
        <div class="grid-3">
          <div class="field">
            <label for="f-sk-due">Date de rendu du croquis</label>
            <input class="input" type="date" id="f-sk-due" name="skDue" value="${esc(p.sketch.due)}">
          </div>
          <div class="field">
            <label for="f-sk-rem">Me le rappeler</label>
            <select class="select" id="f-sk-rem" name="skRemind">${remOpts.map(([v, l]) => `<option value="${v}" ${v === rd ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
          <div class="field" id="sk-time-box" ${rd === '' ? 'hidden' : ''}>
            <label for="f-sk-time">À</label>
            <input class="input" type="time" id="f-sk-time" name="skRemTime" step="300" value="${esc(p.sketch.remindTime || S().notifHour || '08:30')}">
          </div>
        </div>
        <div class="field" id="sk-date-box" ${rd === 'date' ? '' : 'hidden'}>
          <label for="f-sk-date">Date du rappel</label>
          <input class="input" type="date" id="f-sk-date" name="skRemDate" value="${esc(p.sketch.remindDate || '')}">
        </div>
        <p class="small muted" id="sk-hint" aria-live="polite"></p>
        <label class="check"><input type="checkbox" id="f-sk-sent" name="skSent" ${p.sketch.sent ? 'checked' : ''}> Croquis envoyé à la cliente</label>
      </fieldset>

      <details class="fold sheet-fold" id="fs-notes" ${hasExtra ? 'open' : ''}>
        <summary>Notes & photo${hasExtra ? '' : ' <span class="faint">(facultatif)</span>'}</summary>
        <div>
          <div class="field">
            <label for="f-notes">Notes du projet</label>
            <textarea class="textarea" id="f-notes" name="notes" placeholder="Emplacement, taille, style, idées…">${esc(p.notes)}</textarea>
          </div>
          <div class="photo-row">
            <div id="photo-slot">${photoSlot(p.photo)}</div>
            <div style="display:grid;gap:8px">
              <span class="btn sm file-btn">${icon('image')} ${p.photo ? 'Changer la photo' : 'Ajouter une photo'}<input type="file" id="f-photo" accept="image/*" aria-label="Choisir une photo du projet"></span>
              <button type="button" class="btn sm ghost" data-action="remove-photo" ${p.photo ? '' : 'hidden'} id="photo-remove">${icon('trash')} Retirer la photo</button>
            </div>
          </div>
        </div>
      </details>
    </div>
    <footer class="sheet-foot">
      <div class="left">
        ${isNew ? '' : `<span id="del-zone"><button type="button" class="btn danger sm" data-action="ask-delete">${icon('trash')} Supprimer</button></span>`}
      </div>
      <span id="close-zone" class="confirm-inline" hidden>Fermer sans enregistrer ?
        <button type="button" class="btn sm" data-action="keep-editing">Continuer la saisie</button>
        <button type="button" class="btn danger sm" data-action="force-close">Fermer</button>
      </span>
      <button type="button" class="btn ghost" data-action="close-sheet">Annuler</button>
      <button type="submit" class="btn primary">${icon('check')} Enregistrer</button>
    </footer>
  </form>`;
  const f = $('#pf');
  f.addEventListener('input', onFormInput);
  f.addEventListener('change', onFormInput);
  f.addEventListener('submit', onFormSubmit);
  $('#f-photo').addEventListener('change', onPhoto);
  sheet.setAttribute('aria-labelledby', 'pf-title');
  sheet.showModal();
  hydratePhotos(sheet);
  readForm(f);
  draftSnap = JSON.stringify(draft);
  updateFormHints();
  if (isNew) $('#f-client').focus(); else $('#pf-title').focus();
}

function requestClose() {
  const f = $('#pf');
  const sheet = $('#sheet');
  if (!f) { sheet.close(); return; }
  readForm(f);
  if (JSON.stringify(draft) === draftSnap) { sheet.close(); return; }
  const z = $('#close-zone');
  z.hidden = false;
  $('[data-action="keep-editing"]', z).focus();
}

function refreshShell() {
  const y = window.scrollY;
  renderShell(); route(); hydratePhotos(document);
  window.scrollTo(0, y);
}
async function onProfilePhoto(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2, sy = Math.max(0, (img.height - side) * 0.3); // un peu vers le haut : le visage
  const c = document.createElement('canvas');
  c.width = c.height = 320;
  c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 320, 320);
  URL.revokeObjectURL(url);
  if (APP.mode === 'private' && SYNC.email) {
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    S().profilePhoto = await storePhoto(blob);
  } else {
    S().profilePhoto = c.toDataURL('image/jpeg', 0.86);
  }
  APP.state.settingsAt = Date.now();
  save();
  refreshShell();
  toast('Photo de profil enregistrée');
}
function photoSlot(src) {
  return src ? photoImg(src, 'photo-prev', 'Photo du projet') : `<div class="photo-empty" aria-hidden="true">${icon('image')}</div>`;
}

function readForm(f) {
  const p = draft;
  const v = (n) => (f.elements[n] ? String(f.elements[n].value).trim() : '');
  p.title = v('title');
  p.client = { name: v('client'), instagram: v('insta').replace(/^@+/, ''), other: v('other') };
  p.date = v('date');
  p.time = v('time') || S().defaultTime;
  p.duration = num(v('duration')) || 3;
  p.status = f.elements.status.value || 'prevu';
  p.price = num(v('price'));
  p.method = f.elements.method.value || 'paypal';
  const depOn = f.elements.depOn.checked;
  p.deposit = { enabled: depOn, amount: depOn ? num(v('depAmount')) : 0, due: depOn ? v('depDue') : '', paidOn: depOn && f.elements.depPaid.checked ? (v('depPaidOn') || today()) : '' };
  p.final = { paidOn: f.elements.finPaid.checked ? (v('finPaidOn') || p.date) : '' };
  const rem = v('skRemind');
  p.sketch = {
    due: v('skDue'),
    remindDays: rem === '' || rem === 'date' ? null : Number(rem),
    remindDate: rem === 'date' ? v('skRemDate') : '',
    remindTime: rem === '' ? '' : v('skRemTime'),
    sent: f.elements.skSent.checked,
  };
  p.notes = f.elements.notes.value;
  return p;
}

function onFormInput(e) {
  const f = $('#pf');
  if (e.target.name === 'depOn') $('#dep-box').hidden = !e.target.checked;
  if (e.target.name === 'depPaid') { $('#dep-paid-box').hidden = !e.target.checked; if (e.target.checked && !$('#f-dep-paidon').value) $('#f-dep-paidon').value = today(); }
  if (e.target.name === 'finPaid') { $('#fin-paid-box').hidden = !e.target.checked; if (e.target.checked) $('#f-fin-paidon').value = $('#f-fin-paidon').value || $('#f-date').value || today(); }
  if (e.target.name === 'date' && !$('#f-fin-paid').checked) $('#f-fin-paidon').value = e.target.value;
  if (e.target.name === 'client') {
    const c = APP.state.clients.find((x) => x.name.toLowerCase() === e.target.value.trim().toLowerCase());
    if (c && !$('#f-insta').value && c.instagram) $('#f-insta').value = c.instagram;
    if (c && !$('#f-other').value && c.other) $('#f-other').value = c.other;
  }
  if (e.target.name === 'skRemind') {
    $('#sk-date-box').hidden = e.target.value !== 'date';
    $('#sk-time-box').hidden = e.target.value === '';
    if (e.target.value === 'date' && !$('#f-sk-date').value) $('#f-sk-date').value = $('#f-sk-due').value ? addDays($('#f-sk-due').value, -1) : today();
  }
  if (e.target.id && e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); }
  readForm(f);
  updateFormHints();
}

function updateFormHints() {
  const p = draft;
  const fa = $('#final-amt');
  if (fa) fa.textContent = money(finalAmount(p));
  const shop = $('#shop-line');
  if (shop) {
    const cut = round2((S().shopRate / 100) * (S().shopBase === 'solde' ? finalAmount(p) : p.price));
    shop.textContent = p.price > 0 ? `Part du shop (${pct(S().shopRate)}), déduite au paiement final : ${money(cut)}.` : '';
  }
  const sum = $('#pf-summary');
  if (sum) sum.textContent = [p.client.name || 'Nouvelle cliente', p.date ? `${fmt(p.date, { weekday: 'short', day: 'numeric', month: 'short' })}, ${fmtTime(p.time)}–${fmtTime(endTime(p))}` : '', p.price ? money(p.price) : ''].filter(Boolean).join(' · ');
  const calm = [], warn = [];
  // Les conseils de repos ne s'affichent que pour un nouveau projet ou une date modifiée.
  if (p.date && p.status !== 'annule' && p.date !== draftOrigDate) {
    if (weekday(p.date) === 6) calm.push("C'est un dimanche, ton jour de repos.");
    if (isRestMarked(p.date)) calm.push('Tu avais marqué ce jour comme jour de repos.');
    if (!activeOn(p.date, p.id) && weekday(p.date) !== 6) {
      const info = restInfo(startOfWeek(p.date), { date: p.date, excludeId: p.id });
      if (info.free.length === 0) calm.push(`Avec ce rendez-vous, la semaine du ${fmtLong(info.ws)} n'aurait plus de jour libre en plus du dimanche.`);
    }
  }
  if (p.deposit.enabled && p.deposit.amount > p.price && p.price > 0) warn.push("L'acompte est plus élevé que le prix total.");
  const hint = $('#sk-hint');
  if (hint) {
    const on = sketchRemindOn(p);
    const lw = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
    hint.textContent = p.sketch.sent ? 'Croquis envoyé : plus de rappel.'
      : !p.sketch.due ? (p.sketch.remindDays !== null || p.sketch.remindDate ? 'Indique la date de rendu pour programmer le rappel.' : '')
      : !on ? 'Pas de rappel pour ce croquis.'
      : on > p.sketch.due ? 'Le rappel tombe après la date de rendu : choisis une date plus tôt.'
      : `Rappel le ${lw(on)} à ${fmtTime(sketchRemindTime(p))}${on < p.sketch.due ? `, puis le jour du rendu (${lw(p.sketch.due)}) si le croquis n’est pas encore envoyé` : ''}.`;
  }
  const box = $('#pf-warn');
  if (box) box.innerHTML = calm.map((w) => `<div class="notice calm">${icon('moon')}<p>${esc(w)}</p></div>`).join('')
    + warn.map((w) => `<div class="notice warn">${icon('alert')}<p>${esc(w)}</p></div>`).join('');
}

function onPhoto(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const show = () => { $('#photo-slot').innerHTML = photoSlot(draft.photo); $('#photo-remove').hidden = false; };
      if (APP.mode === 'private' && SYNC.email) {
        c.toBlob(async (blob) => { draft.photo = await storePhoto(blob); show(); }, 'image/jpeg', 0.82);
      } else {
        draft.photo = c.toDataURL('image/jpeg', 0.82);
        show();
      }
    };
    img.onerror = () => toast("Cette image n'a pas pu être lue. Essaie un fichier JPG ou PNG.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function validateDraft(p) {
  const errs = [];
  const setErr = (field, id, msg) => { $('#' + id).textContent = msg; if (msg) { $('#' + field).setAttribute('aria-invalid', 'true'); errs.push(field); } };
  setErr('f-client', 'e-client', p.client.name ? '' : 'Indique au moins le prénom de la cliente.');
  setErr('f-date', 'e-date', p.date ? '' : 'Choisis le jour du rendez-vous.');
  setErr('f-price', 'e-price', p.price >= 0 ? '' : 'Le prix doit être un nombre positif.');
  setErr('f-dep', 'e-dep', p.deposit.enabled && p.deposit.amount > p.price && p.price > 0 ? "L'acompte ne peut pas dépasser le prix total." : '');
  if (errs.length) { $('#' + errs[0]).focus(); return false; }
  return true;
}
function commitDraft(p) {
  const fromReq = p._fromRequest; delete p._fromRequest;
  const c = ensureClientIn(APP.state, p.client, true);
  p.clientId = c.id;
  const list = APP.state.projects;
  const i = list.findIndex((x) => x.id === p.id);
  const before = i >= 0 ? list[i] : null;
  p.updatedAt = Date.now();
  if (i >= 0) list[i] = p; else list.push(p);

  // Déduction automatique d'aiguille (réglage) quand un projet passe à « Réalisé ».
  if (S().autoNeedle && p.status === 'fait' && (!before || before.status !== 'fait')) {
    const it = needles();
    if (it) moveStock(it, -(it.perProject || 1), `Projet de ${clientLabel(p)}`);
  }
  // Les séances d'un même projet partagent la cliente et le titre.
  for (const x of sessionsOf(p)) if (x.id !== p.id && (x.title !== p.title || x.clientId !== p.clientId || x.client.name !== p.client.name || x.client.instagram !== p.client.instagram)) {
    x.title = p.title; x.client = { ...p.client }; x.clientId = p.clientId; x.updatedAt = Date.now();
  }
  if (fromReq) { const r = APP.state.requests.find((x) => x.id === fromReq); if (r) { r.status = 'acceptee'; r.projectId = p.id; r.updatedAt = Date.now(); } }
  save();
  return i;
}
function onFormSubmit(e) {
  e.preventDefault();
  const p = readForm($('#pf'));
  if (!validateDraft(p)) return;
  const i = commitDraft(p);
  $('#sheet').close();
  render();
  const el = $(`#view [data-action="open-project"][data-id="${p.id}"]`);
  (el || $('#view')).focus();
  toast(i >= 0 ? 'Projet enregistré' : 'Projet ajouté à l’agenda');
}

/* =========================================================
   Clientes : fiches clientes et demandes de projets en attente
   ========================================================= */
const REQ_STEPS = [['nouvelle', 'Nouvelles'], ['discussion', 'En discussion'], ['croquis', 'Croquis en cours']];
const REQ_LABEL = { nouvelle: 'Nouvelle', discussion: 'En discussion', croquis: 'Croquis en cours', acceptee: 'Planifiée', refusee: 'Refusée' };
const fold = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/^@/, '');
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function clientStats(c) {
  const ps = projectsOfClient(c).sort(byDateTime);
  const paid = ps.flatMap(paymentsOf).filter((x) => x.paidOn).reduce((t, x) => t + x.amount, 0);
  const next = ps.filter((p) => p.status === 'prevu' && p.date >= today())[0];
  const last = ps.filter((p) => p.date <= today() && p.status !== 'annule').pop();
  const groups = new Map();
  for (const p of ps) { const k = p.groupId || p.id; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  return { ps, paid, next, last, groups: [...groups.values()] };
}

function viewClientes() {
  const tab = APP.clientTab || 'fiches';
  const reqs = APP.state.requests;
  const openReqs = reqs.filter((r) => REQ_STEPS.some(([k]) => k === r.status));
  const head = `${pageHead('Fiches & demandes', 'Clientes')}
    <div class="seg tab-seg" role="tablist" aria-label="Clientes">
      <button type="button" role="tab" data-action="client-tab" data-view="fiches" aria-selected="${tab === 'fiches'}" aria-pressed="${tab === 'fiches'}">${icon('users')} Fiches clientes <span class="count">${APP.state.clients.length}</span></button>
      <button type="button" role="tab" data-action="client-tab" data-view="demandes" aria-selected="${tab === 'demandes'}" aria-pressed="${tab === 'demandes'}">${icon('inbox')} Demandes en attente <span class="count">${openReqs.length}</span></button>
    </div><!--/head-->`;
  return tab === 'demandes' ? spread('clientes', head + requestsBody(openReqs), null) : clientsBody(head);
}

function clientsBody(head) {
  const t = today();
  const list = APP.state.clients.map((c) => ({ c, st: clientStats(c) }))
    .sort((a, b) => (a.st.next ? 0 : 1) - (b.st.next ? 0 : 1) || (a.st.next && b.st.next ? byDateTime(a.st.next, b.st.next) : 0) || ((b.st.last && b.st.last.date) || '').localeCompare((a.st.last && a.st.last.date) || '') || a.c.name.localeCompare(b.c.name));
  const sel = clientById(APP.clientSel) || (list[0] && list[0].c);
  if (sel) APP.clientSel = sel.id;
  const q = APP.clientQuery || '';
  const left = `${head}
    <section class="card" aria-labelledby="c-cl-list">
      ${cardHead('users', 'Toutes les clientes', `<span class="count">${list.length}</span>`, 'c-cl-list')}
      <div class="field"><label class="sr-only" for="cl-search">Rechercher une cliente</label>
        <input class="input" id="cl-search" type="search" placeholder="Rechercher par prénom ou Instagram" value="${esc(q)}" autocomplete="off"></div>
      ${list.length ? `<ul class="client-list">${list.map(({ c, st }) => `<li data-search="${esc(fold(c.name + ' ' + c.instagram))}" ${q && !fold(c.name + ' ' + c.instagram).includes(fold(q)) ? 'hidden' : ''}>
        <button type="button" class="client-item ${sel && sel.id === c.id ? 'is-sel' : ''}" data-action="client-sel" data-id="${c.id}" aria-pressed="${!!(sel && sel.id === c.id)}">
          <span class="client-avatar" aria-hidden="true">${esc(initials(c.name))}</span>
          <span class="client-main"><strong>${esc(c.name || 'Sans prénom')}</strong><span>${c.instagram ? '@' + esc(c.instagram) + ' · ' : ''}${plural(st.groups.length, 'projet', 'projets')}</span></span>
          <span class="client-when">${st.next ? `<span class="pill gold">${fmtShort(st.next.date)}</span>` : st.last ? `<span class="faint small">${fmtShort(st.last.date)}</span>` : ''}</span>
        </button></li>`).join('')}</ul>
        <p class="empty" id="cl-none" ${q && !list.some(({ c }) => fold(c.name + ' ' + c.instagram).includes(fold(q))) ? '' : 'hidden'}>Aucune cliente ne correspond.</p>` : `<p class="empty">Les fiches se créent toutes seules à chaque projet ou demande. Tu peux aussi en ajouter une ci-dessous.</p>`}
      <details class="fold"><summary>+ Ajouter une cliente</summary><div>
        <form class="inline-form" id="cl-new">
          <div class="field"><label for="cln-name">Prénom</label><input class="input" id="cln-name" autocomplete="off"></div>
          <div class="field"><label for="cln-insta">Instagram</label><div class="input-affix pre"><span class="affix">@</span><input class="input" id="cln-insta" autocomplete="off"></div></div>
          <button class="btn" type="submit">${icon('plus')} Ajouter</button>
        </form></div></details>
    </section>`;
  if (!sel) return spread('clientes', left, `<section class="card"><p class="empty">Aucune fiche cliente pour l'instant.</p></section>`);
  const st = clientStats(sel);
  const right = `
    <section class="card client-card" id="client-detail" aria-labelledby="c-cl-name" tabindex="-1">
      <div class="client-id">
        <span class="client-avatar lg" aria-hidden="true">${esc(initials(sel.name))}</span>
        <div><h2 class="card-title" id="c-cl-name">${esc(sel.name || 'Sans prénom')}</h2>
        ${sel.instagram ? `<a class="small" href="https://instagram.com/${encodeURIComponent(sel.instagram)}" target="_blank" rel="noopener">@${esc(sel.instagram)} ↗</a>` : '<span class="small faint">Pas d’Instagram renseigné</span>'}</div>
      </div>
      <div class="client-tiles">
        <div class="ctile"><span>Projets</span><strong>${st.groups.length}</strong></div>
        <div class="ctile"><span>Total réglé</span><strong>${money(st.paid)}</strong></div>
        <div class="ctile"><span>Prochain RDV</span><strong>${st.next ? fmtShort(st.next.date) : '—'}</strong></div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn primary" data-action="client-new-project" data-id="${sel.id}">${icon('plus')} Nouveau projet</button>
        <button type="button" class="btn" data-action="client-new-request" data-id="${sel.id}">${icon('inbox')} Nouvelle demande</button>
      </div>
      <div class="field"><label for="cf-notes">Notes sur elle <span class="hint">(peau, allergies, préférences, retouches…)</span></label>
        <textarea class="textarea" id="cf-notes" data-client-field="notes" data-id="${sel.id}" placeholder="Ex. : peau sensible, préfère le fine line, retouche offerte">${esc(sel.notes || '')}</textarea></div>
      <details class="fold"><summary>Modifier ses coordonnées</summary><div class="grid-3">
        <div class="field"><label for="cf-name">Prénom</label><input class="input" id="cf-name" data-client-field="name" data-id="${sel.id}" value="${esc(sel.name)}"></div>
        <div class="field"><label for="cf-insta">Instagram</label><div class="input-affix pre"><span class="affix">@</span><input class="input" id="cf-insta" data-client-field="instagram" data-id="${sel.id}" value="${esc(sel.instagram)}"></div></div>
        <div class="field"><label for="cf-other">Autre réseau</label><input class="input" id="cf-other" data-client-field="other" data-id="${sel.id}" value="${esc(sel.other)}"></div>
      </div>${st.ps.length ? '' : `<div class="btn-row"><button type="button" class="btn danger sm" data-action="client-del" data-id="${sel.id}">${icon('trash')} Supprimer cette fiche</button></div>`}</details>
    </section>
    <section class="card" aria-labelledby="c-cl-hist">
      ${cardHead('feather', 'Ses projets', '', 'c-cl-hist')}
      ${st.groups.length ? `<ul class="rows">${st.groups.slice().reverse().map((g) => {
        const first = g[0], lastS = g[g.length - 1];
        const total = g.reduce((t, x) => t + (x.status === 'annule' ? 0 : x.price), 0);
        const paid = g.flatMap(paymentsOf).filter((x) => x.paidOn).reduce((t, x) => t + x.amount, 0);
        const target = g.find((x) => x.status === 'prevu' && x.date >= today()) || lastS;
        return row({ ic: g.length > 1 ? 'layers' : 'calendar', id: target.id,
          title: (first.title || 'Projet sans titre') + (g.length > 1 ? ` · ${g.length} séances` : ''),
          sub: `${g.length > 1 ? `Du ${fmtShort(first.date)} au ${fmtShort(lastS.date)}` : fmtLong(first.date)} · réglé ${money(paid)} sur ${money(total)}`,
          amt: paid >= total && total > 0 ? '<span class="pill ok">Soldé</span>' : '' });
      }).join('')}</ul>` : `<p class="empty">Pas encore de projet avec elle.</p>`}
    </section>
    ${APP.state.requests.filter((r) => r.clientId === sel.id).length ? `<section class="card" aria-labelledby="c-cl-req">
      ${cardHead('inbox', 'Ses demandes', '', 'c-cl-req')}
      <ul class="rows">${APP.state.requests.filter((r) => r.clientId === sel.id).map((r) => `<li class="row"><span class="ic">${icon('inbox')}</span><button class="row-main" type="button" data-action="client-tab" data-view="demandes"><span class="row-title">${esc(r.idea || 'Demande')}</span><span class="row-sub">${REQ_LABEL[r.status] || r.status} · reçue le ${fmtShort(r.createdAt.slice(0, 10))}</span></button><span></span><span></span></li>`).join('')}</ul>
    </section>` : ''}`;
  return spread('clientes', left, right);
}

function requestsBody(openReqs) {
  const edit = APP.state.requests.find((r) => r.id === APP.reqEdit);
  const archived = APP.state.requests.filter((r) => !REQ_STEPS.some(([k]) => k === r.status)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const card = (r) => {
    const age = diffDays(r.createdAt.slice(0, 10), today());
    const meta = [r.placement, r.size, r.budget ? `budget ${r.budget}` : '', r.wanted ? `souhaité : ${r.wanted}` : ''].filter(Boolean).join(' · ');
    return `<article class="req-card" aria-label="Demande de ${esc(r.name)}">
      <header class="req-head"><span class="client-avatar" aria-hidden="true">${esc(initials(r.name))}</span>
        <div class="req-who"><strong>${esc(r.name)}</strong><span class="small faint">${r.instagram ? '@' + esc(r.instagram) + ' · ' : ''}${age === 0 ? "reçue aujourd'hui" : age === 1 ? 'reçue hier' : `reçue il y a ${age} jours`}</span></div></header>
      <p class="req-idea">${esc(r.idea)}</p>
      ${meta ? `<p class="small muted">${esc(meta)}</p>` : ''}
      ${r.notes ? `<p class="small">${esc(r.notes)}</p>` : ''}
      <div class="field"><label class="label small" for="rs-${r.id}">Étape</label>
        <select class="select" id="rs-${r.id}" data-req-status data-id="${r.id}">${REQ_STEPS.map(([k, l]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${REQ_LABEL[k]}</option>`).join('')}</select></div>
      <div class="btn-row">
        <button type="button" class="btn primary sm" data-action="req-plan" data-id="${r.id}">${icon('calendar')} Planifier</button>
        <button type="button" class="btn sm" data-action="req-edit" data-id="${r.id}">Modifier</button>
        <button type="button" class="btn sm ghost" data-action="req-refuse" data-id="${r.id}">Refuser</button>
      </div>
    </article>`;
  };
  return `
    <section class="card" aria-labelledby="c-req-form" id="req-form-card">
      ${cardHead('inbox', edit ? `Modifier la demande de ${esc(edit.name)}` : 'Nouvelle demande', '', 'c-req-form')}
      <details class="fold req-fold" ${edit || !APP.state.requests.length ? 'open' : ''}><summary>${edit ? 'Modifier' : 'Noter une demande reçue (DM, e-mail, en personne…)'}</summary><div>
      <form id="req-form" novalidate><datalist id="dl-clients">${APP.state.clients.map((c) => `<option value="${esc(c.name)}">${c.instagram ? '@' + esc(c.instagram) : ''}</option>`).join('')}</datalist>
        <div class="grid-3">
          <div class="field"><label for="rq-name">Prénom <span class="hint">(obligatoire)</span></label><input class="input" id="rq-name" list="dl-clients" value="${esc(edit ? edit.name : APP.reqPrefill ? APP.reqPrefill.name : '')}" autocomplete="off"><p class="error" id="e-rq-name"></p></div>
          <div class="field"><label for="rq-insta">Instagram</label><div class="input-affix pre"><span class="affix">@</span><input class="input" id="rq-insta" value="${esc(edit ? edit.instagram : APP.reqPrefill ? APP.reqPrefill.instagram : '')}" autocomplete="off"></div></div>
          <div class="field"><label for="rq-when">Date souhaitée</label><input class="input" id="rq-when" value="${esc(edit ? edit.wanted : '')}" placeholder="Ex. : avant l’été, en mars"></div>
        </div>
        <div class="field"><label for="rq-idea">Son idée <span class="hint">(obligatoire)</span></label><input class="input" id="rq-idea" value="${esc(edit ? edit.idea : '')}" placeholder="Ex. : papillon de nuit avec des fougères"><p class="error" id="e-rq-idea"></p></div>
        <div class="grid-3">
          <div class="field"><label for="rq-place">Emplacement</label><input class="input" id="rq-place" value="${esc(edit ? edit.placement : '')}" placeholder="Avant-bras, cheville…"></div>
          <div class="field"><label for="rq-size">Taille</label><input class="input" id="rq-size" value="${esc(edit ? edit.size : '')}" placeholder="Ex. : 10 cm"></div>
          <div class="field"><label for="rq-budget">Budget</label><input class="input" id="rq-budget" value="${esc(edit ? edit.budget : '')}" placeholder="Ex. : 200 €"></div>
        </div>
        <div class="field"><label for="rq-notes">Notes</label><textarea class="textarea" id="rq-notes" placeholder="Références envoyées, questions, disponibilités…">${esc(edit ? edit.notes : '')}</textarea></div>
        <div class="btn-row">
          <button type="submit" class="btn primary">${icon('check')} ${edit ? 'Enregistrer les modifications' : 'Ajouter la demande'}</button>
          ${edit ? `<button type="button" class="btn ghost" data-action="req-cancel-edit">Annuler</button>` : ''}
        </div>
      </form></div></details>
    </section>
    <div class="kanban">${REQ_STEPS.map(([k, l]) => {
      const items = openReqs.filter((r) => r.status === k).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return `<section class="card kan-col" aria-labelledby="kc-${k}">
        ${cardHead(k === 'nouvelle' ? 'inbox' : k === 'discussion' ? 'feather' : 'pencil', l, `<span class="count">${items.length}</span>`, 'kc-' + k)}
        ${items.length ? items.map(card).join('') : `<p class="empty small">${k === 'nouvelle' ? 'Aucune nouvelle demande.' : 'Rien à cette étape.'}</p>`}
      </section>`;
    }).join('')}</div>
    ${archived.length ? `<section class="card"><details class="fold"><summary>Demandes traitées (${archived.length})</summary><div><ul class="rows">${archived.map((r) => `<li class="row"><span class="ic">${icon(r.status === 'acceptee' ? 'check' : 'close')}</span>
      <${r.projectId && findP(r.projectId) ? `button class="row-main" type="button" data-action="open-project" data-id="${r.projectId}"` : 'div class="row-main"'}><span class="row-title">${esc(r.name)} · ${esc(r.idea)}</span><span class="row-sub">${REQ_LABEL[r.status]} · reçue le ${fmtShort(r.createdAt.slice(0, 10))}</span></${r.projectId && findP(r.projectId) ? 'button' : 'div'}>
      <button type="button" class="btn sm ghost" data-action="req-reopen" data-id="${r.id}">Rouvrir</button>
      <button type="button" class="round sm" data-action="req-del" data-id="${r.id}" aria-label="Supprimer la demande de ${esc(r.name)}">${icon('trash')}</button></li>`).join('')}</ul></div></details></section>` : ''}`;
}

function onRequestSubmit(e) {
  e.preventDefault();
  const v = (id) => ($('#' + id).value || '').trim();
  const name = v('rq-name'), idea = v('rq-idea');
  $('#e-rq-name').textContent = name ? '' : 'Indique au moins son prénom.';
  $('#e-rq-idea').textContent = idea ? '' : 'Décris son idée en quelques mots.';
  if (!name) { $('#rq-name').focus(); return; }
  if (!idea) { $('#rq-idea').focus(); return; }
  const c = ensureClientIn(APP.state, { name, instagram: v('rq-insta').replace(/^@+/, ''), other: '' }, true);
  const data = { name, instagram: v('rq-insta').replace(/^@+/, ''), idea, placement: v('rq-place'), size: v('rq-size'), budget: v('rq-budget'), wanted: v('rq-when'), notes: $('#rq-notes').value.trim(), clientId: c.id, updatedAt: Date.now() };
  const edit = APP.state.requests.find((r) => r.id === APP.reqEdit);
  if (edit) Object.assign(edit, data);
  else APP.state.requests.push({ id: uid(), status: 'nouvelle', createdAt: new Date().toISOString(), projectId: '', ...data });
  APP.reqEdit = null; APP.reqPrefill = null;
  save(); render();
  toast(edit ? 'Demande mise à jour' : `Demande de ${name} ajoutée`);
}

function planRequest(r) {
  const t = newProject({});
  t.client = { name: r.name, instagram: r.instagram, other: '' };
  t.clientId = r.clientId;
  t.title = [r.idea, r.placement].filter(Boolean).join(', ');
  t.notes = [r.size && `Taille : ${r.size}`, r.budget && `Budget annoncé : ${r.budget}`, r.wanted && `Souhaité : ${r.wanted}`, r.notes].filter(Boolean).join('\n');
  t._fromRequest = r.id;
  openProject(null, { template: t });
}

/* ---------- Livre des recettes (obligatoire en micro-entreprise) ---------- */
function bookEntries(year) {
  return allPayments().filter((x) => x.paidOn && x.paidOn.startsWith(year)).sort((a, b) => a.paidOn.localeCompare(b.paidOn));
}
const bookNature = (x) => `Prestation de tatouage · ${projLabel(x.p)} · ${x.kind === 'deposit' ? 'acompte' : 'paiement final'}`;
function bookCard() {
  const yr = APP.bookYear || today().slice(0, 4);
  const entries = bookEntries(yr);
  const total = entries.reduce((t, x) => t + x.amount, 0);
  const months = [...Array(12)].map((_, i) => `${yr}-${pad(i + 1)}`).filter((m) => m <= monthKey(today()) || entries.some((x) => monthKey(x.paidOn) === m));
  return `<section class="card book-card" aria-labelledby="c-book">
    ${cardHead('book', 'Livre des recettes', `<div class="period"><button class="round sm" type="button" data-action="book-prev" aria-label="Année précédente">${icon('left')}</button><span class="period-label">${yr}</span><button class="round sm" type="button" data-action="book-next" aria-label="Année suivante">${icon('right')}</button></div>`, 'c-book')}
    <p class="small muted">Obligatoire en micro-entreprise : chaque encaissement, avec sa date, la cliente, la nature de la prestation et le mode de paiement. Tout est rempli automatiquement depuis les fiches projet.</p>
    <div class="table-wrap"><table class="book-table">
      <thead><tr><th scope="col">Mois</th><th scope="col">Encaissements</th><th scope="col">Montant</th></tr></thead>
      <tbody>${months.map((m) => { const es = entries.filter((x) => monthKey(x.paidOn) === m); return `<tr><th scope="row">${cap(fmt(m + '-01', { month: 'long' }))}</th><td>${es.length || '—'}</td><td>${es.length ? money(es.reduce((t, x) => t + x.amount, 0)) : '—'}</td></tr>`; }).join('')}</tbody>
      <tfoot><tr><th scope="row">Total ${yr}</th><td>${entries.length}</td><td>${money(total)}</td></tr></tfoot>
    </table></div>
    <div class="btn-row"><button type="button" class="btn primary" data-action="book-export" ${entries.length ? '' : 'disabled'}>${icon('download')} Exporter le livre ${yr} (tableur)</button></div>
    ${entries.length ? `<details class="fold"><summary>Voir le détail (${plural(entries.length, 'encaissement', 'encaissements')})</summary><div><div class="table-wrap"><table class="book-table detail">
      <thead><tr><th scope="col">Date</th><th scope="col">Cliente</th><th scope="col">Nature</th><th scope="col">Mode</th><th scope="col">Montant</th></tr></thead>
      <tbody>${entries.map((x) => `<tr><td>${fmt(x.paidOn, { day: '2-digit', month: '2-digit' })}</td><td>${esc(clientLabel(x.p))}</td><td>${esc(bookNature(x).replace('Prestation de tatouage · ', ''))}</td><td>${methodLabel(x.p.method)}</td><td>${money(x.amount)}</td></tr>`).join('')}</tbody>
    </table></div></div></details>` : ''}
  </section>`;
}
function exportBook() {
  const yr = APP.bookYear || today().slice(0, 4);
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const amount = (n) => n.toFixed(2).replace('.', ',');
  const lines = [['Date d’encaissement', 'Cliente', 'Nature de la prestation', 'Mode de règlement', 'Montant (€)', 'Référence'].map(cell).join(';')];
  for (const x of bookEntries(yr)) lines.push([fmt(x.paidOn, { day: '2-digit', month: '2-digit', year: 'numeric' }), clientLabel(x.p), bookNature(x), methodLabel(x.p.method), amount(x.amount), (x.p.id + '-' + (x.kind === 'deposit' ? 'A' : 'S')).toUpperCase()].map(cell).join(';'));
  lines.push(['', '', '', 'Total', amount(bookEntries(yr).reduce((t, x) => t + x.amount, 0)), ''].map(cell).join(';'));
  download(`livre-des-recettes-${yr}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  toast(`Livre des recettes ${yr} téléchargé (ouvrable dans Excel, Numbers ou Google Sheets).`);
}

/* =========================================================
   Comptes
   ========================================================= */
function payRowFor(x, withBtn) {
  const t = today();
  const late = !x.paidOn && x.due < t;
  const kind = x.kind === 'deposit' ? 'Acompte' : 'Paiement final';
  const when = x.paidOn ? `Reçu le ${fmtLong(x.paidOn)}` : late ? `Attendu depuis le ${fmtLong(x.due)}` : `Prévu le ${fmtLong(x.due)}`;
  return row({ ic: x.kind === 'deposit' ? 'euro' : 'ledger', title: `${kind} · ${clientLabel(x.p)}`, sub: `${when} · ${methodLabel(x.p.method)}`, id: x.p.id,
    amt: x.paidOn ? '+' + money(x.amount) : money(x.amount), amtCls: x.paidOn ? 'plus' : '', check: withBtn ? x.kind : '', level: late ? 'late' : '' });
}

function viewComptes() {
  const mk = APP.finMonth;
  const t = today();
  const cur = monthKey(t);
  const s = S();
  const canSim = mk >= cur, canDone = mk <= cur;
  let mode = APP.finMode || (canDone ? 'done' : 'sim');
  if (mode === 'sim' && !canSim) mode = 'done';
  if (mode === 'done' && !canDone) mode = 'sim';
  const v = monthSummary(mk, mode === 'sim');
  const done = monthSummary(mk);
  const monthName = fmt(mk + '-01', { month: 'long' });
  const frac = (x) => (v.gross ? x / v.gross : 0);
  const pending = allPayments().filter((x) => !x.paidOn).sort((a, b) => a.due.localeCompare(b.due));
  const soon = pending.filter((x) => x.due <= addDays(t, 30));
  const later = pending.filter((x) => x.due > addDays(t, 30));
  const received = allPayments().filter((x) => x.paidOn && monthKey(x.paidOn) === mk).sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  const brow = (label, sub, val, f, cls, total = false) => `<div class="brow ${total ? 'is-total' : ''}"><div class="brow-top"><span class="brow-label">${label}${sub ? `<small>${sub}</small>` : ''}</span><span class="brow-val">${val}</span></div>${bar(f, cls)}</div>`;

  const left = `
    ${pageHead('Acomptes, paiements & URSSAF', 'Comptes')}
    <div class="period">
      <button class="round sm" type="button" data-action="fin-prev" aria-label="Mois précédent">${icon('left')}</button>
      <span class="period-label" aria-live="polite">${fmtMonth(mk)}</span>
      <button class="round sm" type="button" data-action="fin-next" aria-label="Mois suivant">${icon('right')}</button>
      ${mk !== cur ? `<button class="btn ghost sm" type="button" data-action="fin-today">Ce mois-ci</button>` : ''}
    </div><!--/head-->

    <section class="card card-accent" aria-labelledby="c-net">
      ${STAR}
      <div class="card-head"><span class="pill pill-on-accent">${mode === 'sim' ? 'Prévu en fin de mois' : mk === cur ? 'Reçu à ce jour' : 'Bilan du mois'}</span></div>
      <p class="accent-label" id="c-net">Il te reste en ${monthName}</p>
      <p class="accent-big">${money(v.net)}</p>
      <p class="accent-note">Après la part du shop et l'URSSAF estimée.</p>
      <div class="accent-tiles">
        <div class="tile"><span>Encaissé</span><strong>${money(v.gross)}</strong></div>
        <div class="tile"><span>À garder pour l'URSSAF</span><strong>${money(v.urssaf)}</strong></div>
      </div>
    </section>

    <section class="card" aria-labelledby="c-detail">
      ${cardHead('ledger', 'Le mois en détail', canSim && canDone ? `<div class="seg" role="group" aria-label="Montants affichés">
        <button type="button" data-action="fin-mode" data-view="done" aria-pressed="${mode === 'done'}">Reçu</button>
        <button type="button" data-action="fin-mode" data-view="sim" aria-pressed="${mode === 'sim'}">Prévu</button></div>` : '', 'c-detail')}
      <div class="breakdown">
        ${brow('Encaissé', `dont ${money(v.dep)} d'acomptes`, money(v.gross), 1, '')}
        ${brow(`Part du shop · ${pct(s.shopRate)}`, `sur ${plural(v.nFinal, 'projet soldé', 'projets soldés')}`, '− ' + money(v.shop), frac(v.shop), 'gold')}
        ${brow(`URSSAF · ${pct(s.urssafRate)}`, s.urssafBase === 'apres-shop' ? 'après la part du shop' : 'sur tout ce que tu encaisses', '− ' + money(v.urssaf), frac(v.urssaf), 'bad')}
        ${brow('Il te reste', '', money(v.net), frac(v.net), 'good', true)}
      </div>
      <p class="hint">${mode === 'sim' ? '« Prévu » compte aussi les paiements attendus ce mois-ci, comme s’ils étaient reçus. ' : ''}Les taux se changent dans <a href="#reglages">Réglages</a>.</p>
    </section>
    ${bookCard()}`;

  const right = `
    <section class="card" aria-labelledby="c-pending">
      ${cardHead('clock', 'À recevoir', `<span class="small muted">30 prochains jours</span>`, 'c-pending')}
      ${soon.length ? `<ul class="rows">${soon.map((x) => payRowFor(x, true)).join('')}</ul>` : `<p class="empty">Rien d'attendu dans les 30 prochains jours.</p>`}
      ${later.length ? `<details class="fold"><summary>Plus tard (${plural(later.length, 'paiement', 'paiements')})</summary><div><ul class="rows">${later.map((x) => payRowFor(x, true)).join('')}</ul></div></details>` : ''}
    </section>
    <section class="card" aria-labelledby="c-recv">
      ${cardHead('check', `Reçu en ${monthName}`, `<span class="row-amt plus">${money(done.gross)}</span>`, 'c-recv')}
      ${received.length ? `<ul class="rows">${received.slice(0, 6).map((x) => payRowFor(x, false)).join('')}</ul>
        ${received.length > 6 ? `<details class="fold"><summary>Voir les ${received.length - 6} autres</summary><div><ul class="rows">${received.slice(6).map((x) => payRowFor(x, false)).join('')}</ul></div></details>` : ''}`
        : `<p class="empty">Rien d'encaissé ce mois-ci.</p>`}
    </section>`;
  return spread('comptes', left, right);
}

function markPaid(id, kind) {
  const p = findP(id);
  if (!p) return;
  const prev = clone(p);
  const date = today();
  if (kind === 'deposit') p.deposit.paidOn = date; else p.final.paidOn = date;
  p.updatedAt = Date.now();
  save();
  render();
  toast(`${kind === 'deposit' ? 'Acompte' : 'Paiement final'} de ${clientLabel(p)} noté comme reçu`, () => {
    const i = APP.state.projects.findIndex((x) => x.id === id);
    if (i >= 0) APP.state.projects[i] = { ...prev, updatedAt: Date.now() };
    save(); render();
  });
}

/* =========================================================
   Réserves
   ========================================================= */
function moveStock(it, delta, note) {
  // Pas de stock négatif : on ne retire pas plus que ce qu'il reste.
  const d = Math.round(delta < 0 ? Math.max(delta, -num(it.qty)) : delta);
  if (!d) return;
  APP.state.inventory.log.unshift({ id: uid(), itemId: it.id, date: today(), delta: d, note: note || '', at: Date.now() });
  recomputeStock();
}

function viewReserves() {
  const items = APP.state.inventory.items;
  const it = items.find((x) => x.id === APP.invSel) || items[0];
  APP.invSel = it.id;
  const t = today();
  const f = forecast(it);
  let text;
  if (it.perProject <= 0) text = 'Cet article n’est pas lié aux projets : pas de prévision automatique.';
  else if (f.basis === 'scheduled') text = `Tu as ${plural(f.up, 'projet prévu', 'projets prévus')} et assez pour ${plural(f.covers, 'projet', 'projets')}. Il te manquera des ${esc(it.name.toLowerCase())} pour le rendez-vous de ${esc(clientLabel(f.shortFor))} le ${fmtLong(f.runout)}.`;
  else if (f.basis === 'estimate') text = `Assez pour tes ${plural(f.up, 'projet prévu', 'projets prévus')}. À ton rythme habituel, le stock devrait tenir jusqu'au ${fmtLong(f.runout)} environ.`;
  else text = `Assez pour tes ${plural(f.up, 'projet prévu', 'projets prévus')}.`;
  const order = f.orderBy ? (f.orderBy <= t ? `Commande dès aujourd'hui pour être livrée à temps.` : `Commande au plus tard le <strong>${fmtLong(f.orderBy)}</strong>.`) : '';
  const log = APP.state.inventory.log.filter((l) => l.itemId === it.id).slice(0, 8);

  const left = `
    ${pageHead('Inventaire du studio', 'Réserves')}<!--/head-->
    ${items.length > 1 ? `<div class="seg" role="group" aria-label="Article affiché">${items.map((x) => `<button type="button" data-action="inv-sel" data-id="${x.id}" aria-pressed="${x.id === it.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
    <section class="card" aria-labelledby="inv-${it.id}">
      ${cardHead('needle', esc(it.name), statusPill(f), 'inv-' + it.id)}
      <div class="stock">
        <button type="button" class="round lg" data-action="inv-step" data-id="${it.id}" data-kind="-1" aria-label="Retirer 1 (${esc(it.name)})">−</button>
        <div class="stock-num"><span class="big xl" aria-live="polite">${it.qty}</span><span class="muted">${esc(it.unit || it.name.toLowerCase())} en stock</span></div>
        <button type="button" class="round lg" data-action="inv-step" data-id="${it.id}" data-kind="1" aria-label="Ajouter 1 (${esc(it.name)})">+</button>
      </div>
      ${it.perProject > 0 && f.up ? bar(f.covers / f.up, f.status === 'ok' ? 'good' : f.status === 'now' ? 'bad' : 'gold') : ''}
      <p>${text}</p>
      ${order ? `<div class="order-box ${f.status}">${icon('clock')}<p>${order} Livraison en ${it.deliveryDays} jours environ, plus 2 jours de marge.</p></div>` : ''}
    </section>`;

  const right = `
    <section class="card" aria-labelledby="c-move">
      ${cardHead('plus', 'Ajouter ou retirer', '', 'c-move')}
      <form class="inv-move" data-inv-form="${it.id}">
        <div class="field"><label for="inv-n-${it.id}">Quantité</label><input class="input num" id="inv-n-${it.id}" name="n" inputmode="numeric" autocomplete="off"></div>
        <div class="field note"><label for="inv-note-${it.id}">Note <span class="hint">(facultatif)</span></label><input class="input" id="inv-note-${it.id}" name="note" placeholder="Livraison, casse…"></div>
        <button type="submit" class="btn primary" name="dir" value="1">${icon('plus')} Ajouter</button>
        <button type="submit" class="btn" name="dir" value="-1">Retirer</button>
      </form>
    </section>
    <section class="card" aria-labelledby="c-log">
      ${cardHead('clock', 'Historique', '', 'c-log')}
      ${log.length ? `<ul class="log">${log.map((l) => `<li><span>${fmtShort(l.date)}${l.note ? ' · ' + esc(l.note) : ''}</span><span class="d ${l.delta > 0 ? 'plus' : 'minus'}">${l.delta > 0 ? '+' : '−'}${Math.abs(l.delta)}</span></li>`).join('')}</ul>` : `<p class="empty">Aucun mouvement pour l'instant.</p>`}
    </section>
    <section class="card" aria-labelledby="c-param">
      ${cardHead('sliders', 'Paramètres', '', 'c-param')}
      <div class="grid-2">
        <div class="field"><label for="it-name-${it.id}">Nom</label><input class="input" id="it-name-${it.id}" data-item="${it.id}" data-key="name" value="${esc(it.name)}"></div>
        <div class="field"><label for="it-unit-${it.id}">Unité affichée</label><input class="input" id="it-unit-${it.id}" data-item="${it.id}" data-key="unit" value="${esc(it.unit)}"></div>
        <div class="field"><label for="it-pp-${it.id}">Utilisées par projet</label><input class="input num" id="it-pp-${it.id}" data-item="${it.id}" data-key="perProject" inputmode="decimal" value="${it.perProject}"></div>
        <div class="field"><label for="it-dd-${it.id}">Livraison (jours)</label><input class="input num" id="it-dd-${it.id}" data-item="${it.id}" data-key="deliveryDays" inputmode="numeric" value="${it.deliveryDays}"></div>
        <div class="field"><label for="it-al-${it.id}">M'alerter sous</label><input class="input num" id="it-al-${it.id}" data-item="${it.id}" data-key="alertAt" inputmode="numeric" value="${it.alertAt}"></div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn sm" data-action="inv-add">${icon('plus')} Suivre un autre article</button>
        ${items.length > 1 ? `<button type="button" class="btn danger sm" data-action="inv-del" data-id="${it.id}">${icon('trash')} Supprimer cet article</button>` : ''}
      </div>
    </section>`;
  return spread('reserves', left, right);
}

/* =========================================================
   Réglages
   ========================================================= */
function viewReglages() {
  const s = S();
  const opt = (key, val, list) => `<div class="seg" role="radiogroup" aria-labelledby="lbl-${key}">${list.map(([v, l]) => `<label><input type="radio" name="set-${key}" data-setting="${key}" value="${v}" ${String(val) === String(v) ? 'checked' : ''}>${l}</label>`).join('')}</div>`;
  const numIn = (key, val, suffix, step = 'any') => `<div class="input-affix"><input class="input num" type="number" step="${step}" id="set-${key}" data-setting="${key}" value="${val}">${suffix ? `<span class="affix">${suffix}</span>` : ''}</div>`;
  const hours = [...Array(24)].map((_, i) => i);
  const priv = APP.mode === 'private';
  const left = `
    ${pageHead('À ta façon', 'Réglages')}<!--/head-->
    <section class="card" aria-labelledby="s-profil">
      ${cardHead('feather', 'Profil', '', 's-profil')}
      <div class="profile-row">
        <span class="profile-pic">${s.profilePhoto ? photoImg(s.profilePhoto, '', 'Ta photo de profil') : `<span class="brand-mark" aria-hidden="true">PC</span>`}</span>
        <div class="profile-fields">
          <div class="field"><label for="set-profileName">Prénom affiché</label><input class="input" id="set-profileName" data-setting="profileName" value="${esc(s.profileName || '')}" placeholder="Lucile" autocomplete="given-name"></div>
          <div class="btn-row">
            <span class="btn sm file-btn">${icon('image')} ${s.profilePhoto ? 'Changer la photo' : 'Ajouter ma photo'}<input type="file" id="profile-photo" accept="image/*" aria-label="Choisir une photo de profil"></span>
            ${s.profilePhoto ? `<button type="button" class="btn sm ghost" data-action="profile-photo-remove">${icon('trash')} Retirer</button>` : ''}
          </div>
        </div>
      </div>
      <p class="small muted">Ta photo apparaît en haut à gauche, à côté de ton prénom.${APP.mode === 'private' && SYNC.email ? ' Elle est chiffrée et synchronisée sur tes appareils, comme le reste.' : ''}</p>
    </section>
    <section class="card" aria-labelledby="s-display">
      ${cardHead('eye', 'Affichage', '', 's-display')}
      <div>
        <div class="set-row"><span class="label" id="lbl-ambiance">Pages</span>${opt('ambiance', s.ambiance, [['parchemin', 'Claires'], ['nuit', 'Sombres']])}</div>
        <div class="set-row"><span class="label" id="lbl-font">Police du texte<span class="hint">Les titres gardent leur police.</span></span>${opt('font', s.font, [['lisible', 'Très lisible'], ['livre', 'Livre']])}</div>
        <div class="set-row"><span class="label" id="lbl-size">Taille du texte</span>${opt('size', s.size, [['s', 'Petite'], ['m', 'Moyenne'], ['l', 'Grande']])}</div>
      </div>
    </section>
    <section class="card" aria-labelledby="s-agenda">
      ${cardHead('calendar', 'Agenda', '', 's-agenda')}
      <div>
        <div class="set-row"><label class="label" for="set-dayStart">Début de journée</label><select class="select" id="set-dayStart" data-setting="dayStart">${hours.map((h) => `<option value="${h}" ${h === Number(s.dayStart) ? 'selected' : ''}>${h}h</option>`).join('')}</select></div>
        <div class="set-row"><label class="label" for="set-dayEnd">Fin de journée</label><select class="select" id="set-dayEnd" data-setting="dayEnd">${hours.slice(1).map((h) => `<option value="${h}" ${h === Number(s.dayEnd) ? 'selected' : ''}>${h}h</option>`).join('')}<option value="24" ${Number(s.dayEnd) === 24 ? 'selected' : ''}>24h</option></select></div>
        <div class="set-row"><label class="label" for="set-defaultTime">Heure proposée</label><input class="input" type="time" id="set-defaultTime" data-setting="defaultTime" value="${s.defaultTime}"></div>
        <div class="set-row"><label class="label" for="set-defaultDuration">Durée par défaut</label>${numIn('defaultDuration', s.defaultDuration, 'h', '0.5')}</div>
        <div class="set-row"><label class="label" for="set-defaultRemind">Rappel du croquis<span class="hint">Modifiable projet par projet.</span></label>
          <select class="select" id="set-defaultRemind" data-setting="defaultRemind">${[['', 'Pas de rappel'], ['0', 'Le jour même'], ['1', '1 jour avant'], ['2', '2 jours avant'], ['3', '3 jours avant'], ['5', '5 jours avant'], ['7', '1 semaine avant']].map(([v, l]) => `<option value="${v}" ${String(s.defaultRemind ?? '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set-row"><span class="label" id="lbl-defaultMethod">Paiement proposé</span>${opt('defaultMethod', s.defaultMethod, [['paypal', 'PayPal'], ['virement', 'Virement']])}</div>
      </div>
    </section>`;
  const right = `
    <section class="card" aria-labelledby="s-fin">
      ${cardHead('ledger', 'Comptes', '', 's-fin')}
      <div>
        <div class="set-row"><label class="label" for="set-urssafRate">Taux URSSAF</label>${numIn('urssafRate', s.urssafRate, '%', '0.1')}</div>
        <div class="set-row"><span class="label" id="lbl-urssafBase">L'URSSAF se calcule sur<span class="hint">En micro-entreprise, en général tout l'encaissé.</span></span>${opt('urssafBase', s.urssafBase, [['brut', 'Tout l’encaissé'], ['apres-shop', 'Après le shop']])}</div>
        <div class="set-row"><label class="label" for="set-shopRate">Part du shop</label>${numIn('shopRate', s.shopRate, '%', '1')}</div>
        <div class="set-row"><span class="label" id="lbl-shopBase">La part du shop porte sur</span>${opt('shopBase', s.shopBase, [['total', 'Prix total'], ['solde', 'Paiement final']])}</div>
      </div>
    </section>
    <section class="card" aria-labelledby="s-inv">
      ${cardHead('needle', 'Réserves', '', 's-inv')}
      <div class="set-row"><span class="label" id="lbl-autoNeedle">Retirer une aiguille quand un projet passe à « Réalisé »</span>${opt('autoNeedle', s.autoNeedle, [['false', 'Non'], ['true', 'Oui']])}</div>
    </section>
    ${SYNC.email || APP.mode === 'demo' ? `<section class="card" aria-labelledby="s-notif">
      ${cardHead('alert', 'Notifications', '', 's-notif')}
      <div id="notif-status"><p class="small muted">Vérification…</p></div>
      <div class="notif-preview" id="notif-preview"></div>
      <div>
        <div class="set-row"><span class="label" id="lbl-notifDaily">Résumé du jour<span class="hint">Une seule notification par jour, seulement s'il y a quelque chose.</span></span>${opt('notifDaily', s.notifDaily !== false, [['true', 'Oui'], ['false', 'Non']])}</div>
        <div class="set-row"><label class="label" for="set-notifHour">Heure du résumé</label><input class="input" type="time" id="set-notifHour" data-setting="notifHour" value="${esc(s.notifHour || '08:30')}"></div>
        <div class="set-row"><label class="label" for="set-notifBefore">Rappel avant un rendez-vous</label>
          <select class="select" id="set-notifBefore" data-setting="notifBefore">${[[0, 'Pas de rappel'], [30, '30 minutes avant'], [60, '1 heure avant'], [120, '2 heures avant']].map(([v, l]) => `<option value="${v}" ${Number(s.notifBefore) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="set-row"><span class="label" id="lbl-notifDetail">Contenu des notifications<span class="hint">« Discret » n'affiche aucun prénom : ni sur l'écran verrouillé, ni sur le serveur.</span></span>${opt('notifDetail', s.notifDetail || 'discret', [['discret', 'Discret'], ['prenoms', 'Avec les prénoms']])}</div>
      </div>
    </section>` : ''}
    <section class="card" aria-labelledby="s-sec">
      ${cardHead('lock', priv ? 'Sécurité & sauvegardes' : 'Démo', '', 's-sec')}
      ${priv ? `
      <div class="set-row"><label class="label" for="set-autoLock">Verrouiller après<span class="hint">sans activité</span></label>
        <select class="select" id="set-autoLock" data-setting="autoLock">${[[5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 heure'], [0, 'Jamais']].map(([v, l]) => `<option value="${v}" ${Number(s.autoLock) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${SYNC.email ? `
      <div class="restline"><span class="ic">${icon('check')}</span><span>Synchronisation active pour <strong>${esc(SYNC.email)}</strong>. Tes données sont chiffrées sur l'appareil avant d'être envoyées.</span></div>
      <p class="small muted">Pour ajouter un appareil : ouvre la plateforme dessus et connecte-toi avec la même adresse et le même mot de passe. Une sauvegarde de temps en temps reste une bonne idée.</p>
      <details class="fold"><summary>Clé de secours</summary><div>
        <p class="small">${SYNC.secours ? 'Ta clé de secours permet de choisir un nouveau mot de passe si tu oublies le tien. Si tu l’as perdue, crée-en une nouvelle : l’ancienne cessera de fonctionner.' : '<strong>Tu n’as pas encore de clé de secours.</strong> Crée-la maintenant : sans elle, un mot de passe oublié ferait perdre tes données.'}</p>
        <div class="btn-row"><button type="button" class="btn sm" data-action="new-recovery">${icon('lock')} Créer une nouvelle clé de secours</button></div>
      </div></details>
      <div class="btn-row"><button type="button" class="btn sm danger" data-action="forget-device">${icon('door')} Déconnecter cet appareil</button></div>`
      : `<p class="small muted">Tes données sont chiffrées et rangées uniquement dans ce navigateur. Fais une sauvegarde chaque début de mois : elle permet de tout retrouver ou de passer sur un autre appareil.</p>`}
      <div class="btn-row"><button type="button" class="btn primary" data-action="export">${icon('download')} Télécharger une sauvegarde</button></div>
      <details class="fold"><summary>Restaurer une sauvegarde</summary><div>
        <form class="inline-form" id="import-form">
          <div class="field"><label for="imp-file">Fichier</label><input class="input" type="file" id="imp-file" accept="application/json,.json"></div>
          <div class="field"><label for="imp-pw">Mot de passe de cette sauvegarde</label><input class="input" type="password" id="imp-pw" autocomplete="off"></div>
          <button type="submit" class="btn">${icon('upload')} Restaurer</button>
          <p class="error" id="imp-msg" role="status" style="flex-basis:100%"></p>
        </form></div></details>
      <details class="fold"><summary>Changer le mot de passe</summary><div>
        <form class="inline-form" id="pw-form">
          <div class="field"><label for="pw-cur">Mot de passe actuel</label><input class="input" type="password" id="pw-cur" autocomplete="current-password"></div>
          <div class="field"><label for="pw-n1">Nouveau mot de passe</label><input class="input" type="password" id="pw-n1" autocomplete="new-password"></div>
          <div class="field"><label for="pw-n2">Le même, une seconde fois</label><input class="input" type="password" id="pw-n2" autocomplete="new-password"></div>
          <button type="submit" class="btn">${icon('lock')} Changer</button>
          <p class="error" id="pw-msg" role="status" style="flex-basis:100%"></p>
        </form></div></details>` : `
      <p class="muted">La démo garde tes essais dans ce navigateur. Tu peux revenir aux données d'exemple à tout moment.</p>
      <div class="btn-row"><button type="button" class="btn" data-action="reset-demo">Remettre la démo à zéro</button></div>`}
    </section>`;
  return spread('reglages', left, right);
}

function onSettingChange(el) {
  const key = el.dataset.setting;
  let val = el.value;
  if (['urssafRate', 'shopRate', 'defaultDuration'].includes(key)) val = Math.max(0, num(val));
  if (['dayStart', 'dayEnd', 'autoLock'].includes(key)) val = Number(val);
  if (key === 'defaultRemind') val = val === '' ? null : Number(val);
  if (key === 'autoNeedle' || key === 'notifDaily') val = val === 'true';
  if (key === 'notifBefore') val = Number(val);
  S()[key] = val;
  APP.state.settingsAt = Date.now();
  if (key === 'dayStart' && S().dayEnd <= val) S().dayEnd = Math.min(24, val + 1);
  if (key === 'dayEnd' && S().dayStart >= val) S().dayStart = Math.max(0, val - 1);
  if (['ambiance', 'font', 'size', 'motion', 'orn'].includes(key)) { applyDisplay(); savePrefs(); }
  if (key === 'autoLock') armAutoLock();
  if (key === 'profileName') { S().profileName = String(val).trim().slice(0, 30); refreshShell(); }
  save();
  if (el.type === 'radio' || el.tagName === 'SELECT') render();
}

/* ---------- Sauvegarde / restauration ---------- */
function download(name, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
async function exportBackup() {
  if (APP.mode !== 'private') return;
  clearTimeout(APP.saveTimer);
  let blob;
  if (SYNC.email) { await persistLocal(); const c = await kv.get('vault'); blob = { app: 'prettycrea', v: 2, iter: c.iter, salt: c.salt, cle: c.cle, iv: c.iv, data: c.data, savedAt: c.savedAt }; }
  else { blob = await seal(APP.key, APP.salt, APP.iter, APP.state); await kv.set('vault', blob); }
  download(`prettycrea-sauvegarde-${today()}.json`, JSON.stringify(blob));
  toast('Sauvegarde téléchargée. Range-la dans un endroit sûr.');
}
async function onImport(e) {
  e.preventDefault();
  const msg = $('#imp-msg');
  const file = $('#imp-file').files[0];
  if (!file) { msg.textContent = 'Choisis d’abord le fichier de sauvegarde (.json).'; return; }
  try {
    const blob = JSON.parse(await file.text());
    if (blob.app !== 'prettycrea' || !blob.data) throw new Error('format');
    const kek = await deriveKey($('#imp-pw').value, unb64(blob.salt), blob.iter || PBKDF2_ITER);
    const key = blob.cle ? await unwrapKey(blob.cle, kek) : kek;
    const state = normalize(await unseal(key, blob));
    if (APP.pendingImport !== file.name + file.size) {
      APP.pendingImport = file.name + file.size;
      msg.textContent = `Sauvegarde valide (${state.projects.length} projets). Elle va remplacer toutes tes données actuelles : clique encore sur « Restaurer » pour confirmer.`;
      return;
    }
    APP.pendingImport = null;
    // La sauvegarde remplace tout : ce qui n'y figure pas est effacé, y compris sur les autres appareils.
    const now = Date.now();
    const keep = new Set([...state.projects, ...state.inventory.items].map((x) => x.id));
    [...APP.state.projects, ...APP.state.inventory.items].forEach((x) => { if (!keep.has(x.id)) state.tomb[x.id] = now; });
    APP.state = touchAll(state);
    applyDisplay();
    save();
    toast('Sauvegarde restaurée');
    render();
  } catch (err) {
    APP.pendingImport = null;
    msg.textContent = err && err.message === 'format' ? "Ce fichier n'est pas une sauvegarde PrettyCrea." : 'Mot de passe incorrect pour cette sauvegarde.';
  }
}
async function onChangePw(e) {
  e.preventDefault();
  const msg = $('#pw-msg');
  const cur = $('#pw-cur').value, n1 = $('#pw-n1').value, n2 = $('#pw-n2').value;
  if (SYNC.email) {
    if (n1.length < 10) { msg.textContent = 'Le nouveau mot de passe doit faire au moins 10 caractères.'; return; }
    if (n1 !== n2) { msg.textContent = 'Les deux nouveaux mots de passe ne sont pas identiques.'; return; }
    if (!navigator.onLine) { msg.textContent = 'Il faut être connectée à internet pour changer le mot de passe.'; return; }
    msg.textContent = 'Changement en cours…';
    try { await changePasswordSynced(cur, n1); }
    catch (err) { msg.textContent = err && err.name === 'OperationError' ? 'Le mot de passe actuel est incorrect.' : 'Le changement a échoué. Réessaie dans un instant.'; return; }
    $('#pw-form').reset();
    msg.textContent = '';
    toast('Mot de passe changé sur tous tes appareils. Utilise le nouveau à la prochaine ouverture.');
    return;
  }
  try {
    const blob = await kv.get('vault');
    await unseal(await deriveKey(cur, unb64(blob.salt), blob.iter || PBKDF2_ITER), blob);
  } catch { msg.textContent = 'Le mot de passe actuel est incorrect.'; return; }
  if (n1.length < 8) { msg.textContent = 'Le nouveau mot de passe doit faire au moins 8 caractères.'; return; }
  if (n1 !== n2) { msg.textContent = 'Les deux nouveaux mots de passe ne sont pas identiques.'; return; }
  APP.salt = crypto.getRandomValues(new Uint8Array(16));
  APP.iter = PBKDF2_ITER;
  APP.key = await deriveKey(n1, APP.salt, APP.iter);
  await persist();
  $('#pw-form').reset();
  msg.textContent = '';
  toast('Mot de passe changé. Pense à refaire une sauvegarde.');
}

/* =========================================================
   Petits éléments d'interface
   ========================================================= */
let toastTimer = null;
function toast(message, undo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(message)}</span>${undo ? '<button type="button" class="btn sm" data-toast-undo>Annuler</button>' : ''}<button type="button" class="btn sm close" data-toast-close aria-label="Fermer le message">${icon('close')}</button>`;
  t.hidden = false;
  const hide = () => { clearTimeout(toastTimer); t.hidden = true; };
  // Plus de temps quand on peut annuler ; le délai s'arrête au survol ou au focus.
  const arm = () => { clearTimeout(toastTimer); toastTimer = setTimeout(hide, undo ? 20000 : 5000); };
  arm();
  t.onmouseenter = t.onfocusin = () => clearTimeout(toastTimer);
  t.onmouseleave = t.onfocusout = arm;
  $('[data-toast-close]', t).onclick = hide;
  const b = $('[data-toast-undo]', t);
  if (b) b.onclick = () => { hide(); undo(); };
}

/* =========================================================
   Actions (délégation d'événements)
   ========================================================= */
const ACTIONS = {
  'enter-demo': () => enterDemo(),
  'lock-tab': (el) => { APP.lockTab = el.dataset.view; renderLock(); },
  'client-tab': (el) => { APP.clientTab = el.dataset.view; APP.reqEdit = null; if (APP.route !== 'clientes') location.hash = '#clientes'; else render(); },
  'client-sel': (el) => { APP.clientSel = el.dataset.id; render(); if (isNarrow()) $('#client-detail')?.scrollIntoView({ block: 'start' }); },
  'client-open': (el) => {
    const f = $('#pf'); if (f) { readForm(f); if (JSON.stringify(draft) !== draftSnap) { toast('Enregistre ou annule d’abord tes modifications.'); return; } $('#sheet').close(); }
    APP.clientTab = 'fiches'; APP.clientSel = el.dataset.id;
    if (APP.route !== 'clientes') location.hash = '#clientes'; else render();
  },
  'client-new-project': (el) => { const c = clientById(el.dataset.id); const t = newProject({}); t.client = { name: c.name, instagram: c.instagram, other: c.other }; t.clientId = c.id; openProject(null, { template: t }); },
  'client-new-request': (el) => { const c = clientById(el.dataset.id); APP.clientTab = 'demandes'; APP.reqEdit = null; APP.reqPrefill = { name: c.name, instagram: c.instagram }; render(); $('#rq-idea')?.focus(); },
  'client-del': (el) => {
    const i = APP.state.clients.findIndex((c) => c.id === el.dataset.id); if (i < 0) return;
    const [c] = APP.state.clients.splice(i, 1); APP.state.tomb[c.id] = Date.now(); APP.clientSel = null; save(); render();
    toast(`Fiche de ${c.name} supprimée`, () => { APP.state.clients.push({ ...c, updatedAt: Date.now() }); save(); render(); });
  },
  'req-plan': (el) => { const r = APP.state.requests.find((x) => x.id === el.dataset.id); if (r) planRequest(r); },
  'req-edit': (el) => { APP.reqEdit = el.dataset.id; render(); $('#req-form-card')?.scrollIntoView({ block: 'start' }); $('#rq-idea')?.focus({ preventScroll: true }); },
  'req-cancel-edit': () => { APP.reqEdit = null; render(); },
  'req-refuse': (el) => {
    const r = APP.state.requests.find((x) => x.id === el.dataset.id); if (!r) return;
    const prev = r.status; r.status = 'refusee'; r.updatedAt = Date.now(); save(); render();
    toast(`Demande de ${r.name} refusée`, () => { r.status = prev; r.updatedAt = Date.now(); save(); render(); });
  },
  'req-reopen': (el) => { const r = APP.state.requests.find((x) => x.id === el.dataset.id); if (r) { r.status = 'discussion'; r.updatedAt = Date.now(); save(); render(); } },
  'req-del': (el) => {
    const i = APP.state.requests.findIndex((x) => x.id === el.dataset.id); if (i < 0) return;
    const [r] = APP.state.requests.splice(i, 1); APP.state.tomb[r.id] = Date.now(); save(); render();
    toast('Demande supprimée', () => { APP.state.requests.push({ ...r, updatedAt: Date.now() }); save(); render(); });
  },
  'book-prev': () => { APP.bookYear = String(Number(APP.bookYear || today().slice(0, 4)) - 1); render(); },
  'book-next': () => { APP.bookYear = String(Number(APP.bookYear || today().slice(0, 4)) + 1); render(); },
  'book-export': () => exportBook(),
  'add-session': () => {
    const p = readForm($('#pf'));
    if (!validateDraft(p)) return;
    if (!p.groupId) p.groupId = p.id;
    commitDraft(p);
    const all = sessionsOf(p);
    const last = all[all.length - 1];
    let d = addDays(last.date, 28);
    while (weekday(d) === 6 || isRestMarked(d)) d = addDays(d, 1);
    const tpl = { ...clone(p), id: uid(), groupId: p.groupId, date: d, status: 'prevu', updatedAt: 0, createdAt: new Date().toISOString(),
      deposit: { enabled: false, amount: 0, due: '', paidOn: '' }, final: { paidOn: '' }, sketch: { due: '', remindDays: null, remindDate: '', remindTime: '', sent: false } };
    $('#sheet').close(); render();
    openProject(null, { template: tpl });
    toast(`Séance ${all.length + 1} : choisis sa date et son prix, puis enregistre.`);
  },
  'open-session': (el) => {
    readForm($('#pf'));
    if (JSON.stringify(draft) !== draftSnap) { toast('Enregistre d’abord tes modifications, puis ouvre l’autre séance.'); return; }
    openProject(el.dataset.id);
  },
  'profile-photo-remove': () => { S().profilePhoto = ''; APP.state.settingsAt = Date.now(); save(); refreshShell(); },
  'notif-on': async (el) => {
    el.disabled = true;
    try { await enableNotifications(); toast('Notifications activées sur cet appareil.'); }
    catch (e) {
      console.error(e);
      toast({ 'ios-install': "Installe d'abord la plateforme sur l'écran d'accueil, puis ouvre-la depuis son icône.", denied: 'Notifications refusées. Tu peux les autoriser dans les réglages de l’appareil.', unsupported: 'Ce navigateur ne gère pas les notifications.' }[e.message] || 'L’activation a échoué. Vérifie ta connexion et réessaie.');
    }
    renderNotifStatus();
  },
  'notif-off': async () => { await disableNotifications(); toast('Notifications désactivées sur cet appareil.'); renderNotifStatus(); },
  'notif-test': async (el) => { el.disabled = true; await sendTestNotification(); toast('Notification de test envoyée : elle arrive dans quelques secondes (5 minutes au plus).'); setTimeout(() => { el.disabled = false; }, 4000); },
  'new-recovery': async (el) => {
    if (!navigator.onLine) { toast('Il faut être connectée à internet pour créer une clé de secours.'); return; }
    el.disabled = true;
    try { await regenerateRecovery(); } catch (e) { console.error(e); el.disabled = false; toast('La création a échoué. Réessaie dans un instant.'); }
  },
  'forget-device': async (el) => {
    if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.innerHTML = `${icon('alert')} Confirmer la déconnexion`; return; }
    clearTimeout(APP.lockTimer);
    if ($('#sheet').open) $('#sheet').close();
    await forgetDevice();
    APP.key = null; APP.state = null; APP.mode = null;
    try { sessionStorage.removeItem('prettycrea.mode'); } catch {}
    renderLock('Cet appareil est déconnecté.');
  },
  lock: () => lock(),
  'reset-demo': () => {
    if (APP.mode !== 'demo') return;
    const prev = APP.state;
    APP.state = seedDemo();
    persist(); applyDisplay(); render();
    toast('Démo remise à zéro', () => { APP.state = prev; persist(); applyDisplay(); render(); });
  },
  'quote-next': () => {
    if (QUOTES.length < 2) return;
    let n; do { n = Math.floor(Math.random() * QUOTES.length); } while (n === APP.quote);
    APP.quote = n; render();
  },
  'quote-fr': () => { APP.showFr = !APP.showFr; lsSet('prettycrea.quoteFr', APP.showFr); render(); },

  'cal-view': (el) => { APP.cal.view = el.dataset.view; S().calView = el.dataset.view; save(); render(); },
  'cal-today': () => { APP.cal.cursor = today(); render(); },
  'cal-prev': () => calShift(-1),
  'cal-next': () => calShift(1),
  'goto-day': (el, e) => { e.preventDefault(); APP.cal.view = 'day'; APP.cal.cursor = el.dataset.date; if (APP.route !== 'agenda') location.hash = '#agenda'; else render(true); },
  'goto-week': (el, e) => { e.preventDefault(); APP.cal.view = 'week'; APP.cal.cursor = el.dataset.date; if (APP.route !== 'agenda') location.hash = '#agenda'; else render(true); },
  cell: (el) => {
    APP.cal.cursor = el.dataset.date;
    render();
    if (isNarrow()) $('.cols .col:last-child')?.scrollIntoView({ block: 'start' });
  },
  'new-at': (el) => openProject(null, { date: el.dataset.date }),
  'new-slot': (el, e) => {
    const r = el.getBoundingClientRect();
    const s = S();
    const H = Number(s.dayEnd) - Number(s.dayStart);
    const slot = Math.floor(((e.clientY - r.top) / r.height) * H * 2);
    const m = Math.min(Number(s.dayEnd) * 60 - 30, Math.max(Number(s.dayStart) * 60, Number(s.dayStart) * 60 + slot * 30));
    openProject(null, { date: el.dataset.date, time: minT(m) });
  },
  'new-project': () => {
    // Jour proposé : aujourd'hui, ou le premier jour ouvré de la période affichée si elle est à venir.
    // Hors de l'agenda (bouton toujours visible du menu), on part d'aujourd'hui.
    const inCal = APP.route === 'agenda';
    let d = inCal && APP.cal.cursor && APP.cal.cursor > today() ? APP.cal.cursor : today();
    if (inCal && APP.cal.view === 'week' && APP.cal.cursor > today()) d = startOfWeek(APP.cal.cursor);
    while (weekday(d) === 6 || isRestMarked(d)) d = addDays(d, 1);
    openProject(null, { date: d });
  },
  'open-project': (el) => openProject(el.dataset.id),
  'toggle-rest': (el) => {
    const d = el.dataset.date;
    APP.state.rest[d] = { on: !isRestMarked(d), at: Date.now() };
    save(); render();
  },

  'close-sheet': () => requestClose(),
  'sheet-jump': (el) => {
    const t = $('#' + el.dataset.target);
    if (!t) return;
    if (t.tagName === 'DETAILS') t.open = true;
    t.scrollIntoView({ block: 'start' });
    (t.tagName === 'DETAILS' ? $('summary', t) : t).focus({ preventScroll: true });
  },
  'keep-editing': () => { $('#close-zone').hidden = true; $('#pf-title').focus(); },
  'force-close': () => $('#sheet').close(),
  'remove-photo': () => { draft.photo = ''; $('#photo-slot').innerHTML = photoSlot(''); $('#photo-remove').hidden = true; $('#f-photo').value = ''; },
  'ask-delete': () => {
    $('#del-zone').innerHTML = `<span class="confirm-inline">Supprimer ce projet et ses paiements ?
      <button type="button" class="btn danger sm" data-action="confirm-delete">Oui, supprimer</button>
      <button type="button" class="btn ghost sm" data-action="cancel-delete">Non</button></span>`;
    $('[data-action="cancel-delete"]').focus();
  },
  'cancel-delete': () => { $('#del-zone').innerHTML = `<button type="button" class="btn danger sm" data-action="ask-delete">${icon('trash')} Supprimer</button>`; },
  'confirm-delete': () => {
    const list = APP.state.projects;
    const i = list.findIndex((x) => x.id === draft.id);
    if (i < 0) return;
    const [removed] = list.splice(i, 1);
    APP.state.tomb[removed.id] = Date.now();
    save();
    $('#sheet').close();
    render();
    toast('Projet supprimé', () => { APP.state.projects.splice(i, 0, { ...removed, updatedAt: Date.now() }); save(); render(); });
  },

  'mark-paid': (el) => markPaid(el.dataset.id, el.dataset.kind),
  'fin-prev': () => { APP.finMonth = addMonths(APP.finMonth, -1); render(); },
  'fin-next': () => { APP.finMonth = addMonths(APP.finMonth, 1); render(); },
  'fin-mode': (el) => { APP.finMode = el.dataset.view; render(); },
  'inv-sel': (el) => { APP.invSel = el.dataset.id; render(); },
  'fin-today': () => { APP.finMonth = monthKey(today()); render(); },

  'inv-step': (el) => {
    const it = APP.state.inventory.items.find((x) => x.id === el.dataset.id);
    if (!it) return;
    const d = Number(el.dataset.kind);
    if (d < 0 && it.qty <= 0) return;
    moveStock(it, d, d > 0 ? 'Ajout' : 'Retrait');
    save(); render();
  },
  'inv-add': () => {
    APP.state.inventory.items.push(newItem({ name: 'Nouvel article', unit: 'unités', perProject: 0, alertAt: 2, base: 0, updatedAt: Date.now() }));
    save(); render();
    toast('Article ajouté. Donne-lui un nom dans « Paramètres ».');
  },
  'inv-del': (el) => {
    const inv = APP.state.inventory;
    const i = inv.items.findIndex((x) => x.id === el.dataset.id);
    if (i < 0 || inv.items.length < 2) return;
    const [removed] = inv.items.splice(i, 1);
    APP.state.tomb[removed.id] = Date.now();
    save(); render();
    toast(`${removed.name} supprimé`, () => { inv.items.splice(i, 0, { ...removed, updatedAt: Date.now() }); save(); render(); });
  },

  export: () => exportBackup(),
  'wipe-vault': async () => {
    const v = ($('#wipe-confirm').value || '').trim().toUpperCase();
    if (v !== 'EFFACER') { $('#unlock-error').textContent = 'Écris EFFACER dans le champ pour confirmer.'; $('#wipe-confirm').focus(); return; }
    await kv.del('vault');
    renderLock('Espace privé effacé. Tu peux en créer un nouveau.');
  },
  skip: (el, e) => { e.preventDefault(); $('#view').focus(); },
};

function calShift(dir) {
  const c = APP.cal;
  if (c.view === 'month') { c.cursor = addMonths(monthKey(c.cursor), dir) + '-01'; }
  else if (c.view === 'week') c.cursor = addDays(c.cursor, 7 * dir);
  else c.cursor = addDays(c.cursor, dir);
  render();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-show-pw]')) { $$('input[type="password"], input[data-was-pw]').forEach((i) => { i.type = el.checked ? 'text' : 'password'; i.toggleAttribute('data-was-pw', true); }); return; }
  if (el.id === 'profile-photo') { const f = el.files && el.files[0]; if (f) onProfilePhoto(f).catch(() => toast("Cette image n'a pas pu être lue. Essaie un fichier JPG ou PNG.")); return; }
  if (el.matches('[data-setting]')) { onSettingChange(el); return; }
  if (el.matches('[data-client-field]')) {
    const c = clientById(el.dataset.id); if (!c) return;
    const k = el.dataset.clientField;
    c[k] = k === 'instagram' ? el.value.trim().replace(/^@+/, '') : k === 'notes' ? el.value : el.value.trim();
    c.updatedAt = Date.now();
    if (k !== 'notes') for (const x of projectsOfClient(c)) { x.client = { name: c.name, instagram: c.instagram, other: c.other }; x.updatedAt = Date.now(); }
    save(); if (k !== 'notes') render(); else toast('Notes enregistrées');
    return;
  }
  if (el.matches('[data-req-status]')) {
    const r = APP.state.requests.find((x) => x.id === el.dataset.id); if (!r) return;
    r.status = el.value; r.updatedAt = Date.now(); save(); render();
    return;
  }
  if (el.matches('[data-item]')) {
    const it = APP.state.inventory.items.find((x) => x.id === el.dataset.item);
    if (!it) return;
    const k = el.dataset.key;
    it[k] = ['name', 'unit'].includes(k) ? (el.value.trim() || it[k]) : Math.max(0, num(el.value));
    it.updatedAt = Date.now();
    save(); render();
  }
});
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id !== 'cl-search') return;
  const q = fold(el.value);
  APP.clientQuery = el.value;
  let shown = 0;
  for (const li of $$('.client-list > li')) { const ok = !q || li.dataset.search.includes(q); li.hidden = !ok; if (ok) shown++; }
  const none = $('#cl-none'); if (none) none.hidden = shown > 0;
});
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.matches('[data-inv-form]')) {
    e.preventDefault();
    const it = APP.state.inventory.items.find((x) => x.id === f.dataset.invForm);
    const n = Math.round(Math.abs(num(f.elements.n.value)));
    const dir = Number((e.submitter && e.submitter.value) || 1);
    if (!it || !n) { f.elements.n.focus(); return; }
    moveStock(it, dir * n, f.elements.note.value.trim() || (dir > 0 ? 'Livraison' : 'Retrait'));
    save(); render();
    toast(`${dir > 0 ? '+' : '−'}${n} ${it.unit || it.name}`);
    return;
  }
  if (f.id === 'req-form') return onRequestSubmit(e);
  if (f.id === 'cl-new') {
    e.preventDefault();
    const name = $('#cln-name').value.trim(), instagram = $('#cln-insta').value.trim().replace(/^@+/, '');
    if (!name && !instagram) { $('#cln-name').focus(); return; }
    const c = ensureClientIn(APP.state, { name: name || instagram, instagram, other: '' }, true);
    APP.clientSel = c.id; APP.clientQuery = '';
    save(); render();
    $('#client-detail')?.focus();
    toast(`Fiche de ${c.name} créée`);
    return;
  }
  if (f.id === 'import-form') return onImport(e);
  if (f.id === 'pw-form') return onChangePw(e);
});
matchMedia('(max-width: 980px)').addEventListener('change', () => { if (APP.route === 'agenda') render(); });
$('#sheet').addEventListener('close', () => { if (APP.pendingRender) { APP.pendingRender = false; render(); } });
// Échap : même vérification que « Annuler » pour ne pas perdre une saisie.
$('#sheet').addEventListener('cancel', (e) => { if ($('#pf')) { e.preventDefault(); requestClose(); } });
// Au retour sur l'onglet, remettre à jour rappels et ligne « maintenant » (pas de rafraîchissement automatique pendant la lecture).
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !APP.state || $('#sheet').open) return;
  const a = document.activeElement;
  if (a && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) return;
  if (APP.route === 'agenda' || APP.route === 'bibliotheque') render();
});

window.addEventListener('pagehide', () => { if (APP.state) { clearTimeout(APP.saveTimer); persist(); } });

boot();
})();
