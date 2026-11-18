'use strict';
/* ===========================================================
   MathX: parser d'expressions, avaluació numèrica, TeX, comparadors
   =========================================================== */
const M = (() => {
  const FN_NAMES = ['arcsin', 'arccos', 'arctan', 'sqrt', 'arrel', 'sin', 'sen', 'cos', 'tan', 'tg', 'exp', 'ln', 'log', 'abs'];
  const FN_ALIAS = { sen: 'sin', tg: 'tan', log: 'ln', arrel: 'sqrt' };
  const WORDS = [...FN_NAMES, 'pi', 'x', 'h', 'e'];

  function tokenize(src) {
    const s = src
      .replace(/[·×]/g, '*').replace(/[−–]/g, '-').replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\*\*/g, '^')
      .replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const str = s.slice(i, j);
        if (str === '.' || (str.match(/\./g) || []).length > 1) throw new Error('Número mal escrit: ' + str);
        toks.push({ t: 'num', v: parseFloat(str) });
        i = j; continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
        const w = s.slice(i, j).toLowerCase();
        let k = 0;
        while (k < w.length) {
          let m = null;
          for (const n of WORDS) if (w.startsWith(n, k) && (!m || n.length > m.length)) m = n;
          if (!m) throw new Error(`No reconec «${w.slice(k)}». Usa x, sin, cos, tan, exp, ln, sqrt, pi, e`);
          if (FN_NAMES.includes(m)) toks.push({ t: 'fn', v: FN_ALIAS[m] || m });
          else if (m === 'x' || m === 'h') toks.push({ t: 'var' });
          else toks.push({ t: 'const', v: m });
          k += m.length;
        }
        i = j; continue;
      }
      if ('+-*/^()'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
      throw new Error(`Caràcter no vàlid: «${c}»`);
    }
    return toks;
  }

  function parse(src) {
    if (!src || !src.trim()) throw new Error('Escriu alguna cosa');
    const toks = tokenize(src);
    let p = 0;
    const isOp = v => p < toks.length && toks[p].t === 'op' && toks[p].v === v;
    const expect = v => {
      if (!isOp(v)) throw new Error(v === ')' ? 'Falta tancar un parèntesi «)»' : "S'esperava " + v);
      p++;
    };
    const starts = () => {
      const t = toks[p];
      return t && (t.t === 'num' || t.t === 'var' || t.t === 'const' || t.t === 'fn' || (t.t === 'op' && t.v === '('));
    };
    function expr() {
      let a = term();
      while (isOp('+') || isOp('-')) {
        const o = toks[p++].v;
        const b = term();
        a = { t: o === '+' ? 'add' : 'sub', a, b };
      }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) {
          const o = toks[p++].v;
          const b = unary();
          a = { t: o === '*' ? 'mul' : 'div', a, b };
        } else if (starts()) {
          const b = power();
          a = { t: 'mul', a, b };
        } else break;
      }
      return a;
    }
    function unary() {
      if (isOp('-')) { p++; return { t: 'neg', a: unary() }; }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (isOp('^')) { p++; const e = unary(); return { t: 'pow', a: b, b: e }; }
      return b;
    }
    function primary() {
      const t = toks[p];
      if (!t) throw new Error('Expressió incompleta');
      if (t.t === 'num') { p++; return { t: 'num', v: t.v }; }
      if (t.t === 'var') { p++; return { t: 'var' }; }
      if (t.t === 'const') { p++; return { t: 'const', v: t.v }; }
      if (t.t === 'fn') {
        p++;
        let ex = null;
        if (isOp('^')) {
          p++;
          if (isOp('-')) { p++; ex = { t: 'neg', a: primary() }; } else ex = primary();
        }
        if (p >= toks.length) throw new Error(`Falta l'argument de ${t.v}`);
        let arg;
        if (isOp('(')) { p++; arg = expr(); expect(')'); } else arg = power();
        let node = { t: 'fn', v: t.v, a: arg };
        if (ex) node = { t: 'pow', a: node, b: ex };
        return node;
      }
      if (isOp('(')) { p++; const e = expr(); expect(')'); return e; }
      throw new Error(`Símbol inesperat: «${t.v}»`);
    }
    const ast = expr();
    if (p < toks.length) throw new Error(isOp(')') ? 'Sobra un parèntesi «)»' : 'Expressió mal formada');
    return ast;
  }

  const FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp,
    ln: x => (x > 0 ? Math.log(x) : NaN), sqrt: x => (x >= 0 ? Math.sqrt(x) : NaN),
    abs: Math.abs, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  };
  function powR(b, e) {
    if (b >= 0 || Number.isInteger(e)) return Math.pow(b, e);
    for (const q of [3, 5, 7, 9]) {
      const pp = e * q;
      if (Math.abs(pp - Math.round(pp)) < 1e-9) return (Math.round(pp) % 2 ? -1 : 1) * Math.pow(-b, e);
    }
    return NaN;
  }
  function ev(n, x) {
    switch (n.t) {
      case 'num': return n.v;
      case 'var': return x;
      case 'const': return n.v === 'pi' ? Math.PI : Math.E;
      case 'add': return ev(n.a, x) + ev(n.b, x);
      case 'sub': return ev(n.a, x) - ev(n.b, x);
      case 'mul': return ev(n.a, x) * ev(n.b, x);
      case 'div': return ev(n.a, x) / ev(n.b, x);
      case 'neg': return -ev(n.a, x);
      case 'pow': return powR(ev(n.a, x), ev(n.b, x));
      case 'fn': return FN[n.v](ev(n.a, x));
    }
    return NaN;
  }
  function hasVar(n) {
    if (!n) return false;
    if (n.t === 'var') return true;
    return hasVar(n.a) || hasVar(n.b);
  }

  /* ---------- TeX ---------- */
  const PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 3, pow: 4 };
  const prec = n => PREC[n.t] || 5;
  const wrap = s => `\\left(${s}\\right)`;
  const FNTEX = { sin: '\\sin', cos: '\\cos', tan: '\\tan', ln: '\\ln', arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan' };
  function leftmost(n) { while (n.a && ['add', 'sub', 'mul', 'div', 'pow'].includes(n.t)) n = n.a; return n; }
  function fnTeX(name, a) {
    if (name === 'sqrt') return `\\sqrt{${a}}`;
    if (name === 'abs') return `\\left|${a}\\right|`;
    if (name === 'exp') return `e^{${a}}`;
    return `${FNTEX[name]}\\left(${a}\\right)`;
  }
  function tex(n) {
    switch (n.t) {
      case 'num': return fmt(n.v);
      case 'var': return 'x';
      case 'const': return n.v === 'pi' ? '\\pi' : 'e';
      case 'add': return `${tex(n.a)} + ${n.b.t === 'neg' ? wrap(tex(n.b)) : tex(n.b)}`;
      case 'sub': return `${tex(n.a)} - ${prec(n.b) <= 1 || n.b.t === 'neg' ? wrap(tex(n.b)) : tex(n.b)}`;
      case 'mul': {
        const l = prec(n.a) < 2 ? wrap(tex(n.a)) : tex(n.a);
        const r = prec(n.b) < 2 || n.b.t === 'neg' ? wrap(tex(n.b)) : tex(n.b);
        const dot = leftmost(n.b).t === 'num' || n.b.t === 'neg' || prec(n.b) < 2;
        return dot && !(prec(n.b) < 2) ? `${l} \\cdot ${r}` : `${l}\\,${r}`;
      }
      case 'div': return `\\frac{${tex(n.a)}}{${tex(n.b)}}`;
      case 'neg': {
        const s = tex(n.a);
        return prec(n.a) < 2 || n.a.t === 'neg' ? `-${wrap(s)}` : `-${s}`;
      }
      case 'pow': {
        if (n.a.t === 'fn' && FNTEX[n.a.v]) return `${FNTEX[n.a.v]}^{${tex(n.b)}}\\left(${tex(n.a.a)}\\right)`;
        const base = prec(n.a) < 5 || n.a.t === 'fn' ? wrap(tex(n.a)) : tex(n.a);
        return `${base}^{${tex(n.b)}}`;
      }
      case 'fn': return fnTeX(n.v, tex(n.a));
    }
    return '?';
  }
  function fmt(v) {
    if (!isFinite(v)) return v > 0 ? '+\\infty' : v < 0 ? '-\\infty' : '\\text{?}';
    if (Number.isInteger(v)) return String(v);
    return String(+v.toFixed(6));
  }
  // número -> TeX intentant fracció
  function numTeX(v) {
    if (!isFinite(v)) return fmt(v);
    for (let q = 1; q <= 60; q++) {
      const p = Math.round(v * q);
      if (Math.abs(p / q - v) < 1e-9) return fracTeX(p, q);
    }
    return fmt(v);
  }

  /* ---------- comparadors ---------- */
  function close(a, b, tol = 1e-6) {
    if (!isFinite(a) || !isFinite(b)) return a === b;
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  }
  const SAMPLE = [-1.93, -1.37, -1.08, -0.83, -0.61, -0.41, -0.27, 0.19, 0.33, 0.52, 0.74, 0.97, 1.21, 1.46, 1.72, 2.03];
  function equivFn(ast, trueF, pts = SAMPLE) {
    let ok = 0, bad = 0;
    for (const x of pts) {
      const t = trueF(x);
      if (!isFinite(t) || Math.abs(t) > 1e7) continue;
      const u = ev(ast, x);
      if (!isFinite(u)) { bad++; continue; }
      if (close(u, t, 1e-6)) ok++; else return false;
    }
    return ok >= 3 && bad <= ok / 3;
  }

  function parseValue(s) {
    const a = parse(s);
    if (hasVar(a)) throw new Error("Aquí ha de ser un número, sense x");
    const v = ev(a, 0);
    if (!isFinite(v)) throw new Error('Aquest valor no és un número real');
    return { v, tex: tex(a) };
  }

  const EMPTY_RE = /^(∅|ø|cap|buit|ningun|ninguno|none|\{\}|no hi ha|no n'hi ha|cap punt)$/i;
  const DNE = ['noexisteix', 'ne', 'no', '∄', 'dne', 'noexiste', 'nohiha', 'noexist'];
  const INF_RE = /^([+-]?)(∞|inf|infty|infinit|infinity|infinito|oo)$/;

  function parseLimit(s) {
    const t = s.trim().toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');
    if (!t) throw new Error('Escriu alguna cosa');
    if (DNE.includes(t)) return { k: 'dne', tex: '\\nexists' };
    const m = t.match(INF_RE);
    if (m) return { k: 'inf', s: m[1] === '-' ? -1 : 1, tex: m[1] === '-' ? '-\\infty' : '+\\infty' };
    const pv = parseValue(s);
    return { k: 'num', v: pv.v, tex: pv.tex };
  }
  function sameLimit(a, b) {
    if (a.k !== b.k) return false;
    if (a.k === 'inf') return a.s === b.s;
    if (a.k === 'num') return close(a.v, b.v);
    return true;
  }
  function limitTeX(l) {
    if (l.k === 'dne') return '\\nexists \\;(\\text{no existeix})';
    if (l.k === 'inf') return l.s > 0 ? '+\\infty' : '-\\infty';
    return l.tex || numTeX(l.v);
  }

  function parseList(s) {
    const t = s.trim();
    if (!t) throw new Error('Escriu alguna cosa (o «cap» si no n\'hi ha)');
    if (EMPTY_RE.test(t)) return [];
    const out = [];
    for (let raw of t.split(/[;,]/)) {
      raw = raw.trim().replace(/^x\s*=\s*/i, '');
      if (!raw) continue;
      const pm = raw.match(/^(±|\+-|\+\/-)\s*(.+)$/);
      if (pm) {
        const pv = parseValue(pm[2]);
        out.push({ v: pv.v, tex: pv.tex }, { v: -pv.v, tex: '-' + (/^[\d\\a-z]/i.test(pv.tex) ? pv.tex : wrap(pv.tex)) });
      } else out.push(parseValue(raw));
    }
    // elimina duplicats
    const uniq = [];
    for (const it of out) if (!uniq.some(u => close(u.v, it.v))) uniq.push(it);
    return uniq;
  }
  function sameList(user, target) {
    if (user.length !== target.length) return false;
    const a = user.map(o => o.v).sort((x, y) => x - y);
    const b = target.map(o => o.v).sort((x, y) => x - y);
    return a.every((v, i) => close(v, b[i], 1e-5));
  }
  function listTeX(list) {
    if (!list.length) return '\\varnothing \\;(\\text{cap})';
    return list.map(o => o.tex).join(',\\; ');
  }

  function parseEnd(s) {
    const t = s.trim().toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');
    const m = t.match(INF_RE);
    if (m) return m[1] === '-' ? { v: -Infinity, tex: '-\\infty' } : { v: Infinity, tex: '+\\infty' };
    return parseValue(s);
  }
  function parseIntervals(s) {
    const t = s.trim();
    if (!t) throw new Error("Escriu alguna cosa (o «cap» si no n'hi ha)");
    if (EMPTY_RE.test(t)) return [];
    if (/^(r|ℝ|totr|totar)$/i.test(t.replace(/\s/g, ''))) return [{ a: { v: -Infinity, tex: '-\\infty' }, b: { v: Infinity, tex: '+\\infty' } }];
    const pieces = t.split(/\s*(?:∪|U|\bu\b)\s*/);
    const out = [];
    for (const pc0 of pieces) {
      const pc = pc0.trim();
      if (!pc) continue;
      const m = pc.match(/^([\(\[\]])(.*)([\)\]\[])$/);
      if (!m) throw new Error(`No entenc «${pc}». Format: (a, b) U (c, d)`);
      const parts = m[2].split(/[,;]/);
      if (parts.length !== 2) throw new Error(`Cada interval necessita dos extrems separats per coma: «${pc}»`);
      const a = parseEnd(parts[0]), b = parseEnd(parts[1]);
      if (!(a.v < b.v)) throw new Error(`L'extrem esquerre ha de ser menor que el dret: «${pc}»`);
      out.push({ a, b });
    }
    out.sort((x, y) => x.a.v - y.a.v);
    const merged = [];
    for (const iv of out) {
      const last = merged[merged.length - 1];
      if (last && iv.a.v <= last.b.v + 1e-9) { if (iv.b.v > last.b.v) last.b = iv.b; }
      else merged.push({ a: iv.a, b: iv.b });
    }
    return merged;
  }
  function sameIntervals(u, t) {
    if (u.length !== t.length) return false;
    return u.every((iv, i) => close(iv.a.v, t[i].a.v, 1e-5) && close(iv.b.v, t[i].b.v, 1e-5));
  }
  function intervalsTeX(list) {
    if (!list.length) return '\\varnothing \\;(\\text{cap})';
    return list.map(iv => `\\left(${iv.a.tex},\\, ${iv.b.tex}\\right)`).join(' \\cup ');
  }

  /* ---------- aritmètica exacta senzilla ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
  function fracTeX(p, q) {
    if (q < 0) { p = -p; q = -q; }
    const g = gcd(p, q); p /= g; q /= g;
    if (q === 1) return String(p);
    return (p < 0 ? '-' : '') + `\\frac{${Math.abs(p)}}{${q}}`;
  }
  function sqrtSplit(n) {
    let out = 1, inn = n;
    for (let k = 2; k * k <= inn; k++) while (inn % (k * k) === 0) { inn /= k * k; out *= k; }
    return [out, inn];
  }
  // (a + b·√n) / d
  function surdTeX(a, b, n, d) {
    const [o, i] = sqrtSplit(n);
    b *= o; n = i;
    if (n === 1 || b === 0) return fracTeX(a + (n === 1 ? b : 0), d);
    const g = gcd(gcd(a, b), d);
    a /= g; b /= g; d /= g;
    if (d < 0) { a = -a; b = -b; d = -d; }
    const bs = (Math.abs(b) === 1 ? '' : Math.abs(b)) + `\\sqrt{${n}}`;
    if (a === 0) return d === 1 ? (b < 0 ? '-' : '') + bs : (b < 0 ? '-' : '') + `\\frac{${bs}}{${d}}`;
    const num = `${a} ${b < 0 ? '-' : '+'} ${bs}`;
    return d === 1 ? num : `\\frac{${num}}{${d}}`;
  }
  const surd = (a, b, n, d) => ({ v: (a + b * Math.sqrt(n)) / d, tex: surdTeX(a, b, n, d) });
  const int = v => ({ v, tex: String(v) });
  const frac = (p, q) => ({ v: p / q, tex: fracTeX(p, q) });

  /* ---------- polinomis (coeficients de grau baix a alt) ---------- */
  function polyEval(c, x) { let r = 0; for (let i = c.length - 1; i >= 0; i--) r = r * x + c[i]; return r; }
  function polyDer(c) { return c.slice(1).map((v, i) => v * (i + 1)); }
  function polyMul(a, b) {
    const r = new Array(a.length + b.length - 1).fill(0);
    a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; }));
    return r;
  }
  function polyPow(a, k) { let r = [1]; for (let i = 0; i < k; i++) r = polyMul(r, a); return r; }
  function trim(c) { c = c.slice(); while (c.length > 1 && c[c.length - 1] === 0) c.pop(); return c; }
  const xpow = (k, v = 'x') => (k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`);
  function termsTeX(terms) {
    let s = '';
    for (const { c, body } of terms) {
      if (c === 0) continue;
      const neg = c < 0, a = Math.abs(c);
      const core = body ? (a === 1 ? body : `${numTeX(a)}${body}`) : numTeX(a);
      if (!s) s = (neg ? '-' : '') + core;
      else s += ` ${neg ? '-' : '+'} ${core}`;
    }
    return s || '0';
  }
  function polyTeX(c, v = 'x') {
    c = trim(c);
    const terms = [];
    for (let i = c.length - 1; i >= 0; i--) terms.push({ c: c[i], body: xpow(i, v) });
    return termsTeX(terms);
  }
  const polyIsSum = c => trim(c).filter(x => x !== 0).length > 1;

  return {
    parse, ev, tex, hasVar, fmt, numTeX, close, equivFn, parseValue,
    parseLimit, sameLimit, limitTeX, parseList, sameList, listTeX,
    parseIntervals, sameIntervals, intervalsTeX,
    gcd, fracTeX, surdTeX, surd, int, frac, sqrtSplit,
    polyEval, polyDer, polyMul, polyPow, polyTeX, polyIsSum, termsTeX, xpow, trim, wrap,
  };
})();
