'use strict';
/* ===========================================================
   Generadors d'exercicis (format Seminari 3 de Càlcul)
   Cada exercici: { topic, diff, statement, parts[], solution }
   Tipus de part: expr | value | limit | list | intervals | mcq
   =========================================================== */
const G = (() => {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const nz = (a, b) => { let v; do v = ri(a, b); while (v === 0); return v; };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const W = M.wrap;

  /* ---------------------------------------------------------
     1. REGLA DE LA CADENA
     --------------------------------------------------------- */
  const LAYERS = {
    sin: { lab: '\\sin', trig: '\\sin', tex: u => `\\sin\\left(${u}\\right)`, d: u => `\\cos\\left(${u}\\right)`, rule: "(\\sin u)' = \\cos u\\cdot u'", f: Math.sin, df: Math.cos, pos: false },
    cos: { lab: '\\cos', trig: '\\cos', tex: u => `\\cos\\left(${u}\\right)`, d: u => `-\\sin\\left(${u}\\right)`, rule: "(\\cos u)' = -\\sin u\\cdot u'", f: Math.cos, df: u => -Math.sin(u), pos: false },
    tan: { lab: '\\tan', trig: '\\tan', tex: u => `\\tan\\left(${u}\\right)`, d: u => `\\frac{1}{\\cos^{2}\\left(${u}\\right)}`, rule: "(\\tan u)' = \\frac{1}{\\cos^2 u}\\cdot u'", f: Math.tan, df: u => 1 / Math.cos(u) ** 2, pos: false },
    exp: { lab: 'e^{\\square}', tex: u => `e^{${u}}`, d: u => `e^{${u}}`, rule: "(e^{u})' = e^{u}\\cdot u'", f: Math.exp, df: Math.exp, pos: true },
    ln: { lab: '\\ln', tex: u => `\\ln\\left(${u}\\right)`, d: u => `\\frac{1}{${u}}`, rule: "(\\ln u)' = \\frac{1}{u}\\cdot u'", f: u => (u > 0 ? Math.log(u) : NaN), df: u => 1 / u, pos: false },
    sqrt: { lab: '\\sqrt{\\square}', tex: u => `\\sqrt{${u}}`, d: u => `\\frac{1}{2\\sqrt{${u}}}`, rule: "(\\sqrt{u})' = \\frac{1}{2\\sqrt{u}}\\cdot u'", f: u => (u >= 0 ? Math.sqrt(u) : NaN), df: u => 1 / (2 * Math.sqrt(u)), pos: true },
    sq1: { lab: '1+\\square^{2}', tex: u => `1+\\left(${u}\\right)^{2}`, d: u => `2\\left(${u}\\right)`, rule: "(1+u^2)' = 2u\\cdot u'", f: u => 1 + u * u, df: u => 2 * u, pos: true },
  };
  for (const n of [2, 3, 4]) {
    LAYERS['p' + n] = {
      n, lab: `\\square^{${n}}`,
      tex: u => `\\left(${u}\\right)^{${n}}`,
      d: u => (n === 2 ? `2\\left(${u}\\right)` : `${n}\\left(${u}\\right)^{${n - 1}}`),
      rule: `(u^{${n}})' = ${n}u${n - 1 === 1 ? '' : `^{${n - 1}}`}\\cdot u'`,
      f: u => u ** n, df: u => n * u ** (n - 1), pos: n % 2 === 0 ? true : 'keep',
    };
  }
  const CHAIN_INNERS = [
    { c: [0, 0, 1] }, { c: [0, 0, 0, 1] }, { c: [1, 0, 1], pos: true }, { c: [1, 3] }, { c: [0, -1, 0, 1] },
    { c: [0, 2] }, { c: [3, 0, 2], pos: true }, { c: [1, 0, 0, 0, 1], pos: true }, { c: [0, 1, 1] },
    { c: [2, -1] }, { c: [0, 0, 3] }, { c: [0, 5] }, { c: [1, 0, -1] },
  ];
  function badPair(prev, k) {
    if (prev === k && !['sin', 'cos'].includes(k)) return true;
    if ((prev === 'exp' && k === 'ln') || (prev === 'ln' && k === 'exp')) return true;
    if (prev[0] === 'p' && (k[0] === 'p' || k === 'sqrt' || k === 'sq1')) return true;
    if ((prev === 'sqrt' || prev === 'sq1') && k[0] === 'p') return true;
    return false;
  }
  const needWrap = s => /^-/.test(s);

  function genChain(diff) {
    const nL = [0, 2, 3, 4][diff];
    for (let attempt = 0; attempt < 400; attempt++) {
      const inner = pick(CHAIN_INNERS);
      const seq = [];
      let pos = !!inner.pos;
      for (let i = 0; i < nL; i++) {
        const prev = seq[i - 1];
        const cands = [];
        for (const [k, w] of [['sin', 5], ['cos', 5], ['tan', 1], ['exp', 2], ['ln', 3], ['sqrt', 2], ['p2', 3], ['p3', 2], ['p4', 1], ['sq1', 1]]) {
          if ((k === 'ln' || k === 'sqrt') && !pos) continue;
          if (prev && badPair(prev, k)) continue;
          if (['tan', 'exp', 'ln', 'sqrt', 'sq1'].includes(k) && seq.includes(k)) continue;
          for (let j = 0; j < w; j++) cands.push(k);
        }
        const k = pick(cands);
        seq.push(k);
        const P = LAYERS[k].pos;
        pos = P === 'keep' ? pos : !!P;
      }
      // construcció de dins cap a fora
      const lv = [{ tex: M.polyTeX(inner.c), trig: null }];
      for (const k of seq) {
        const L = LAYERS[k], cur = lv[lv.length - 1];
        let tex, dtex;
        if ((L.n || k === 'sq1') && cur.trig) {
          const n = L.n || 2;
          if (k === 'sq1') { tex = `1+${cur.trig}^{2}\\left(${cur.arg}\\right)`; dtex = `2${cur.trig}\\left(${cur.arg}\\right)`; }
          else {
            tex = `${cur.trig}^{${n}}\\left(${cur.arg}\\right)`;
            dtex = n - 1 === 1 ? `${n}${cur.trig}\\left(${cur.arg}\\right)` : `${n}${cur.trig}^{${n - 1}}\\left(${cur.arg}\\right)`;
          }
        } else { tex = L.tex(cur.tex); dtex = L.d(cur.tex); }
        lv.push({ tex, dtex, trig: L.trig || null, arg: L.trig ? cur.tex : null, key: k });
      }
      const innerVal = x => M.polyEval(inner.c, x);
      const dInner = M.polyDer(inner.c);
      const vals = x => { const v = [innerVal(x)]; for (const k of seq) v.push(LAYERS[k].f(v[v.length - 1])); return v; };
      const dF = x => {
        const v = vals(x);
        let r = M.polyEval(dInner, x);
        seq.forEach((k, i) => { r *= LAYERS[k].df(v[i]); });
        return r;
      };
      const outerFactor = x => { const v = vals(x); return LAYERS[seq[nL - 1]].df(v[nL - 1]); };
      // validesa numèrica
      let good = 0;
      for (const x of [-1.93, -1.37, -1.08, -0.83, -0.61, -0.41, -0.27, 0.19, 0.33, 0.52, 0.74, 0.97, 1.21, 1.46, 1.72, 2.03]) {
        const y = dF(x);
        if (isFinite(y) && Math.abs(y) < 1e6) good++;
      }
      if (good < 9) continue;

      const factors = [];
      for (let i = nL; i >= 1; i--) factors.push(needWrap(lv[i].dtex) ? W(lv[i].dtex) : lv[i].dtex);
      const dInTeX = M.polyTeX(dInner);
      factors.push(M.polyIsSum(dInner) || needWrap(dInTeX) ? W(dInTeX) : dInTeX);
      const dTeX = factors.join(' \\cdot ');
      const fTeX = lv[nL].tex;

      // opcions de descomposició
      const labels = [...seq.slice().reverse().map(k => LAYERS[k].lab), lv[0].tex];
      const fmtChain = arr => arr.join('\\;\\to\\;');
      const correct = fmtChain(labels);
      const opts = new Set([correct]);
      const rev = fmtChain([...labels.slice(0, -1).reverse(), labels[labels.length - 1]]);
      if (rev !== correct) opts.add(rev);
      for (let t = 0; t < 80 && opts.size < 4; t++) opts.add(fmtChain(shuffle(labels)));
      const options = shuffle([...opts]).map(s => ({ tex: s, ok: s === correct }));

      const outerL = LAYERS[seq[nL - 1]];
      const uNames = lv.map((_, i) => `u_{${i + 1}}`);
      const steps = [`u_{1} = ${lv[0].tex}`];
      seq.forEach((k, i) => { steps.push(`u_{${i + 2}} = ${LAYERS[k].tex(uNames[i]).replace(/\\left\(u_\{(\d+)\}\\right\)/g, '(u_{$1})')}`); });
      let table = '<table class="tbl"><tr><th>Capa</th><th>Regla</th><th>Factor de f\'(x)</th></tr>';
      for (let i = nL; i >= 1; i--) {
        const L = LAYERS[seq[i - 1]];
        table += `<tr><td>$${L.lab}$</td><td>$${L.rule}$</td><td>$${lv[i].dtex}$</td></tr>`;
      }
      table += `<tr><td>$${lv[0].tex}$</td><td>derivada d'un polinomi</td><td>$${dInTeX}$</td></tr></table>`;

      return {
        topic: 'chain', diff,
        statement: `Aplicant la regla de la cadena les vegades que calgui, calcula la derivada de la funció:
          $$f(x) = ${fTeX}$$
          <p class="note"><b>Nota:</b> no cal simplificar el resultat. L'important és aplicar la regla de la cadena en l'ordre correcte.</p>`,
        parts: [
          {
            type: 'mcq', label: "Descomposició: quin és l'ordre de les funcions, <b>de la més exterior a la més interior</b>?",
            options, hint: "La capa <b>exterior</b> és l'última operació que faries si calculessis $f(x)$ amb la calculadora per a un valor concret de $x$.",
          },
          {
            type: 'expr', label: `Primer factor: escriu la derivada de la capa exterior <b>avaluada en tot el seu argument</b> (sense multiplicar per res més).`,
            f: outerFactor, answerTeX: lv[nL].dtex,
            hint: `La capa exterior és $${outerL.lab}$ i $${outerL.rule}$. Deixa l'argument tal com està, intacte.`,
          },
          {
            type: 'expr', label: "Calcula $f'(x)$ completa.", f: dF, answerTeX: `f'(x) = ${dTeX}`,
            hint: `Hi ha d'haver <b>${nL + 1} factors</b> multiplicats: la derivada de cada capa avaluada en el que té a dins, de fora cap a dins, i al final la derivada de $${lv[0].tex}$.`,
          },
        ],
        solution: `<p><b>1. Descomposició</b> (de dins cap a fora):</p>
          <p>$$${steps.join(',\\qquad ')}$$</p>
          <p>Així $f = u_{${nL + 1}}$ i l'ordre de fora cap a dins és $${correct}$.</p>
          <p><b>2. Regla de la cadena:</b> derivem cada capa avaluada en el seu argument i multipliquem:</p>
          ${table}
          <p><b>3. Resultat:</b></p>
          $$f'(x) = ${dTeX}$$`,
      };
    }
    throw new Error('No s\'ha pogut generar');
  }

  /* ---------------------------------------------------------
     2. DERIVADA EN UN PUNT VIA LÍMIT:  f(x) = c x^k T(1/x) + a x
     --------------------------------------------------------- */
  function genLimDer(diff) {
    let k, T, c, a;
    if (diff === 1) { k = pick([3, 4]); T = 'sin'; c = 1; a = 0; }
    else if (diff === 2) { k = pick([3, 3, 4, 5]); T = pick(['sin', 'cos']); c = pick([1, 1, 2, -1, 3]); a = pick([0, 0, 1, -1, 2, -3]); }
    else { k = pick([1, 2, 2, 3, 3, 4]); T = pick(['sin', 'cos']); c = pick([1, 1, 2, -1, -2]); a = pick([0, 1, -1, 2, 3, -2]); }
    const Tt = T === 'sin' ? '\\sin' : '\\cos', Ut = T === 'sin' ? '\\cos' : '\\sin';
    const inv = '\\left(\\frac{1}{x}\\right)';
    const Tf = T === 'sin' ? Math.sin : Math.cos;
    const fTeX = M.termsTeX([{ c, body: M.xpow(k) + Tt + inv }, { c: a, body: 'x' }]);
    const body = (j, fn) => (j === 0 ? fn + inv : j === 1 ? 'x' + fn + inv : j > 0 ? `x^{${j}}${fn}${inv}` : `\\frac{${fn}${inv}}{${j === -1 ? 'x' : `x^{${-j}}`}}`);
    const t2c = T === 'sin' ? -c : c;
    const dTeX = M.termsTeX([{ c: c * k, body: body(k - 1, Tt) }, { c: t2c, body: body(k - 2, Ut) }, { c: a, body: '' }]);
    const f = x => (x === 0 ? 0 : c * x ** k * Tf(1 / x) + a * x);
    const df = x => c * k * x ** (k - 1) * Tf(1 / x) + (T === 'sin' ? -c * x ** (k - 2) * Math.cos(1 / x) : c * x ** (k - 2) * Math.sin(1 / x)) + a;
    const limDer = k >= 3 ? { k: 'num', v: a, tex: String(a) } : { k: 'dne' };
    const fp0 = k >= 2 ? { k: 'num', v: a, tex: String(a) } : { k: 'dne' };
    const concl = k >= 3 ? 0 : k === 2 ? 1 : 2;
    const OPTS = [
      "$f$ és derivable en $0$ i $f'$ és contínua en $0$",
      "$f$ és derivable en $0$, però $f'$ <b>no</b> és contínua en $0$",
      "$f$ <b>no</b> és derivable en $0$",
      "$f$ no és ni tan sols contínua en $0$",
    ];
    const cases = `f(x) = \\begin{cases} ${fTeX} & \\text{si } x \\neq 0,\\\\[4pt] 0 & \\text{si } x = 0. \\end{cases}`;

    // anàlisi de termes per a la solució
    const termAnalysis = (j, fn, coefTeX) => {
      if (j >= 1) return `<li>$${coefTeX}${j === 1 ? 'x' : `x^{${j}}`}${fn}${inv}$: és (una cosa que tendeix a $0$) × (una cosa acotada, $|${fn}(\\cdot)|\\le 1$) $\\Rightarrow$ tendeix a $0$.</li>`;
      if (j === 0) return `<li>$${coefTeX}${fn}${inv}$: quan $x\\to0$, $\\frac1x\\to\\pm\\infty$ i $${fn}$ oscil·la entre $-1$ i $1$ infinites vegades $\\Rightarrow$ <b>no té límit</b>.</li>`;
      return `<li>$${coefTeX}\\frac{${fn}${inv}}{x}$: oscil·la i a més no està acotat (les oscil·lacions creixen com $\\frac1{|x|}$) $\\Rightarrow$ <b>no té límit</b>.</li>`;
    };
    const cTeX = v => (v === 1 ? '' : v === -1 ? '-' : String(v));
    const limSentence = k >= 3
      ? `Tots els termes oscil·lants tendeixen a $0$, per tant $$\\lim_{x\\to0} f'(x) = ${a}.$$`
      : `Hi ha un terme que no té límit (i la resta sí), per tant <b>$\\lim_{x\\to0} f'(x)$ no existeix</b>.`;
    const defSentence = k >= 2
      ? `$$\\frac{f(h)-f(0)}{h} = \\frac{${M.termsTeX([{ c, body: M.xpow(k, 'h') + Tt + '\\left(\\frac1h\\right)' }, { c: a, body: 'h' }])}}{h} = ${M.termsTeX([{ c, body: M.xpow(k - 1, 'h') + Tt + '\\left(\\frac1h\\right)' }, { c: a, body: '' }])} \\xrightarrow[h\\to0]{} ${a}$$
         perquè $h^{${k - 1}}\\to0$ i $${Tt}(1/h)$ està acotat. Per tant $f'(0) = ${a}$.`
      : `$$\\frac{f(h)-f(0)}{h} = ${M.termsTeX([{ c, body: Tt + '\\left(\\frac1h\\right)' }, { c: a, body: '' }])},$$
         que oscil·la quan $h\\to0$: <b>no existeix</b> el límit, i $f$ no és derivable en $0$.`;
    const warn = k === 2
      ? `<p class="callout warn"><b>Compte!</b> Aquí $\\lim_{x\\to0}f'(x)$ no existeix però $f$ <b>sí</b> és derivable en $0$ (amb $f'(0)=${a}$). El truc de l'enunciat ($f'(0)=\\lim f'(x)$) només serveix quan aquest límit <b>existeix</b>; si no, cal anar a la definició.</p>`
      : '';
    const env = x => Math.abs(c) * Math.abs(x) ** k;
    const plot = Plot.svg({
      f, xmin: k === 1 ? -0.35 : -0.6, xmax: k === 1 ? 0.35 : 0.6, samples: 2400,
      extra: [{ f: x => env(x) + a * x }, { f: x => -env(x) + a * x }],
      pts: [{ x: 0, y: 0, label: '(0, 0)' }],
    });

    return {
      topic: 'limder', diff,
      statement: `A vegades cal calcular la derivada en un punt fent un límit. Considera la funció
        $$${cases}$$
        És fàcil veure que $f$ és contínua a tot $\\mathbb{R}$ (perquè $|x^{${k}}${Tt}(1/x)| \\le |x|^{${k}} \\to 0$). Calcula $f'(x)$ per a $x\\neq0$ i estudia què passa en $x=0$.
        <p class="note"><b>Pista:</b> el sinus i el cosinus sempre estan acotats. Una cosa que tendeix a $0$ multiplicada per una cosa acotada tendeix a $0$.</p>`,
      parts: [
        {
          type: 'expr', label: "Calcula $f'(x)$ per a $x \\neq 0$.", f: df, answerTeX: `f'(x) = ${dTeX}`,
          pts: [-1.93, -1.37, -1.08, -0.83, -0.61, -0.41, -0.27, 0.27, 0.33, 0.52, 0.74, 0.97, 1.21, 1.46, 1.72, 2.03],
          hint: `Regla del producte i de la cadena: $\\big(x^{${k}}\\big)'=${k === 1 ? '1' : `${k}x^{${k - 1}}`}$ i $\\left(${Tt}\\frac1x\\right)' = ${T === 'sin' ? '\\cos' : '-\\sin'}\\left(\\frac1x\\right)\\cdot\\left(-\\frac{1}{x^2}\\right)$.`,
        },
        {
          type: 'limit', label: "Calcula $\\displaystyle\\lim_{x\\to0} f'(x)$. (Si no existeix, escriu «no existeix».)", lim: limDer,
          hint: 'Mira cada terme de $f\'(x)$: una potència <b>positiva</b> de $x$ per un sinus/cosinus tendeix a $0$. Si queda un $\\cos(1/x)$ o $\\sin(1/x)$ sol (o dividit per $x$), oscil·la i no té límit.',
        },
        {
          type: 'limit', label: "Calcula $f'(0)$ <b>per definició</b>: $\\displaystyle f'(0)=\\lim_{h\\to0}\\frac{f(h)-f(0)}{h}$. (Si no existeix, escriu «no existeix».)", lim: fp0,
          hint: `Simplifica: $\\frac{f(h)-0}{h} = ${M.termsTeX([{ c, body: M.xpow(k - 1, 'h') + Tt + '\\left(\\frac1h\\right)' }, { c: a, body: '' }])}$. Aplica l'argument d'«acotada per una cosa que tendeix a 0».`,
        },
        {
          type: 'mcq', label: 'Conclusió sobre el comportament en $x=0$:',
          options: OPTS.map((t, i) => ({ html: t, ok: i === concl })),
          hint: "Derivable en $0$ ⇔ existeix el límit de la definició. $f'$ contínua en $0$ ⇔ $\\lim_{x\\to0}f'(x)$ existeix i val $f'(0)$.",
        },
      ],
      solution: `<p><b>1. Derivada per a $x\\neq0$</b> (producte + cadena):</p>
        $$f'(x) = ${dTeX}$$
        <p>on hem fet servir $\\left(${Tt}\\tfrac1x\\right)' = ${T === 'sin' ? '\\cos' : '-\\sin'}\\left(\\tfrac1x\\right)\\cdot\\left(-\\tfrac{1}{x^2}\\right)$.</p>
        <p><b>2. Límit de $f'(x)$ quan $x\\to0$</b>, terme a terme:</p>
        <ul>${termAnalysis(k - 1, Tt, cTeX(c * k))}${termAnalysis(k - 2, Ut, cTeX(t2c))}${a ? `<li>$${a}$: constant.</li>` : ''}</ul>
        <p>${limSentence}</p>
        <p><b>3. Derivada en $0$ per definició:</b></p>
        <p>${defSentence}</p>
        ${warn}
        <p><b>4. Conclusió:</b> ${OPTS[concl]}.</p>
        <div class="plotwrap">${plot}<p class="cap">Gràfica de $f$ prop de $0$. Les corbes discontínues són $\\pm${Math.abs(c) === 1 ? '' : Math.abs(c)}|x|^{${k}}${a ? ' + ' + (a === 1 ? '' : a === -1 ? '(-1)' : a) + 'x' : ''}$: la funció hi queda «atrapada» entre elles.</p></div>`,
    };
  }

  /* ---------------------------------------------------------
     3. ESTUDI D'UNA FUNCIÓ POLINÒMICA
     --------------------------------------------------------- */
  const { int, surd, frac } = M;
  const fams = {
    A(s, k) { // s(x^3 - kx)
      return {
        c: [0, -s * k, 0, s], zeros: [int(0), surd(0, 1, k, 1), surd(0, -1, k, 1)],
        crit: [surd(0, 1, 3 * k, 3), surd(0, -1, 3 * k, 3)], infl: [int(0)],
        zhint: `Treu factor comú $x$: $f(x) = ${s < 0 ? '-' : ''}x\\,(x^2 - ${k})$.`,
      };
    },
    B(s, r) { // s(x-r1)(x-r2)(x-r3)
      let c = [s];
      for (const ri_ of r) c = M.polyMul(c, [-ri_, 1]);
      const s1 = r[0] + r[1] + r[2], s2 = r[0] * r[1] + r[0] * r[2] + r[1] * r[2], D = s1 * s1 - 3 * s2;
      return {
        c, zeros: r.map(int), crit: [surd(s1, 1, D, 3), surd(s1, -1, D, 3)], infl: [frac(s1, 3)],
        zhint: r.includes(0)
          ? 'Treu factor comú $x$ i resol l\'equació de segon grau que queda.'
          : 'Busca una arrel entera entre els divisors del terme independent (Ruffini) i després resol el polinomi de segon grau.',
      };
    },
    D(s, k) { // s(x^3 + kx)
      return {
        c: [0, s * k, 0, s], zeros: [int(0)], crit: [], infl: [int(0)],
        zhint: `$f(x) = ${s < 0 ? '-' : ''}x\\,(x^2 + ${k})$ i $x^2+${k}>0$ sempre.`,
      };
    },
    C(s, k) { // s(x^4 - 2k^2 x^2)
      return {
        c: [0, 0, -2 * k * k * s, 0, s], zeros: [int(0), surd(0, k, 2, 1), surd(0, -k, 2, 1)],
        crit: [int(0), int(k), int(-k)], infl: [surd(0, k, 3, 3), surd(0, -k, 3, 3)],
        zhint: `Treu factor comú $x^2$: $f(x) = ${s < 0 ? '-' : ''}x^2(x^2 - ${2 * k * k})$.`,
      };
    },
    E(s, p) { // s(x^4 - 4p x^3)
      return {
        c: [0, 0, 0, -4 * p * s, s], zeros: [int(0), int(4 * p)], crit: [int(0), int(3 * p)], infl: [int(0), int(2 * p)],
        zhint: `Treu factor comú $x^3$: $f(x) = ${s < 0 ? '-' : ''}x^3(x ${p > 0 ? '-' : '+'} ${4 * Math.abs(p)})$.`,
      };
    },
  };
  function distinctRoots() {
    const pool = shuffle([-3, -2, -1, 0, 1, 2, 3]);
    return pool.slice(0, 3);
  }
  const sortV = arr => arr.slice().sort((a, b) => a.v - b.v);
  function signIntervals(points, g) {
    const ends = [{ v: -Infinity, tex: '-\\infty' }, ...points, { v: Infinity, tex: '+\\infty' }];
    const ivs = [];
    for (let i = 0; i < ends.length - 1; i++) {
      const a = ends[i], b = ends[i + 1];
      const t = !isFinite(a.v) && !isFinite(b.v) ? 0.123 : !isFinite(a.v) ? b.v - 1 : !isFinite(b.v) ? a.v + 1 : (a.v + b.v) / 2;
      ivs.push({ a, b, s: Math.sign(g(t)) });
    }
    return ivs;
  }
  function mergeBy(ivs, sign) {
    const out = [];
    for (const iv of ivs) {
      if (iv.s !== sign) continue;
      const last = out[out.length - 1];
      if (last && last.b.v === iv.a.v) last.b = iv.b; else out.push({ a: iv.a, b: iv.b });
    }
    return out;
  }
  function signTable(ivs, dName, fName, up, down) {
    let h = `<div class="tblwrap"><table class="tbl signs"><tr><th>$x$</th>`;
    for (const iv of ivs) h += `<td>$\\left(${iv.a.tex}, ${iv.b.tex}\\right)$</td>`;
    h += `</tr><tr><th>$${dName}$</th>`;
    for (const iv of ivs) h += `<td class="${iv.s > 0 ? 'pos' : 'neg'}">${iv.s > 0 ? '+' : '−'}</td>`;
    h += `</tr><tr><th>$${fName}$</th>`;
    for (const iv of ivs) h += `<td>${iv.s > 0 ? up : down}</td>`;
    return h + '</tr></table></div>';
  }

  function genStudy(diff) {
    let F, fam;
    if (diff === 1) { fam = 'A'; F = fams.A(1, pick([1, 3, 12, 2, 4])); }
    else if (diff === 2) {
      fam = pick(['A', 'B', 'B', 'D']);
      F = fam === 'A' ? fams.A(pick([1, -1]), pick([1, 2, 3, 4, 12])) : fam === 'B' ? fams.B(pick([1, -1]), distinctRoots()) : fams.D(pick([1, -1]), pick([1, 3, 6]));
    } else {
      fam = pick(['B', 'C', 'E', 'A', 'C', 'E']);
      F = fam === 'A' ? fams.A(-1, pick([1, 3, 12])) : fam === 'B' ? fams.B(pick([1, -1]), distinctRoots())
        : fam === 'C' ? fams.C(pick([1, -1]), pick([1, 2])) : fams.E(pick([1, -1]), pick([1, -1]));
    }
    const c = F.c, d1 = M.polyDer(c), d2 = M.polyDer(d1);
    const f = x => M.polyEval(c, x);
    const crit = sortV(F.crit), inflCand = sortV(F.infl), zeros = sortV(F.zeros);
    const iv1 = signIntervals(crit, x => M.polyEval(d1, x));
    const iv2 = signIntervals(inflCand, x => M.polyEval(d2, x));
    const incr = mergeBy(iv1, 1), decr = mergeBy(iv1, -1);
    const convex = mergeBy(iv2, 1), concave = mergeBy(iv2, -1);
    const maxs = [], mins = [], neither = [];
    crit.forEach((p, i) => {
      const L = iv1[i].s, R = iv1[i + 1].s;
      if (L > 0 && R < 0) maxs.push(p); else if (L < 0 && R > 0) mins.push(p); else neither.push(p);
    });
    const infl = inflCand.filter((p, i) => iv2[i].s !== iv2[i + 1].s);
    const deg = c.length - 1, lead = c[deg];
    const limP = { k: 'inf', s: Math.sign(lead) };
    const limM = { k: 'inf', s: Math.sign(lead) * (deg % 2 ? -1 : 1) };
    const absIdx = deg % 2 ? 0 : lead > 0 ? 1 : 2;
    const ABS = ['No té ni màxim ni mínim absoluts', 'Té mínim absolut però no màxim absolut', 'Té màxim absolut però no mínim absolut', 'Té màxim i mínim absoluts'];
    const fTeX = M.polyTeX(c);
    const L = M.listTeX, I = M.intervalsTeX;

    const special = [...zeros, ...crit, ...inflCand].map(p => p.v);
    let lo = Math.min(...special), hi = Math.max(...special);
    if (hi - lo < 2) { lo -= 1; hi += 1; }
    const padX = (hi - lo) * 0.22 + 0.5;
    const ptsPlot = [
      ...zeros.map(p => ({ x: p.v, y: 0, label: 'zero', cls: 'pz' })),
      ...maxs.map(p => ({ x: p.v, y: f(p.v), label: 'màxim local', cls: 'pmax' })),
      ...mins.map(p => ({ x: p.v, y: f(p.v), label: 'mínim local', cls: 'pmin' })),
      ...infl.map(p => ({ x: p.v, y: f(p.v), label: 'inflexió', cls: 'pinf' })),
    ];
    const ys = ptsPlot.map(p => p.y);
    let ylo = Math.min(...ys), yhi = Math.max(...ys);
    const ypad = Math.max(1.5, (yhi - ylo) * 0.6);
    const plot = Plot.svg({ f, xmin: lo - padX, xmax: hi + padX, ymin: ylo - ypad, ymax: yhi + ypad, pts: ptsPlot });
    const sketch = { f, xmin: lo - padX, xmax: hi + padX, ymin: ylo - ypad, ymax: yhi + ypad, pts: ptsPlot };
    const fmtPt = p => `\\left(${p.tex},\\ ${M.numTeX(+f(p.v).toFixed(4)).replace(/^(-?\d+\.\d+)$/, '\\approx $1')}\\right)`;
    const isPoly2 = d1.length === 3;

    const parts = [
      { type: 'list', label: 'Zeros de $f$ (solucions de $f(x)=0$):', list: zeros, answerTeX: L(zeros), hint: F.zhint },
      { type: 'list', label: "Punts crítics (solucions de $f'(x)=0$):", list: crit, answerTeX: L(crit), hint: `$f'(x) = ${M.polyTeX(d1)}$. ${isPoly2 ? 'És de segon grau: fórmula de l\'equació de segon grau.' : 'Treu factor comú.'}` },
      { type: 'list', label: 'Abscisses ($x$) dels <b>màxims locals</b>:', list: maxs, answerTeX: L(maxs), hint: "Un punt crític és màxim local si $f'$ passa de $+$ a $-$ (o $f''<0$ en el punt). Si $f'$ no canvia de signe, no és extrem." },
      { type: 'list', label: 'Abscisses ($x$) dels <b>mínims locals</b>:', list: mins, answerTeX: L(mins), hint: "Mínim local si $f'$ passa de $-$ a $+$ (o $f''>0$ en el punt)." },
      { type: 'intervals', label: 'Intervals de <b>creixement</b> ($f\'>0$):', intervals: incr, answerTeX: I(incr), hint: "Estudia el signe de $f'$ als intervals que delimiten els punts crítics. Dona un valor de prova a cada interval." },
      { type: 'intervals', label: 'Intervals de <b>decreixement</b> ($f\'<0$):', intervals: decr, answerTeX: I(decr), hint: "On $f'(x) < 0$." },
      { type: 'list', label: "Punts d'inflexió (abscisses $x$):", list: infl, answerTeX: L(infl), hint: `$f''(x) = ${M.polyTeX(d2)}$. Inflexió on $f''$ <b>canvia de signe</b>.` },
      { type: 'intervals', label: 'Intervals de <b>convexitat</b> ($f\'\'>0$, forma $\\cup$):', intervals: convex, answerTeX: I(convex), hint: "On $f''(x) > 0$." },
      { type: 'intervals', label: 'Intervals de <b>concavitat</b> ($f\'\'<0$, forma $\\cap$):', intervals: concave, answerTeX: I(concave), hint: "On $f''(x) < 0$." },
      { type: 'limit', label: '$\\displaystyle\\lim_{x\\to+\\infty} f(x)$', lim: limP, hint: `Mana el terme de grau més alt: $${M.polyTeX([...new Array(deg).fill(0), lead])}$.` },
      { type: 'limit', label: '$\\displaystyle\\lim_{x\\to-\\infty} f(x)$', lim: limM, hint: `Mana $${M.polyTeX([...new Array(deg).fill(0), lead])}$; recorda que $(-\\infty)^{${deg}}$ ${deg % 2 ? 'és negatiu' : 'és positiu'}.` },
      { type: 'mcq', label: 'Extrems <b>absoluts</b> de $f$ a $\\mathbb{R}$:', options: ABS.map((t, i) => ({ html: t, ok: i === absIdx })), hint: 'Mira els límits a $\\pm\\infty$: si $f\\to+\\infty$ no pot tenir màxim absolut; si $f\\to-\\infty$ no pot tenir mínim absolut.' },
    ];

    const absExpl = deg % 2
      ? `Com que $\\lim_{x\\to+\\infty}f = ${M.limitTeX(limP)}$ i $\\lim_{x\\to-\\infty}f = ${M.limitTeX(limM)}$, la funció pren valors tan grans i tan petits com vulguem: <b>no té ni màxim ni mínim absoluts</b> (els extrems locals no són globals).`
      : lead > 0
        ? `Els dos límits són $+\\infty$: no té màxim absolut. Com que és contínua i tendeix a $+\\infty$ pels dos costats, té <b>mínim absolut</b>, que s'assoleix al mínim local més baix${mins.length ? ` ($x = ${mins.map(p => p.tex).join(', ')}$, amb $f = ${M.numTeX(+Math.min(...mins.map(p => f(p.v))).toFixed(4))}$)` : ''}.`
        : `Els dos límits són $-\\infty$: no té mínim absolut, però té <b>màxim absolut</b> al màxim local més alt${maxs.length ? ` ($x = ${maxs.map(p => p.tex).join(', ')}$, amb $f = ${M.numTeX(+Math.max(...maxs.map(p => f(p.v))).toFixed(4))}$)` : ''}.`;

    return {
      topic: 'study', diff, sketch,
      statement: `Considera la funció $$f(x) = ${fTeX}.$$ Calcula'n els zeros, els punts crítics (i digues si són màxims o mínims locals), els intervals de creixement i decreixement, els punts d'inflexió i els intervals de concavitat i convexitat. Amb tota aquesta informació, fes un esbós de la gràfica de $f$. Estudia també si $f$ té màxim o mínim absoluts.
        <p class="note"><b>Formats:</b> llista → <code>0, -1, sqrt(3)/3</code> o <code>±sqrt(2)</code> · intervals → <code>(-inf, -1) U (1, inf)</code> · si no n'hi ha → <code>cap</code>. Convenció: <b>convexa</b> = $\\cup$ ($f''>0$), <b>còncava</b> = $\\cap$ ($f''<0$).</p>`,
      parts,
      solution: `<p><b>1. Zeros:</b> ${F.zhint} Zeros: $x = ${L(zeros)}$.</p>
        <p><b>2. Primera derivada:</b> $f'(x) = ${M.polyTeX(d1)}$. Punts crítics: $x = ${L(crit)}$.</p>
        ${signTable(iv1, "f'(x)", 'f(x)', '↗ creix', '↘ decreix')}
        <p>Creixent a $${I(incr)}$; decreixent a $${I(decr)}$.</p>
        <p>Màxims locals: ${maxs.length ? maxs.map(p => `$${fmtPt(p)}$`).join(', ') : 'cap'}. Mínims locals: ${mins.length ? mins.map(p => `$${fmtPt(p)}$`).join(', ') : 'cap'}.
        ${neither.length ? `<br><span class="callout warn">Compte: $x=${neither.map(p => p.tex).join(', ')}$ és punt crític però <b>no és extrem</b> ($f'$ no canvia de signe).</span>` : ''}</p>
        <p><b>3. Segona derivada:</b> $f''(x) = ${M.polyTeX(d2)}$, que s'anul·la a $x = ${L(inflCand)}$.</p>
        ${signTable(iv2, "f''(x)", 'f(x)', '∪ convexa', '∩ còncava')}
        <p>Convexa a $${I(convex)}$; còncava a $${I(concave)}$. Punts d'inflexió: ${infl.length ? infl.map(p => `$${fmtPt(p)}$`).join(', ') : 'cap'}.</p>
        <p><b>4. Límits:</b> $\\lim_{x\\to+\\infty} f(x) = ${M.limitTeX(limP)}$, $\\quad\\lim_{x\\to-\\infty} f(x) = ${M.limitTeX(limM)}$.</p>
        <p><b>5. Extrems absoluts:</b> ${absExpl}</p>
        <div class="plotwrap">${plot}<p class="cap">Esbós: <span class="lg pz"></span> zeros · <span class="lg pmax"></span> màxims · <span class="lg pmin"></span> mínims · <span class="lg pinf"></span> inflexió</p></div>`,
    };
  }

  /* ---------------------------------------------------------
     4. LÍMITS DE QUOCIENTS DE POLINOMIS A L'INFINIT
     --------------------------------------------------------- */
  function rPoly(deg, lead) {
    const c = [];
    for (let i = 0; i < deg; i++) c.push(Math.random() < 0.3 ? 0 : ri(-7, 7));
    c.push(lead);
    if (deg > 0 && c.slice(0, deg).every(v => v === 0)) c[0] = nz(-5, 5);
    return c;
  }
  function shufTeX(c) {
    const terms = [];
    c.forEach((v, i) => { if (v) terms.push({ c: v, body: M.xpow(i) }); });
    let t = shuffle(terms);
    if (t.length > 1 && t[0].body === M.xpow(c.length - 1)) t = [...t.slice(1), t[0]];
    return M.termsTeX(t);
  }
  function factPoly(deg) {
    const p = nz(-3, 3), q = nz(-4, 4);
    if (deg === 1) return { c: [q, p], tex: M.polyTeX([q, p]) };
    const e1 = ri(1, deg - 1), e2 = deg - e1;
    const r = nz(-3, 3), s = nz(-5, 5);
    const p2 = [s, ...new Array(e2 - 1).fill(0), r];
    const c = M.polyMul(M.polyPow([q, p], e1), p2);
    return { c, tex: `\\left(${M.polyTeX([q, p])}\\right)${e1 > 1 ? `^{${e1}}` : ''}\\left(${M.polyTeX(p2)}\\right)` };
  }
  function makeLimit(dir, kase, form) {
    let n, m;
    if (kase === 'lt') { n = ri(1, 4); m = ri(n + 1, 5); }
    else if (kase === 'eq') { n = m = ri(1, 4); }
    else { m = ri(1, 4); n = ri(m + 1, 5); }
    let P, Q, Ptex, Qtex;
    if (form === 'fact' && n >= 2) { const fp = factPoly(n); P = fp.c; Ptex = fp.tex; }
    else { P = rPoly(n, nz(-7, 7)); Ptex = form === 'std' ? M.polyTeX(P) : shufTeX(P); }
    Q = rPoly(m, nz(-7, 7)); Qtex = form === 'std' ? M.polyTeX(Q) : shufTeX(Q);
    const an = P[n], bm = Q[m];
    let lim;
    if (n < m) lim = { k: 'num', v: 0, tex: '0' };
    else if (n === m) lim = { k: 'num', v: an / bm, tex: M.fracTeX(an, bm) };
    else lim = { k: 'inf', s: Math.sign(an * bm) * (dir < 0 && (n - m) % 2 ? -1 : 1) };
    const D = dir > 0 ? '+\\infty' : '-\\infty';
    const limTeX = `\\lim_{x\\to${D}} \\frac{${Ptex}}{${Qtex}}`;
    const ratio = M.fracTeX(an, bm);
    let why;
    if (n < m) why = `Com que $n\\lt m$, $\\frac{${ratio}}{x^{${m - n}}}\\to 0$.`;
    else if (n === m) why = `Com que $n=m$, les potències de $x$ es cancel·len i queda el quocient dels coeficients principals.`;
    else {
      const pw = n - m;
      const xp = dir > 0 ? '+\\infty' : pw % 2 ? '-\\infty' : '+\\infty';
      why = `Com que $n>m$, $x^{${pw}} \\to ${xp}$${dir < 0 ? ` (exponent ${pw % 2 ? 'senar' : 'parell'})` : ''} i es multiplica per $${ratio}$ (${an / bm > 0 ? 'positiu' : 'negatiu'}).`;
    }
    const mid = n === m ? ratio : n < m ? `\\frac{${ratio}}{x^{${m - n}}}` : `${ratio === '1' ? '' : ratio === '-1' ? '-' : ratio}\\,x^{${n - m}}`;
    const sol = `$$${limTeX} = \\lim_{x\\to${D}} \\frac{${M.termsTeX([{ c: an, body: M.xpow(n) }])}}{${M.termsTeX([{ c: bm, body: M.xpow(m) }])}} = \\lim_{x\\to${D}} ${mid} = ${M.limitTeX(lim)}$$
      <p>Grau del numerador $n=${n}$ (coef. principal $a_n=${an}$), grau del denominador $m=${m}$ ($b_m=${bm}$). ${why}</p>`;
    return {
      part: {
        type: 'limit', label: `$$${limTeX}$$`, lim,
        hint: form === 'fact' ? 'Si el numerador està factoritzat, el seu terme principal és el producte dels termes principals de cada factor (amb les potències).'
          : form === 'shuf' ? 'Compte: els termes no estan ordenats! Identifica el terme de <b>grau més alt</b> de dalt i de baix.'
            : 'Divideix numerador i denominador per la potència més gran de $x$, o directament: només compten els termes de grau més alt.',
      },
      sol,
    };
  }
  const TH = [
    { dir: '+', cond: 'n < m', ans: 0 },
    { dir: '+', cond: 'n = m', ans: 1 },
    { dir: '+', cond: 'n > m \\text{ i } \\frac{a_n}{b_m} > 0', ans: 2 },
    { dir: '+', cond: 'n > m \\text{ i } \\frac{a_n}{b_m} < 0', ans: 3 },
    { dir: '-', cond: 'n = m', ans: 1 },
    { dir: '-', cond: 'n > m,\\ n-m \\text{ parell i } \\frac{a_n}{b_m} > 0', ans: 2 },
    { dir: '-', cond: 'n > m,\\ n-m \\text{ senar i } \\frac{a_n}{b_m} > 0', ans: 3 },
    { dir: '-', cond: 'n > m,\\ n-m \\text{ senar i } \\frac{a_n}{b_m} < 0', ans: 2 },
    { dir: '-', cond: 'n < m', ans: 0 },
  ];
  const TH_OPTS = ['0', '\\dfrac{a_n}{b_m}', '+\\infty', '-\\infty', '\\dfrac{a_0}{b_0}'];
  const PROOF_RATLIM = [
    String.raw`Traiem factor comú $x^n$ al numerador i $x^m$ al denominador.`,
    String.raw`Escrivim el quocient com $x^{n-m}\cdot\frac{A(x)}{B(x)}$, amb $A(x)=a_n+\frac{a_{n-1}}{x}+\dots$ i $B(x)=b_m+\frac{b_{m-1}}{x}+\dots$`,
    String.raw`Com que cada $\frac{a_j}{x^k}\to0$, tenim $A(x)\to a_n$ i $B(x)\to b_m\neq0$.`,
    String.raw`Separem casos segons $n-m$: si $n\lt m$, $x^{n-m}\to0$; si $n=m$, $x^{n-m}=1$; si $n>m$, $x^{n-m}\to+\infty$.`,
    String.raw`Conclusió: $0$, $\frac{a_n}{b_m}$ o $\pm\infty$ (segons el signe de $\frac{a_n}{b_m}$), respectivament.`,
  ];

  function genRatlim(diff) {
    const cases = shuffle(['lt', 'eq', 'gt']);
    let plan;
    if (diff === 1) plan = [[1, 'std'], [1, 'std']];
    else if (diff === 2) plan = [[1, 'std'], [-1, 'std'], [1, 'shuf']];
    else plan = [[1, 'shuf'], [-1, 'fact'], [-1, 'shuf']];
    const parts = [], sols = [];
    plan.forEach(([dir, form], i) => {
      const kase = i < 3 ? cases[i % 3] : pick(['lt', 'eq', 'gt']);
      const r = makeLimit(dir, dir < 0 && diff === 3 && i === 2 ? 'gt' : kase, form);
      parts.push(r.part); sols.push(r.sol);
    });
    const th = pick(diff === 3 ? TH : TH.filter(t => t.dir === '+'));
    parts.push({
      type: 'mcq',
      label: `<b>Cas general.</b> Siguin $n,m$ enters positius, $P(x)=a_nx^n+\\dots+a_1x+a_0$ i $Q(x)=b_mx^m+\\dots+b_1x+b_0$ amb $a_n\\neq0$, $b_m\\neq0$. Si $${th.cond}$, quant val $\\displaystyle\\lim_{x\\to${th.dir}\\infty}\\frac{P(x)}{Q(x)}$?`,
      options: TH_OPTS.map((t, i) => ({ tex: t, ok: i === th.ans })),
      hint: `$\\dfrac{P(x)}{Q(x)} \\approx \\dfrac{a_n}{b_m}x^{n-m}$ quan $|x|$ és gran. El límit només depèn de $n$, $m$, $a_n$ i $b_m$.`,
    });
    if (diff >= 2) parts.push({ type: 'order', label: '<b>Demostració del cas general.</b> Ordena els passos tal com els escriuries a l\'examen:', items: PROOF_RATLIM, hint: 'Primer factor comú, després què passa amb cada tros, després casos.' });
    return {
      topic: 'ratlim', diff,
      statement: `Calcula els límits següents. <p class="note"><b>Pista:</b> només cal usar l'Hôpital uns quants cops, o bé treure factor comú convenientment. El límit només depèn dels graus i dels coeficients principals. Respostes: un número (<code>3/2</code>, <code>0</code>…), <code>inf</code> o <code>-inf</code>.</p>`,
      parts,
      solution: sols.map((s, i) => `<p><b>(${String.fromCharCode(97 + i)})</b></p>${s}`).join('') +
        `<p><b>Cas general:</b> traient factor comú $x^n$ a dalt i $x^m$ a baix,
         $$\\frac{P(x)}{Q(x)} = \\frac{x^n\\left(a_n + \\frac{a_{n-1}}{x}+\\dots+\\frac{a_0}{x^n}\\right)}{x^m\\left(b_m + \\frac{b_{m-1}}{x}+\\dots+\\frac{b_0}{x^m}\\right)} \\;\\sim\\; \\frac{a_n}{b_m}\\,x^{n-m},$$
         per tant a $+\\infty$: $0$ si $n\\lt m$; $\\frac{a_n}{b_m}$ si $n=m$; $\\operatorname{sign}\\!\\left(\\frac{a_n}{b_m}\\right)\\infty$ si $n>m$. A $-\\infty$, si $n>m$ el signe canvia quan $n-m$ és senar.</p>`,
    };
  }

  const TOPIC_GEN = { chain: genChain, limder: genLimDer, study: genStudy, ratlim: genRatlim, hopital: d => SK.exHopital(d), extrem: d => SK.exExtrem(d) };
  function generate(topic, diff) { return TOPIC_GEN[topic](diff); }
  return { generate, LAYERS, PROOF_RATLIM };
})();
