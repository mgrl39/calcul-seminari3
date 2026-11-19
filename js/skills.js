'use strict';
/* ===========================================================
   Graf de coneixement: habilitats petites + generadors d'ítems
   ràpids (mode Entrena) + exercicis complets de l'Hôpital i
   d'extrems relatius.
   Cada ítem és una "part" compatible amb el motor d'exercicis:
   { type, label, ..., why }   (why = explicació curta)
   =========================================================== */
const SK = (() => {
  const R = String.raw;
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const nz = (a, b) => { let v; do v = ri(a, b); while (v === 0); return v; };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P = s => M.parse(s);
  const isN = (n, v) => n.t === 'num' && n.v === v;
  const negOf = n => (n.t === 'neg' ? n.a : n.t === 'num' && n.v < 0 ? { t: 'num', v: -n.v } : n.t === 'mul' && negOf(n.a) ? { t: 'mul', a: negOf(n.a), b: n.b } : n.t === 'div' && negOf(n.a) ? { t: 'div', a: negOf(n.a), b: n.b } : null);
  // simplificacions només per mostrar (1·x → x, a + (−b) → a − b, x^1 → x)
  function simp(n) {
    if (!n || typeof n !== 'object') return n;
    const a = simp(n.a), b = simp(n.b);
    const m = { ...n, a, b };
    if (n.t === 'mul') { if (isN(a, 1)) return b; if (isN(b, 1)) return a; if (isN(a, -1)) return { t: 'neg', a: b }; if (a.t === 'neg' && isN(a.a, 1)) return { t: 'neg', a: b }; }
    if (n.t === 'pow' && isN(b, 1)) return a;
    if (n.t === 'div') { const na = negOf(a); if (na) return { t: 'neg', a: { t: 'div', a: na, b } }; }
    if (n.t === 'add') { const nb = negOf(b); if (nb) return { t: 'sub', a, b: nb }; }
    if (n.t === 'sub') { const nb = negOf(b); if (nb) return { t: 'add', a, b: nb }; }
    return m;
  }
  const TX = a => M.tex(simp(a));
  const T = s => TX(P(s));
  const F = M.fracTeX, NT = M.numTeX;
  const N = (v, tex) => ({ k: 'num', v, tex: tex ?? NT(v) }), INF = { k: 'inf', s: 1 }, NINF = { k: 'inf', s: -1 }, DNE = { k: 'dne' };
  const POS = [0.19, 0.33, 0.52, 0.74, 0.97, 1.21, 1.46, 1.72, 2.03, 2.4, 2.9, 3.6];
  const I = Infinity;

  /* ---------- constructors d'ítems ---------- */
  function EX(label, ans, why, o = {}) {
    const a = P(ans);
    return { type: 'expr', label, ans, f: x => M.ev(a, x), answerTeX: o.tex || TX(a), why, pts: o.pts, src: o.src };
  }
  const VAL = (label, v, tex, why, o = {}) => ({ type: 'value', label, v, answerTeX: tex ?? NT(v), why, ...o });
  const LIM = (label, lim, why, o = {}) => ({ type: 'limit', label, lim, why, ...o });
  const LST = (label, pairs, why, o = {}) => {
    const list = pairs.map(p => (Array.isArray(p) ? { v: p[0], tex: p[1] ?? NT(p[0]) } : p)).sort((a, b) => a.v - b.v);
    return { type: 'list', label, list, answerTeX: M.listTeX(list), why, ...o };
  };
  const end = (v, tex) => ({ v, tex: tex ?? (v === -I ? '-\\infty' : v === I ? '+\\infty' : NT(v)) });
  function mergeTouch(ivs) {
    const out = [];
    for (const iv of ivs) { const l = out[out.length - 1]; if (l && Math.abs(l.b.v - iv.a.v) < 1e-12) l.b = iv.b; else out.push({ a: iv.a, b: iv.b }); }
    return out;
  }
  // ivs: [{a:{v,tex}, b:{v,tex}}]; la resposta es compara fusionada (com fa el lector)
  const IVL = (label, ivs, why, o = {}) => ({ type: 'intervals', label, intervals: mergeTouch(ivs), answerTeX: M.intervalsTeX(ivs), why, ...o });
  const MC = (label, opts, ok, why) => ({ type: 'mcq', label, options: shuffle(opts.map((h, i) => ({ html: h, ok: i === ok }))), why });

  /* ---------- cadenes d'expressions ---------- */
  const mono = (c, b) => (b === '' ? String(c) : c === 1 ? b : c === -1 ? `-${b}` : `${c}*${b}`);
  const sum = terms => terms.filter(Boolean).join(' + ').replace(/\+ -/g, '- ') || '0';
  const xp = i => (i === 0 ? '' : i === 1 ? 'x' : `x^${i}`);
  const polyS = c => sum(c.map((v, i) => (v === 0 ? null : mono(v, xp(i)))).reverse());
  function isCall(s) {
    const m = s.match(/^[a-z]+\(/);
    if (!m) return false;
    let d = 0;
    for (let i = m[0].length - 1; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')') { d--; if (d === 0) return i === s.length - 1; } }
    return false;
  }
  const isAtom = s => /^x$|^\d+$/.test(s) || isCall(s);
  const pw = (u, n) => (isAtom(u) && u !== 'x' ? `${u}^${n}` : u === 'x' ? `x^${n}` : `(${u})^${n}`);
  const mul = (a, b) => (a === '1' ? b : b === '1' ? a : a.startsWith('1/') ? `${b}/${a.slice(2)}` : b.startsWith('1/') ? `${a}/${b.slice(2)}` : `${a}*${b}`);
  const wrapP = s => (isAtom(s) ? s : `(${s})`);
  const sq = s => (isAtom(s) ? `${s}^2` : `(${s})^2`);
  // a + b, on b pot començar per "-"
  const plus = (a, b) => (b.startsWith('-') ? `${a} - ${b.slice(1)}` : `${a} + ${b}`);
  // a·b on b pot començar per "-"
  const times = (a, b) => (b.startsWith('-') ? `-${mul(a, b.slice(1))}` : mul(a, b));
  const lnTeX = n => (n === 1 ? 'e' : n === 2 ? '\\sqrt{e}' : `e^{1/${n}}`);

  /* ---------- capes per a la regla de la cadena ---------- */
  const OUT = {
    sin: { w: u => `sin(${u})`, lab: '\\sin', r: R`(\sin u)'=\cos u\cdot u'` },
    cos: { w: u => `cos(${u})`, lab: '\\cos', r: R`(\cos u)'=-\sin u\cdot u'` },
    tan: { w: u => `tan(${u})`, lab: '\\tan', r: R`(\tan u)'=\frac{u'}{\cos^2u}` },
    exp: { w: u => `e^(${u})`, lab: 'e^{\\square}', r: R`(e^u)'=e^u\cdot u'`, pos: true },
    ln: { w: u => `ln(${u})`, lab: '\\ln', r: R`(\ln u)'=\frac{u'}{u}`, need: true },
    sqrt: { w: u => `sqrt(${u})`, lab: '\\sqrt{\\square}', r: R`(\sqrt u)'=\frac{u'}{2\sqrt u}`, need: true, pos: true },
  };
  for (const n of [2, 3, 4, 5]) OUT['p' + n] = { n, w: u => pw(u, n), lab: `\\square^{${n}}`, r: `(u^{${n}})'=${n}u${n - 1 === 1 ? '' : `^{${n - 1}}`}\\cdot u'`, pos: n % 2 === 0 ? true : 'keep' };
  function chainD(k, u, du) {
    if (du === '0') return '0';
    if (k === 'ln') return `${wrapP(du)}/${wrapP(u)}`;
    if (k === 'sqrt') return `${wrapP(du)}/(2*sqrt(${u}))`;
    if (k === 'tan') return `${wrapP(du)}/cos(${u})^2`;
    let neg = false, core, coef = 1;
    if (k === 'sin') core = `cos(${u})`;
    else if (k === 'cos') { neg = true; core = `sin(${u})`; }
    else if (k === 'exp') core = `e^(${u})`;
    else { coef = OUT[k].n; core = coef - 1 === 1 ? wrapP(u) : pw(u, coef - 1); }
    let dneg = false, d = du;
    if (d.startsWith('-') && isAtom(d.slice(1))) { dneg = true; d = d.slice(1); }
    if (dneg) neg = !neg;
    if (/^\d+$/.test(d)) { coef *= +d; d = '1'; }
    const c = neg ? -coef : coef;
    const head = mono(c, core);
    return d === '1' ? head : `${head}*${wrapP(d)}`;
  }
  // base: {s, d}; keys de dins cap a fora
  function compose(base, keys) {
    let cur = { s: base.s, d: base.d };
    for (const k of keys) cur = { s: OUT[k].w(cur.s), d: chainD(k, cur.s, cur.d) };
    return cur;
  }

  /* =========================================================
     A. DERIVADES
     ========================================================= */
  const ELEM = [
    { s: 'sin(x)', d: c => mono(c, 'cos(x)'), r: R`(\sin x)'=\cos x` },
    { s: 'cos(x)', d: c => mono(-c, 'sin(x)'), r: R`(\cos x)'=-\sin x` },
    { s: 'e^x', d: c => mono(c, 'e^x'), r: R`(e^x)'=e^x` },
    { s: 'ln(x)', d: c => `${c}/x`, r: R`(\ln x)'=\frac1x`, pos: true },
    { s: 'tan(x)', d: c => `${c}/cos(x)^2`, r: R`(\tan x)'=\frac{1}{\cos^2x}` },
    { s: 'sqrt(x)', d: c => (c % 2 === 0 ? `${c / 2}/sqrt(x)` : `${c}/(2*sqrt(x))`), r: R`(\sqrt x)'=\frac{1}{2\sqrt x}`, pos: true },
  ];
  function dPow(t) {
    if (t === 1) {
      const a = nz(-9, 9), n = ri(2, 7), src = mono(a, `x^${n}`);
      return EX(`Deriva $f(x)=${T(src)}$`, mono(a * n, xp(n - 1)), R`$(x^n)'=n\,x^{n-1}$: l'exponent baixa multiplicant i es resta 1. Aquí $${a}\cdot${n}=${a * n}$.`, { src });
    }
    if (t === 2) {
      const deg = ri(3, 5);
      const c = Array.from({ length: deg + 1 }, (_, i) => (i === deg ? nz(-6, 6) : Math.random() < 0.65 ? ri(-9, 9) : 0));
      const d = M.polyDer(c);
      return EX(`Deriva $f(x)=${M.polyTeX(c)}$`, polyS(d), R`Terme a terme amb $(x^n)'=nx^{n-1}$. La constant es fa $0$.`, { src: polyS(c), tex: M.polyTeX(d) });
    }
    const gens = [
      () => { const a = nz(-6, 6), n = ri(1, 3); return { s: n === 1 ? `${a}/x` : `${a}/x^${n}`, d: `${-a * n}/x^${n + 1}`, w: R`$${T(n === 1 ? `${a}/x` : `${a}/x^${n}`)}=${T(mono(a, `x^(-${n})`))}$, i $(x^{-${n}})'=-${n}x^{-${n + 1}}$` }; },
      () => { const a = nz(-6, 6); return { s: mono(a, 'sqrt(x)'), d: a % 2 === 0 ? `${a / 2}/sqrt(x)` : `${a}/(2*sqrt(x))`, w: R`$\sqrt x=x^{1/2}$, i $(x^{1/2})'=\frac12x^{-1/2}=\frac{1}{2\sqrt x}$` }; },
      () => { const a = pick([2, 4, -2, 6]); return { s: mono(a, 'x*sqrt(x)'), d: mono(a * 3 / 2, 'sqrt(x)'), w: R`$x\sqrt x=x^{3/2}$, i $(x^{3/2})'=\frac32x^{1/2}$` }; },
      () => { const a = nz(-5, 5), n = ri(2, 4); return { s: mono(a, `x^${n}`), d: mono(a * n, xp(n - 1)), w: R`$(x^{${n}})'=${n}x^{${n - 1}}$` }; },
    ];
    const [g1, g2] = shuffle(gens).slice(0, 2).map(g => g());
    const src = sum([g1.s, g2.s]);
    return EX(`Deriva $f(x)=${T(src)}$ (per a $x>0$)`, sum([g1.d, g2.d]), `${g1.w}; ${g2.w}.`, { src, pts: POS });
  }
  function dElem(t) {
    const k = t === 1 ? 1 : t === 2 ? 2 : 3;
    const pool = t === 1 ? ELEM.slice(0, 4) : ELEM;
    const terms = shuffle(pool).slice(0, k).map(e => ({ e, c: nz(-6, 6) }));
    if (t >= 2 && Math.random() < 0.5) terms.push({ e: { s: 'x^3', d: c => mono(3 * c, 'x^2'), r: R`(x^3)'=3x^2` }, c: nz(-4, 4) });
    const src = sum(terms.map(o => mono(o.c, o.e.s)));
    const ans = sum(terms.map(o => o.e.d(o.c)));
    return EX(`Deriva $f(x)=${T(src)}$`, ans, terms.map(o => `$${o.e.r}$`).join(', ') + '. Les constants que multipliquen es queden.', { src, pts: terms.some(o => o.e.pos) ? POS : undefined });
  }
  const UP = [{ s: 'x', d: '1' }, { s: 'x^2', d: '2*x' }, { s: 'x^3', d: '3*x^2' }];
  const UP2 = [{ s: '(x^2+1)', d: '2*x' }, { s: '(x+1)', d: '1' }, { s: '(2*x-3)', d: '2' }, { s: 'x^4', d: '4*x^3' }, { s: '3*x^2', d: '6*x' }, { s: '(x^2-x)', d: '(2*x-1)' }];
  const VF = [{ s: 'sin(x)', d: 'cos(x)' }, { s: 'cos(x)', d: '-sin(x)' }, { s: 'e^x', d: 'e^x' }, { s: 'ln(x)', d: '1/x', pos: true }];
  const prodAns = (u, v) => plus(mul(u.d, v.s), times(u.s, v.d));
  function dProd(t) {
    let u, v;
    if (t === 1) { u = pick(UP); v = pick(VF); }
    else if (t === 2) { u = pick(UP2); v = pick(VF); }
    else { [u, v] = shuffle(VF).slice(0, 2); if (Math.random() < 0.3) { u = pick(UP2); v = pick(VF); } }
    const src = `${u.s}*${v.s}`;
    return EX(`Deriva $f(x)=${T(src)}$`, prodAns(u, v), R`Regla del producte $(u\,v)'=u'v+u\,v'$ amb $u=${T(u.s)}$ ($u'=${T(u.d)}$) i $v=${T(v.s)}$ ($v'=${T(v.d)}$).`, { src, pts: u.pos || v.pos ? POS : undefined });
  }
  function dQuot(t) {
    const NUM = t === 1 ? [{ s: '1', d: '0' }, { s: 'x', d: '1' }] : t === 2 ? [{ s: 'x', d: '1' }, { s: 'x^2', d: '2*x' }, { s: '(x+1)', d: '1' }, { s: '1', d: '0' }]
      : [{ s: 'sin(x)', d: 'cos(x)' }, { s: 'e^x', d: 'e^x' }, { s: 'ln(x)', d: '1/x', pos: true }, { s: 'x^2', d: '2*x' }];
    const DEN = t === 1 ? [{ s: '(x+2)', d: '1' }, { s: '(x^2+1)', d: '2*x' }, { s: 'x', d: '1' }] : t === 2 ? [{ s: '(x^2+1)', d: '2*x' }, { s: '(x+2)', d: '1' }, { s: '(x-3)', d: '1' }, { s: 'x^2', d: '2*x' }]
      : [{ s: 'x', d: '1' }, { s: 'e^x', d: 'e^x' }, { s: '(x^2+1)', d: '2*x' }, { s: 'cos(x)', d: '-sin(x)' }];
    let u, v;
    do { u = pick(NUM); v = pick(DEN); } while (u.s === v.s || (u.s === 'x' && v.s === 'x'));
    const src = `${u.s}/${v.s}`;
    const uv = times(u.s, v.d);
    const numer = u.d === '0' ? (uv.startsWith('-') ? uv.slice(1) : `-${uv}`) : (uv.startsWith('-') ? `${mul(u.d, v.s)} + ${uv.slice(1)}` : `${mul(u.d, v.s)} - ${uv}`);
    const ans = `(${numer})/${sq(v.s)}`;
    return EX(`Deriva $f(x)=${T(src)}$`, ans, R`Regla del quocient $\left(\frac uv\right)'=\frac{u'v-u\,v'}{v^2}$ amb $u=${T(u.s)}$, $v=${T(v.s)}$. Compte: el signe menys va al davant de $u\,v'$.`, { src, pts: u.pos ? POS : undefined });
  }
  function dVal(t) {
    if (t === 1) {
      const c = [ri(-5, 5), ri(-6, 6), nz(-4, 4), Math.random() < 0.5 ? nz(-3, 3) : 0];
      const a = ri(-2, 2), d = M.polyDer(c);
      return VAL(`Si $f(x)=${M.polyTeX(c)}$, quant val $f'(${a})$?`, M.polyEval(d, a), null, R`$f'(x)=${M.polyTeX(d)}$ i substituïm $x=${a}$.`);
    }
    const opts = [
      () => { const a = nz(-4, 4), b = nz(-4, 4), c = nz(-3, 3); const src = `(${polyS([b, a])})*e^(${mono(c, 'x')})`; return { src, at: 0, v: a + b * c, w: R`$f'(x)=${a}e^{${c}x}+(${M.polyTeX([b, a])})\cdot${c}e^{${c}x}$; a $x=0$: $${a}+${b}\cdot${c}=${a + b * c}$.` }; },
      () => { const a = nz(-4, 4), b = nz(-4, 4), c = nz(-3, 3); const src = `(${polyS([b, a])})*sin(${mono(c, 'x')})`; return { src, at: 0, v: b * c, w: R`$f'(x)=${a}\sin(${c}x)+(${M.polyTeX([b, a])})\cdot${c}\cos(${c}x)$; a $x=0$: $0+${b}\cdot${c}=${b * c}$.` }; },
      () => { const a = nz(-4, 4), b = nz(-4, 4); const src = `e^(${mono(a, 'x')})*cos(${mono(b, 'x')})`; return { src, at: 0, v: a, w: R`$f'(x)=${a}e^{${a}x}\cos(${b}x)-${b}e^{${a}x}\sin(${b}x)$; a $x=0$: $${a}$.` }; },
      () => ({ src: 'x^2*ln(x)', at: 1, v: 1, w: R`$f'(x)=2x\ln x+x$; a $x=1$: $0+1=1$.` }),
      () => ({ src: 'ln(x)/x', at: 1, v: 1, w: R`$f'(x)=\frac{1-\ln x}{x^2}$; a $x=1$: $1$.` }),
      () => { const n = ri(2, 4); return { src: `(x^2+1)^${n}`, at: 1, v: n * 2 ** (n - 1) * 2, w: R`Cadena: $f'(x)=${n}(x^2+1)^{${n - 1}}\cdot2x$; a $x=1$: $${n}\cdot2^{${n - 1}}\cdot2=${n * 2 ** n}$.` }; },
    ];
    const o = (t === 2 ? pick(opts.slice(0, 3)) : pick(opts))();
    return VAL(`Si $f(x)=${T(o.src)}$, quant val $f'(${o.at})$?`, o.v, null, o.w, { src: o.src, at: o.at });
  }

  /* =========================================================
     B. REGLA DE LA CADENA
     ========================================================= */
  const seqTeX = (keys, base) => keys.slice().reverse().map(k => OUT[k].lab).concat([T(base)]).join(R` \to `);
  function bad(prev, k, used) {
    if (!prev) return false;
    if (prev === k && !['sin', 'cos'].includes(k)) return true;
    if ((prev === 'exp' && k === 'ln') || (prev === 'ln' && k === 'exp')) return true;
    if (prev[0] === 'p' && (k[0] === 'p' || k === 'sqrt')) return true;
    if (prev === 'sqrt' && k[0] === 'p') return true;
    if (prev === 'exp' && k[0] === 'p') return true;
    if (['exp', 'ln', 'sqrt', 'tan'].includes(k) && used.includes(k)) return true;
    return false;
  }
  function randKeys(n, base, allowed = ['sin', 'cos', 'exp', 'ln', 'sqrt', 'p2', 'p3']) {
    for (let tries = 0; tries < 200; tries++) {
      const keys = [];
      let pos = !!base.pos;
      for (let i = 0; i < n; i++) {
        const c = allowed.filter(k => (!OUT[k].need || pos) && !bad(keys[i - 1], k, keys) && !(i === 0 && k[0] === 'p' && /^\d*\*?x(\^\d)?$/.test(base.s))
          && !(k === 'exp' && !(i === 0 ? base.s !== 'x^3' : ['sin', 'cos'].includes(keys[i - 1]))));
        if (!c.length) break;
        const k = pick(c);
        keys.push(k);
        const p = OUT[k].pos;
        pos = p === 'keep' ? pos : !!p;
      }
      if (keys.length === n) return keys;
    }
    return ['sin', 'p2'].slice(0, n);
  }
  const BASES = [{ s: 'x^2', d: '2*x' }, { s: 'x^3', d: '3*x^2' }, { s: '3*x', d: '3' }, { s: '2*x+1', d: '2' }, { s: 'x^2+1', d: '2*x', pos: true }];
  function cLayers(t) {
    const base = pick(BASES);
    const n = t === 1 ? 2 : 3;
    const allowed = t === 3 ? ['sin', 'cos', 'p2', 'p3', 'exp'] : ['sin', 'cos', 'exp', 'ln', 'sqrt', 'p2', 'p3'];
    let keys = randKeys(n, base, allowed);
    for (let g = 0; g < 30 && new Set(keys.map(k => OUT[k].lab)).size < n; g++) keys = randKeys(n, base, allowed);
    if (t === 3 && !keys.some(k => k[0] === 'p')) keys = ['sin', 'p2', 'cos'].slice(0, n);
    const f = compose(base, keys);
    const correct = seqTeX(keys, base.s);
    if (t === 1 || t === 3) {
      const ext = keys[keys.length - 1];
      const others = shuffle(Object.keys(OUT).filter(k => OUT[k].lab !== OUT[ext].lab && !['p4', 'p5', 'tan'].includes(k))).slice(0, 2).map(k => `$${OUT[k].lab}$`);
      const innerLab = `$${OUT[keys[0]].lab === OUT[ext].lab ? T(base.s) : OUT[keys[0]].lab}$`;
      const opts = [...new Set([`$${OUT[ext].lab}$`, innerLab, ...others])].slice(0, 4);
      return MC(`Quina és la <b>capa exterior</b> (l'última operació) de $f(x)=${T(f.s)}$?`, opts, 0,
        R`Capes de fora cap a dins: $${correct}$. La capa exterior és l'última operació que faries amb la calculadora.`);
    }
    const perms = new Set([correct]);
    let guard = 0;
    while (perms.size < 4 && guard++ < 50) perms.add(seqTeX(shuffle(keys), base.s));
    const opts = [...perms].map(s => `$${s}$`);
    return MC(`Ordena les capes de <b>fora cap a dins</b> de $f(x)=${T(f.s)}$:`, opts, 0, R`De fora cap a dins: $${correct}$.`);
  }
  function lin() { const a = nz(-5, 5), b = ri(-5, 5); return { s: polyS([b, a]), d: String(a) }; }
  function cOne(t) {
    let base;
    if (t === 1) base = lin();
    else if (t === 2) base = pick([{ s: `${ri(1, 3) === 1 ? '' : ri(2, 3) + '*'}x^2+${ri(1, 4)}`, pos: true }, { s: 'x^3', d: '3*x^2' }, { s: `x^2-${ri(1, 4)}*x`, pd: true }]);
    else base = pick([{ s: 'sin(x)', d: 'cos(x)' }, { s: 'cos(x)', d: '-sin(x)' }, { s: 'e^x', d: 'e^x', pos: true }, { s: 'ln(x)', d: '1/x', dom: POS }, { s: '1+e^x', d: 'e^x', pos: true }, { s: 'x^2+4', d: '2*x', pos: true }]);
    if (!base.d) { const ast = base.s.replace(/\s/g, ''); const c = polyFrom(ast); base.d = polyS(M.polyDer(c)); }
    const ks = ['sin', 'cos', 'exp', 'p2', 'p3', 'p4', 'p5', ...(base.pos ? ['ln', 'sqrt'] : []), ...(t >= 2 ? ['tan'] : [])].filter(k => !(base.s.startsWith('e^') && k === 'ln') && !(base.s.startsWith('ln') && k === 'exp'));
    const k = pick(ks);
    const f = compose(base, [k]);
    return EX(`Deriva $f(x)=${T(f.s)}$`, f.d, R`Exterior: $${OUT[k].lab}$, interior $u=${T(base.s)}$ amb $u'=${T(base.d)}$. Regla: $${OUT[k].r}$.`, { src: f.s, pts: base.dom || (base.s.includes('ln') ? POS : undefined) });
  }
  // coeficients d'un polinomi senzill escrit com "a*x^2+b" (per a cOne)
  function polyFrom(s) {
    const c = [0, 0, 0, 0, 0, 0];
    for (const term of s.replace(/-/g, '+-').split('+').filter(Boolean)) {
      const m = term.match(/^(-?\d*)\*?(x(?:\^(\d))?)?$/);
      if (!m) continue;
      const coef = m[1] === '' ? 1 : m[1] === '-' ? -1 : +m[1];
      const p = m[2] ? (m[3] ? +m[3] : 1) : 0;
      c[p] += coef;
    }
    return M.trim(c);
  }
  function cPowTrig(t) {
    const trig = pick(['sin', 'cos']);
    let base, keys;
    if (t === 1) { base = pick([{ s: 'x', d: '1' }, { s: `${ri(2, 5)}*x`, d: null }]); keys = Math.random() < 0.6 ? [trig, pick(['p2', 'p3'])] : null; if (!keys) { base = { s: `x^${ri(2, 4)}` }; keys = [trig]; } }
    else if (t === 2) { const n = ri(2, 4); base = Math.random() < 0.5 ? { s: `${ri(2, 4)}*x` } : { s: `x^${ri(2, 3)}` }; keys = [trig, 'p' + n]; }
    else {
      const other = trig === 'sin' ? 'cos' : 'sin', pn = pick(['p2', 'p3']);
      base = { s: `x^${ri(2, 3)}` };
      keys = pick([[trig, pn, 'exp'], [trig, other, pn], [other, trig, pn]]);
      if (keys[2] === 'exp') base = { s: 'x^2' };
    }
    if (!base.d) base.d = polyS(M.polyDer(polyFrom(base.s)));
    const f = compose(base, keys);
    return EX(`Deriva $f(x)=${T(f.s)}$`, f.d, R`Capes de fora cap a dins: $${seqTeX(keys, base.s)}$. Recorda: $\sin^n(u)$ vol dir $(\sin u)^n$, i la potència és la capa de <b>fora</b>.`, { src: f.s });
  }
  function cMulti(t) {
    const base = pick(BASES);
    const n = t === 1 ? 2 : t === 2 ? 3 : pick([3, 4]);
    const keys = randKeys(n, base);
    const f = compose(base, keys);
    return EX(`Deriva $f(x)=${T(f.s)}$`, f.d, R`Capes: $${seqTeX(keys, base.s)}$. Un factor per capa, cada capa derivada amb el seu argument intacte.`, { src: f.s });
  }
  function cMixed(t) {
    let u, v;
    if (t === 1) { u = pick(UP); v = compose(lin(), [pick(['sin', 'cos', 'exp'])]); }
    else if (t === 2) { u = pick([...UP, ...UP2.slice(0, 3)]); v = compose(pick([{ s: 'x^2', d: '2*x' }, lin()]), [pick(['sin', 'cos', 'exp', 'p3'])]); }
    else {
      const a = nz(-3, 3);
      u = compose({ s: mono(a, 'x'), d: String(a) }, ['exp']);
      const kk = ri(2, 4);
      v = compose(pick([{ s: `${kk}*x`, d: String(kk) }, { s: 'x', d: '1' }]), [pick(['sin', 'cos'])]);
      if (Math.random() < 0.4) { u = pick(UP); v = compose({ s: 'x^2+1', d: '2*x', pos: true }, [pick(['ln', 'sqrt'])]); }
    }
    const src = `${wrapP(u.s)}*${wrapP(v.s)}`;
    return EX(`Deriva $f(x)=${T(src)}$`, plus(mul(u.d, wrapP(v.s)), times(wrapP(u.s), v.d)), R`Producte: $(u\,v)'=u'v+u\,v'$ amb $u=${T(u.s)}$, $v=${T(v.s)}$. Per derivar $v$ cal la cadena: $v'=${T(v.d)}$.`, { src });
  }

  /* =========================================================
     C. LÍMITS I ACOTACIÓ
     ========================================================= */
  const limL = (at, tex, extra = '') => R`Calcula $\displaystyle\lim_{x\to ${at}} ${tex}$${extra}`;
  function lSub(t) {
    if (t === 1) {
      const c = [ri(-5, 5), ri(-5, 5), nz(-3, 3)], a = ri(-3, 3);
      return LIM(limL(a, M.polyTeX(c)), N(M.polyEval(c, a)), R`Un polinomi és continu: substitueix $x=${a}$.`, { src: polyS(c), at: a });
    }
    if (t === 2) {
      let p, q, r, s, a;
      do { p = nz(-4, 4); q = ri(-5, 5); r = nz(-3, 3); s = ri(-5, 5); a = ri(-3, 3); } while (r * a + s === 0 || p * s === q * r);
      const src = `(${polyS([q, p])})/(${polyS([s, r])})`;
      return LIM(limL(a, T(src)), N((p * a + q) / (r * a + s), F(p * a + q, r * a + s)), R`El denominador no s'anul·la a $x=${a}$ (val $${r * a + s}$), per tant no hi ha cap indeterminació: substitueix. Resultat $\frac{${p * a + q}}{${r * a + s}}$.`, { src, at: a });
    }
    const opts = [
      () => { const a = nz(-3, 3); return { src: `e^(${mono(a, 'x')})*cos(x)`, at: 0, v: 1, w: R`Contínua: $e^0\cos0=1$.` }; },
      () => { const a = nz(1, 4); return { src: `(x^2-${a * a})/(x+${a})`, at: a, v: 0, w: R`A $x=${a}$ el denominador val $${2 * a}\neq0$ i el numerador $0$: el límit és $\frac{0}{${2 * a}}=0$ (no és cap indeterminació).` }; },
      () => { const a = nz(1, 4); return { src: `(x+${a})/(x^2+1)`, at: 0, v: a, w: R`Substitueix $x=0$: $\frac{${a}}{1}=${a}$.` }; },
      () => { const a = ri(2, 5); return { src: `sqrt(x+${a * a - 1})`, at: 1, v: a, w: R`$\sqrt{1+${a * a - 1}}=\sqrt{${a * a}}=${a}$.` }; },
    ];
    const o = pick(opts)();
    return LIM(limL(o.at, T(o.src)), N(o.v), o.w, { src: o.src, at: o.at });
  }
  const TRIG = ['sin', 'cos'];
  const osc = (c, k, tr) => mono(c, (k === 0 ? '' : k === 1 ? 'x*' : `x^${k}*`) + `${tr}(1/x)`);
  function lBounded(t) {
    if (t === 3 && Math.random() < 0.5) {
      const c = nz(-5, 5), b = ri(-4, 4), tr = pick(TRIG);
      const src = sum([`${mono(c, `${tr}(x)`)}/x`, b ? String(b) : null]);
      return LIM(limL(R`+\infty`, T(src)), N(b), R`$\left|\frac{${tr === 'sin' ? '\\sin' : '\\cos'} x}{x}\right|\le\frac1x\to0$ (acotada entre una cosa que va a infinit), i queda $${b}$.`, { src, at: I });
    }
    const k = ri(1, 3), c = nz(-5, 5), tr = pick(TRIG);
    const b = t === 1 ? 0 : nz(-5, 5);
    const src = sum([osc(c, k, tr), b ? String(b) : null, t === 3 ? mono(nz(-3, 3), 'x') : null]);
    return LIM(limL(0, T(src)), N(b), R`$\left|${T(osc(c, k, tr))}\right|\le ${Math.abs(c) === 1 ? '' : Math.abs(c)}|x|^{${k}}\to0$: <b>zero per acotada</b> ($|\sin|,|\cos|\le1$). La resta és contínua i val $${b}$ a $x=0$.`, { src, at: 0 });
  }
  function lOsc(t) {
    const nTerms = t === 1 ? 1 : 2;
    const ks = [];
    for (let i = 0; i < nTerms; i++) ks.push(t === 3 ? ri(-1, 3) : ri(0, 2));
    if (t === 3 && Math.random() < 0.5) ks[0] = ri(1, 3);
    const terms = ks.map(k => ({ k, c: nz(-4, 4), tr: pick(TRIG) }));
    const minK = Math.min(...ks);
    const str = o => (o.k === -1 ? mono(o.c, `${o.tr}(1/x)/x`) : osc(o.c, o.k, o.tr));
    const src = sum(terms.map(str));
    const dne = minK <= 0;
    return LIM(limL(0, T(src), ' (o escriu «no existeix»)'), dne ? DNE : N(0),
      dne ? R`El terme $${T(str(terms.find(o => o.k === minK)))}$ ${minK === 0 ? 'oscil·la sense parar entre dos valors' : 'oscil·la amb amplitud que creix'} quan $x\to0$: <b>no té límit</b>. Sumar-li termes que tendeixen a $0$ no ho arregla.`
        : R`Tots els termes són $x^k\cdot(\text{acotada})$ amb $k\ge1$: tots tendeixen a $0$.`, { src, at: 0 });
  }
  function lDefDer(t) {
    if (t === 1) {
      const c = [ri(-4, 4), ri(-5, 5), nz(-3, 3)], a = ri(-2, 2), d = M.polyDer(c);
      return LIM(R`Sigui $f(x)=${M.polyTeX(c)}$. Calcula $\displaystyle\lim_{h\to0}\frac{f(${a}+h)-f(${a})}{h}$.`, N(M.polyEval(d, a)), R`Aquest límit és la definició de $f'(${a})$. Amb les regles: $f'(x)=${M.polyTeX(d)}$, $f'(${a})=${M.polyEval(d, a)}$.`);
    }
    const k = ri(1, 3), c = nz(-4, 4), tr = pick(TRIG), a = t === 3 ? nz(-4, 4) : 0;
    const src = sum([osc(c, k, tr), a ? mono(a, 'x') : null]);
    const q = sum([osc(c, k - 1, tr), a ? String(a) : null]);
    return LIM(R`Sigui $f(x)=${T(src)}$ si $x\neq0$ i $f(0)=0$. Calcula $f'(0)=\displaystyle\lim_{h\to0}\frac{f(h)-f(0)}{h}$ (o «no existeix»).`, k >= 2 ? N(a) : DNE,
      R`$\frac{f(h)-0}{h}=${T(q).replace(/x/g, 'h')}$. ${k >= 2 ? R`Com que $h^{${k - 1}}\cdot(\text{acotada})\to0$, el límit és $${a}$.` : R`El terme $${tr === 'sin' ? '\\sin' : '\\cos'}(1/h)$ oscil·la: el límit no existeix, i $f$ no és derivable a $0$.`}`);
  }
  const CLASS = ['No és contínua a $0$', 'Contínua però no derivable a $0$', "Derivable a $0$, però $f'$ no és contínua a $0$", "Derivable i amb $f'$ contínua a $0$ (de classe $C^1$)"];
  function lClass(t) {
    const k = t === 1 ? ri(1, 2) : t === 2 ? ri(0, 3) : ri(0, 4);
    const c = nz(-3, 3), tr = pick(TRIG);
    const src = sum([osc(c, k, tr), t === 3 && Math.random() < 0.5 ? mono(nz(-3, 3), 'x') : null]);
    const ans = Math.min(k, 3);
    const W = [
      R`$f(x)$ oscil·la i no tendeix a $f(0)=0$: no és contínua.`,
      R`$|f(x)|\le C|x|\to0$: contínua. Però $\frac{f(h)}{h}$ conté $${tr}(1/h)$, que oscil·la: no derivable.`,
      R`$\frac{f(h)}{h}=h\cdot(\text{acotada})\to0$: derivable amb $f'(0)=0$ (o el que valgui el terme lineal). Però $f'(x)$ conté un terme $\pm\cos(1/x)$ o $\pm\sin(1/x)$ sense $x$ davant, que oscil·la: $f'$ no és contínua.`,
      R`Derivable a $0$ i tots els termes de $f'(x)$ porten com a mínim una $x$ multiplicant: $f'(x)\to f'(0)$. És $C^1$.`,
    ];
    return MC(`Sigui $f(x)=${T(src)}$ si $x\neq0$, i $f(0)=0$. Quina afirmació és correcta?`, CLASS, ans, W[ans]);
  }

  /* =========================================================
     D. REGLA DE L'HÔPITAL
     ========================================================= */
  const FORMS = { '00': R`$\frac{0}{0}$`, ii: R`$\frac{\infty}{\infty}$`, '0i': R`$0\cdot\infty$`, 'i-i': R`$\infty-\infty$`, '1i': R`$1^{\infty}$`, '0^0': R`$0^{0}$`, 'i^0': R`$\infty^{0}$`, no: 'No és cap indeterminació' };
  const atTeX = at => (at === I ? '+\\infty' : at === '0+' ? '0^{+}' : String(at));
  const atNum = at => (at === '0+' ? 0 : at);
  function hForm(t) {
    const a = ri(2, 5);
    const L1 = [
      { s: `sin(${a}*x)/x`, at: 0, f: '00', w: R`$\sin(${a}\cdot0)=0$ i el denominador també $0$.` },
      { s: `(e^(${a}*x)-1)/x`, at: 0, f: '00', w: R`$e^0-1=0$ a dalt i $0$ a baix.` },
      { s: `ln(x)/x^${a}`, at: I, f: 'ii', w: R`$\ln x\to\infty$ i $x^{${a}}\to\infty$.` },
      { s: `x^${a}/e^x`, at: I, f: 'ii', w: R`Els dos van a $\infty$.` },
      { s: `(x+${a})/(x+1)`, at: 0, f: 'no', w: R`Substituint dona $\frac{${a}}{1}=${a}$: és un número, no hi ha res a resoldre (i <b>no</b> es pot aplicar l'Hôpital).` },
      { s: `(x^2+${a})/(x+1)`, at: 0, f: 'no', w: R`Substituint dona $${a}$. No és indeterminació.` },
    ];
    const L2 = [
      { s: `x*ln(x)`, at: '0+', f: '0i', w: R`$x\to0$ i $\ln x\to-\infty$.` },
      { s: `x^${a}*e^(-x)`, at: I, f: '0i', w: R`$x^{${a}}\to\infty$ i $e^{-x}\to0$.` },
      { s: `1/x-1/sin(x)`, at: '0+', f: 'i-i', w: R`Els dos termes van a $+\infty$ i es resten.` },
      { s: `sqrt(x^2+${a}*x)-x`, at: I, f: 'i-i', w: R`$\sqrt{x^2+${a}x}\to\infty$ i $x\to\infty$.` },
      { s: `cos(x)/x`, at: '0+', f: 'no', w: R`$\cos 0=1$ a dalt, $0^+$ a baix: dona $+\infty$ directament, no és indeterminació.` },
    ];
    const L3 = [
      { s: `(1+${a}/x)^x`, at: I, f: '1i', w: R`La base tendeix a $1$ i l'exponent a $\infty$.` },
      { s: `x^x`, at: '0+', f: '0^0', w: R`Base $\to0$ i exponent $\to0$.` },
      { s: `x^(1/x)`, at: I, f: 'i^0', w: R`Base $\to\infty$ i exponent $\frac1x\to0$.` },
      { s: `(1+${a}*x)^(1/x)`, at: 0, f: '1i', w: R`Base $\to1$, exponent $\frac1x\to\infty$.` },
      { s: `x^(sin(x))`, at: '0+', f: '0^0', w: R`Base $\to0$, exponent $\sin x\to0$.` },
      { s: `(2+x)^(1/x)`, at: '0+', f: 'no', w: R`La base tendeix a $2$ (no a $1$): $2^{+\infty}=+\infty$. No és indeterminació.` },
    ];
    const pool = t === 1 ? L1 : t === 2 ? [...L1, ...L2, ...L2] : [...L2, ...L3, ...L3];
    const o = pick(pool);
    const keys = t === 1 ? ['00', 'ii', '0i', 'no'] : t === 2 ? ['00', 'ii', '0i', 'i-i', 'no'] : Object.keys(FORMS);
    const others = shuffle(keys.filter(k => k !== o.f)).slice(0, 3);
    return MC(`Quin tipus de límit és $\\displaystyle\\lim_{x\\to ${atTeX(o.at)}} ${T(o.s)}$?`, [FORMS[o.f], ...others.map(k => FORMS[k])], 0, o.w);
  }
  // plantilles 0/0 (una aplicació)
  function H00(t) {
    const a = ri(1, 5), b = ri(2, 5), n = ri(2, 5);
    let c = ri(1, 4); while (c === a) c = ri(1, 4);
    const L = [
      { t: 1, N: `sin(${a}*x)`, D: `${b}*x`, dN: `${a}*cos(${a}*x)`, dD: `${b}`, at: 0, v: a / b, vt: F(a, b) },
      { t: 1, N: `e^(${a}*x)-1`, D: `${b}*x`, dN: `${a}*e^(${a}*x)`, dD: `${b}`, at: 0, v: a / b, vt: F(a, b) },
      { t: 1, N: `x^2-${a * a}`, D: `x-${a}`, dN: '2*x', dD: '1', at: a, v: 2 * a },
      { t: 1, N: `x^${n}-1`, D: 'x-1', dN: `${n}*x^${n - 1}`, dD: '1', at: 1, v: n },
      { t: 2, N: `ln(1+${a}*x)`, D: `${b}*x`, dN: `${a}/(1+${a}*x)`, dD: `${b}`, at: 0, v: a / b, vt: F(a, b) },
      { t: 2, N: `x^3-${a ** 3}`, D: `x-${a}`, dN: '3*x^2', dD: '1', at: a, v: 3 * a * a },
      { t: 2, N: `tan(${a}*x)`, D: `${b}*x`, dN: `${a}/cos(${a}*x)^2`, dD: `${b}`, at: 0, v: a / b, vt: F(a, b) },
      { t: 2, N: `sin(${a}*x)`, D: `sin(${b}*x)`, dN: `${a}*cos(${a}*x)`, dD: `${b}*cos(${b}*x)`, at: 0, v: a / b, vt: F(a, b) },
      { t: 2, N: 'ln(x)', D: 'x-1', dN: '1/x', dD: '1', at: 1, v: 1 },
      { t: 2, N: `x^2-${a + c}*x+${a * c}`, D: `x-${a}`, dN: `2*x-${a + c}`, dD: '1', at: a, v: a - c },
      { t: 3, N: `e^(${a}*x)-e^(${c}*x)`, D: 'x', dN: `${a}*e^(${a}*x)-${c}*e^(${c}*x)`, dD: '1', at: 0, v: a - c },
      { t: 3, N: `sqrt(1+${a}*x)-1`, D: 'x', dN: `${a}/(2*sqrt(1+${a}*x))`, dD: '1', at: 0, v: a / 2, vt: F(a, 2) },
      { t: 3, N: `1-e^(${a}*x)`, D: `sin(${b}*x)`, dN: `-${a}*e^(${a}*x)`, dD: `${b}*cos(${b}*x)`, at: 0, v: -a / b, vt: F(-a, b) },
      { t: 3, N: `${a}*x-sin(${a}*x)`, D: `x^2`, dN: `${a}-${a}*cos(${a}*x)`, dD: '2*x', at: 0, v: 0, twice: true },
    ];
    return pick(L.filter(o => (t === 3 ? true : o.t <= t) && !o.twice));
  }
  const fracS = (N, D) => `(${N})/(${D})`;
  function h00(t) {
    const o = H00(t);
    const src = fracS(o.N, o.D);
    return LIM(limL(o.at, T(src)), N(o.v, o.vt), R`Substituint surt $\frac00$. Per l'Hôpital: $\displaystyle\lim_{x\to${o.at}}\frac{${T(o.dN)}}{${T(o.dD)}}$, i ara substituint $x=${o.at}$ surt $${o.vt ?? NT(o.v)}$.`, { src, at: o.at });
  }
  function hStep(t) {
    const o = pick([H00(t), H00(t), HINF(t)].filter(x => x.dN));
    const src = fracS(o.N, o.D);
    const ans = fracS(o.dN, o.dD);
    return EX(R`Aplica l'Hôpital <b>una vegada</b> a $\displaystyle\lim_{x\to ${atTeX(o.at)}} ${T(src)}$: escriu el quocient $\frac{f'(x)}{g'(x)}$ (sense calcular el límit).`, ans,
      R`Es deriven <b>per separat</b> numerador i denominador (no és la regla del quocient!): $f'=${T(o.dN)}$, $g'=${T(o.dD)}$.`, { pts: POS, testN: o.N, testD: o.D });
  }
  function hTwice(t) {
    const a = ri(1, 4), b = ri(2, 5);
    const L = [
      { t: 1, s: `(1-cos(${a}*x))/x^2`, at: 0, v: a * a / 2, st: [R`\frac{${a}\sin(${a}x)}{2x}`, R`\frac{${a * a}\cos(${a}x)}{2}`] },
      { t: 1, s: `(e^(${a}*x)-1-${a}*x)/x^2`, at: 0, v: a * a / 2, st: [R`\frac{${a}e^{${a}x}-${a}}{2x}`, R`\frac{${a * a}e^{${a}x}}{2}`] },
      { t: 2, s: `(cos(${a}*x)-1)/(${b}*x^2)`, at: 0, v: -a * a / (2 * b), st: [R`\frac{-${a}\sin(${a}x)}{${2 * b}x}`, R`\frac{-${a * a}\cos(${a}x)}{${2 * b}}`] },
      { t: 2, s: '(ln(1+x)-x)/x^2', at: 0, v: -1 / 2, st: [R`\frac{\frac{1}{1+x}-1}{2x}`, R`\frac{-\frac{1}{(1+x)^2}}{2}`] },
      { t: 2, s: '(e^x+e^(-x)-2)/x^2', at: 0, v: 1, st: [R`\frac{e^x-e^{-x}}{2x}`, R`\frac{e^x+e^{-x}}{2}`] },
      { t: 3, s: '(x-sin(x))/x^3', at: 0, v: 1 / 6, st: [R`\frac{1-\cos x}{3x^2}`, R`\frac{\sin x}{6x}`, R`\frac{\cos x}{6}`] },
      { t: 3, s: '(tan(x)-x)/x^3', at: 0, v: 1 / 3, st: [R`\frac{\frac{1}{\cos^2x}-1}{3x^2}=\frac{\tan^2x}{3x^2}=\frac13\left(\frac{\tan x}{x}\right)^2`, R`\frac13\cdot1^2`] },
      { t: 3, s: `(e^(${a}*x)-1-sin(${a}*x))/x^2`, at: 0, v: a * a / 2, st: [R`\frac{${a}e^{${a}x}-${a}\cos(${a}x)}{2x}`, R`\frac{${a * a}e^{${a}x}+${a * a}\sin(${a}x)}{2}`] },
      { t: 3, s: 'x*sin(x)/(1-cos(x))', at: 0, v: 2, st: [R`\frac{\sin x+x\cos x}{\sin x}`, R`\frac{2\cos x-x\sin x}{\cos x}`] },
      { t: 3, s: `(${a}*x-sin(${a}*x))/x^3`, at: 0, v: a ** 3 / 6, st: [R`\frac{${a}-${a}\cos(${a}x)}{3x^2}`, R`\frac{${a * a}\sin(${a}x)}{6x}`, R`\frac{${a ** 3}\cos(${a}x)}{6}`] },
    ];
    const o = pick(L.filter(x => x.t === t || (t === 3 && x.t === 2 && Math.random() < 0.3)).concat(L.filter(x => x.t === t)));
    const steps = o.st.map((s, i) => `${i + 1}a aplicació: $${s}$${i < o.st.length - 1 ? ' (encara $\\frac00$)' : ''}`).join('<br>');
    return LIM(limL(o.at, T(o.s)), N(o.v), `És $\\frac00$.<br>${steps}<br>Substituint $x=0$: $${NT(o.v)}$.`, { src: o.s, at: o.at });
  }
  function HINF(t) {
    const a = ri(1, 3), b = ri(2, 6), n = ri(1, 3);
    const L = [
      { t: 1, N: 'ln(x)', D: n === 1 ? 'x' : `x^${n}`, dN: '1/x', dD: n === 1 ? '1' : `${n}*x^${n - 1}`, lim: N(0), w: R`Queda $\frac{1/x}{${n === 1 ? '1' : `${n}x^{${n - 1}}`}}=\frac{1}{${n === 1 ? '' : n}x^{${n}}}\to0$. El logaritme creix més lent que qualsevol potència.` },
      { t: 1, N: n === 1 ? 'x' : `x^${n}`, D: `e^(${a}*x)`, dN: n === 1 ? '1' : `${n}*x^${n - 1}`, dD: `${a}*e^(${a}*x)`, lim: N(0), w: R`Aplicant l'Hôpital ${n} cop${n > 1 ? 's' : ''} el numerador es fa constant i a baix queda una exponencial $\to\infty$: límit $0$. L'exponencial guanya a qualsevol potència.` },
      { t: 1, N: `e^(${a}*x)`, D: n === 1 ? 'x' : `x^${n}`, dN: `${a}*e^(${a}*x)`, dD: n === 1 ? '1' : `${n}*x^${n - 1}`, lim: INF, w: R`Després de ${n} aplicació${n > 1 ? 'ns' : ''} a dalt hi ha $e^{${a}x}\to\infty$ i a baix una constant: $+\infty$.` },
      { t: 2, N: 'x', D: 'ln(x)', dN: '1', dD: '1/x', lim: INF, w: R`$\frac{1}{1/x}=x\to+\infty$.` },
      { t: 2, N: 'ln(x)^2', D: 'x', dN: '2*ln(x)/x', dD: '1', lim: N(0), w: R`$\frac{2\ln x}{x}$, que torna a ser $\frac\infty\infty$; una altra vegada: $\frac{2/x}{1}\to0$.` },
      { t: 2, N: `ln(${b}*x)`, D: 'ln(x)', dN: '1/x', dD: '1/x', lim: N(1), w: R`$(\ln(${b}x))'=\frac{${b}}{${b}x}=\frac1x$: el quocient de derivades és $1$.` },
      { t: 3, N: 'e^x+x', D: 'e^x+1', dN: 'e^x+1', dD: 'e^x', lim: N(1), w: R`$\frac{e^x+1}{e^x}=1+e^{-x}\to1$.` },
      { t: 3, N: `-e^(${a}*x)`, D: `x^${n + 1}`, dN: `-${a}*e^(${a}*x)`, dD: `${n + 1}*x^${n}`, lim: NINF, w: R`L'exponencial guanya i el signe és negatiu: $-\infty$.` },
      { t: 3, N: `x^${n}*ln(x)`, D: `x^${n + 1}`, dN: n === 1 ? 'ln(x)+1' : `${xp(n - 1)}*(${n}*ln(x)+1)`, dD: `${n + 1}*x^${n}`, lim: N(0), w: R`Simplificant és $\frac{\ln x}{x}\to0$.` },
    ];
    const o = pick(L.filter(x => x.t <= t));
    return { ...o, at: I };
  }
  function hInf(t) {
    const o = HINF(t);
    const src = fracS(o.N, o.D);
    return LIM(limL('+\\infty', T(src)), o.lim, `És $\\frac{\\infty}{\\infty}$. L'Hôpital: $\\frac{${T(o.dN)}}{${T(o.dD)}}$. ${o.w}`, { src, at: I });
  }
  function hProd(t) {
    const a = ri(2, 5), n = ri(1, 3);
    const L = [
      { t: 1, s: 'x*ln(x)', at: '0+', lim: N(0), w: R`$x\ln x=\frac{\ln x}{1/x}$ ($\frac{\infty}{\infty}$). L'Hôpital: $\frac{1/x}{-1/x^2}=-x\to0$.` },
      { t: 1, s: `x^${n}*e^(-x)`, at: I, lim: N(0), w: R`$x^{${n}}e^{-x}=\frac{x^{${n}}}{e^x}$ ($\frac\infty\infty$): l'exponencial guanya, $0$.` },
      { t: 2, s: `x^${n + 1}*ln(x)`, at: '0+', lim: N(0), w: R`$\frac{\ln x}{x^{-${n + 1}}}$; L'Hôpital: $\frac{1/x}{-${n + 1}x^{-${n + 2}}}=-\frac{x^{${n + 1}}}{${n + 1}}\to0$.` },
      { t: 2, s: `x*sin(${a}/x)`, at: I, lim: N(a), w: R`$x\sin(${a}/x)=\frac{\sin(${a}/x)}{1/x}$ ($\frac00$). L'Hôpital: $\frac{\cos(${a}/x)\cdot(-${a}/x^2)}{-1/x^2}=${a}\cos(${a}/x)\to${a}$.` },
      { t: 2, s: `x*(e^(${a}/x)-1)`, at: I, lim: N(a), w: R`$\frac{e^{${a}/x}-1}{1/x}$ ($\frac00$). L'Hôpital: $\frac{e^{${a}/x}\cdot(-${a}/x^2)}{-1/x^2}=${a}e^{${a}/x}\to${a}$.` },
      { t: 3, s: `x*ln(1+${a}/x)`, at: I, lim: N(a), w: R`$\frac{\ln(1+${a}/x)}{1/x}$ ($\frac00$). L'Hôpital: $\frac{\frac{-${a}/x^2}{1+${a}/x}}{-1/x^2}=\frac{${a}}{1+${a}/x}\to${a}$.` },
      { t: 3, s: 'sqrt(x)*ln(x)', at: '0+', lim: N(0), w: R`$\frac{\ln x}{x^{-1/2}}$; L'Hôpital: $\frac{1/x}{-\frac12x^{-3/2}}=-2\sqrt x\to0$.` },
      { t: 3, s: `sin(${a}*x)*ln(x)`, at: '0+', lim: N(0), w: R`$\sin(${a}x)\sim ${a}x$, i $x\ln x\to0$. (Amb l'Hôpital: $\frac{\ln x}{1/\sin(${a}x)}$.)` },
    ];
    const o = pick(L.filter(x => x.t <= t));
    return LIM(limL(atTeX(o.at), T(o.s)), o.lim, `És $0\\cdot\\infty$: es passa a quocient. ${o.w}`, { src: o.s, at: atNum(o.at), side: o.at === '0+' ? 1 : 0 });
  }
  function hDiff(t) {
    const a = ri(1, 6), b = ri(1, 6);
    const L = [
      { t: 1, s: '1/x-1/(e^x-1)', at: 0, lim: N(1 / 2), w: R`Denominador comú: $\frac{e^x-1-x}{x(e^x-1)}$ ($\frac00$). L'Hôpital: $\frac{e^x-1}{e^x-1+xe^x}$ (encara $\frac00$). Un altre cop: $\frac{e^x}{2e^x+xe^x}\to\frac12$.` },
      { t: 1, s: `sqrt(x^2+${a}*x)-x`, at: I, lim: N(a / 2, F(a, 2)), w: R`Multiplicant pel conjugat: $\frac{${a}x}{\sqrt{x^2+${a}x}+x}=\frac{${a}}{\sqrt{1+${a}/x}+1}\to\frac{${a}}{2}$.` },
      { t: 2, s: '1/x-1/sin(x)', at: 0, lim: N(0), w: R`$\frac{\sin x-x}{x\sin x}$ ($\frac00$). L'Hôpital: $\frac{\cos x-1}{\sin x+x\cos x}$ ($\frac00$). Un altre cop: $\frac{-\sin x}{2\cos x-x\sin x}\to\frac02=0$.` },
      { t: 2, s: '1/ln(x)-1/(x-1)', at: 1, lim: N(1 / 2), w: R`$\frac{x-1-\ln x}{(x-1)\ln x}$ ($\frac00$). L'Hôpital: $\frac{1-1/x}{\ln x+1-1/x}=\frac{x-1}{x\ln x+x-1}$ ($\frac00$). Un altre cop: $\frac{1}{\ln x+2}\to\frac12$.` },
      { t: 3, s: `sqrt(x^2+${a}*x)-sqrt(x^2+${b}*x)`, at: I, lim: N((a - b) / 2, F(a - b, 2)), w: R`Conjugat: $\frac{(${a}-${b})x}{\sqrt{x^2+${a}x}+\sqrt{x^2+${b}x}}\to\frac{${a - b}}{2}$.` },
      { t: 3, s: '1/sin(x)-1/tan(x)', at: 0, lim: N(0), w: R`$\frac{1-\cos x}{\sin x}$ ($\frac00$). L'Hôpital: $\frac{\sin x}{\cos x}\to0$.` },
      { t: 3, s: 'x-ln(x)', at: I, lim: INF, w: R`Factor comú: $x\left(1-\frac{\ln x}{x}\right)$, i $\frac{\ln x}{x}\to0$: queda $\infty\cdot1=+\infty$.` },
      { t: 3, s: '1/(e^x-1)-1/x', at: 0, lim: N(-1 / 2), w: R`És el contrari de $\frac1x-\frac1{e^x-1}$, que val $\frac12$: el límit és $-\frac12$.` },
    ];
    const o = pick(L.filter(x => x.t <= t));
    return LIM(limL(atTeX(o.at), T(o.s)), o.lim, `És $\\infty-\\infty$: cal ajuntar-ho en una fracció (o multiplicar pel conjugat). ${o.w}`, { src: o.s, at: o.at });
  }
  function hExp(t) {
    const a = ri(1, 4), b = ri(2, 3);
    const eT = k => (k === 1 ? 'e' : k === 0 ? '1' : Number.isInteger(k) ? `e^{${k}}` : `e^{${NT(k)}}`);
    const L = [
      { t: 1, s: `(1+${a}/x)^x`, at: I, k: a, w: R`$\ln L=\lim x\ln(1+${a}/x)=${a}$ (és el $0\cdot\infty$ d'abans).` },
      { t: 1, s: `(1+${a}*x)^(1/x)`, at: 0, k: a, w: R`$\ln L=\lim\frac{\ln(1+${a}x)}{x}$ ($\frac00$), L'Hôpital: $\frac{${a}/(1+${a}x)}{1}\to${a}$.` },
      { t: 1, s: 'x^x', at: '0+', k: 0, w: R`$\ln L=\lim x\ln x=0$.` },
      { t: 2, s: 'x^(1/x)', at: I, k: 0, w: R`$\ln L=\lim\frac{\ln x}{x}=0$.` },
      { t: 2, s: `(1+${a}/x)^(${b}*x)`, at: I, k: a * b, w: R`$\ln L=\lim ${b}x\ln(1+${a}/x)=${b}\cdot${a}=${a * b}$.` },
      { t: 2, s: `(1-${a}/x)^x`, at: I, k: -a, w: R`$\ln L=\lim x\ln(1-${a}/x)=-${a}$.` },
      { t: 3, s: `cos(${a}*x)^(1/x^2)`, tex: R`\left(\cos ${a === 1 ? '' : a}x\right)^{1/x^2}`, at: 0, k: -a * a / 2, w: R`$\ln L=\lim\frac{\ln\cos(${a}x)}{x^2}$ ($\frac00$). L'Hôpital: $\frac{-${a}\tan(${a}x)}{2x}\to-\frac{${a * a}}{2}$.` },
      { t: 3, s: 'x^(sin(x))', at: '0+', k: 0, w: R`$\ln L=\lim\sin x\ln x=\lim\frac{\ln x}{1/\sin x}$; com que $\sin x\sim x$, és com $x\ln x\to0$.` },
      { t: 3, s: `(1+sin(${a}*x))^(1/x)`, at: 0, k: a, w: R`$\ln L=\lim\frac{\ln(1+\sin(${a}x))}{x}$ ($\frac00$). L'Hôpital: $\frac{${a}\cos(${a}x)}{1+\sin(${a}x)}\to${a}$.` },
    ];
    const o = pick(L.filter(x => x.t <= t));
    return LIM(limL(atTeX(o.at), o.tex || T(o.s), R`. Pots escriure potències de $e$ com <code>e^2</code> o <code>e^(-1/2)</code>.`), N(Math.exp(o.k), eT(o.k)),
      R`Indeterminació exponencial: escriu $L=e^{\lim g\ln f}$ (o pren logaritmes). ${o.w} Per tant $L=${eT(o.k)}$.`, { src: o.s, at: atNum(o.at), side: o.at === '0+' ? 1 : 0 });
  }

  /* =========================================================
     E. EQUACIONS I SIGNES
     ========================================================= */
  const R3 = () => shuffle([-3, -2, -1, 1, 2, 3, 0, 4]);
  function eRoots(t) {
    if (t === 1) {
      const k = pick([0, 1, 2]);
      if (k === 0) { const a = nz(-4, 4), b = nz(-6, 6); return LST(`Resol $${M.polyTeX([0, b, a])}=0$`, [[0, '0'], [-b / a, F(-b, a)]], R`Factor comú: $x(${M.polyTeX([b, a])})=0$, per tant $x=0$ o $x=${F(-b, a)}$.`); }
      if (k === 1) { const r = ri(1, 6); return LST(`Resol $${M.polyTeX([-r * r, 0, 1])}=0$`, [[r], [-r]], R`$x^2=${r * r}\Rightarrow x=\pm${r}$.`); }
      const [r, s] = R3();
      return LST(`Resol $${M.polyTeX(M.polyMul([-r, 1], [-s, 1]))}=0$`, r === s ? [[r]] : [[r], [s]], R`Fórmula de segon grau (o busca dos números que sumin $${r + s}$ i multipliquin $${r * s}$): $x=${r}$, $x=${s}$.`);
    }
    if (t === 2) {
      const k = pick([0, 1, 2]);
      if (k === 0) { const a = nz(-3, 3); const [r, s] = R3(); const c = M.polyMul([-r, 1], [-s, 1]).map(v => v * a); return LST(`Resol $${M.polyTeX(c)}=0$`, r === s ? [[r]] : [[r], [s]], R`Divideix per $${a}$ i aplica la fórmula: $x=${r}$, $x=${s}$.`); }
      if (k === 1) { const r = ri(1, 2), s = r + ri(1, 2); const c = [r * r * s * s, 0, -(r * r + s * s), 0, 1]; return LST(`Resol $${M.polyTeX(c)}=0$`, [[r], [-r], [s], [-s]], R`Biquadrada: amb $t=x^2$ queda $t^2-${r * r + s * s}t+${r * r * s * s}=0$, $t=${r * r}$ o $t=${s * s}$, i $x=\pm${r}$, $x=\pm${s}$.`); }
      const kk = pick([2, 3, 5, 6, 7]); const a = nz(-3, 3);
      return LST(`Resol $${M.polyTeX([0, -kk * a, 0, a])}=0$`, [[0, '0'], [Math.sqrt(kk), `\\sqrt{${kk}}`], [-Math.sqrt(kk), `-\\sqrt{${kk}}`]], R`Factor comú: $${a === 1 ? '' : a === -1 ? '-' : a}x(x^2-${kk})=0$, per tant $x=0$ o $x=\pm\sqrt{${kk}}$.`);
    }
    const k = pick([0, 1, 2]);
    if (k === 0) { const [r, s, u] = R3(); const c = M.polyMul(M.polyMul([-r, 1], [-s, 1]), [-u, 1]); const roots = [...new Set([r, s, u])].map(v => [v]); return LST(`Resol $${M.polyTeX(c)}=0$`, roots, R`Ruffini: prova divisors del terme independent. Arrels: $${[r, s, u].join(',\\,')}$.`); }
    if (k === 1) { const p = nz(-3, 3), m = pick([2, 3, 5]); return LST(`Resol $${M.polyTeX([p * p - m, -2 * p, 1])}=0$`, [M.surd(p, 1, m, 1), M.surd(p, -1, m, 1)], R`$x=\frac{${2 * p}\pm\sqrt{${4 * p * p}-${4 * (p * p - m)}}}{2}=${p}\pm\sqrt{${m}}$.`); }
    const p = ri(-2, 2), q = ri(1, 4); return LST(`Resol $${M.polyTeX([p * p + q, -2 * p, 1])}=0$ (escriu «cap» si no té solucions reals)`, [], R`El discriminant és $${4 * p * p}-${4 * (p * p + q)}=${-4 * q}\lt 0$: no hi ha solucions reals.`);
  }
  function signIvs(points, g, lo = -I) {
    const ends = [end(lo), ...points, end(I)];
    const out = [];
    for (let i = 0; i < ends.length - 1; i++) {
      const a = ends[i], b = ends[i + 1];
      const tt = !isFinite(a.v) && !isFinite(b.v) ? 0.123 : !isFinite(a.v) ? b.v - 1 : !isFinite(b.v) ? a.v + 1 : (a.v + b.v) / 2;
      out.push({ a, b, s: Math.sign(g(tt)) });
    }
    return out;
  }
  const facTeX = (r, m = 1) => { const b = r === 0 ? 'x' : r > 0 ? `(x-${r})` : `(x+${-r})`; return m === 1 ? b : r === 0 ? `x^{${m}}` : `${b}^{${m}}`; };
  function eSign(t) {
    const roots = shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, t === 1 ? 2 : 3).sort((a, b) => a - b);
    const mult = roots.map(() => 1);
    if (t === 3) mult[ri(0, roots.length - 1)] = 2;
    const s = pick([1, -1]);
    const extra = t === 3 && Math.random() < 0.4 ? '(x^2+1)' : '';
    const g = x => s * roots.reduce((p, r, i) => p * (x - r) ** mult[i], 1);
    const tex = (s < 0 ? '-' : '') + roots.map((r, i) => facTeX(r, mult[i])).join('') + extra;
    const want = pick([1, -1]);
    const ivs = signIvs(roots.map(r => end(r)), g).filter(iv => iv.s === want).map(({ a, b }) => ({ a, b }));
    return IVL(`On és $P(x)${want > 0 ? '>' : '\\lt'}0$, si $P(x)=${tex}$?`, ivs,
      R`Arrels: $${roots.join(',\\,')}$. Fes la taula de signes${mult.includes(2) ? ' (al factor al quadrat el signe <b>no</b> canvia)' : ''}${extra ? ' ($x^2+1>0$ sempre)' : ''}, començant per la dreta amb el signe del coeficient principal.`);
  }

  /* =========================================================
     F. EXTREMS RELATIUS I ESTUDI
     ========================================================= */
  // Famílies de funcions amb tota la informació d'extrems
  const sgnS = (a) => (a < 0 ? '-' : '');
  function FAM(name, t) {
    const pos = { v: 0, tex: '0' };
    switch (name) {
      case 'xexp': { // x e^{ax}
        const a = pick(t === 1 ? [1, -1] : [1, -1, 2, -2, 3, -3]);
        const c = -1 / a, A = Math.abs(a);
        return { f: `x*e^(${a}*x)`.replace('(1*x)', '(x)').replace('(-1*x)', '(-x)'), df: `(1+${a}*x)*e^(${a}*x)`, dfTeX: R`(1${a > 0 ? '+' : '-'}${A === 1 ? '' : A}x)\,e^{${a === 1 ? '' : a === -1 ? '-' : a}x}`,
          crit: [{ v: c, tex: F(-1, a) }], y: { [c]: R`${a > 0 ? '-' : ''}\frac{1}{${A === 1 ? '' : A}e}` }, dom: 'R', lims: { '-inf': a > 0 ? N(0) : NINF, inf: a > 0 ? INF : N(0) } };
      }
      case 'x2exp': { // x^2 e^{ax}
        const a = pick([1, -1, 2, -2]);
        const c = -2 / a, g = M.gcd(4, a * a);
        const yt = `\\frac{${4 / g}}{${a * a / g === 1 ? '' : a * a / g}e^{2}}`;
        return { f: `x^2*e^(${a}*x)`.replace('(1*x)', '(x)').replace('(-1*x)', '(-x)'), df: `x*(2+${a}*x)*e^(${a}*x)`, dfTeX: R`x\,(2${a > 0 ? '+' : '-'}${Math.abs(a) === 1 ? '' : Math.abs(a)}x)\,e^{${a === 1 ? '' : a === -1 ? '-' : a}x}`,
          crit: [{ v: 0, tex: '0' }, { v: c, tex: F(-2, a) }], y: { 0: '0', [c]: yt }, dom: 'R', lims: { '-inf': a > 0 ? N(0) : INF, inf: a > 0 ? INF : N(0) } };
      }
      case 'lnx': { // ln x / x^n
        const n = pick([1, 2]);
        return { f: n === 1 ? 'ln(x)/x' : 'ln(x)/x^2', df: `(1-${n}*ln(x))/x^${n + 1}`, dfTeX: R`\frac{1-${n === 1 ? '' : n}\ln x}{x^{${n + 1}}}`,
          crit: [{ v: Math.exp(1 / n), tex: lnTeX(n) }], y: { [Math.exp(1 / n)]: n === 1 ? '\\frac{1}{e}' : '\\frac{1}{2e}' }, dom: 'pos', lims: { '0+': NINF, inf: N(0) } };
      }
      case 'rat': { // x/(x^2+a^2)
        const a = ri(1, 3);
        return { f: `x/(x^2+${a * a})`, df: `(${a * a}-x^2)/(x^2+${a * a})^2`, dfTeX: R`\frac{${a * a}-x^2}{(x^2+${a * a})^2}`,
          crit: [{ v: -a, tex: String(-a) }, { v: a, tex: String(a) }], y: { [-a]: F(-1, 2 * a), [a]: F(1, 2 * a) }, dom: 'R', lims: { '-inf': N(0), inf: N(0) } };
      }
      case 'xlnx': { // x^n ln x
        const n = pick([1, 2]);
        const c = Math.exp(-1 / n);
        return { f: n === 1 ? 'x*ln(x)' : 'x^2*ln(x)', df: n === 1 ? 'ln(x)+1' : 'x*(2*ln(x)+1)', dfTeX: n === 1 ? R`\ln x+1` : R`x\,(2\ln x+1)`,
          crit: [{ v: c, tex: n === 1 ? '\\frac{1}{e}' : '\\frac{1}{\\sqrt{e}}' }], y: { [c]: n === 1 ? '-\\frac{1}{e}' : '-\\frac{1}{2e}' }, dom: 'pos', lims: { '0+': N(0), inf: INF } };
      }
      case 'xinv': { // x + a^2/x
        const a = ri(1, 3);
        return { f: `x+${a * a}/x`, df: `1-${a * a}/x^2`, dfTeX: R`1-\frac{${a * a}}{x^2}=\frac{x^2-${a * a}}{x^2}`,
          crit: [{ v: -a, tex: String(-a) }, { v: a, tex: String(a) }], y: { [-a]: String(-2 * a), [a]: String(2 * a) }, dom: 'nz', lims: { '-inf': NINF, inf: INF, '0+': INF } };
      }
      case 'gauss': { // x e^{-x^2/2}
        return { f: 'x*e^(-x^2/2)', df: '(1-x^2)*e^(-x^2/2)', dfTeX: R`(1-x^2)\,e^{-x^2/2}`,
          crit: [{ v: -1, tex: '-1' }, { v: 1, tex: '1' }], y: { '-1': '-\\frac{1}{\\sqrt{e}}', 1: '\\frac{1}{\\sqrt{e}}' }, dom: 'R', lims: { '-inf': N(0), inf: N(0) } };
      }
      case 'bell': { // e^{-a x^2}
        const a = ri(1, 3);
        return { f: `e^(-${a}*x^2)`.replace('-1*', '-'), df: `-${2 * a}*x*e^(-${a}*x^2)`.replace('-1*x^2', '-x^2'), dfTeX: R`-${2 * a}x\,e^{-${a === 1 ? '' : a}x^2}`,
          crit: [pos], y: { 0: '1' }, dom: 'R', lims: { '-inf': N(0), inf: N(0) } };
      }
      case 'cubic': { // 2x^3 - 3(r+s)x^2 + 6rs x + d   (f' = 6(x-r)(x-s))
        let r, s; do { r = ri(-3, 2); s = ri(r + 1, 3); } while (s === r);
        const sg = pick([1, -1]), d = ri(-3, 3);
        const c = [d, 6 * r * s * sg, -3 * (r + s) * sg, 2 * sg];
        const dc = M.polyDer(c);
        return { f: polyS(c), fTeX: M.polyTeX(c), df: polyS(dc), dfTeX: R`${sg * 6 === 6 ? '6' : '-6'}${facTeX(r)}${facTeX(s)}`, poly: c,
          crit: [{ v: r, tex: String(r) }, { v: s, tex: String(s) }], y: { [r]: String(M.polyEval(c, r)), [s]: String(M.polyEval(c, s)) }, dom: 'R',
          lims: { '-inf': sg > 0 ? NINF : INF, inf: sg > 0 ? INF : NINF } };
      }
      case 'quartic': { // 3x^4 - 4(r+s)x^3 + 6rs x^2   (f' = 12x(x-r)(x-s))
        let r, s; do { r = nz(-2, 2); s = nz(-2, 3); } while (s === r);
        if (r > s) [r, s] = [s, r];
        const c = [0, 0, 6 * r * s, -4 * (r + s), 3];
        const roots = [0, r, s].sort((p, q) => p - q);
        return { f: polyS(c), fTeX: M.polyTeX(c), df: polyS(M.polyDer(c)), dfTeX: R`12${facTeX(0)}${facTeX(r)}${facTeX(s)}`, poly: c,
          crit: roots.map(v => ({ v, tex: String(v) })), y: Object.fromEntries(roots.map(v => [v, String(M.polyEval(c, v))])), dom: 'R', lims: { '-inf': INF, inf: INF } };
      }
    }
  }
  const FAMS = { 1: ['xexp', 'rat', 'bell', 'cubic'], 2: ['x2exp', 'lnx', 'xinv', 'cubic', 'xexp'], 3: ['xlnx', 'gauss', 'x2exp', 'lnx', 'quartic', 'xinv'] };
  function analyse(fm) {
    const dfA = P(fm.df), df = x => M.ev(dfA, x), fA = P(fm.f), f = x => M.ev(fA, x);
    const pts = fm.crit.slice().sort((a, b) => a.v - b.v);
    const bps = pts.map(p => end(p.v, p.tex));
    if (fm.dom === 'nz') { bps.push(end(0, '0')); bps.sort((a, b) => a.v - b.v); }
    const ivs = signIvs(bps, df, fm.dom === 'pos' ? 0 : -I);
    const inc = ivs.filter(iv => iv.s > 0).map(({ a, b }) => ({ a, b }));
    const dec = ivs.filter(iv => iv.s < 0).map(({ a, b }) => ({ a, b }));
    const max = [], min = [];
    for (const p of pts) {
      const l = Math.sign(df(p.v - 1e-4)), r = Math.sign(df(p.v + 1e-4));
      const e = { ...p, y: f(p.v), ytex: fm.y[p.v] ?? NT(f(p.v)) };
      if (l > 0 && r < 0) max.push(e); else if (l < 0 && r > 0) min.push(e);
    }
    const d2 = x => (df(x + 1e-5) - df(x - 1e-5)) / 2e-5;
    return { f, df, d2, ivs, inc, dec, max, min, pts };
  }
  const famLabel = fm => `$f(x)=${fm.fTeX || T(fm.f)}$${fm.dom === 'pos' ? ' (definida per a $x>0$)' : fm.dom === 'nz' ? ' (definida per a $x\\neq0$)' : ''}`;
  const famPts = fm => (fm.dom === 'pos' ? POS : undefined);
  function xCrit(t) {
    const fm = FAM(pick(FAMS[t]), t);
    return LST(`Troba els punts crítics ($f'(x)=0$) de ${famLabel(fm)}`, fm.crit.map(c => [c.v, c.tex]), R`$f'(x)=${fm.dfTeX}$. ${fm.dfTeX.includes('e^') ? R`Com que $e^{(\dots)}>0$ sempre, només cal anul·lar l'altre factor.` : ''} Solucions: $${fm.crit.map(c => c.tex).join(',\\;')}$.`);
  }
  function xMono(t) {
    const fm = FAM(pick(FAMS[t]), t), A = analyse(fm);
    const up = Math.random() < 0.5;
    return IVL(`On és <b>${up ? 'creixent' : 'decreixent'}</b> ${famLabel(fm)}?`, up ? A.inc : A.dec,
      R`$f'(x)=${fm.dfTeX}$. Signe de $f'$ als intervals: ${A.ivs.map(iv => `$(${iv.a.tex},${iv.b.tex})$: ${iv.s > 0 ? '+' : '−'}`).join('; ')}. ${up ? 'Creix on $f\'>0$' : 'Decreix on $f\'\\lt 0$'}.`);
  }
  const KIND = ['Màxim relatiu', 'Mínim relatiu', 'Ni màxim ni mínim'];
  function xFirst(t) {
    const roots = shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, t === 1 ? 2 : 3).sort((a, b) => a - b);
    const mult = roots.map(() => 1);
    if (t >= 2) mult[ri(0, roots.length - 1)] = t === 3 ? pick([2, 3]) : 2;
    const s = pick([1, -1]);
    const extra = t === 3 ? pick(['e^x', '(x^2+1)', '']) : '';
    const g = x => s * roots.reduce((p, r, i) => p * (x - r) ** mult[i], 1);
    const i = ri(0, roots.length - 1), c = roots[i];
    const l = Math.sign(g(c - 0.01)), r = Math.sign(g(c + 0.01));
    const ans = l > 0 && r < 0 ? 0 : l < 0 && r > 0 ? 1 : 2;
    const tex = (s < 0 ? '-' : '') + roots.map((rr, j) => facTeX(rr, mult[j])).join('') + (extra === 'e^x' ? 'e^{x}' : extra);
    return MC(`La derivada d'una funció és $f'(x)=${tex}$. Què té $f$ a $x=${c}$?`, KIND, ans,
      R`Signe de $f'$ just a l'esquerra de $${c}$: ${l > 0 ? '+' : '−'}; just a la dreta: ${r > 0 ? '+' : '−'}. ${ans === 0 ? 'Passa de créixer a decréixer: màxim.' : ans === 1 ? 'Passa de decréixer a créixer: mínim.' : 'No canvia de signe (factor amb exponent parell): ni màxim ni mínim.'}`);
  }
  const SECOND = [R`Mínim relatiu, perquè $f''(c)>0$`, R`Màxim relatiu, perquè $f''(c)\lt 0$`, R`El criteri no decideix, perquè $f''(c)=0$`];
  function xSecond(t) {
    if (t === 3 && Math.random() < 0.3) {
      const k = pick([3, 4]), a = nz(-3, 3);
      return MC(`$f(x)=${M.polyTeX([0, 0, 0, 0, 0].map((_, i) => (i === k ? a : 0)))}$ té $f'(0)=0$. Què diu el criteri de la <b>segona derivada</b> a $c=0$?`, SECOND, 2,
        R`$f''(x)=${a * k * (k - 1)}x^{${k - 2}}$, i $f''(0)=0$: el criteri no diu res. (Caldria mirar el signe de $f'$.)`);
    }
    const fm = FAM(pick(FAMS[t]), t), A = analyse(fm);
    const p = pick(A.pts);
    const v = A.d2(p.v);
    const ans = Math.abs(v) < 1e-6 ? 2 : v > 0 ? 0 : 1;
    return MC(`${famLabel(fm)} té un punt crític a $c=${p.tex}$. Què diu el criteri de la <b>segona derivada</b>?`, SECOND, ans,
      R`$f'(x)=${fm.dfTeX}$. Derivant un altre cop i substituint, $f''(${p.tex})\approx${+v.toFixed(3)}$ ${ans === 0 ? '> 0: mínim (forma de vall).' : ans === 1 ? '< 0: màxim (forma de muntanya).' : '= 0.'}`);
  }
  function xValue(t) {
    let fm, A;
    do { fm = FAM(pick(FAMS[t]), t); A = analyse(fm); } while (!A.max.length && !A.min.length);
    const isMax = A.max.length && (!A.min.length || Math.random() < 0.5);
    const list = isMax ? A.max : A.min;
    const e = t === 1 ? pick(list) : list[list.length - 1];
    const where = t === 1 ? ` a $x=${e.tex}$` : list.length > 1 ? " (si n'hi ha més d'un, el de més a la dreta)" : '';
    return VAL(`${famLabel(fm)} té un <b>${isMax ? 'màxim' : 'mínim'} relatiu</b>${where}. Quant val $f$ en aquest punt?`, e.y, e.ytex,
      R`$f'(x)=${fm.dfTeX}$, punts crítics $${fm.crit.map(c => c.tex).join(',\,')}$. ${isMax ? 'Màxim' : 'Mínim'} a $x=${e.tex}$, i $f(${e.tex})=${e.ytex}$.`);
  }
  function xInfl(t) {
    const opts = {
      1: [() => { const a = pick([1, -1, 2]), p = ri(-2, 2); const c = [ri(-3, 3), ri(-5, 5), -3 * a * p, a]; return { c, pts: [[p]], w: R`$f''(x)=${M.polyTeX(M.polyDer(M.polyDer(c)))}$, s'anul·la a $x=${p}$ i hi canvia de signe.` }; }],
      2: [() => { const k = ri(1, 3), a = pick([1, -1]); const c = [0, 0, -6 * k * k * a, 0, a]; return { c, pts: [[k], [-k]], w: R`$f''(x)=${M.polyTeX(M.polyDer(M.polyDer(c)))}=${12 * a}(x^2-${k * k})$: zeros $\pm${k}$ i canvia de signe.` }; },
        () => { const a = pick([1, -1, 2]); const c = [ri(-2, 2), 0, 0, 0, a]; return { c, pts: [], w: R`$f''(x)=${12 * a}x^2$ s'anul·la a $0$ però <b>no canvia de signe</b>: no hi ha inflexió.` }; }],
      3: [() => ({ s: 'x*e^x', pts: [[-2]], w: R`$f''(x)=(x+2)e^x$: canvia de signe a $x=-2$.` }),
        () => ({ s: 'x*e^(-x)', pts: [[2]], w: R`$f''(x)=(x-2)e^{-x}$: canvia de signe a $x=2$.` }),
        () => ({ s: 'e^(-x^2/2)', pts: [[-1], [1]], w: R`$f''(x)=(x^2-1)e^{-x^2/2}$: zeros $\pm1$.` }),
        () => ({ s: 'x^2*ln(x)', pts: [[Math.exp(-1.5), 'e^{-3/2}']], w: R`$f'(x)=2x\ln x+x$, $f''(x)=2\ln x+3=0\iff x=e^{-3/2}$.`, pos: true })],
    };
    const o = pick(opts[t])();
    const lab = o.c ? M.polyTeX(o.c) : T(o.s);
    return LST(`Troba els punts d'inflexió (les $x$) de $f(x)=${lab}$${o.pos ? ' ($x>0$)' : ''} (o «cap»)`, o.pts, `Inflexió on $f''$ canvia de signe. ${o.w}`);
  }
  function xAbs(t) {
    if (t === 3 && Math.random() < 0.5) {
      const o = pick([
        { s: 'x*e^(-x)', a: 0, b: 3, max: [1 / Math.E, '\\frac1e'], min: [0, '0'], w: R`$f'=(1-x)e^{-x}$, crític $x=1$. Candidats: $f(0)=0$, $f(1)=\frac1e\approx0.37$, $f(3)=\frac3{e^3}\approx0.15$.` },
        { s: 'x^2*e^(-x)', a: -1, b: 3, max: [Math.E, 'e'], min: [0, '0'], w: R`$f'=x(2-x)e^{-x}$, crítics $0,2$. Candidats: $f(-1)=e\approx2.72$, $f(0)=0$, $f(2)=\frac4{e^2}\approx0.54$, $f(3)=\frac9{e^3}\approx0.45$.` },
        { s: 'ln(x)/x', a: 1, b: 9, max: [1 / Math.E, '\\frac1e'], min: [0, '0'], w: R`$f'=\frac{1-\ln x}{x^2}$, crític $x=e$. Candidats: $f(1)=0$, $f(e)=\frac1e\approx0.37$, $f(9)=\frac{\ln9}{9}\approx0.24$.` },
      ]);
      const isMax = Math.random() < 0.5, ans = isMax ? o.max : o.min;
      return VAL(`Quin és el valor <b>${isMax ? 'màxim' : 'mínim'} absolut</b> de $f(x)=${T(o.s)}$ a l'interval $[${o.a},${o.b}]$?`, ans[0], ans[1], `Interval tancat: els extrems absoluts estan als punts crítics de dins o als extrems de l'interval. ${o.w}`);
    }
    const fm = FAM('cubic', t);
    const c = fm.poly, cr = fm.crit.map(p => p.v);
    let a, b;
    do { a = ri(-4, 1); b = ri(a + 2, 4); } while (!cr.some(v => v > a && v < b));
    const cands = [a, ...cr.filter(v => v > a && v < b), b];
    const vals = cands.map(x => M.polyEval(c, x));
    const isMax = Math.random() < 0.5;
    const best = isMax ? Math.max(...vals) : Math.min(...vals);
    return VAL(`Quin és el valor <b>${isMax ? 'màxim' : 'mínim'} absolut</b> de $f(x)=${M.polyTeX(c)}$ a l'interval $[${a},${b}]$?`, best, null,
      R`$f'(x)=${fm.dfTeX}$. Candidats: extrems de l'interval i punts crítics de dins: ${cands.map((x, i) => `$f(${x})=${vals[i]}$`).join(', ')}. El ${isMax ? 'més gran' : 'més petit'} és $${best}$.`);
  }
  function xLimits(t) {
    if (t === 1) {
      const deg = ri(2, 5), a = nz(-4, 4), c = Array.from({ length: deg + 1 }, (_, i) => (i === deg ? a : ri(-5, 5)));
      const toNeg = Math.random() < 0.5;
      const s = Math.sign(a) * (toNeg && deg % 2 ? -1 : 1);
      return LIM(limL(toNeg ? '-\\infty' : '+\\infty', M.polyTeX(c)), s > 0 ? INF : NINF, R`Mana el terme de grau més alt, $${M.polyTeX([0, 0, 0, 0, 0, 0].map((_, i) => (i === deg ? a : 0)))}$${toNeg ? ` (grau ${deg % 2 ? 'senar: canvia el signe' : 'parell: signe positiu'})` : ''}.`);
    }
    const names = t === 2 ? ['xexp', 'x2exp'] : ['lnx', 'xlnx', 'rat', 'xinv', 'x2exp'];
    const fm = FAM(pick(names), t);
    const k = pick(Object.keys(fm.lims));
    const at = k === 'inf' ? '+\\infty' : k === '-inf' ? '-\\infty' : '0^{+}';
    const lim = fm.lims[k];
    return LIM(limL(at, fm.fTeX || T(fm.f)), lim, R`${k === '0+' ? 'Prop de $0$ per la dreta' : 'A l\'infinit'}: ${fm.f.includes('e^') ? 'l\'exponencial mana sobre la potència.' : fm.f.includes('ln') ? 'qualsevol potència de $x$ mana sobre el logaritme.' : 'compara els termes dominants.'} Resultat: $${M.limitTeX(lim)}$.`, { src: fm.f, at: k === 'inf' ? I : k === '-inf' ? -I : 0, side: k === '0+' ? 1 : 0 });
  }

  /* =========================================================
     G. LÍMITS DE QUOCIENTS A L'INFINIT
     ========================================================= */
  function rp(deg, lead) { const c = Array.from({ length: deg + 1 }, () => ri(-6, 6)); c[deg] = lead; return c; }
  function ratItem(t, neg) {
    const n = ri(1, 4), m = ri(1, 4), a = nz(-6, 6), b = nz(-6, 6);
    const pc = rp(n, a), qc = rp(m, b);
    let num = M.polyTeX(pc), den = M.polyTeX(qc);
    if (t === 3) {
      const order = c => shuffle(c.map((v, i) => ({ v, i })).filter(o => o.v)).map(o => ({ c: o.v, body: M.xpow(o.i) }));
      num = M.termsTeX(order(pc)); den = M.termsTeX(order(qc));
    }
    let lim;
    if (n < m) lim = N(0);
    else if (n === m) lim = N(a / b, F(a, b));
    else { const s = Math.sign(a / b) * (neg && (n - m) % 2 ? -1 : 1); lim = s > 0 ? INF : NINF; }
    const dir = neg ? '-\\infty' : '+\\infty';
    return LIM(limL(dir, R`\frac{${num}}{${den}}`), lim,
      R`Grau de dalt $n=${n}$ (coef. $${a}$), grau de baix $m=${m}$ (coef. $${b}$). ${n < m ? 'Baix guanya: $0$.' : n === m ? R`Mateix grau: $\frac{${a}}{${b}}$.` : R`Dalt guanya: $\sim\frac{${a}}{${b}}x^{${n - m}}$${neg ? R` i a $-\infty$ ${(n - m) % 2 ? 'la potència senar canvia el signe' : 'la potència parella no canvia el signe'}` : ''}.`}`,
      { src: `(${polyS(pc)})/(${polyS(qc)})`, at: neg ? -I : I });
  }
  const rDeg = t => ratItem(t, false);
  const rNeg = t => ratItem(t, true);
  const GEN_OPTS = [R`$0$`, R`$\frac{a_n}{b_m}$`, R`$+\infty$`, R`$-\infty$`];
  function rGeneral(t) {
    const cases = [
      { c: R`n\lt m`, d: '+', a: 0 }, { c: R`n=m`, d: '+', a: 1 }, { c: R`n>m\text{ i }\frac{a_n}{b_m}>0`, d: '+', a: 2 }, { c: R`n>m\text{ i }\frac{a_n}{b_m}\lt 0`, d: '+', a: 3 },
      { c: R`n>m,\ n-m\text{ parell i }\frac{a_n}{b_m}>0`, d: '-', a: 2, t: 2 }, { c: R`n>m,\ n-m\text{ senar i }\frac{a_n}{b_m}>0`, d: '-', a: 3, t: 2 }, { c: R`n>m,\ n-m\text{ senar i }\frac{a_n}{b_m}\lt 0`, d: '-', a: 2, t: 3 },
      { c: R`n\lt m`, d: '-', a: 0, t: 2 },
    ];
    const o = pick(cases.filter(x => (x.t || 1) <= t));
    return MC(R`Siguin $P(x)=a_nx^n+\dots$ i $Q(x)=b_mx^m+\dots$ ($a_n,b_m\neq0$). Si $${o.c}$, quant val $\displaystyle\lim_{x\to${o.d}\infty}\frac{P(x)}{Q(x)}$?`, GEN_OPTS, o.a,
      R`$\frac{P(x)}{Q(x)}\sim\frac{a_n}{b_m}x^{n-m}$. ${o.d === '-' ? R`A $-\infty$, $x^{n-m}$ té el signe de $(-1)^{n-m}$.` : ''}`);
  }

  /* =========================================================
     GRAF: àrees i habilitats
     ========================================================= */
  const AREAS = [
    { id: 'A', name: 'Derivades', icon: '∂', req: [] },
    { id: 'B', name: 'Regla de la cadena', icon: '⛓️', req: ['A'] },
    { id: 'C', name: 'Límits i acotació', icon: '🎯', req: [] },
    { id: 'E', name: 'Equacions i signes', icon: '🧮', req: [] },
    { id: 'D', name: "Regla de l'Hôpital", icon: '🏥', req: ['A', 'B', 'C'] },
    { id: 'F', name: 'Extrems relatius', icon: '⛰️', req: ['B', 'E', 'D'] },
    { id: 'G', name: "Quocients a l'infinit", icon: '∞', req: ['C'] },
  ];
  const S_ = (id, area, name, req, gen, th) => ({ id, area, name, req, gen, th });
  const SKILLS = [
    S_('d-pow', 'A', 'Potències i polinomis', [], dPow, R`$(x^n)'=n\,x^{n-1}$ per a qualsevol exponent: $\frac1{x^k}=x^{-k}$, $\sqrt x=x^{1/2}$. Constants multiplicant es queden; constants sumant desapareixen.`),
    S_('d-elem', 'A', 'Taula de derivades', [], dElem, R`$(\sin x)'=\cos x$, $(\cos x)'=-\sin x$, $(\tan x)'=\frac1{\cos^2x}$, $(e^x)'=e^x$, $(\ln x)'=\frac1x$, $(\sqrt x)'=\frac1{2\sqrt x}$.`),
    S_('d-prod', 'A', 'Regla del producte', ['d-pow', 'd-elem'], dProd, R`$(u\,v)'=u'\,v+u\,v'$. <b>No</b> és $u'v'$.`),
    S_('d-quot', 'A', 'Regla del quocient', ['d-prod'], dQuot, R`$\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}$. L'ordre importa: primer $u'v$, després resta $uv'$.`),
    S_('d-val', 'A', 'Derivada en un punt', ['d-prod'], dVal, R`Primer deriva i <b>després</b> substitueix. Mai al revés (la derivada d'un número és 0).`),
    S_('c-layers', 'B', 'Identificar capes', ['d-elem'], cLayers, R`La capa <b>exterior</b> és l'última operació que faries amb la calculadora. $\sin^2(x^3)=\big(\sin(x^3)\big)^2$: exterior $\square^2$, després $\sin$, després $x^3$.`),
    S_('c-one', 'B', 'Cadena: una capa', ['d-pow', 'd-elem', 'c-layers'], cOne, R`$\big(g(u)\big)'=g'(u)\cdot u'$. Deriva la de fora deixant l'argument intacte, i multiplica per la derivada de l'argument.`),
    S_('c-powtrig', 'B', '$\\sin^n$ vs $\\sin(x^n)$', ['c-one'], cPowTrig, R`$(\sin^n u)'=n\sin^{n-1}u\cdot\cos u\cdot u'$, però $(\sin(x^n))'=\cos(x^n)\cdot nx^{n-1}$.`),
    S_('c-multi', 'B', 'Cadena: 2–4 capes', ['c-powtrig'], cMulti, R`Un factor per capa, de fora cap a dins: $\big(f(g(h(x)))\big)'=f'(g(h))\cdot g'(h)\cdot h'(x)$.`),
    S_('c-mixed', 'B', 'Producte + cadena', ['c-one', 'd-prod'], cMixed, R`Primer la regla del producte; quan derivis cada factor, si és una composició aplica-hi la cadena.`),
    S_('l-sub', 'C', 'Substitució directa', [], lSub, R`Si la funció és contínua al punt (polinomis, $\sin$, $e^x$, quocients amb denominador $\neq0$…), el límit és el valor: <b>substitueix</b>.`),
    S_('l-bounded', 'C', 'Zero per acotada', ['l-sub'], lBounded, R`Si $g\to0$ i $|h|\le C$, llavors $g\cdot h\to0$. Ex.: $|x^2\sin(1/x)|\le x^2\to0$.`),
    S_('l-osc', 'C', 'Quan no existeix', ['l-bounded'], lOsc, R`$\sin(1/x)$ i $\cos(1/x)$ oscil·len entre $-1$ i $1$ quan $x\to0$: <b>no tenen límit</b>. Amb $x^k$ ($k\ge1$) davant sí: $0$.`),
    S_('l-defder', 'C', 'Derivada per definició', ['l-bounded', 'd-pow'], lDefDer, R`$f'(0)=\lim_{h\to0}\frac{f(h)-f(0)}{h}$. Per a $x^k\sin(1/x)$: queda $h^{k-1}\sin(1/h)$, que va a $0$ si $k\ge2$ i no existeix si $k=1$.`),
    S_('l-class', 'C', 'Contínua, derivable, $C^1$', ['l-osc', 'l-defder'], lClass, R`Per a $x^k\sin(1/x)$ amb $f(0)=0$: $k=0$ no contínua; $k=1$ contínua però no derivable; $k=2$ derivable però $f'$ no contínua; $k\ge3$ de classe $C^1$.`),
    S_('h-form', 'D', 'Tipus d\'indeterminació', ['l-sub'], hForm, R`Substitueix primer. L'Hôpital només serveix directament per a $\frac00$ i $\frac\infty\infty$. Les altres ($0\cdot\infty$, $\infty-\infty$, $1^\infty$, $0^0$, $\infty^0$) s'han de transformar abans.`),
    S_('h-step', 'D', 'Aplicar la regla', ['h-form', 'c-one', 'd-quot'], hStep, R`Si és $\frac00$ o $\frac\infty\infty$: $\lim\frac{f}{g}=\lim\frac{f'}{g'}$. Es deriven <b>per separat</b>, no amb la regla del quocient.`),
    S_('h-00', 'D', '$\\frac00$ (un cop)', ['h-step'], h00, R`Comprova $\frac00$, deriva dalt i baix, substitueix. Ex.: $\lim_{x\to0}\frac{\sin 3x}{2x}=\lim\frac{3\cos3x}{2}=\frac32$.`),
    S_('h-twice', 'D', 'Diversos cops', ['h-00'], hTwice, R`Si després d'aplicar-la torna a sortir $\frac00$, aplica-la una altra vegada. Comprova la indeterminació <b>a cada pas</b>.`),
    S_('h-inf', 'D', '$\\frac\\infty\\infty$ i jerarquia', ['h-00'], hInf, R`A $+\infty$: $\ln x\ll x^n\ll e^{ax}$ ($a>0$). Qui creix més ràpid mana: $\frac{x^5}{e^x}\to0$, $\frac{\ln x}{x}\to0$.`),
    S_('h-prod', 'D', '$0\\cdot\\infty$', ['h-inf'], hProd, R`Escriu $f\cdot g=\frac{f}{1/g}$ per obtenir $\frac00$ o $\frac\infty\infty$. Ex.: $x\ln x=\frac{\ln x}{1/x}$.`),
    S_('h-diff', 'D', '$\\infty-\\infty$', ['h-twice'], hDiff, R`Fes denominador comú (o multiplica pel conjugat si hi ha arrels) fins arribar a $\frac00$.`),
    S_('h-exp', 'D', '$1^\\infty$, $0^0$, $\\infty^0$', ['h-prod'], hExp, R`$f^g=e^{g\ln f}$. Calcula $\lim g\ln f$ (sol ser $0\cdot\infty$) i el resultat és $e^{\text{aquest límit}}$. Ex.: $(1+\frac ax)^x\to e^a$.`),
    S_('e-roots', 'E', 'Resoldre equacions', [], eRoots, R`Factor comú → segon grau $x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$ → biquadrada ($t=x^2$) → Ruffini (prova divisors del terme independent).`),
    S_('e-sign', 'E', 'Taula de signes', ['e-roots'], eSign, R`Ordena les arrels, i a cada interval el signe és el producte dels signes dels factors. Un factor al quadrat no canvia el signe.`),
    S_('x-crit', 'F', 'Punts crítics', ['e-roots', 'c-mixed'], xCrit, R`Punts crítics: on $f'(x)=0$ (dins el domini). $e^{(\dots)}$ mai és $0$; un quocient és $0$ quan ho és el numerador.`),
    S_('x-mono', 'F', 'Creixement', ['x-crit', 'e-sign'], xMono, R`$f'>0\Rightarrow f$ creix; $f'\lt 0\Rightarrow f$ decreix. Fes la taula de signes de $f'$ amb els punts crítics (i els punts fora del domini).`),
    S_('x-first', 'F', 'Criteri 1a derivada', ['x-mono'], xFirst, R`Si $f'$ passa de $+$ a $-$: màxim. De $-$ a $+$: mínim. Si no canvia de signe: ni una cosa ni l'altra.`),
    S_('x-second', 'F', 'Criteri 2a derivada', ['x-crit', 'd-val'], xSecond, R`Si $f'(c)=0$: $f''(c)>0\Rightarrow$ mínim (vall), $f''(c)\lt 0\Rightarrow$ màxim (muntanya), $f''(c)=0\Rightarrow$ no decideix.`),
    S_('x-value', 'F', 'Valor de l\'extrem', ['x-first'], xValue, R`Un cop trobat el punt $c$, el valor de l'extrem és $f(c)$ (substitueix a $f$, <b>no</b> a $f'$).`),
    S_('x-infl', 'F', 'Inflexió', ['x-second'], xInfl, R`Punt d'inflexió: on $f''$ <b>canvia de signe</b>. Que $f''(c)=0$ no n'hi ha prou (ex. $x^4$).`),
    S_('x-abs', 'F', 'Extrems absoluts en $[a,b]$', ['x-value'], xAbs, R`Weierstrass: en un interval tancat $[a,b]$ sempre hi són. Candidats: punts crítics de dins i els extrems $a$, $b$. Avalua $f$ a tots i compara.`),
    S_('x-limits', 'F', 'Límits als extrems', ['h-inf'], xLimits, R`Per a l'esbós i els extrems absoluts a $\mathbb R$: límits a $\pm\infty$ (i on la funció no està definida).`),
    S_('r-deg', 'G', 'Graus a $+\\infty$', ['l-sub'], rDeg, R`$\frac{P}{Q}\sim\frac{a_n}{b_m}x^{n-m}$: $n\lt m\to0$; $n=m\to\frac{a_n}{b_m}$; $n>m\to\pm\infty$ amb el signe de $\frac{a_n}{b_m}$.`),
    S_('r-neg', 'G', 'Cap a $-\\infty$', ['r-deg'], rNeg, R`Igual que a $+\infty$, però si $n>m$ el signe es multiplica per $(-1)^{n-m}$.`),
    S_('r-general', 'G', 'Cas general', ['r-neg'], rGeneral, R`Taula: $n\lt m$: $0$ · $n=m$: $\frac{a_n}{b_m}$ · $n>m$: $\pm\infty$ (a $-\infty$, compte amb la paritat de $n-m$).`),
  ];
  const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
  function gen(id, tier) {
    const s = byId[id];
    for (let k = 0; k < 20; k++) {
      try { const it = s.gen(tier); it.skill = id; it.tier = tier; return it; }
      catch (e) { if (k === 19) throw e; }
    }
  }

  /* =========================================================
     EXERCICIS COMPLETS (Practica / Simulacre)
     ========================================================= */
  const lab = (it, i) => it.label;
  function exHopital(diff) {
    const plan = diff === 1 ? [['h-form', 1], ['h-00', 1], ['h-inf', 1], ['h-00', 2]]
      : diff === 2 ? [['h-00', 2], ['h-twice', 2], ['h-inf', 2], ['h-prod', 2], ['h-diff', 1]]
        : [['h-twice', 3], ['h-prod', 3], ['h-diff', 3], ['h-exp', 3], ['h-inf', 3]];
    const parts = plan.map(([id, t]) => gen(id, t));
    if (diff >= 2) parts.push(MC(R`Quina d'aquestes afirmacions sobre la regla de l'Hôpital és <b>correcta</b>?`, [
      R`Si $\lim\frac fg$ és $\frac00$ o $\frac\infty\infty$ i existeix $\lim\frac{f'}{g'}$, llavors $\lim\frac fg=\lim\frac{f'}{g'}$.`,
      R`Funciona perquè $\left(\frac fg\right)'=\frac{f'}{g'}$.`,
      R`Es pot aplicar a qualsevol límit, encara que no sigui indeterminat.`,
      R`Si $\lim\frac{f'}{g'}$ no existeix, llavors $\lim\frac fg$ tampoc no existeix.`,
    ], 0, R`Les hipòtesis són: indeterminació $\frac00$ o $\frac\infty\infty$, $f,g$ derivables a prop del punt amb $g'\neq0$, i que existeixi $\lim f'/g'$. Si aquest últim no existeix, la regla no diu res (ex.: $\frac{x+\sin x}{x}$ a $+\infty$).`));
    parts.forEach(p => { p.hint = p.hint || undefined; });
    return {
      topic: 'hopital', diff,
      statement: R`Calcula els límits següents. Abans d'aplicar la <b>regla de l'Hôpital</b> comprova (i escriu) que és una indeterminació $\frac00$ o $\frac\infty\infty$; les altres indeterminacions s'han de transformar primer. <p class="note">Respostes: un número (<code>3/2</code>, <code>e^2</code>…), <code>inf</code>, <code>-inf</code> o <code>no existeix</code>.</p>`,
      parts: parts.map(p => ({ ...p, label: lab(p) })),
      solution: parts.map((p, i) => `<p><b>(${String.fromCharCode(97 + i)})</b> ${p.why}</p>`).join(''),
    };
  }
  function signTableHTML(ivs, fm) {
    let h = `<div class="tblwrap"><table class="tbl signs"><tr><th>$x$</th>`;
    for (const iv of ivs) h += `<td>$\\left(${iv.a.tex}, ${iv.b.tex}\\right)$</td>`;
    h += `</tr><tr><th>$f'(x)$</th>`;
    for (const iv of ivs) h += `<td class="${iv.s > 0 ? 'pos' : 'neg'}">${iv.s > 0 ? '+' : '−'}</td>`;
    h += `</tr><tr><th>$f(x)$</th>`;
    for (const iv of ivs) h += `<td>${iv.s > 0 ? '↗' : '↘'}</td>`;
    return h + '</tr></table></div>';
  }
  function exExtrem(diff) {
    const fm = FAM(pick(FAMS[diff]), diff), A = analyse(fm);
    const pts = famPts(fm);
    const parts = [
      EX(`Calcula $f'(x)$.`, fm.df, R`$f'(x)=${fm.dfTeX}$.`, { pts, tex: fm.dfTeX }),
      LST(`Punts crítics (les $x$ amb $f'(x)=0$).`, fm.crit.map(c => [c.v, c.tex]), ''),
      IVL(`Intervals on $f$ és <b>creixent</b>.`, A.inc, ''),
      IVL(`Intervals on $f$ és <b>decreixent</b>.`, A.dec, ''),
      LST(`On té <b>màxims relatius</b>? (les $x$, o «cap»)`, A.max.map(e => [e.v, e.tex]), ''),
      LST(`On té <b>mínims relatius</b>? (les $x$, o «cap»)`, A.min.map(e => [e.v, e.tex]), ''),
    ];
    const e = (A.max.length && A.min.length ? pick([A.max, A.min]) : A.max.length ? A.max : A.min).slice(-1)[0];
    if (e) parts.push(VAL(`Quant val $f$ a l'extrem relatiu de $x=${e.tex}$?`, e.y, e.ytex, ''));
    if (diff >= 2) {
      const p = pick(A.pts), v = A.d2(p.v);
      parts.push(MC(`Aplica el criteri de la <b>segona derivada</b> al punt crític $x=${p.tex}$:`, SECOND, Math.abs(v) < 1e-6 ? 2 : v > 0 ? 0 : 1, ''));
    }
    if (diff === 3) {
      const k = pick(Object.keys(fm.lims));
      const at = k === 'inf' ? '+\\infty' : k === '-inf' ? '-\\infty' : '0^{+}';
      parts.push(LIM(`Calcula $\\displaystyle\\lim_{x\\to${at}}f(x)$.`, fm.lims[k], ''));
    }
    const xs = A.pts.map(p => p.v);
    let xmin = Math.min(...xs) - 2.2, xmax = Math.max(...xs) + 2.2;
    if (fm.dom === 'pos') { xmin = 0.02; xmax = Math.max(4, Math.max(...xs) * 2.5); }
    const ys = A.pts.map(p => A.f(p.v));
    const ylo = Math.min(...ys), yhi = Math.max(...ys), pad = Math.max(1, (yhi - ylo) * 0.6);
    const plot = Plot.svg({ f: A.f, xmin, xmax, ymin: ylo - pad, ymax: yhi + pad,
      pts: [...A.max.map(p => ({ x: p.v, y: p.y, cls: 'pmax' })), ...A.min.map(p => ({ x: p.v, y: p.y, cls: 'pmin' }))] });
    const solution = R`<p><b>Derivada:</b> $f'(x)=${fm.dfTeX}$.</p>
      <p><b>Punts crítics:</b> $f'(x)=0\iff x\in\{${fm.crit.map(c => c.tex).join(',\\,')}\}$.${fm.dfTeX.includes('e^') ? R` (L'exponencial no s'anul·la mai.)` : ''}${fm.dom === 'nz' ? R` Compte: $x=0$ no és del domini, però també separa intervals.` : ''}</p>
      ${signTableHTML(A.ivs, fm)}
      <p><b>Creixent:</b> $${M.intervalsTeX(A.inc)}$. <b>Decreixent:</b> $${M.intervalsTeX(A.dec)}$.</p>
      <p><b>Màxims relatius:</b> ${A.max.length ? A.max.map(p => `$x=${p.tex}$, $f=${p.ytex}$`).join('; ') : 'cap'}. <b>Mínims relatius:</b> ${A.min.length ? A.min.map(p => `$x=${p.tex}$, $f=${p.ytex}$`).join('; ') : 'cap'}.</p>
      <p><b>Criteri de la 2a derivada</b> (alternativa): $f''(c)>0$ mínim, $f''(c)\lt 0$ màxim.</p>
      <p><b>Límits:</b> ${Object.entries(fm.lims).map(([k, l]) => `$\\lim_{x\\to${k === 'inf' ? '+\\infty' : k === '-inf' ? '-\\infty' : '0^+'}}f=${M.limitTeX(l)}$`).join(', ')}.</p>
      <div class="plotwrap">${plot}</div>`;
    return {
      topic: 'extrem', diff,
      statement: `Estudia la monotonia i els <b>extrems relatius</b> de ${famLabel(fm)}.`,
      parts, solution,
      sketch: { f: A.f, xmin, xmax, ymin: ylo - pad, ymax: yhi + pad, pts: [...A.max.map(p => ({ x: p.v, y: p.y, cls: 'pmax' })), ...A.min.map(p => ({ x: p.v, y: p.y, cls: 'pmin' }))] },
    };
  }

  return { AREAS, SKILLS, byId, gen, exHopital, exExtrem };
})();
