'use strict';
/* ===========================================================
   App: estat, gamificació, vistes, motor d'exercicis
   =========================================================== */
(() => {
  const KEY = 'sem3-calcul-v1';
  const TOPICS = {
    chain: { name: 'Regla de la cadena', icon: '⛓️', n: 1, desc: 'Derivar composicions de 2–4 capes en l\'ordre correcte.' },
    limder: { name: 'Derivada via límit', icon: '🎯', n: 2, desc: '$x^k\\sin(1/x)$: derivada en 0, límits i acotació.' },
    study: { name: 'Estudi d\'una funció', icon: '📈', n: 3, desc: 'Zeros, extrems, monotonia, inflexió, curvatura, esbós.' },
    ratlim: { name: 'Límits a l\'infinit', icon: '∞', n: 4, desc: 'Quocients de polinomis quan $x\\to\\pm\\infty$.' },
    hopital: { name: "Regla de l'Hôpital", icon: '🏥', n: 5, desc: '$\\frac00$, $\\frac\\infty\\infty$, $0\\cdot\\infty$, $\\infty-\\infty$, $1^\\infty$…' },
    extrem: { name: 'Extrems relatius', icon: '⛰️', n: 6, desc: 'Punts crítics, monotonia, màxims i mínims (amb $e^x$, $\\ln x$…).' },
  };
  const TOPIC_IDS = Object.keys(TOPICS);
  const DIFF = { 1: { name: 'Fàcil', mult: 1 }, 2: { name: 'Mitjà', mult: 1.5 }, 3: { name: 'Difícil', mult: 2 } };
  const TRY_FACTOR = [1, 0.7, 0.5, 0.35, 0.25];
  const LEVEL_TITLES = ['Novell', 'Aprenent', 'Derivador', 'Calculista', 'Analista', 'Domador de límits', 'Mestre de la cadena', 'Expert en Càlcul', 'Llegenda del Seminari'];

  /* ---------------- estat ---------------- */
  const DEF = () => ({
    xp: 0, combo: 0, bestCombo: 0,
    streak: { count: 0, last: null, best: 0 },
    history: [], mastery: { chain: [], limder: [], study: [], ratlim: [], hopital: [], extrem: [] },
    skills: {}, drillStats: { sessions: 0, perfect: 0 },
    missions: { date: null, list: [] }, badges: {},
    daily: { date: null, xp: 0, topics: [] },
    settings: { diff: 'auto', topic: 'mix', paper: false },
    lessons: {},
  });
  let S;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    S = Object.assign(DEF(), raw || {});
    S.mastery = Object.assign(DEF().mastery, S.mastery || {});
    S.settings = Object.assign(DEF().settings, S.settings || {});
    S.lessons = S.lessons || {};
    S.skills = S.skills || {};
    S.drillStats = Object.assign(DEF().drillStats, S.drillStats || {});
  } catch { S = DEF(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* sense emmagatzematge */ } };

  /* ---------------- utilitats ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderMath(el) {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(el, {
          delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
          throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'input'],
        });
      } catch { /* ignore */ }
    }
  }
  function kt(tex, display = false) {
    if (window.katex) { try { return katex.renderToString(tex, { throwOnError: false, displayMode: display }); } catch { /* */ } }
    return `<code>${esc(tex)}</code>`;
  }
  const dayStr = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function toast(html, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    renderMath(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
  }

  /* ---------------- nivells i XP ---------------- */
  function levelInfo(xp) {
    let lvl = 1, acc = 0, need = 100;
    while (xp >= acc + need) { acc += need; lvl++; need = 100 + (lvl - 1) * 40; }
    return { lvl, into: xp - acc, need, title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lvl - 1) / 2))] };
  }
  function ensureDaily() {
    const today = dayStr();
    if (S.daily.date !== today) S.daily = { date: today, xp: 0, topics: [] };
    if (S.missions.date !== today || S.missions.v !== 2) {
      const h = hash(today);
      const pool = MISSION_POOL.slice();
      const list = [];
      let k = h;
      while (list.length < 4 && pool.length) {
        const i = k % pool.length;
        const m = pool.splice(i, 1)[0];
        if (!list.some(x => x.group && x.group === m.group)) list.push({ id: m.id, progress: 0, claimed: false });
        k = Math.floor(k / 7) + 13;
      }
      // sempre hi ha una missió d'Entrena
      if (!list.some(x => missionDef(x.id).group === 'drill')) list[list.length - 1] = { id: ['drill3', 'star2', 'drill6'][h % 3], progress: 0, claimed: false };
      S.missions = { date: today, list, v: 2 };
    }
  }
  function addXP(n, reason, fromMission = false) {
    if (n <= 0) return;
    const before = levelInfo(S.xp).lvl;
    S.xp += n;
    if (!fromMission) { S.daily.xp += n; bumpMission('xp', { set: S.daily.xp }); }
    toast(`<b>+${n} XP</b> ${reason || ''}`, 'xp');
    const after = levelInfo(S.xp);
    if (after.lvl > before) levelUp(after);
    renderHeader();
  }
  function levelUp(info) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card levelup">
      <div class="burst">${'<i></i>'.repeat(14)}</div>
      <div class="lvl-big">${info.lvl}</div>
      <h2>Has pujat de nivell!</h2>
      <p>Ara ets <b>${info.title}</b>.</p>
      <button class="btn primary" data-close>Endavant!</button></div>`;
    m.hidden = false;
    $('[data-close]', m).onclick = () => { m.hidden = true; };
    $('[data-close]', m).focus();
  }
  function touchStreak() {
    const today = dayStr();
    if (S.streak.last === today) return;
    S.streak.count = S.streak.last === dayStr(-1) ? S.streak.count + 1 : 1;
    S.streak.last = today;
    S.streak.best = Math.max(S.streak.best, S.streak.count);
    if (S.streak.count > 1) toast(`🔥 Ratxa de <b>${S.streak.count} dies</b>!`, 'fire');
  }
  const liveStreak = () => (S.streak.last === dayStr() || S.streak.last === dayStr(-1) ? S.streak.count : 0);

  /* ---------------- missions ---------------- */
  const MISSION_POOL = [
    { id: 'c_chain', group: 'topic', kind: 'complete', topic: 'chain', target: 3, xp: 60, text: 'Completa 3 exercicis de regla de la cadena' },
    { id: 'c_limder', group: 'topic', kind: 'complete', topic: 'limder', target: 2, xp: 60, text: 'Completa 2 exercicis de derivada via límit' },
    { id: 'c_study', group: 'topic', kind: 'complete', topic: 'study', target: 2, xp: 70, text: "Completa 2 estudis de funció" },
    { id: 'c_ratlim', group: 'topic', kind: 'complete', topic: 'ratlim', target: 3, xp: 50, text: "Completa 3 exercicis de límits a l'infinit" },
    { id: 'perfect', group: 'perf', kind: 'perfect', target: 1, xp: 50, text: 'Treu un 10 en un exercici' },
    { id: 'perfect3', group: 'perf', kind: 'perfect', target: 3, xp: 110, text: 'Treu tres 10' },
    { id: 'first8', kind: 'first', target: 8, xp: 50, text: 'Encerta 8 apartats a la primera' },
    { id: 'exam', kind: 'exam', target: 1, xp: 120, text: 'Fes un simulacre de seminari complet' },
    { id: 'hard2', kind: 'hard', target: 2, xp: 80, text: 'Completa 2 exercicis en dificultat Difícil' },
    { id: 'clean2', kind: 'clean', target: 2, xp: 60, text: 'Resol 2 exercicis sense pistes ni solucions (nota ≥ 8)' },
    { id: 'combo10', kind: 'combo', target: 10, xp: 60, text: 'Fes una combo de 10 encerts seguits a la primera' },
    { id: 'xp250', kind: 'xp', target: 250, xp: 40, text: 'Guanya 250 XP avui' },
    { id: 'lesson2', kind: 'lesson', target: 2, xp: 50, text: "Completa 2 lliçons del camí d'aprenentatge" },
    { id: 'paper1', kind: 'paper', target: 1, xp: 50, text: 'Fes un exercici en mode paper i corregeix-te' },
    { id: 'all4', kind: 'alltopics', target: 4, xp: 90, text: "Completa exercicis de 4 tipus diferents" },
    { id: 'c_hopital', group: 'topic', kind: 'complete', topic: 'hopital', target: 2, xp: 70, text: "Completa 2 exercicis de la regla de l'Hôpital" },
    { id: 'c_extrem', group: 'topic', kind: 'complete', topic: 'extrem', target: 2, xp: 70, text: "Completa 2 estudis d'extrems relatius" },
    { id: 'drill3', group: 'drill', kind: 'drill', target: 3, xp: 60, text: "Completa 3 sessions d'Entrena" },
    { id: 'drill6', group: 'drill', kind: 'drill', target: 6, xp: 110, text: "Completa 6 sessions d'Entrena" },
    { id: 'star2', group: 'drill', kind: 'star', target: 2, xp: 70, text: 'Guanya 2 estrelles de mestria' },
    { id: 'drillperf', kind: 'drillperfect', target: 1, xp: 50, text: "Fes una sessió d'Entrena sense cap error" },
  ];
  const missionDef = id => MISSION_POOL.find(m => m.id === id);
  function bumpMission(kind, payload = {}) {
    ensureDaily();
    for (const ms of S.missions.list) {
      const d = missionDef(ms.id);
      if (!d || d.kind !== kind || ms.progress >= d.target) continue;
      if (kind === 'complete' && d.topic !== payload.topic) continue;
      if (kind === 'combo' || kind === 'xp' || kind === 'alltopics') ms.progress = Math.max(ms.progress, payload.set);
      else ms.progress += 1;
      ms.progress = Math.min(ms.progress, d.target);
      if (ms.progress >= d.target) toast(`🎯 Missió completada: <b>${d.text}</b>. Recull la recompensa a l'Inici!`, 'mission');
    }
  }
  function claimMission(id) {
    const ms = S.missions.list.find(m => m.id === id), d = missionDef(id);
    if (!ms || ms.claimed || ms.progress < d.target) return;
    ms.claimed = true;
    addXP(d.xp, 'missió completada', true);
    save();
    renderHome();
  }

  /* ---------------- domini i insígnies ---------------- */
  const DW = { 1: 0.7, 2: 0.85, 3: 1 };
  function mastery(topic) {
    const all = S.mastery[topic] || [];
    const arr = all.slice(-5);
    if (!arr.length) return { score: 0, n: 0, status: 'nou', label: 'Sense començar' };
    const score = arr.reduce((a, r) => a + r.nota * DW[r.diff], 0) / arr.length;
    const n = all.length;
    let status, label;
    if (n >= 5 && score >= 9) { status = 'dominat'; label = 'Dominat ✓'; }
    else if (score >= 7) { status = 'be'; label = 'Gairebé'; }
    else if (score >= 5) { status = 'progres'; label = 'En progrés'; }
    else { status = 'fluix'; label = 'Cal practicar'; }
    return { score, n, status, label };
  }
  function autoDiff(topic) {
    const m = mastery(topic);
    if (!m.n) return 1;
    return m.score < 5.5 ? 1 : m.score < 7.8 ? 2 : 3;
  }
  const BADGES = [
    { id: 'first', icon: '🌱', name: 'Primer pas', desc: 'Completa el primer exercici', test: () => S.history.length >= 1 },
    { id: 'ten', icon: '💯', name: 'Perfecte', desc: 'Treu un 10', test: () => S.history.some(h => h.nota === 10) },
    { id: 'hard10', icon: '🧠', name: "Cervell d'acer", desc: 'Treu un 10 en Difícil', test: () => S.history.some(h => h.nota === 10 && h.diff === 3) },
    { id: 'combo10', icon: '⚡', name: 'Combo ×10', desc: '10 encerts seguits a la primera', test: () => S.bestCombo >= 10 },
    { id: 'combo25', icon: '🌩️', name: 'Combo ×25', desc: '25 encerts seguits a la primera', test: () => S.bestCombo >= 25 },
    { id: 'streak3', icon: '🔥', name: 'Constància', desc: 'Ratxa de 3 dies', test: () => S.streak.best >= 3 },
    { id: 'streak7', icon: '☄️', name: 'Imparable', desc: 'Ratxa de 7 dies', test: () => S.streak.best >= 7 },
    { id: 'lvl5', icon: '⭐', name: 'Nivell 5', desc: 'Arriba al nivell 5', test: () => levelInfo(S.xp).lvl >= 5 },
    { id: 'lvl10', icon: '🌟', name: 'Nivell 10', desc: 'Arriba al nivell 10', test: () => levelInfo(S.xp).lvl >= 10 },
    { id: 'exam5', icon: '📝', name: 'Aprovat', desc: 'Treu ≥ 5 en un simulacre', test: () => S.history.some(h => h.mode === 'exam' && h.nota >= 5) },
    { id: 'exam9', icon: '🏆', name: 'Excel·lent', desc: 'Treu ≥ 9 en un simulacre', test: () => S.history.some(h => h.mode === 'exam' && h.nota >= 9) },
    ...TOPIC_IDS.map(t => ({ id: 'm_' + t, icon: TOPICS[t].icon, name: 'Domini: ' + TOPICS[t].name, desc: 'Mitjana ≥ 9 (ponderada) als últims 5', test: () => mastery(t).status === 'dominat' })),
    { id: 'path', icon: '🎓', name: 'Camí complet', desc: 'Totes les lliçons amb nota ≥ 7', test: () => LESSONS.list.every(l => (S.lessons[l.id] || 0) >= 7) },
    { id: 'all', icon: '👑', name: 'Seminari 3 dominat', desc: 'Domina tots els tipus d\'exercici', test: () => TOPIC_IDS.every(t => mastery(t).status === 'dominat') },
    ...SK.AREAS.map(a => ({ id: 'area_' + a.id, icon: a.icon, name: 'Mestria: ' + a.name, desc: "Totes les habilitats de l'àrea a ★★★", test: () => SK.SKILLS.filter(s => s.area === a.id).every(s => (S.skills[s.id] || {}).lvl === 3) })),
    { id: 'rank_or', icon: '🥇', name: 'Rang Or', desc: "Arriba al rang Or a Entrena", test: () => rankInfo().i >= 3 },
    { id: 'rank_dia', icon: '💎', name: 'Rang Diamant', desc: 'Arriba al rang Diamant', test: () => rankInfo().i >= 5 },
    { id: 'rank_leg', icon: '🌟', name: 'Llegenda', desc: 'Totes les estrelles i ≥ 9 en un simulacre', test: () => rankInfo().i >= 8 },
    { id: 'drill10', icon: '🏋️', name: 'Constància', desc: "10 sessions d'Entrena", test: () => S.drillStats.sessions >= 10 },
  ];
  function checkBadges() {
    for (const b of BADGES) {
      if (!S.badges[b.id] && b.test()) {
        S.badges[b.id] = Date.now();
        toast(`${b.icon} Insígnia desbloquejada: <b>${b.name}</b>`, 'badge');
      }
    }
  }

  /* ---------------- capçalera ---------------- */
  function renderHeader() {
    const li = levelInfo(S.xp);
    $('#hdr-level').textContent = li.lvl;
    $('#hdr-title').textContent = li.title;
    $('#hdr-xpbar').style.width = (li.into / li.need * 100).toFixed(1) + '%';
    $('#hdr-xptext').textContent = `${li.into} / ${li.need} XP`;
    $('#hdr-streak').textContent = liveStreak();
    $('#hdr-streak-wrap').classList.toggle('lit', S.streak.last === dayStr());
    $('#hdr-combo').textContent = '×' + S.combo;
    $('#hdr-combo-wrap').classList.toggle('hot', S.combo >= 3);
    const rk = rankInfo();
    $('#hdr-rank').textContent = `${rk.icon} ${rk.name}`;
  }

  /* ===========================================================
     MOTOR D'EXERCICIS
     =========================================================== */
  const TYPES = {
    expr: {
      ph: 'p. ex.  2x*cos(x^2)', keys: ['sin(', 'cos(', 'tan(', 'e^(', 'ln(', 'sqrt(', '^', '*', '/', '(', ')'],
      parse: s => { const a = M.parse(s); return { ast: a, tex: M.tex(a) }; },
      prev: p => p.tex, cmp: (p, part) => M.equivFn(p.ast, part.f, part.pts),
    },
    value: {
      ph: 'p. ex.  6   ·   3/2   ·   sqrt(3)/3', keys: ['/', 'sqrt(', 'pi', '(', ')'],
      parse: M.parseValue, prev: p => p.tex, cmp: (p, part) => M.close(p.v, part.v),
    },
    limit: {
      ph: 'p. ex.  3/2   ·   inf   ·   -inf   ·   no existeix', keys: ['inf', '-inf', 'no existeix', '/', 'sqrt('],
      parse: M.parseLimit, prev: p => M.limitTeX(p), cmp: (p, part) => M.sameLimit(p, part.lim),
    },
    list: {
      ph: 'p. ex.  0, -1, sqrt(3)/3   ·   cap', keys: ['sqrt(', '±', '/', ', ', 'cap'],
      parse: M.parseList, prev: p => M.listTeX(p), cmp: (p, part) => M.sameList(p, part.list),
    },
    intervals: {
      ph: 'p. ex.  (-inf, -1) U (1, inf)   ·   cap', keys: ['(', '-inf', 'inf', ', ', ')', ' U ', 'sqrt(', 'cap'],
      parse: M.parseIntervals, prev: p => M.intervalsTeX(p), cmp: (p, part) => M.sameIntervals(p, part.intervals),
    },
  };
  const answerHTML = part => {
    if (part.type === 'mcq') { const o = part.options.find(x => x.ok); return o.tex ? kt(o.tex) : o.html; }
    if (part.type === 'limit') return kt(M.limitTeX(part.lim));
    if (part.type === 'order') return `<ol class="ord-sol">${part.items.map(t => `<li>${t}</li>`).join('')}</ol>`;
    if (part.type === 'value' && !part.answerTeX) return kt(M.numTeX(part.v));
    return kt(part.answerTeX);
  };
  const MAX_WRONG = { mcq: 2, order: 3 };

  function mountExercise(ex, host, opts) {
    const exam = opts.mode === 'exam';
    const st = ex.parts.map(() => ({ wrong: 0, hint: false, done: false, earned: 0, revealed: false, choice: null, order: [], ordShuffle: null }));
    let finished = false;
    const T = TOPICS[ex.topic];
    const head = opts.head || `<span class="tag topic">${T.icon} ${T.n}. ${T.name}</span><span class="tag diff d${ex.diff}">${DIFF[ex.diff].name}</span>`;
    host.innerHTML = `
      <article class="exercise card">
        <header class="ex-head">${head}<span class="spacer"></span>
          ${exam || !ex.parts.length ? '' : '<span class="ex-score" title="Puntuació acumulada"></span>'}
        </header>
        <div class="statement">${ex.statement}</div>
        <div class="parts"></div>
        ${ex.sketch && !exam ? `<section class="sketchbox">
          <h3>✏️ Fes l'esbós</h3>
          <p class="muted small">Amb els teus resultats (zeros, extrems, inflexions i límits), dibuixa la gràfica aquí amb el dit o el ratolí. Després compara-la amb la real. No puntua: és per entrenar el dibuix de l'examen.</p>
          <div class="sketch">${Plot.svg({ ...ex.sketch, reveal: true })}<canvas></canvas></div>
          <div class="part-actions"><button class="btn ghost sk-clear">🧽 Esborrar</button><button class="btn primary sk-show">👁 Mostrar la gràfica real</button></div>
        </section>` : ''}
        <footer class="ex-foot"></footer>
        ${ex.solution ? `<section class="solution" hidden><h3>Resolució completa</h3>${ex.solution}</section>` : ''}
      </article>`;
    const partsEl = $('.parts', host);
    ex.parts.forEach((part, i) => partsEl.appendChild(buildPart(part, i)));
    renderMath(host);
    if (ex.sketch && !exam) setupSketch($('.sketchbox', host));
    updateFoot();

    function buildPart(part, i) {
      const el = document.createElement('div');
      el.className = 'part';
      el.dataset.i = i;
      const letter = String.fromCharCode(97 + i);
      let body;
      if (part.type === 'mcq') {
        body = `<div class="opts">${part.options.map((o, j) => `<button class="opt" data-j="${j}">${o.tex ? `$${o.tex}$` : o.html}</button>`).join('')}</div>`;
      } else if (part.type === 'order') {
        let sh;
        do { sh = part.items.map((_, k) => k).sort(() => Math.random() - 0.5); } while (part.items.length > 1 && sh.every((k, j) => k === j));
        st[i].ordShuffle = sh;
        body = `<div class="ord"><p class="muted small">Toca els passos en l'ordre correcte (toca'n un de la llista de dalt per treure'l).</p>
          <ol class="ord-ans"></ol><div class="ord-pool"></div></div>`;
      } else {
        const ty = TYPES[part.type];
        body = `<div class="inrow"><input class="ans" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${esc(ty.ph)}" aria-label="Resposta ${letter}"></div>
          <div class="keys">${ty.keys.map(k => `<button class="key" data-k="${esc(k)}" tabindex="-1">${esc(k.trim() || k)}</button>`).join('')}</div>
          <div class="preview muted">Vista prèvia de la teva resposta</div>`;
      }
      el.innerHTML = `
        <div class="part-h"><span class="pnum">${letter})</span><div class="plabel">${part.label}</div><span class="pstatus"></span></div>
        ${body}
        <div class="feedback" aria-live="polite"></div>
        ${exam ? '' : `<div class="part-actions">
          <button class="btn primary chk">Comprova</button>
          ${part.hint ? '<button class="btn ghost hintb">💡 Pista <small>(−25%)</small></button>' : ''}
          <button class="btn ghost revb">Veure resposta <small>(0 punts)</small></button>
        </div>`}
        <div class="hintbox" hidden>${part.hint || ''}</div>`;
      const inp = $('.ans', el);
      if (inp) {
        const ty = TYPES[part.type];
        const prev = $('.preview', el);
        const upd = () => {
          const v = inp.value.trim();
          if (!v) { prev.className = 'preview muted'; prev.textContent = 'Vista prèvia de la teva resposta'; return; }
          try { const p = ty.parse(v); prev.className = 'preview'; prev.innerHTML = kt(ty.prev(p)); }
          catch (e) { prev.className = 'preview err'; prev.textContent = '⚠ ' + e.message; }
        };
        inp.addEventListener('input', upd);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !exam) { e.preventDefault(); check(i); } });
        $$('.key', el).forEach(b => b.addEventListener('mousedown', e => {
          e.preventDefault();
          if (st[i].done) return;
          const k = b.dataset.k;
          const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
          if (k === 'cap' || k === 'no existeix') { inp.value = k; }
          else {
            inp.value = inp.value.slice(0, s) + k + inp.value.slice(en);
            inp.setSelectionRange(s + k.length, s + k.length);
          }
          inp.focus(); upd();
        }));
      } else if (part.type === 'mcq') {
        $$('.opt', el).forEach(b => b.addEventListener('click', () => {
          if (st[i].done || b.disabled) return;
          st[i].choice = +b.dataset.j;
          $$('.opt', el).forEach(o => o.classList.toggle('sel', o === b));
        }));
      }
      if (part.type === 'order') setTimeout(() => renderOrd(i), 0);
      if (!exam) {
        $('.chk', el).onclick = () => check(i);
        const hb = $('.hintb', el);
        if (hb) hb.onclick = () => {
          if (st[i].done) return;
          st[i].hint = true;
          $('.hintbox', el).hidden = false;
          hb.disabled = true;
          renderMath($('.hintbox', el));
        };
        $('.revb', el).onclick = () => reveal(i);
      }
      return el;
    }

    function renderOrd(i) {
      const el = partEl(i), part = ex.parts[i], s = st[i];
      const ans = $('.ord-ans', el), pool = $('.ord-pool', el);
      ans.innerHTML = s.order.map(k => `<li><button class="ord-item in" data-k="${k}">${part.items[k]}</button></li>`).join('');
      pool.innerHTML = s.ordShuffle.filter(k => !s.order.includes(k)).map(k => `<button class="ord-item" data-k="${k}">${part.items[k]}</button>`).join('');
      renderMath(el);
      $$('.ord-item', el).forEach(b => b.onclick = () => {
        if (s.done) return;
        const k = +b.dataset.k;
        if (b.classList.contains('in')) s.order = s.order.filter(x => x !== k); else s.order.push(k);
        renderOrd(i);
      });
    }

    function setupSketch(box) {
      const wrap = $('.sketch', box), cv = $('canvas', wrap), svg = $('svg', wrap);
      let ctx, drawing = false, last = null;
      const size = () => {
        const r = svg.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
        if (cv.width === Math.round(r.width * dpr) && cv.height === Math.round(r.height * dpr)) return;
        cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
        cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
        ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
        ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--fire').trim() || '#f26b1d';
      };
      requestAnimationFrame(size);
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', e => { size(); drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
      cv.addEventListener('pointermove', e => {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke();
        last = p;
      });
      const stop = () => { drawing = false; };
      cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
      $('.sk-clear', box).onclick = () => { if (ctx) ctx.clearRect(0, 0, cv.width, cv.height); wrap.classList.remove('shown'); };
      $('.sk-show', box).onclick = () => { wrap.classList.toggle('shown'); };
    }

    function partEl(i) { return $(`.part[data-i="${i}"]`, host); }
    function setFb(i, html, kind) {
      const fb = $('.feedback', partEl(i));
      fb.className = 'feedback ' + kind;
      fb.innerHTML = html;
      renderMath(fb);
    }
    function lockPart(i, ok) {
      const el = partEl(i);
      el.classList.add(ok ? 'ok' : 'bad', 'done');
      $$('input, .opt, .chk, .hintb, .revb, .key, .ord-item', el).forEach(x => { x.disabled = true; });
      $('.pstatus', el).innerHTML = ok ? '✓' : '✗';
      if (ex.parts[i].type === 'mcq') $$('.opt', el).forEach((o, j) => { if (ex.parts[i].options[j].ok) o.classList.add('right'); });
    }
    // retorna true/false, o null si la resposta no es pot interpretar (amb missatge)
    function evaluate(i, silent) {
      const part = ex.parts[i], s = st[i];
      if (part.type === 'mcq') {
        if (s.choice == null) { if (!silent) setFb(i, 'Tria una opció primer.', 'warn'); return null; }
        return part.options[s.choice].ok;
      }
      if (part.type === 'order') {
        if (s.order.length !== part.items.length) { if (!silent) setFb(i, 'Col·loca tots els passos abans de comprovar.', 'warn'); return null; }
        return s.order.every((k, j) => k === j);
      }
      try { return TYPES[part.type].cmp(TYPES[part.type].parse($('.ans', partEl(i)).value), part); }
      catch (e) { if (!silent) setFb(i, '⚠ ' + esc(e.message) + ' <small>(no compta com a intent)</small>', 'warn'); return null; }
    }
    function check(i) {
      const part = ex.parts[i], s = st[i];
      if (s.done || finished) return;
      const ok = evaluate(i);
      if (ok === null) return;
      if (ok) {
        const f = TRY_FACTOR[Math.min(s.wrong, TRY_FACTOR.length - 1)] * (s.hint ? 0.75 : 1);
        s.earned = f; s.done = true;
        const first = s.wrong === 0 && !s.hint;
        setFb(i, `${first ? '🎉 Perfecte, a la primera!' : '✓ Correcte!'} <b>+${Math.round(f * 100)}%</b> d'aquest apartat. <span class="answer">Resposta: ${answerHTML(part)}</span>`, 'ok');
        lockPart(i, true);
        opts.onPart && opts.onPart({ correct: true, first });
      } else {
        s.wrong++;
        opts.onPart && opts.onPart({ correct: false });
        const max = MAX_WRONG[part.type];
        if (max && s.wrong >= max) {
          // als tests no es pot encertar per eliminació
          s.done = true; s.earned = 0;
          setFb(i, `✗ Incorrecte. Resposta correcta: ${answerHTML(part)}`, 'bad');
          lockPart(i, false);
        } else {
          let extra = '';
          if (part.type === 'mcq') {
            const b = $(`.opt[data-j="${s.choice}"]`, partEl(i));
            b.classList.add('wrong'); b.classList.remove('sel'); b.disabled = true; s.choice = null;
            extra = ' Només et queda un intent.';
          }
          if (part.type === 'order') {
            let good = 0; while (good < s.order.length && s.order[good] === good) good++;
            extra = good === 1 ? ' El primer pas és correcte.' : good ? ` Els ${good} primers passos són correctes.` : ' El primer pas ja no és correcte.';
          }
          const next = Math.round(TRY_FACTOR[Math.min(s.wrong, TRY_FACTOR.length - 1)] * 100);
          setFb(i, `✗ Incorrecte.${extra} Torna-ho a provar (ara val com a màxim un ${next}%).${s.wrong >= 2 && !s.hint && part.hint ? ' Potser t\'ajuda la <b>pista</b>.' : ''}`, 'bad');
          const el = partEl(i);
          el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
        }
      }
      updateFoot();
      if (st.every(x => x.done)) finish();
    }
    function reveal(i) {
      const s = st[i];
      if (s.done) return;
      s.done = true; s.revealed = true; s.earned = 0;
      setFb(i, `Resposta: ${answerHTML(ex.parts[i])}`, 'reveal');
      lockPart(i, false);
      opts.onPart && opts.onPart({ correct: false, revealed: true });
      updateFoot();
      if (st.every(x => x.done)) finish();
    }
    function nota() { return st.length ? Math.round(st.reduce((a, s) => a + s.earned, 0) / st.length * 100) / 10 : 10; }
    function updateFoot() {
      if (exam) return;
      const sc = $('.ex-score', host);
      if (sc) sc.innerHTML = `${st.filter(s => s.done).length}/${st.length} apartats · <b>${nota().toFixed(1)}</b>/10`;
      const foot = $('.ex-foot', host);
      if (finished) return;
      if (!ex.parts.length) {
        foot.innerHTML = `<button class="btn primary readdone">✓ Ho he llegit i entès</button>`;
        $('.readdone', foot).onclick = finish;
        return;
      }
      foot.innerHTML = `<button class="btn ghost giveup">Rendir-me i veure ${ex.solution ? 'la resolució' : 'les respostes'}</button>`;
      $('.giveup', foot).onclick = () => {
        if (!confirm('Els apartats que no hagis resolt valdran 0 punts. Continuar?')) return;
        st.forEach((s, i) => { if (!s.done) reveal(i); });
      };
    }
    function finish() {
      if (finished) return;
      finished = true;
      const n = nota();
      const clean = st.every(s => !s.hint && !s.revealed);
      const res = opts.onDone ? opts.onDone({ nota: n, clean, topic: ex.topic, diff: ex.diff }) : {};
      const msg = !ex.parts.length ? 'Lliçó completada.' : n === 10 ? 'Impecable.' : n >= 8.5 ? 'Molt bé! Gairebé perfecte.' : n >= 6 ? 'Bé, però repassa els apartats fallats.' : 'Rellegeix l\'explicació i la resolució amb calma i torna-ho a provar.';
      const foot = $('.ex-foot', host);
      foot.innerHTML = `
        <div class="result">
          <div class="grade g${n >= 9 ? 'a' : n >= 7 ? 'b' : n >= 5 ? 'c' : 'd'}">${n.toFixed(1)}</div>
          <div class="rtext"><b>${opts.gradeLabel || "Nota de l'exercici"}</b><br>${msg}${res && res.xp ? `<br><span class="xpgain">+${res.xp} XP</span>` : ''}</div>
          <div class="ractions">
            ${ex.solution ? '<button class="btn ghost showsol">📖 Resolució completa</button>' : ''}
            ${opts.retry ? '<button class="btn ghost retry">↻ Repetir</button>' : ''}
            ${opts.onNext ? `<button class="btn primary nextex">${opts.nextLabel || 'Següent exercici →'}</button>` : ''}
          </div>
        </div>`;
      const sol = $('.solution', host);
      if (sol) {
        $('.showsol', foot).onclick = () => {
          sol.hidden = !sol.hidden;
          if (!sol.hidden) { renderMath(sol); sol.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        };
        if (n < 10) { sol.hidden = false; renderMath(sol); }
      }
      if (opts.retry) $('.retry', foot).onclick = opts.retry;
      if (opts.onNext) $('.nextex', foot).onclick = opts.onNext;
    }
    // mode examen: correcció final
    function grade() {
      ex.parts.forEach((part, i) => {
        const s = st[i];
        const ok = evaluate(i, true) === true;
        s.done = true; s.earned = ok ? 1 : 0;
        setFb(i, ok ? `✓ Correcte. <span class="answer">${answerHTML(part)}</span>` : `✗ Resposta correcta: ${answerHTML(part)}`, ok ? 'ok' : 'bad');
        lockPart(i, ok);
      });
      finished = true;
      const sol = $('.solution', host);
      if (sol) { sol.hidden = false; renderMath(sol); }
      return nota();
    }
    function touched() {
      return ex.parts.some((p, i) => (p.type === 'mcq' ? st[i].choice != null : p.type === 'order' ? st[i].order.length > 0 : $('.ans', partEl(i)).value.trim() !== ''));
    }
    return { grade, touched };
  }

  /* ---------------- events de gamificació ---------------- */
  function onPart({ correct, first }) {
    if (correct && first) {
      S.combo++;
      S.bestCombo = Math.max(S.bestCombo, S.combo);
      bumpMission('first');
      bumpMission('combo', { set: S.combo });
      if (S.combo > 0 && S.combo % 5 === 0) addXP(S.combo, `combo ×${S.combo}!`);
    } else if (!correct) {
      S.combo = 0;
    }
    renderHeader();
    save();
  }
  function recordResult({ nota, clean, topic, diff }, mode = 'practice') {
    ensureDaily();
    let xp = Math.round(nota * (mode === 'paper' ? 4 : 6) * DIFF[diff].mult);
    if (nota === 10 && mode === 'practice') xp += 15;
    S.history.push({ t: Date.now(), topic, diff, nota, mode });
    if (S.history.length > 300) S.history.splice(0, S.history.length - 300);
    if (mode === 'practice') S.mastery[topic].push({ nota, diff });
    if (S.mastery[topic].length > 20) S.mastery[topic].splice(0, S.mastery[topic].length - 20);
    touchStreak();
    bumpMission('complete', { topic });
    if (nota === 10) bumpMission('perfect');
    if (diff === 3) bumpMission('hard');
    if (clean && nota >= 8) bumpMission('clean');
    if (!S.daily.topics.includes(topic)) S.daily.topics.push(topic);
    bumpMission('alltopics', { set: S.daily.topics.length });
    if (mode === 'paper') bumpMission('paper');
    addXP(xp, mode === 'paper' ? 'exercici en paper' : `exercici (${DIFF[diff].name.toLowerCase()})`);
    checkBadges();
    save();
    renderHeader();
    return { xp };
  }

  /* ===========================================================
     VISTES
     =========================================================== */
  let current = 'home';
  function show(view) {
    current = view;
    $$('.view').forEach(v => { v.hidden = v.id !== 'view-' + view; });
    $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'home') renderHome();
    if (view === 'practice') renderPracticeBar();
    if (view === 'history') renderHistory();
    if (view === 'theory') renderTheory();
    if (view === 'learn') renderLearn();
    if (view === 'train') renderTrain();
    window.scrollTo({ top: 0 });
  }

  /* ---------- Inici ---------- */
  function renderHome() {
    ensureDaily();
    const li = levelInfo(S.xp);
    const el = $('#view-home');
    const today = S.history.filter(h => new Date(h.t).toISOString().slice(0, 10) === dayStr()).length;
    el.innerHTML = `
      <section class="hero card">
        <div>
          <p class="eyebrow">Càlcul · Seminari 3</p>
          <h1>Derivades i les seves aplicacions</h1>
          <p class="muted">Regla de la cadena, derivada via límit, <b>regla de l'Hôpital</b>, <b>extrems relatius</b>, estudi de funcions i límits a l'infinit. Exercicis infinits generats a l'atzar, corregits a l'instant.</p>
          <div class="hero-actions">
            <button class="btn primary big" data-view-go="train">⚡ Entrena (sessions ràpides)</button>
            <button class="btn ghost big" data-go="mix">✏️ Exercici complet</button>
            <button class="btn ghost big" data-view-go="exam">📝 Simulacre</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="sv">${li.lvl}</span><span class="sl">Nivell · ${li.title}</span></div>
          <div class="stat"><span class="sv">🔥 ${liveStreak()}</span><span class="sl">Ratxa de dies (millor ${S.streak.best})</span></div>
          <div class="stat"><span class="sv">${today}</span><span class="sl">Exercicis avui</span></div>
          <div class="stat"><span class="sv">${rankInfo().icon} ${rankInfo().st}★</span><span class="sl">Rang ${rankInfo().name}</span></div>
        </div>
      </section>

      ${(() => {
        const nx = nextSkill(), rk = rankInfo();
        return `<section class="card learn-cta train-cta">
          <div class="lc-ico">⚡</div>
          <div class="lc-body"><b>Entrena: ${rk.icon} ${rk.name}</b><div class="bar"><i style="width:${(rk.p * 100).toFixed(1)}%"></i></div>
          <span class="muted small">${rk.st}/${rk.max} ★ de mestria · ${SK.SKILLS.length} habilitats en ${SK.AREAS.length} blocs${nx ? ' · Següent: ' + nx.name : ''}</span></div>
          <button class="btn primary" data-view-go="train">${rk.st ? 'Continua' : 'Comença'} →</button>
        </section>`;
      })()}
      ${(() => {
        const nx = nextLesson(), d = LESSONS.list.filter(lessonDone).length;
        return `<section class="card learn-cta ${nx ? '' : 'complete'}">
          <div class="lc-ico">🎓</div>
          <div class="lc-body"><b>Camí d'aprenentatge</b><div class="bar"><i style="width:${d / LESSONS.list.length * 100}%"></i></div>
          <span class="muted small">${d}/${LESSONS.list.length} lliçons · ${nx ? 'Següent: ' + nx.title : 'Completat'}</span></div>
          <button class="btn ghost" data-les-go="${nx ? nx.id : ''}">${nx ? (d ? 'Continuar' : 'Començar des de zero') : 'Repassar'} →</button>
        </section>`;
      })()}
      <div class="grid2">
        <section class="card">
          <h2>🎯 Missions d'avui</h2>
          <ul class="missions">
            ${S.missions.list.map(ms => {
              const d = missionDef(ms.id);
              const pct = Math.min(100, ms.progress / d.target * 100);
              const done = ms.progress >= d.target;
              return `<li class="${ms.claimed ? 'claimed' : done ? 'ready' : ''}">
                <div class="mtext">${d.text}<span class="mprog">${ms.progress}/${d.target}</span></div>
                <div class="bar"><i style="width:${pct}%"></i></div>
                <div class="mrew">${ms.claimed ? '✓ Recollida' : done ? `<button class="btn primary sm" data-claim="${ms.id}">Recull +${d.xp} XP</button>` : `+${d.xp} XP`}</div>
              </li>`;
            }).join('')}
          </ul>
          <p class="muted small">Les missions es renoven cada dia a mitjanit.</p>
        </section>
        <section class="card">
          <h2>🏅 Insígnies <span class="muted small">${Object.keys(S.badges).length}/${BADGES.length}</span></h2>
          <div class="badges">
            ${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'got' : ''}" title="${esc(b.desc)}"><span>${b.icon}</span><small>${b.name}</small></div>`).join('')}
          </div>
        </section>
      </div>

      <h2 class="section-h">Domini per tipus d'exercici</h2>
      <p class="muted small">Per marcar un tipus com a <b>dominat</b> necessites una mitjana ≥ 9 als últims 5 exercicis, ponderada per dificultat (Fàcil ×0.7, Mitjà ×0.85, Difícil ×1). És a dir: has de treure molt bona nota en <b>Difícil</b>.</p>
      <div class="topics">
        ${TOPIC_IDS.map(t => {
          const m = mastery(t);
          return `<button class="topic-card card ${m.status}" data-go="${t}">
            <div class="ti">${TOPICS[t].icon}</div>
            <div class="tb">
              <div class="tn">${TOPICS[t].n}. ${TOPICS[t].name}</div>
              <div class="td muted">${TOPICS[t].desc}</div>
              <div class="bar big"><i style="width:${m.score * 10}%"></i></div>
              <div class="tm"><span class="pill ${m.status}">${m.label}</span><span class="muted small">${m.n ? `domini ${m.score.toFixed(1)}/10 · ${m.n} fets` : '—'}</span></div>
            </div>
          </button>`;
        }).join('')}
      </div>`;
    renderMath(el);
    $$('[data-go]', el).forEach(b => b.onclick = () => { S.settings.topic = b.dataset.go; save(); show('practice'); newExercise(); });
    $$('[data-view-go]', el).forEach(b => b.onclick = () => show(b.dataset.viewGo));
    $$('[data-claim]', el).forEach(b => b.onclick = () => claimMission(b.dataset.claim));
    $$('[data-les-go]', el).forEach(b => b.onclick = () => { if (b.dataset.lesGo) openLesson(b.dataset.lesGo); else show('learn'); });
  }

  /* ---------- Pràctica ---------- */
  let practiceHasEx = false;
  function renderPracticeBar() {
    const bar = $('#practice-bar');
    bar.innerHTML = `
      <div class="seg" role="group" aria-label="Tipus">
        <button data-t="mix" class="${S.settings.topic === 'mix' ? 'on' : ''}">🔀 Repàs intel·ligent</button>
        ${TOPIC_IDS.map(t => `<button data-t="${t}" class="${S.settings.topic === t ? 'on' : ''}">${TOPICS[t].icon} ${TOPICS[t].name}</button>`).join('')}
      </div>
      <div class="seg" role="group" aria-label="Dificultat">
        ${[['auto', '🧭 Auto'], ['1', 'Fàcil'], ['2', 'Mitjà'], ['3', 'Difícil']].map(([k, n]) => `<button data-d="${k}" class="${String(S.settings.diff) === k ? 'on' : ''}">${n}</button>`).join('')}
      </div>
      <div class="seg" role="group" aria-label="Mode">
        <button data-p="0" class="${S.settings.paper ? '' : 'on'}">🖱️ Interactiu</button>
        <button data-p="1" class="${S.settings.paper ? 'on' : ''}">📝 Paper (com a l'examen)</button>
      </div>
      <button class="btn primary" id="btn-new">🎲 Exercici nou</button>`;
    $$('[data-t]', bar).forEach(b => b.onclick = () => { S.settings.topic = b.dataset.t; save(); renderPracticeBar(); newExercise(); });
    $$('[data-d]', bar).forEach(b => b.onclick = () => { S.settings.diff = b.dataset.d; save(); renderPracticeBar(); newExercise(); });
    $$('[data-p]', bar).forEach(b => b.onclick = () => { S.settings.paper = b.dataset.p === '1'; save(); renderPracticeBar(); newExercise(); });
    $('#btn-new').onclick = newExercise;
    if (!practiceHasEx) newExercise();
  }
  function pickTopic() {
    if (S.settings.topic !== 'mix') return S.settings.topic;
    // repàs intel·ligent: més pes als tipus menys dominats
    const w = TOPIC_IDS.map(t => { const m = mastery(t); return Math.max(0.6, 10.5 - m.score) * (m.n ? 1 : 1.4); });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return TOPIC_IDS[i]; }
    return TOPIC_IDS[0];
  }
  function newExercise() {
    const topic = pickTopic();
    const diff = S.settings.diff === 'auto' ? autoDiff(topic) : +S.settings.diff;
    const ex = G.generate(topic, diff);
    practiceHasEx = true;
    const host = $('#practice-ex');
    if (S.settings.paper) { mountPaper(ex, host); return; }
    mountExercise(ex, host, {
      mode: 'practice', onPart,
      onDone: r => recordResult(r, 'practice'),
      onNext: () => { newExercise(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    });
    const first = $('.ans, .opt', host);
    if (first && window.matchMedia('(pointer:fine)').matches) first.focus({ preventScroll: true });
  }


  /* ---------- Mode paper ---------- */
  const RUBRIC = {
    chain: ["He identificat totes les capes en l'ordre correcte (de fora cap a dins)", "El primer factor és la derivada de la capa exterior <b>amb l'argument intacte</b>", "He escrit un factor per a cada capa, sense saltar-me'n cap", "L'últim factor és la derivada del polinomi interior", "Els signes són correctes (p. ex. el − de la derivada del cosinus)", "El resultat coincideix amb el de la resolució"],
    limder: ["He aplicat bé la regla del producte per a $x\\neq0$", "He derivat bé $\\sin(1/x)$ o $\\cos(1/x)$, amb el factor $-1/x^2$", "He estudiat el límit de $f'(x)$ <b>terme a terme</b>", "He justificat cada límit amb l'acotació ($|\\sin|\\le1$, $|\\cos|\\le1$) o he explicat per què oscil·la", "He calculat $f'(0)$ amb la definició (o ho he justificat amb el teorema del valor mitjà)", "La conclusió (derivable? $f'$ contínua?) és correcta"],
    study: ["Zeros correctes", "$f'$ i punts crítics correctes", "Taula de signes de $f'$ i intervals de creixement/decreixement correctes", "Màxims i mínims locals ben classificats", "$f''$, punts d'inflexió i curvatura correctes", "Límits a $\\pm\\infty$ correctes", "Extrems absoluts <b>justificats</b> amb els límits", "L'esbós és coherent amb tot l'anterior"],
    hopital: ["Abans d'aplicar l'Hôpital he substituït i he <b>escrit</b> quina indeterminació és", "He derivat numerador i denominador <b>per separat</b> (no la regla del quocient)", "Quan ha tornat a sortir indeterminació, ho he indicat i he tornat a aplicar la regla", "He transformat bé les indeterminacions $0\\cdot\\infty$, $\\infty-\\infty$ o exponencials", "Tots els resultats coincideixen amb la resolució"],
    extrem: ["He indicat el domini de $f$", "$f'(x)$ correcta i factoritzada", "Punts crítics correctes (i he dit per què $e^{(\\dots)}\\neq0$ si cal)", "Taula de signes de $f'$ amb intervals de creixement i decreixement", "Màxims i mínims relatius ben classificats i justificats", "He calculat el valor $f(c)$ de cada extrem", "Si calia, límits o criteri de la 2a derivada correctes"],
    ratlim: ["He identificat el grau i el coeficient principal de dalt i de baix", "He tret factor comú (o he aplicat l'Hôpital) i ho he escrit", "He justificat que els termes $a_j/x^k$ tendeixen a $0$", "Tots els límits concrets són correctes", "Cas general: he distingit els casos $n\\lt m$, $n=m$, $n>m$ i el signe de $a_n/b_m$"],
  };
  function mountPaper(ex, host) {
    const T = TOPICS[ex.topic];
    const rub = RUBRIC[ex.topic];
    host.innerHTML = `
      <article class="exercise card">
        <header class="ex-head"><span class="tag topic">${T.icon} ${T.n}. ${T.name}</span><span class="tag diff d${ex.diff}">${DIFF[ex.diff].name}</span><span class="tag">📝 Mode paper</span></header>
        <div class="statement">${ex.statement}</div>
        <div class="paper-box">
          <p>Resol-ho en un full, <b>sense mirar res</b>, i escriu totes les justificacions com si fos l'examen. Quan acabis, compara amb la resolució i corregeix-te amb sinceritat.</p>
          <button class="btn primary big pp-show">He acabat: veure la resolució</button>
        </div>
        <section class="solution" hidden><h3>Resolució</h3>${ex.solution}</section>
        <section class="rubric" hidden>
          <h3>✅ Autocorrecció</h3>
          <p class="muted small">Marca només el que tinguis <b>bé i ben justificat</b> al teu full.</p>
          ${rub.map((r, i) => `<label class="rub"><input type="checkbox" data-r="${i}"><span>${r}</span></label>`).join('')}
          <button class="btn primary pp-score">Posar-me la nota</button>
        </section>
        <footer class="ex-foot"></footer>
      </article>`;
    renderMath(host);
    $('.pp-show', host).onclick = () => {
      $('.paper-box', host).hidden = true;
      const sol = $('.solution', host); sol.hidden = false; $('.rubric', host).hidden = false;
      renderMath(sol);
      sol.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('.pp-score', host).onclick = () => {
      const n = Math.round($$('.rub input:checked', host).length / rub.length * 100) / 10;
      $$('.rub input, .pp-score', host).forEach(x => { x.disabled = true; });
      const res = recordResult({ nota: n, clean: false, topic: ex.topic, diff: ex.diff }, 'paper');
      const foot = $('.ex-foot', host);
      foot.innerHTML = `<div class="result"><div class="grade g${n >= 9 ? 'a' : n >= 7 ? 'b' : n >= 5 ? 'c' : 'd'}">${n.toFixed(1)}</div>
        <div class="rtext"><b>Nota autoavaluada</b><br>${n >= 8 ? 'Molt bé. A l\'examen, escriu-ho igual.' : 'Mira què et falta a la resolució i torna-ho a intentar.'}<br><span class="xpgain">+${res.xp} XP</span></div>
        <div class="ractions"><button class="btn primary nextex">Següent exercici →</button></div></div>`;
      $('.nextex', foot).onclick = () => { newExercise(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    };
  }

  /* ---------- Camí d'aprenentatge ---------- */
  const lessonDone = l => (S.lessons[l.id] || 0) >= 7;
  const nextLesson = () => LESSONS.list.find(l => !lessonDone(l));
  function renderLearn() {
    const el = $('#view-learn');
    const doneN = LESSONS.list.filter(lessonDone).length;
    const blocks = [...new Set(LESSONS.list.map(l => l.block))];
    const nx = nextLesson();
    el.innerHTML = `
      <section class="card learn-head">
        <div><h1>🎓 Aprèn des de zero</h1>
        <p class="muted">Un camí en ordre: primer les eines (derivades, límits, equacions) i després cada tipus d'exercici del seminari. Cada lliçó té una explicació i unes preguntes per comprovar que l'has entès. Es dona per superada amb un 7.</p></div>
        <div class="learn-prog"><div class="bar big"><i style="width:${doneN / LESSONS.list.length * 100}%"></i></div>
        <span class="muted small">${doneN} de ${LESSONS.list.length} lliçons superades</span>
        ${nx ? `<button class="btn primary" data-les="${nx.id}">${doneN ? 'Continuar' : 'Començar'}: ${nx.title} →</button>` : '<p><b>Has completat tot el camí!</b> Ara toca practicar i fer simulacres.</p>'}</div>
      </section>
      ${blocks.map(b => `<section class="card"><h2>${b}</h2><ol class="lesson-list">
        ${LESSONS.list.map((l, i) => ({ l, i })).filter(o => o.l.block === b).map(({ l, i }) => {
          const n = S.lessons[l.id];
          return `<li><button class="lesson-item ${lessonDone(l) ? 'done' : n != null ? 'tried' : ''}" data-les="${l.id}">
            <span class="lnum">${lessonDone(l) ? '✓' : i + 1}</span><span class="ltitle">${l.title}</span>
            <span class="muted small">${n != null ? 'millor nota ' + n.toFixed(1) : l.parts.length ? l.parts.length + ' preguntes' : 'lectura'}</span></button></li>`;
        }).join('')}</ol></section>`).join('')}`;
    renderMath(el);
    $$('[data-les]', el).forEach(b => b.onclick = () => openLesson(b.dataset.les));
  }
  function openLesson(id) {
    const idx = LESSONS.list.findIndex(l => l.id === id);
    const les = LESSONS.list[idx], next = LESSONS.list[idx + 1], prev = LESSONS.list[idx - 1];
    if (current !== 'learn') { current = 'learn'; $$('.view').forEach(v => { v.hidden = v.id !== 'view-learn'; }); $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === 'learn')); }
    const el = $('#view-learn');
    el.innerHTML = `<div class="lesson-nav">
        <button class="btn ghost sm" id="les-back">← Totes les lliçons</button><span class="spacer"></span>
        ${prev ? `<button class="btn ghost sm" id="les-prev">← Anterior</button>` : ''}
        ${next ? `<button class="btn ghost sm" id="les-next">Següent →</button>` : ''}
      </div><h1 class="lesson-title">${les.title}</h1><div id="lesson-host"></div>`;
    $('#les-back').onclick = renderLearn;
    if (prev) $('#les-prev').onclick = () => openLesson(prev.id);
    if (next) $('#les-next').onclick = () => openLesson(next.id);
    const ex = {
      topic: 'lesson', diff: 1, solution: null, parts: les.parts,
      statement: `<div class="lesson-body">${les.body}</div>${les.parts.length ? '<h3 class="checks-h">✍️ Comprova que ho has entès</h3>' : ''}`,
    };
    mountExercise(ex, $('#lesson-host'), {
      mode: 'practice', onPart,
      head: `<span class="tag topic">🎓 Lliçó ${idx + 1} de ${LESSONS.list.length}</span><span class="tag">${les.block}</span>`,
      gradeLabel: 'Nota de la lliçó',
      onDone: r => {
        const first = !lessonDone(les);
        S.lessons[les.id] = Math.max(S.lessons[les.id] || 0, r.nota);
        touchStreak();
        bumpMission('lesson');
        let xp = 0;
        if (first && r.nota >= 7) { xp = 20 + Math.round(r.nota * 2); addXP(xp, 'lliçó superada'); }
        checkBadges(); save(); renderHeader();
        return { xp };
      },
      retry: () => openLesson(id),
      onNext: next ? () => openLesson(next.id) : () => show('practice'),
      nextLabel: next ? 'Següent lliçó →' : 'Anar a practicar →',
    });
    window.location.hash = 'learn/' + id;
    window.scrollTo({ top: 0 });
  }

  /* ===========================================================
     ENTRENA: graf de coneixement, sessions ràpides, rangs i mestries
     =========================================================== */
  const SKS = SK.SKILLS, AREAS = SK.AREAS;
  const STALE_DAYS = 2, DRILL_N = 8, TEST_N = 6, REVIEW_N = 10;
  const skState = id => (S.skills[id] ||= { lvl: 0, last: 0, n: 0, ok: 0 });
  const lvlOf = id => (S.skills[id] ? S.skills[id].lvl : 0);
  const reqsMet = s => s.req.every(r => lvlOf(r) >= 1);
  const isStale = id => { const k = S.skills[id]; return !!k && k.lvl >= 1 && Date.now() - k.last > STALE_DAYS * 864e5; };
  const starsStr = l => '★'.repeat(l) + '☆'.repeat(3 - l);
  const totalStars = () => SKS.reduce((a, s) => a + lvlOf(s.id), 0);
  const areaOf = s => AREAS.find(a => a.id === s.area);
  const RANKS = [
    { min: 0, name: 'Ferro', icon: '⚙️' },
    { min: 0.06, name: 'Bronze', icon: '🥉' },
    { min: 0.18, name: 'Plata', icon: '🥈' },
    { min: 0.33, name: 'Or', icon: '🥇' },
    { min: 0.5, name: 'Platí', icon: '💠' },
    { min: 0.66, name: 'Diamant', icon: '💎' },
    { min: 0.82, name: 'Mestre', icon: '🎖️' },
    { min: 0.95, name: 'Gran Mestre', icon: '👑' },
    { min: 1, name: 'Llegenda', icon: '🌟', exam: true },
  ];
  function rankInfo() {
    const st = totalStars(), max = SKS.length * 3, p = st / max;
    const exam9 = S.history.some(h => h.mode === 'exam' && h.nota >= 9);
    let i = 0;
    RANKS.forEach((r, k) => { if (p >= r.min - 1e-9 && (!r.exam || exam9)) i = k; });
    const next = RANKS[i + 1];
    return { ...RANKS[i], i, st, max, p, next, toNext: next ? Math.max(0, Math.ceil(next.min * max - 1e-9) - st) : 0 };
  }
  function areaStats(a) {
    const list = SKS.filter(s => s.area === a.id);
    const st = list.reduce((x, s) => x + lvlOf(s.id), 0);
    return { list, st, max: list.length * 3, p: st / (list.length * 3), gold: list.every(s => lvlOf(s.id) === 3) };
  }
  // la recomanada: entre les obertes, la de menys estrelles (i primer en l'ordre del graf)
  function nextSkill() {
    const open = SKS.filter(s => lvlOf(s.id) < 3 && reqsMet(s));
    if (!open.length) return null;
    const m = Math.min(...open.map(s => lvlOf(s.id)));
    return open.find(s => lvlOf(s.id) === m);
  }

  /* ---------- graf (DAG per capes) ---------- */
  const ROW = 146, NODE = 54, LABEL = 52;
  function dagLayout(ids, reqOf) {
    const depth = {};
    const d = id => (depth[id] ??= reqOf(id).length ? 1 + Math.max(...reqOf(id).map(d)) : 0);
    ids.forEach(d);
    const rows = [];
    ids.forEach(id => (rows[depth[id]] ||= []).push(id));
    const pos = {};
    const bary = id => { const ps = reqOf(id).filter(p => pos[p]); return ps.length ? ps.reduce((s, p) => s + pos[p].x, 0) / ps.length : 50; };
    rows.forEach((row, r) => {
      if (r > 0) row.sort((a, b) => bary(a) - bary(b));
      row.forEach((id, i) => { pos[id] = { x: (i + 0.5) / row.length * 100, r }; });
    });
    return { pos, rows: rows.length };
  }
  function graphHTML(ids, reqOf, node, edgeCls) {
    const { pos, rows } = dagLayout(ids, reqOf);
    const H = rows * ROW - 30;
    const cy = r => r * ROW + 6 + NODE / 2;
    let edges = '';
    for (const id of ids) for (const p of reqOf(id)) {
      const a = pos[p], b = pos[id];
      const y1 = cy(a.r) + NODE / 2 + LABEL, y2 = cy(b.r) - NODE / 2 - 3, ym = (y1 + y2) / 2;
      edges += `<path d="M${a.x} ${y1} C${a.x} ${ym} ${b.x} ${ym} ${b.x} ${y2}" class="ge ${edgeCls(p, id)}" vector-effect="non-scaling-stroke"/>`;
    }
    return `<div class="graph" style="height:${H}px"><svg class="gedges" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
      ${ids.map(id => { const n = node(id); return `<button class="gnode ${n.cls}" style="left:${pos[id].x}%;top:${cy(pos[id].r) - NODE / 2}px;${n.style || ''}" ${n.attrs}>${n.inner}</button>`; }).join('')}</div>`;
  }
  function skillNode(id) {
    const s = SK.byId[id], l = lvlOf(id), open = reqsMet(s), nx = nextSkill();
    const cls = [`s${l}`, !open && l === 0 ? 'locked' : '', nx && nx.id === id ? 'next' : '', isStale(id) ? 'stale' : ''].join(' ');
    return {
      cls, attrs: `data-skill="${id}" title="${esc(s.name.replace(/\$/g, ''))}"`,
      inner: `<span class="gc">${!open && l === 0 ? '🔒' : l === 3 ? '👑' : areaOf(s).icon}</span><span class="gl">${s.name}</span><span class="gs">${starsStr(l)}${isStale(id) ? ' <i title="Fa dies que no la practiques">⟳</i>' : ''}</span>`,
    };
  }

  /* ---------- vista principal ---------- */
  function renderTrain() {
    if (drill) { renderDrill(); return; }
    const el = $('#view-train');
    const rk = rankInfo(), nx = nextSkill();
    const stale = SKS.filter(s => isStale(s.id)).length;
    const anyLvl = SKS.some(s => lvlOf(s.id) >= 1);
    const areaReq = id => AREAS.find(a => a.id === id).req;
    el.innerHTML = `
      <section class="card train-head">
        <div class="rank-big"><span class="ri">${rk.icon}</span><div><small class="muted">El teu rang</small><b>${rk.name}</b></div></div>
        <div class="rank-prog"><div class="bar big"><i style="width:${(rk.p * 100).toFixed(1)}%"></i></div>
          <span class="muted small">${rk.st} / ${rk.max} ★ de mestria${rk.next ? ` · ${rk.toNext ? `et falten <b>${rk.toNext} ★</b> per a ${rk.next.icon} ${rk.next.name}` : `per a ${rk.next.icon} ${rk.next.name} cal treure ≥ 9 en un simulacre`}` : ' · rang màxim!'}</span>
          <div class="rank-ladder">${RANKS.map((r, i) => `<span class="${i <= rk.i ? 'on' : ''}" title="${r.name}">${r.icon}</span>`).join('')}</div></div>
        <div class="train-actions">
          ${nx ? `<button class="btn primary big" data-start="${nx.id}">▶ Continua: <span>${nx.name}</span></button>` : '<p><b>Totes les habilitats a ★★★!</b></p>'}
          <button class="btn ghost" id="tr-review" ${anyLvl ? '' : 'disabled'}>🔁 Repàs ràpid (${REVIEW_N})${stale ? ` · ${stale} ⟳` : ''}</button>
        </div>
      </section>
      <section class="card">
        <h2>🗺️ Mapa del coneixement</h2>
        <p class="muted small">Tot el que cal saber per al seminari (derivades i aplicacions), en blocs. Les fletxes indiquen què cal saber abans. Toca un bloc per veure'n les habilitats.</p>
        ${graphHTML(AREAS.map(a => a.id), areaReq, id => {
          const a = AREAS.find(x => x.id === id), st = areaStats(a);
          return { cls: `area-node ${st.gold ? 's3' : st.st ? 's1' : 's0'}`, attrs: `data-area-go="${id}"`, style: `--p:${(st.p * 100).toFixed(0)}%`,
            inner: `<span class="gc ring"><span>${a.icon}</span></span><span class="gl">${a.name}</span><span class="gs">${Math.round(st.p * 100)}%</span>` };
        }, p => (areaStats(AREAS.find(a => a.id === p)).st ? 'done' : ''))}
      </section>
      ${AREAS.map(a => {
        const st = areaStats(a);
        const ids = st.list.map(s => s.id);
        const intra = id => SK.byId[id].req.filter(r => ids.includes(r));
        const cross = [...new Set(st.list.flatMap(s => s.req.filter(r => !ids.includes(r))))];
        return `<section class="card area-card ${st.gold ? 'gold' : ''}" id="area-${a.id}">
          <div class="area-h"><span class="ai">${a.icon}</span><div class="area-t"><h2>${a.name}</h2>
            <span class="muted small">${st.st}/${st.max} ★${st.gold ? ' · <b>Mestria completa</b> 🏅' : ''}</span></div>
            <button class="btn sm" data-area="${a.id}">🔀 Barreja de l'àrea</button></div>
          <div class="bar"><i style="width:${(st.p * 100).toFixed(1)}%"></i></div>
          ${cross.length ? `<p class="cross small muted">Ve de: ${cross.map(r => `<button class="req-chip" data-skill="${r}">${SK.byId[r].name} <b>${starsStr(lvlOf(r))}</b></button>`).join(' ')}</p>` : ''}
          ${graphHTML(ids, intra, skillNode, p => (lvlOf(p) >= 1 ? 'done' : ''))}
        </section>`;
      }).join('')}
      <section class="card how">
        <h2>Com funciona</h2>
        <ul>
          <li><b>Sessions curtes</b> de ${DRILL_N} exercicis (2–4 minuts). La barra només avança quan encertes; si falles, aquell tipus d'exercici tornarà a sortir (amb números nous).</li>
          <li><b>Estrelles de mestria:</b> acaba una sessió amb ≥ 80 % d'encerts per guanyar una estrella (☆ → ★ → ★★ → ★★★). Cada estrella fa els exercicis més difícils.</li>
          <li><b>⏩ Prova directa:</b> si ja ho saps, ${TEST_N} exercicis difícils amb com a màxim 1 error et donen ★★★ de cop.</li>
          <li><b>⟳ Repàs:</b> les habilitats que fa ${STALE_DAYS} dies que no toques es marquen per repassar. El repàs ràpid barreja les que tens més fluixes.</li>
          <li><b>Rang:</b> depèn del total d'estrelles. Per a 🌟 Llegenda cal tenir-les totes i treure ≥ 9 en un simulacre.</li>
        </ul>
      </section>`;
    renderMath(el);
    $$('[data-skill]', el).forEach(b => b.onclick = () => openSkill(b.dataset.skill));
    $$('[data-start]', el).forEach(b => b.onclick = () => startDrill({ mode: 'skill', ids: [b.dataset.start] }));
    $$('[data-area]', el).forEach(b => b.onclick = () => {
      const ids = SKS.filter(s => s.area === b.dataset.area && (reqsMet(s) || lvlOf(s.id))).map(s => s.id);
      startDrill({ mode: 'area', ids: ids.length ? ids : [SKS.find(s => s.area === b.dataset.area).id], area: b.dataset.area });
    });
    $$('[data-area-go]', el).forEach(b => b.onclick = () => $('#area-' + b.dataset.areaGo).scrollIntoView({ behavior: 'smooth', block: 'start' }));
    const rv = $('#tr-review', el);
    if (rv) rv.onclick = startReview;
  }
  function startReview() {
    const cand = SKS.filter(s => lvlOf(s.id) >= 1);
    const pool = cand.length ? cand : SKS.filter(reqsMet);
    startDrill({ mode: 'review', ids: pool.map(s => s.id) });
  }

  /* ---------- fitxa d'una habilitat ---------- */
  function openSkill(id) {
    const s = SK.byId[id], l = lvlOf(id), a = areaOf(s), k = S.skills[id];
    let ex;
    try { ex = SK.gen(id, Math.min(3, l + 1)); } catch { ex = null; }
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card sheet" role="dialog" aria-label="${esc(s.name.replace(/\$/g, ''))}">
      <button class="sheet-x" data-close aria-label="Tanca">✕</button>
      <p class="eyebrow">${a.icon} ${a.name}</p>
      <h2>${s.name}</h2>
      <div class="sheet-stars s${l}">${starsStr(l)}</div>
      <p class="muted small">${l === 3 ? 'Mestria completa.' : l ? `Nivell ${l} de 3. Següent sessió: exercicis ${['', 'fàcils', 'mitjans', 'difícils'][Math.min(3, l + 1)]}.` : 'Encara no l\'has començat.'}${k && k.n ? ` · ${k.ok}/${k.n} encerts en total` : ''}${isStale(id) ? ' · <b>⟳ toca repassar-la</b>' : ''}</p>
      <div class="know"><b>💡 Què has de saber</b><div>${s.th}</div></div>
      ${ex ? `<details class="exmp"><summary>👀 Veure un exemple resolt</summary><div class="exq">${ex.label}</div><p><b>Resposta:</b> ${answerHTML(ex)}</p><p class="muted small">${ex.why || ''}</p></details>` : ''}
      ${s.req.length ? `<p class="small">Cal saber abans: ${s.req.map(r => `<button class="req-chip" data-req="${r}">${SK.byId[r].name} <b>${starsStr(lvlOf(r))}</b></button>`).join(' ')}</p>` : ''}
      ${!reqsMet(s) ? '<p class="warnline small">⚠ Et recomano fer primer els requisits, però pots començar igualment.</p>' : ''}
      <div class="sheet-actions">
        <button class="btn primary big" data-go-drill>▶ Sessió de ${DRILL_N}</button>
        ${l < 3 ? `<button class="btn ghost" data-go-test>⏩ Ja ho sé: prova directa a ★★★</button>` : ''}
      </div>
    </div>`;
    m.hidden = false;
    renderMath(m);
    const close = () => { m.hidden = true; m.onclick = null; };
    m.onclick = e => { if (e.target === m) close(); };
    $('[data-close]', m).onclick = close;
    $$('[data-req]', m).forEach(b => b.onclick = () => openSkill(b.dataset.req));
    $('[data-go-drill]', m).onclick = () => { close(); startDrill({ mode: 'skill', ids: [id] }); };
    const t = $('[data-go-test]', m);
    if (t) t.onclick = () => { close(); startDrill({ mode: 'test', ids: [id] }); };
  }

  /* ---------- sessió estil Duolingo ---------- */
  let drill = null;
  function startDrill(cfg) {
    const n = cfg.mode === 'test' ? TEST_N : cfg.mode === 'review' ? REVIEW_N : DRILL_N;
    drill = { ...cfg, n, done: 0, mistakes: 0, streak: 0, best: 0, retry: [], last: null, t0: Date.now(), item: null, phase: 'ask', choice: null, perSkill: {}, rankBefore: rankInfo().i, lvlBefore: cfg.ids.length === 1 ? lvlOf(cfg.ids[0]) : null };
    if (current !== 'train') { current = 'train'; $$('.view').forEach(v => { v.hidden = v.id !== 'view-train'; }); $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === 'train')); }
    nextDrillItem();
    window.scrollTo({ top: 0 });
  }
  function drillTier(id) {
    const l = lvlOf(id);
    if (drill.mode === 'test') return 3;
    if (drill.mode === 'skill') return Math.min(3, l + 1);
    return Math.max(1, Math.min(3, l));
  }
  function pickDrillSkill() {
    if (drill.ids.length === 1) return drill.ids[0];
    // els errors tornen al cap d'una o dues preguntes
    if (drill.retry.length && drill.retry[0].wait <= 0) return drill.retry.shift().id;
    const w = drill.ids.map(id => { const l = lvlOf(id); return (id === drill.last ? 0.15 : 1) * (isStale(id) ? 3 : 1) * (l <= 1 ? 2 : l === 2 ? 1.5 : 1); });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return drill.ids[i]; }
    return drill.ids[0];
  }
  function nextDrillItem() {
    drill.retry.forEach(x => x.wait--);
    const id = pickDrillSkill();
    drill.last = id;
    drill.item = SK.gen(id, drillTier(id));
    drill.phase = 'ask'; drill.choice = null;
    renderDrill();
  }
  function renderDrill() {
    const el = $('#view-train'), d = drill, it = d.item, s = SK.byId[it.skill];
    const pct = d.done / d.n * 100;
    const ty = TYPES[it.type];
    el.innerHTML = `<div class="drill">
      <div class="drill-top">
        <button class="btn ghost sm" id="dr-x" aria-label="Surt de la sessió">✕</button>
        <div class="bar dbar"><i style="width:${pct}%"></i></div>
        <span class="dstreak ${d.streak >= 3 ? 'hot' : ''}" title="Encerts seguits">🔥 ${d.streak}</span>
      </div>
      <div class="drill-card card ${d.phase}">
        <div class="dmeta"><span class="tag">${areaOf(s).icon} ${s.name}</span><span class="tag">${['', 'Fàcil', 'Mitjà', 'Difícil'][it.tier]}</span>${d.mode === 'test' ? '<span class="tag">⏩ Prova directa</span>' : d.mode === 'review' ? '<span class="tag">🔁 Repàs</span>' : ''}</div>
        <div class="dq">${it.label}</div>
        ${it.type === 'mcq'
          ? `<div class="opts dopts">${it.options.map((o, j) => `<button class="opt" data-j="${j}"><kbd>${j + 1}</kbd> ${o.tex ? `$${o.tex}$` : o.html}</button>`).join('')}</div>`
          : `<div class="inrow"><input class="ans" id="dr-in" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${esc(ty.ph)}" aria-label="Resposta"></div>
             <div class="keys">${ty.keys.map(k => `<button class="key" data-k="${esc(k)}" tabindex="-1">${esc(k.trim() || k)}</button>`).join('')}</div>
             <div class="preview muted" id="dr-prev">Vista prèvia</div>`}
      </div>
      <div class="drill-foot" id="dr-foot"></div>
    </div>`;
    renderMath(el);
    $('#dr-x').onclick = () => {
      if (d.done > 0 && !confirm('Vols sortir? Perdràs el progrés d\'aquesta sessió.')) return;
      drill = null; renderTrain();
    };
    const inp = $('#dr-in');
    if (inp) {
      const prev = $('#dr-prev');
      const upd = () => {
        const v = inp.value.trim();
        if (!v) { prev.className = 'preview muted'; prev.textContent = 'Vista prèvia'; return; }
        try { prev.className = 'preview'; prev.innerHTML = kt(ty.prev(ty.parse(v))); } catch (e) { prev.className = 'preview err'; prev.textContent = '⚠ ' + e.message; }
        footAsk();
      };
      inp.addEventListener('input', upd);
      $$('.key', el).forEach(b => b.addEventListener('mousedown', e => {
        e.preventDefault();
        if (d.phase !== 'ask') return;
        const k = b.dataset.k, s0 = inp.selectionStart ?? inp.value.length, e0 = inp.selectionEnd ?? inp.value.length;
        if (k === 'cap' || k === 'no existeix') inp.value = k;
        else { inp.value = inp.value.slice(0, s0) + k + inp.value.slice(e0); inp.setSelectionRange(s0 + k.length, s0 + k.length); }
        inp.focus(); upd();
      }));
      if (window.matchMedia('(pointer:fine)').matches) inp.focus({ preventScroll: true });
    } else {
      $$('.dopts .opt', el).forEach(b => b.onclick = () => selectOpt(+b.dataset.j));
    }
    footAsk();
  }
  function selectOpt(j) {
    if (drill.phase !== 'ask') return;
    drill.choice = j;
    $$('.dopts .opt').forEach(o => o.classList.toggle('sel', +o.dataset.j === j));
    footAsk();
  }
  function hasAnswer() {
    if (drill.item.type === 'mcq') return drill.choice != null;
    const inp = $('#dr-in');
    return !!(inp && inp.value.trim());
  }
  function footAsk() {
    if (drill.phase !== 'ask') return;
    const f = $('#dr-foot');
    f.className = 'drill-foot';
    f.innerHTML = `<button class="btn ghost" id="dr-skip">No ho sé</button><span class="spacer"></span><button class="btn primary big" id="dr-chk" ${hasAnswer() ? '' : 'disabled'}>Comprova</button>`;
    $('#dr-chk').onclick = drillCheck;
    $('#dr-skip').onclick = () => drillResolve(false, true);
  }
  function drillCheck() {
    const d = drill, it = d.item;
    if (d.phase !== 'ask' || !hasAnswer()) return;
    let ok;
    if (it.type === 'mcq') ok = it.options[d.choice].ok;
    else {
      try { ok = TYPES[it.type].cmp(TYPES[it.type].parse($('#dr-in').value), it); }
      catch (e) { const p = $('#dr-prev'); p.className = 'preview err'; p.textContent = '⚠ ' + e.message + ' (no compta com a error)'; return; }
    }
    drillResolve(ok, false);
  }
  function drillResolve(ok, skipped) {
    const d = drill, it = d.item, k = skState(it.skill);
    d.phase = ok ? 'ok' : 'bad';
    k.n++; S.daily.drill = (S.daily.drill || 0) + 1;
    const ps = d.perSkill[it.skill] ||= { ok: 0, bad: 0 };
    if (ok) {
      k.ok++; k.last = Date.now(); d.done++; d.streak++; d.best = Math.max(d.best, d.streak); ps.ok++;
    } else {
      d.mistakes++; d.streak = 0; ps.bad++;
      if (d.mode === 'review' || d.mode === 'area') { d.retry.push({ id: it.skill, wait: 2 }); if (k.lvl >= 1) k.last = Math.min(k.last, Date.now() - STALE_DAYS * 864e5 - 1); }
    }
    onPart({ correct: ok, first: ok });
    // estat visual
    const card = $('.drill-card');
    card.classList.remove('ask'); card.classList.add(d.phase);
    $$('#view-train input, #view-train .key, #view-train .opt').forEach(x => { x.disabled = true; });
    if (it.type === 'mcq') $$('.dopts .opt').forEach(o => { const opt = it.options[+o.dataset.j]; if (opt.ok) o.classList.add('right'); else if (+o.dataset.j === d.choice) o.classList.add('wrong'); });
    $('.dbar i').style.width = (d.done / d.n * 100) + '%';
    const st = $('.dstreak'); st.textContent = '🔥 ' + d.streak; st.classList.toggle('hot', d.streak >= 3);
    const cheer = ['Perfecte!', 'Molt bé!', 'Exacte!', 'Així es fa!', 'Correcte!'];
    const f = $('#dr-foot');
    f.className = 'drill-foot ' + d.phase;
    f.innerHTML = `<div class="dfb">
        <b>${ok ? `✓ ${d.streak >= 3 && d.streak % 3 === 0 ? `${d.streak} seguides! 🔥` : cheer[Math.floor(Math.random() * cheer.length)]}` : skipped ? 'Cap problema. Mira com es fa:' : '✗ No és correcte.'}</b>
        ${ok ? '' : `<div class="dsol">Solució: ${answerHTML(it)}</div>`}
        ${it.why ? (ok ? `<details class="dwhy"><summary>Per què?</summary><div>${it.why}</div></details>` : `<div class="dwhy">${it.why}</div>`) : ''}
        ${!ok && d.mode !== 'test' ? '<div class="small muted">Aquest tipus tornarà a sortir amb altres números.</div>' : ''}
      </div>
      <button class="btn ${ok ? 'primary' : 'danger-solid'} big" id="dr-next">Continua</button>`;
    renderMath(f);
    $('#dr-next').onclick = drillNext;
    $('#dr-next').focus({ preventScroll: true });
    save();
  }
  function drillNext() {
    const d = drill;
    if (!d || d.phase === 'ask') return;
    if (d.done >= d.n || (d.mode === 'test' && d.mistakes >= 2)) { finishDrill(); return; }
    nextDrillItem();
  }
  function finishDrill() {
    const d = drill;
    drill = null;
    const total = d.done + d.mistakes, acc = total ? d.done / total : 0;
    const secs = Math.round((Date.now() - d.t0) / 1000);
    let gained = 0, msg = '';
    const single = d.ids.length === 1 ? d.ids[0] : null;
    const passed = d.mode === 'test' ? d.mistakes <= 1 && d.done >= d.n : acc >= 0.8;
    if (single && (d.mode === 'skill' || d.mode === 'test')) {
      const k = skState(single), before = k.lvl;
      if (passed && k.lvl < 3) k.lvl = d.mode === 'test' ? 3 : k.lvl + 1;
      gained = k.lvl - before;
      if (passed) k.last = Date.now();
      msg = gained ? `Mestria pujada: <b>${starsStr(before)} → ${starsStr(k.lvl)}</b>`
        : k.lvl === 3 ? 'Ja tens ★★★ en aquesta habilitat. Aquesta sessió ha servit de repàs.'
          : d.mode === 'test' ? 'No l\'has superada (màxim 1 error). Fes sessions normals i ja hi arribaràs.'
            : `Per guanyar una estrella necessites ≥ 80 % d'encerts (aquí ${Math.round(acc * 100)} %). Torna-ho a provar!`;
    } else {
      const weak = Object.entries(d.perSkill).filter(([, v]) => v.bad).map(([id]) => SK.byId[id].name);
      msg = weak.length ? `Per repassar: ${weak.map(n => `<span class="pill">${n}</span>`).join(' ')}` : 'Cap error. Tot ben après!';
    }
    const perfect = d.mistakes === 0 && d.done >= d.n;
    let xp = d.done ? 10 + d.done * 3 + (perfect ? 15 : 0) + gained * 20 : 0;
    ensureDaily();
    if (d.done >= d.n) {
      touchStreak();
      bumpMission('drill');
      for (let i = 0; i < gained; i++) bumpMission('star');
      if (perfect) bumpMission('drillperfect');
      S.drillStats.sessions++;
      if (perfect) S.drillStats.perfect++;
    }
    if (xp) addXP(xp, 'sessió d\'Entrena');
    checkBadges();
    save(); renderHeader();
    const rk = rankInfo();
    const el = $('#view-train');
    const nx = nextSkill();
    el.innerHTML = `<section class="card drill-end">
      <div class="end-emoji">${perfect ? '🏆' : gained ? '⭐' : d.done >= d.n ? '✅' : '💪'}</div>
      <h2>${d.done >= d.n ? (perfect ? 'Sessió perfecta!' : 'Sessió completada!') : 'Sessió acabada'}</h2>
      <div class="end-stats">
        <div><b>${Math.round(acc * 100)}%</b><small>encerts</small></div>
        <div><b>+${xp}</b><small>XP</small></div>
        <div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b><small>temps</small></div>
        <div><b>🔥 ${d.best}</b><small>millor ratxa</small></div>
      </div>
      <p>${msg}</p>
      <p class="muted small">Rang: ${rk.icon} <b>${rk.name}</b> · ${rk.st}/${rk.max} ★</p>
      <div class="ractions">
        <button class="btn ghost" id="de-map">🗺️ Mapa</button>
        <button class="btn ghost" id="de-again">↻ Una altra</button>
        ${nx ? `<button class="btn primary" id="de-next">Següent: ${nx.name} →</button>` : ''}
      </div>
    </section>`;
    renderMath(el);
    if (rk.i > d.rankBefore) rankUp(rk);
    $('#de-map').onclick = renderTrain;
    $('#de-again').onclick = () => (d.mode === 'review' ? startReview() : startDrill({ mode: d.mode === 'test' ? 'skill' : d.mode, ids: d.ids, area: d.area }));
    if (nx) $('#de-next').onclick = () => startDrill({ mode: 'skill', ids: [nx.id] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function rankUp(rk) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-card levelup">
      <div class="burst">${'<i></i>'.repeat(14)}</div>
      <div class="lvl-big rank-up">${rk.icon}</div>
      <h2>Nou rang: ${rk.name}!</h2>
      <p>${rk.st} estrelles de mestria. ${rk.next ? `Següent: ${rk.next.icon} ${rk.next.name}.` : ''}</p>
      <button class="btn primary" data-close>Endavant!</button></div>`;
    m.hidden = false;
    $('[data-close]', m).onclick = () => { m.hidden = true; };
    $('[data-close]', m).focus();
  }
  document.addEventListener('keydown', e => {
    if (!drill || current !== 'train' || !$('#modal').hidden) return;
    const typing = e.target && e.target.id === 'dr-in';
    if (e.key === 'Enter') {
      e.preventDefault();
      if (drill.phase === 'ask') drillCheck(); else drillNext();
    } else if (!typing && drill.phase === 'ask' && drill.item.type === 'mcq' && /^[1-9]$/.test(e.key)) {
      const j = +e.key - 1;
      if (j < drill.item.options.length) selectOpt(j);
    }
  });

  /* ---------- Simulacre ---------- */
  let examTimer = null, examCtl = null, examRunning = false;
  window.addEventListener('beforeunload', e => { if (examRunning) { e.preventDefault(); e.returnValue = ''; } });
  function renderExamIntro() {
    const el = $('#view-exam');
    el.innerHTML = `
      <section class="card exam-intro">
        <h1>📝 Simulacre del Tercer Seminari</h1>
        <ul>
          <li>Disposes de <b>50 minuts</b>.</li>
          <li>Hi ha <b>4 exercicis</b> de nivell examen. Com al seminari real, <b>en compten 3</b>: la nota final és la mitjana dels <b>3 millors</b>.</li>
          <li><b>Format d'enguany:</b> regla de la cadena, derivada via límit, extrems relatius (o estudi de funció) i regla de l'Hôpital. <b>Format 2023-24:</b> els 4 exercicis del full original.</li>
          <li><b>No hi ha correcció fins que entreguis</b>, ni pistes. Només boli i cap.</li>
          <li>Recompensa: fins a <b>200 XP</b> + bonus si treus ≥ 9.</li>
        </ul>
        <div class="hero-actions"><button class="btn primary big" data-fmt="nou">▶ Format d'enguany (Hôpital i extrems)</button>
        <button class="btn ghost big" data-fmt="orig">Format del full 2023-24</button></div>
      </section>
      ${(() => {
        const ex = S.history.filter(h => h.mode === 'exam').slice(-5).reverse();
        return ex.length ? `<section class="card"><h3>Últims simulacres</h3><ul class="plain">${ex.map(h => `<li>${new Date(h.t).toLocaleString('ca')} — <b>${h.nota.toFixed(1)}</b></li>`).join('')}</ul></section>` : '';
      })()}`;
    $$('[data-fmt]', el).forEach(b => b.onclick = () => startExam(b.dataset.fmt));
  }
  let examTopics = [];
  const EXAM_FORMATS = {
    nou: () => ['chain', 'limder', Math.random() < 0.6 ? 'extrem' : 'study', 'hopital'],
    orig: () => ['chain', 'limder', 'study', 'ratlim'],
  };
  function startExam(fmt = 'nou') {
    examTopics = EXAM_FORMATS[fmt]();
    const exs = examTopics.map(t => G.generate(t, 3));
    const el = $('#view-exam');
    const ends = Date.now() + 50 * 60 * 1000;
    el.innerHTML = `
      <div class="exam-bar card">
        <span class="timer" id="exam-timer">50:00</span>
        <span class="muted small">Escolliu i resoleu TRES dels QUATRE exercicis (comptaran els 3 millors).</span>
        <span class="spacer"></span>
        <button class="btn primary" id="exam-submit">Entregar</button>
      </div>
      <div id="exam-result"></div>
      ${exs.map((_, i) => `<div class="exam-ex" id="exam-ex-${i}"></div>`).join('')}`;
    examCtl = exs.map((ex, i) => mountExercise(ex, $('#exam-ex-' + i), { mode: 'exam' }));
    examRunning = true;
    $('#exam-submit').onclick = () => {
      const empty = examCtl.filter(c => !c.touched()).length;
      if (!confirm(`Segur que vols entregar?${empty ? ` Hi ha ${empty} exercici(s) sense començar.` : ''}`)) return;
      submitExam();
    };
    clearInterval(examTimer);
    const tick = () => {
      const left = Math.max(0, ends - Date.now());
      const mm = Math.floor(left / 60000), ss = Math.floor(left % 60000 / 1000);
      const t = $('#exam-timer');
      if (!t) { clearInterval(examTimer); return; }
      t.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      t.classList.toggle('low', left < 5 * 60000);
      if (left <= 0) { clearInterval(examTimer); toast('⏰ Temps esgotat! Entregant…'); submitExam(); }
    };
    tick();
    examTimer = setInterval(tick, 1000);
    window.scrollTo({ top: 0 });
  }
  function submitExam() {
    clearInterval(examTimer);
    examRunning = false;
    const notes = examCtl.map(c => c.grade());
    const best3 = notes.slice().sort((a, b) => b - a).slice(0, 3);
    const final = Math.round(best3.reduce((a, b) => a + b, 0) / 3 * 10) / 10;
    ensureDaily();
    S.history.push({ t: Date.now(), topic: 'exam', diff: 3, nota: final, mode: 'exam', parts: notes });
    examTopics.forEach((t, i) => { S.mastery[t].push({ nota: notes[i], diff: 3 }); });
    touchStreak();
    bumpMission('exam');
    examTopics.forEach(t => bumpMission('complete', { topic: t }));
    examTopics.forEach(t => { if (!S.daily.topics.includes(t)) S.daily.topics.push(t); });
    bumpMission('alltopics', { set: S.daily.topics.length });
    notes.forEach(n => { bumpMission('hard'); if (n === 10) bumpMission('perfect'); });
    const xp = Math.round(final * 20) + (final >= 9 ? 40 : 0);
    addXP(xp, 'simulacre');
    checkBadges();
    save();
    const bar = $('.exam-bar');
    bar.innerHTML = `<span class="timer done">Entregat</span><span class="spacer"></span><button class="btn primary" id="exam-again">Nou simulacre</button>`;
    $('#exam-again').onclick = renderExamIntro;
    const r = $('#exam-result');
    r.innerHTML = `<section class="card result exam-res">
      <div class="grade g${final >= 9 ? 'a' : final >= 7 ? 'b' : final >= 5 ? 'c' : 'd'}">${final.toFixed(1)}</div>
      <div class="rtext"><b>Nota del simulacre</b> (mitjana dels 3 millors)<br>
      ${notes.map((n, i) => `<span class="pill">${TOPICS[examTopics[i]].icon} Ex. ${i + 1}: ${n.toFixed(1)}</span>`).join(' ')}
      <br><span class="xpgain">+${xp} XP</span></div></section>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Teoria ---------- */
  let theoryRendered = false;
  function renderTheory() {
    if (theoryRendered) return;
    theoryRendered = true;
    const el = $('#view-theory');
    el.innerHTML = `
      <div class="theory-nav seg">${TOPIC_IDS.map(t => `<a href="#th-${t}">${TOPICS[t].icon} ${TOPICS[t].name}</a>`).join('')}<a href="#th-original">🧾 Seminari resolt</a><a href="#th-syntax">⌨️ Com escriure</a></div>
      ${TOPIC_IDS.map(t => `<section class="card theory" id="th-${t}">
        <h2>${TOPICS[t].icon} ${TOPICS[t].n}. ${TOPICS[t].name}</h2>
        ${THEORY[t]}
        <div class="th-actions">
          <button class="btn ghost" data-ex="${t}">👀 Veure un exemple resolt</button>
          <button class="btn primary" data-pr="${t}">✏️ Practicar aquest tipus</button>
        </div>
        <div class="worked" hidden></div>
      </section>`).join('')}
      <section class="card theory" id="th-original"><h2>🧾 El seminari original, resolt i redactat</h2>${LESSONS.ORIGINAL}</section>
      <section class="card theory" id="th-syntax"><h2>⌨️ Com escriure les respostes</h2>${THEORY.syntax}</section>`;
    renderMath(el);
    $$('[data-ex]', el).forEach(b => b.onclick = () => {
      const t = b.dataset.ex;
      const ex = G.generate(t, 3);
      const w = $('.worked', b.closest('section'));
      w.hidden = false;
      w.innerHTML = `<h3>Exemple resolt (nivell examen)</h3><div class="statement">${ex.statement}</div><div class="solution">${ex.solution}</div>`;
      renderMath(w);
      b.textContent = '🔄 Un altre exemple';
    });
    $$('[data-pr]', el).forEach(b => b.onclick = () => { S.settings.topic = b.dataset.pr; save(); show('practice'); newExercise(); });
  }

  /* ---------- Historial ---------- */
  function renderHistory() {
    const el = $('#view-history');
    const H = S.history.slice().reverse();
    const avg = arr => (arr.length ? (arr.reduce((a, h) => a + h.nota, 0) / arr.length).toFixed(1) : '—');
    const last20 = S.history.slice(-30);
    const w = 600, hgt = 140;
    const spark = last20.length > 1 ? `<svg viewBox="0 0 ${w} ${hgt}" class="spark" role="img" aria-label="Evolució de notes">
      ${[0, 5, 10].map(v => `<line x1="0" x2="${w}" y1="${hgt - 10 - v * 12}" y2="${hgt - 10 - v * 12}" class="pg"/><text x="4" y="${hgt - 13 - v * 12}" class="pt">${v}</text>`).join('')}
      <polyline points="${last20.map((h, i) => `${20 + i * (w - 30) / (last20.length - 1)},${hgt - 10 - h.nota * 12}`).join(' ')}" class="pc"/>
      ${last20.map((h, i) => `<circle cx="${20 + i * (w - 30) / (last20.length - 1)}" cy="${hgt - 10 - h.nota * 12}" r="3.5" class="pp ${h.mode === 'exam' ? 'pmax' : ''}"><title>${h.nota}</title></circle>`).join('')}
    </svg>` : '<p class="muted">Encara no hi ha prou dades per a la gràfica.</p>';
    el.innerHTML = `
      <section class="card">
        <h2>📊 Estadístiques</h2>
        <div class="hstats">
          <div class="stat"><span class="sv">${S.history.length}</span><span class="sl">Exercicis fets</span></div>
          <div class="stat"><span class="sv">${avg(S.history)}</span><span class="sl">Nota mitjana</span></div>
          <div class="stat"><span class="sv">${S.xp}</span><span class="sl">XP total</span></div>
          <div class="stat"><span class="sv">×${S.bestCombo}</span><span class="sl">Millor combo</span></div>
        </div>
        <h3>Evolució (últimes 30 notes)</h3>${spark}
        <h3>Mitjana per tipus</h3>
        <div class="hstats">${TOPIC_IDS.map(t => `<div class="stat"><span class="sv">${avg(S.history.filter(h => h.topic === t))}</span><span class="sl">${TOPICS[t].icon} ${TOPICS[t].name}</span></div>`).join('')}</div>
      </section>
      <section class="card">
        <h2>🗂️ Historial</h2>
        ${H.length ? `<div class="tblwrap"><table class="tbl hist"><tr><th>Data</th><th>Tipus</th><th>Dificultat</th><th>Nota</th></tr>
          ${H.slice(0, 60).map(h => `<tr><td>${new Date(h.t).toLocaleString('ca', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>${h.mode === 'exam' ? '📝 Simulacre' : TOPICS[h.topic].icon + ' ' + TOPICS[h.topic].name + (h.mode === 'paper' ? ' · <small>paper</small>' : '')}</td>
            <td>${DIFF[h.diff].name}</td><td><b class="n${h.nota >= 9 ? 'a' : h.nota >= 7 ? 'b' : h.nota >= 5 ? 'c' : 'd'}">${h.nota.toFixed(1)}</b></td></tr>`).join('')}
        </table></div>` : '<p class="muted">Encara no has fet cap exercici.</p>'}
        <p><button class="btn ghost danger" id="reset">Esborrar tot el progrés</button></p>
      </section>`;
    $('#reset').onclick = () => {
      if (!confirm('Segur? S\'esborraran XP, nivell, ratxa, missions, insígnies i historial.')) return;
      S = DEF(); save(); renderHeader(); renderHistory(); toast('Progrés esborrat');
    };
  }

  /* ---------------- inici ---------------- */
  function init() {
    ensureDaily();
    $$('.nav button').forEach(b => b.onclick = () => {
      show(b.dataset.view);
      if (b.dataset.view === 'exam' && !examCtl) renderExamIntro();
    });
    renderExamIntro();
    renderHeader();
    $('#hdr-rank').onclick = () => show('train');
    const [hv, ht] = location.hash.slice(1).split('/');
    if (hv === 'learn' && LESSONS.list.some(l => l.id === ht)) openLesson(ht);
    else if (hv === 'train' && SK.byId[ht]) { show('train'); openSkill(ht); }
    else if (['practice', 'exam', 'theory', 'history', 'learn', 'train'].includes(hv)) {
      if (hv === 'practice' && TOPICS[ht]) { S.settings.topic = ht; practiceHasEx = false; }
      show(hv);
    } else show('home');
    save();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
