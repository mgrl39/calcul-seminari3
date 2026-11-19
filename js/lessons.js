'use strict';
/* ===========================================================
   Camí d'aprenentatge: lliçons des de zero amb comprovacions
   =========================================================== */
const LESSONS = (() => {
  const R = String.raw;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const N = (v, tex) => ({ k: 'num', v, tex: tex ?? String(v) }), INF = { k: 'inf', s: 1 }, NINF = { k: 'inf', s: -1 }, DNE = { k: 'dne' };
  const E = (label, f, ans, hint, pts) => ({ type: 'expr', label, f, answerTeX: ans, hint, pts });
  const V = (label, v, ans, hint) => ({ type: 'value', label, v, answerTeX: ans ?? M.numTeX(v), hint });
  const L = (label, lim, hint) => ({ type: 'limit', label, lim, hint });
  const LS = (label, pairs, hint) => { const list = pairs.map(([v, tex]) => ({ v, tex })); return { type: 'list', label, list, answerTeX: M.listTeX(list), hint }; };
  const IV = (label, ivs, hint) => { const iv = ivs.map(([a, at, b, bt]) => ({ a: { v: a, tex: at }, b: { v: b, tex: bt } })); return { type: 'intervals', label, intervals: iv, answerTeX: M.intervalsTeX(iv), hint }; };
  const Q = (label, opts, ok, hint) => ({ type: 'mcq', label, options: shuffle(opts.map((h, i) => ({ html: h, ok: i === ok }))), hint });
  const O = (label, items, hint) => ({ type: 'order', label, items, hint });
  const I = Infinity, s3 = Math.sqrt(3), s2 = Math.sqrt(2);
  const POS = [0.19, 0.33, 0.52, 0.74, 0.97, 1.21, 1.46, 1.72, 2.03, 2.4];

  const PROOF_LEMMA = [
    R`Sabem que $|\sin(1/x)|\le 1$ per a tot $x\neq0$.`,
    R`Multiplicant per $x^2\ge0$: $\;|x^2\sin(1/x)|\le x^2$.`,
    R`És a dir: $\;-x^2\le x^2\sin(1/x)\le x^2$.`,
    R`Com que $-x^2\to0$ i $x^2\to0$, pel criteri del sandvitx $x^2\sin(1/x)\to0$.`,
  ];
  const PROOF_TVM = [
    R`$f$ és contínua a $[0,h]$ i derivable a $(0,h)$.`,
    R`Pel teorema del valor mitjà existeix $c_h$ entre $0$ i $h$ amb $\frac{f(h)-f(0)}{h}=f'(c_h)$.`,
    R`Quan $h\to0$, també $c_h\to0$ (perquè està entre $0$ i $h$).`,
    R`Com que $\lim_{x\to0}f'(x)=L$, tenim $f'(c_h)\to L$.`,
    R`Per tant $f'(0)=\lim_{h\to0}\frac{f(h)-f(0)}{h}=L$.`,
  ];

  /* ---------- el seminari original, redactat ---------- */
  const f3 = x => x ** 3 - x;
  const plotOrig = Plot.svg({ f: f3, xmin: -1.9, xmax: 1.9, ymin: -1.6, ymax: 1.6, pts: [
    { x: -1, y: 0, cls: 'pz' }, { x: 0, y: 0, cls: 'pinf' }, { x: 1, y: 0, cls: 'pz' },
    { x: -1 / s3, y: f3(-1 / s3), cls: 'pmax' }, { x: 1 / s3, y: f3(1 / s3), cls: 'pmin' }] });
  const ORIGINAL = R`
  <p class="callout">Així és com s'haurien d'escriure les respostes del full del seminari: <b>cada pas justificat</b>, sense saltar-se res important.</p>
  <h3>Exercici 1 · $f(x)=\cos\big(\sin(\sin^2(x^2))\big)$</h3>
  <div class="model">
  <p>Capes de fora cap a dins: $\cos \to \sin \to (\cdot)^2 \to \sin \to x^2$. Apliquem la regla de la cadena capa per capa:</p>
  $$\begin{aligned}
  f'(x) &= -\sin\big(\sin(\sin^2(x^2))\big)\cdot\big[\sin(\sin^2(x^2))\big]'\\
  &= -\sin\big(\sin(\sin^2(x^2))\big)\cdot\cos\big(\sin^2(x^2)\big)\cdot\big[\sin^2(x^2)\big]'\\
  &= -\sin\big(\sin(\sin^2(x^2))\big)\cdot\cos\big(\sin^2(x^2)\big)\cdot 2\sin(x^2)\cdot\big[\sin(x^2)\big]'\\
  &= -\sin\big(\sin(\sin^2(x^2))\big)\cdot\cos\big(\sin^2(x^2)\big)\cdot 2\sin(x^2)\cdot\cos(x^2)\cdot 2x.
  \end{aligned}$$
  </div>
  <h3>Exercici 2 · $f(x)=x^3\sin(1/x)$, $f(0)=0$</h3>
  <div class="model">
  <p><b>Derivada per a $x\neq0$.</b> Aquí $f$ és producte i composició de funcions derivables, per tant:</p>
  $$f'(x)=3x^2\sin\left(\tfrac1x\right)+x^3\cos\left(\tfrac1x\right)\cdot\left(-\tfrac{1}{x^2}\right)=3x^2\sin\left(\tfrac1x\right)-x\cos\left(\tfrac1x\right).$$
  <p><b>Límit.</b> Com que $|\sin(\cdot)|\le1$ i $|\cos(\cdot)|\le1$:</p>
  $$\left|3x^2\sin\left(\tfrac1x\right)\right|\le3x^2\xrightarrow[x\to0]{}0,\qquad\left|x\cos\left(\tfrac1x\right)\right|\le|x|\xrightarrow[x\to0]{}0.$$
  <p>Per tant $\displaystyle\lim_{x\to0}f'(x)=0-0=0$.</p>
  <p><b>Per què això dona $f'(0)$</b> (justificació completa). $f$ és contínua en $0$ perquè $|x^3\sin(1/x)|\le|x|^3\to0=f(0)$. Pel teorema del valor mitjà, per a cada $h\neq0$ existeix $c_h$ entre $0$ i $h$ amb $\frac{f(h)-f(0)}{h}=f'(c_h)$. Quan $h\to0$, $c_h\to0$ i $f'(c_h)\to0$. Així $f'(0)=0$.</p>
  <p><i>Comprovació directa:</i> $\frac{f(h)-f(0)}{h}=h^2\sin(1/h)\to0$, perquè $|h^2\sin(1/h)|\le h^2$.</p>
  </div>
  <h3>Exercici 3 · $f(x)=x^3-x$</h3>
  <div class="model">
  <p><b>Zeros.</b> $x^3-x=x(x^2-1)=x(x-1)(x+1)=0\iff x\in\{-1,0,1\}$.</p>
  <p><b>Punts crítics.</b> $f'(x)=3x^2-1=0\iff x=\pm\frac{1}{\sqrt3}=\pm\frac{\sqrt3}{3}$.</p>
  <div class="tblwrap"><table class="tbl signs"><tr><th>$x$</th><td>$(-\infty,-\frac{\sqrt3}3)$</td><td>$(-\frac{\sqrt3}3,\frac{\sqrt3}3)$</td><td>$(\frac{\sqrt3}3,+\infty)$</td></tr>
  <tr><th>$f'$</th><td class="pos">+</td><td class="neg">−</td><td class="pos">+</td></tr><tr><th>$f$</th><td>↗</td><td>↘</td><td>↗</td></tr></table></div>
  <p>$f$ creix a $(-\infty,-\frac{\sqrt3}3)\cup(\frac{\sqrt3}3,+\infty)$ i decreix a $(-\frac{\sqrt3}3,\frac{\sqrt3}3)$. Hi ha un <b>màxim local</b> a $x=-\frac{\sqrt3}{3}$ (valor $\frac{2\sqrt3}{9}\approx0.385$) i un <b>mínim local</b> a $x=\frac{\sqrt3}{3}$ (valor $-\frac{2\sqrt3}{9}$).</p>
  <p><b>Inflexió.</b> $f''(x)=6x$: $f''\lt 0$ a $(-\infty,0)$ (còncava, $\cap$) i $f''>0$ a $(0,+\infty)$ (convexa, $\cup$). Canvia de signe a $x=0$: punt d'inflexió $(0,0)$.</p>
  <p><b>Extrems absoluts.</b> $\lim_{x\to+\infty}(x^3-x)=\lim x^3\left(1-\frac{1}{x^2}\right)=+\infty$, i de la mateixa manera $\lim_{x\to-\infty}f(x)=-\infty$. Per tant, per a qualsevol $M$ hi ha punts amb $f(x)>M$ (no hi ha màxim absolut) i punts amb $f(x)\lt -M$ (no hi ha mínim absolut).</p>
  ${plotOrig}
  </div>
  <h3>Exercici 4 · Límit general de $\frac{P(x)}{Q(x)}$</h3>
  <div class="model">
  <p>Per a $x\neq0$ traiem factor comú $x^n$ al numerador i $x^m$ al denominador:</p>
  $$\frac{a_nx^n+\dots+a_0}{b_mx^m+\dots+b_0}=\frac{x^n\left(a_n+\frac{a_{n-1}}{x}+\dots+\frac{a_0}{x^n}\right)}{x^m\left(b_m+\frac{b_{m-1}}{x}+\dots+\frac{b_0}{x^m}\right)}=x^{n-m}\cdot\frac{A(x)}{B(x)}.$$
  <p>Cada terme $\frac{a_j}{x^k}$ (amb $k\ge1$) tendeix a $0$, per tant $A(x)\to a_n$ i $B(x)\to b_m\neq0$, i $\frac{A(x)}{B(x)}\to\frac{a_n}{b_m}$. Ara separem casos:</p>
  <ul>
    <li>$n\lt m$: $x^{n-m}=\frac{1}{x^{m-n}}\to0$, i el límit és $0\cdot\frac{a_n}{b_m}=0$.</li>
    <li>$n=m$: $x^{0}=1$, i el límit és $\frac{a_n}{b_m}$.</li>
    <li>$n>m$: $x^{n-m}\to+\infty$, i el límit és $+\infty$ si $\frac{a_n}{b_m}>0$ i $-\infty$ si $\frac{a_n}{b_m}\lt 0$.</li>
  </ul>
  </div>`;

  const L_ = [
    /* ---------------- BLOC 0 ---------------- */
    {
      id: 'der-intro', block: 'Fonaments', title: 'Què és una derivada?',
      body: R`
      <p>La <b>derivada</b> $f'(a)$ mesura <b>com de ràpid canvia</b> $f$ al punt $a$: és el <b>pendent</b> de la recta tangent a la gràfica en aquell punt.</p>
      <p>Es defineix amb un límit: agafem dos punts de la gràfica, $a$ i $a+h$, calculem el pendent de la recta que els uneix i fem que s'ajuntin ($h\to0$):</p>
      <div class="formula">$$f'(a)=\lim_{h\to0}\frac{f(a+h)-f(a)}{h}$$</div>
      <p><b>Exemple:</b> $f(x)=x^2$. Llavors
      $$\frac{f(a+h)-f(a)}{h}=\frac{(a+h)^2-a^2}{h}=\frac{a^2+2ah+h^2-a^2}{h}=\frac{2ah+h^2}{h}=2a+h\xrightarrow[h\to0]{}2a.$$
      Per tant la derivada de $x^2$ és $2x$.</p>
      <p><b>Què ens diu el signe de la derivada?</b></p>
      <ul><li>$f'(a)>0$: la funció <b>creix</b> a prop de $a$.</li><li>$f'(a)\lt 0$: la funció <b>decreix</b>.</li><li>$f'(a)=0$: tangent horitzontal (pot ser un màxim, un mínim… o cap dels dos).</li></ul>`,
      parts: [
        V(R`Si $f(x)=x^2$, quant val $f'(3)$?`, 6, '6', R`Hem vist que $f'(x)=2x$.`),
        V(R`Si $f(x)=x^3$, calcula $f'(1)=\lim_{h\to0}\frac{(1+h)^3-1}{h}$.`, 3, '3', R`$(1+h)^3=1+3h+3h^2+h^3$. Resta 1, divideix per $h$ i fes $h\to0$.`),
        Q(R`Si $f'(2)=-3$, què fa $f$ a prop de $x=2$?`, ['Decreix', 'Creix', 'Té un màxim', 'És constant'], 0, 'Derivada negativa vol dir pendent negatiu.'),
      ],
    },
    {
      id: 'der-rules', block: 'Fonaments', title: 'Derivades bàsiques',
      body: R`
      <p>No cal fer el límit cada vegada: aquestes derivades ja estan calculades i les has de saber de memòria.</p>
      <div class="tblwrap"><table class="tbl">
      <tr><th>$f(x)$</th><th>$f'(x)$</th><th>$f(x)$</th><th>$f'(x)$</th></tr>
      <tr><td>$c$ (constant)</td><td>$0$</td><td>$\sin x$</td><td>$\cos x$</td></tr>
      <tr><td>$x^n$</td><td>$n\,x^{n-1}$</td><td>$\cos x$</td><td>$-\sin x$</td></tr>
      <tr><td>$e^x$</td><td>$e^x$</td><td>$\tan x$</td><td>$\frac{1}{\cos^2x}$</td></tr>
      <tr><td>$\ln x$</td><td>$\frac1x$</td><td>$\sqrt x$</td><td>$\frac{1}{2\sqrt x}$</td></tr>
      </table></div>
      <p><b>Regles:</b> la derivada d'una suma és la suma de derivades, i les constants que multipliquen es queden: $(c\,f)'=c\,f'$.</p>
      <p><b>Exemple:</b> $(3x^4-2x+7)'=3\cdot4x^3-2\cdot1+0=12x^3-2$.</p>
      <p><b>Truc:</b> $x^n$ funciona també amb exponents negatius o fraccionaris: $\left(\frac1x\right)'=(x^{-1})'=-x^{-2}=-\frac1{x^2}$.</p>`,
      parts: [
        E(R`Deriva $f(x)=3x^4-2x+7$.`, x => 12 * x ** 3 - 2, '12x^3-2', R`Terme a terme: $(x^n)'=nx^{n-1}$.`),
        E(R`Deriva $f(x)=5x^2+4\cos x$.`, x => 10 * x - 4 * Math.sin(x), '10x-4\\sin x', R`$(\cos x)'=-\sin x$.`),
        E(R`Deriva $f(x)=\sqrt{x}+\ln x$ (per a $x>0$).`, x => 1 / (2 * Math.sqrt(x)) + 1 / x, '\\frac{1}{2\\sqrt x}+\\frac1x', 'Mira la taula.', POS),
        E(R`Deriva $f(x)=\frac{1}{x}$.`, x => -1 / x ** 2, '-\\frac{1}{x^2}', R`Escriu-ho com $x^{-1}$.`),
      ],
    },
    {
      id: 'der-prod', block: 'Fonaments', title: 'Regla del producte i del quocient',
      body: R`
      <div class="formula">$$(f\cdot g)'=f'\cdot g+f\cdot g'\qquad\qquad\left(\frac fg\right)'=\frac{f'g-fg'}{g^2}$$</div>
      <p class="callout warn"><b>Error típic:</b> $(f\cdot g)'\neq f'\cdot g'$. Per exemple $(x\cdot x)'=(x^2)'=2x$, però $1\cdot1=1$.</p>
      <p><b>Exemple:</b> $(x^2\sin x)'=\underbrace{2x}_{f'}\cdot\underbrace{\sin x}_{g}+\underbrace{x^2}_{f}\cdot\underbrace{\cos x}_{g'}$.</p>
      <p>Aquesta regla és la que necessitaràs a l'exercici 2 del seminari: $x^3\sin(1/x)$ és un producte.</p>`,
      parts: [
        E(R`Deriva $x^2\sin x$.`, x => 2 * x * Math.sin(x) + x * x * Math.cos(x), '2x\\sin x+x^2\\cos x', R`$f=x^2$, $g=\sin x$.`),
        E(R`Deriva $x\,e^x$.`, x => Math.exp(x) * (1 + x), 'e^x+xe^x', R`$f=x$, $g=e^x$.`),
        E(R`Deriva $x^3\cos x$.`, x => 3 * x * x * Math.cos(x) - x ** 3 * Math.sin(x), '3x^2\\cos x-x^3\\sin x', R`Compte amb el signe: $(\cos x)'=-\sin x$.`),
        E(R`Deriva $\dfrac{\sin x}{x}$.`, x => (x * Math.cos(x) - Math.sin(x)) / x ** 2, '\\frac{x\\cos x-\\sin x}{x^2}', R`$\frac{f'g-fg'}{g^2}$ amb $f=\sin x$, $g=x$.`),
      ],
    },
    /* ---------------- BLOC 1 ---------------- */
    {
      id: 'chain-comp', block: 'Regla de la cadena', title: 'Funcions dins de funcions',
      body: R`
      <p>Una <b>composició</b> $f(g(x))$ vol dir: primer calcules $g(x)$ i al resultat li apliques $f$. Per exemple, a $\sin(x^2)$:</p>
      <ul><li>$x^2$ és la funció <b>interior</b> (es calcula primer),</li><li>$\sin$ és la funció <b>exterior</b> (es calcula l'última).</li></ul>
      <p><b>Truc de la calculadora:</b> imagina que calcules $f(1)$ tecla a tecla. L'<b>última</b> tecla que prems és la capa <b>exterior</b>.</p>
      <p><b>Exemple de l'examen:</b> $\cos\big(\sin(\sin^2(x^2))\big)$ amb $x=1$:</p>
      <ol><li>$x^2=1$</li><li>$\sin(1)\approx0.841$</li><li>al quadrat: $0.708$</li><li>$\sin(0.708)\approx0.650$</li><li>$\cos(0.650)\approx0.796$</li></ol>
      <p>Ordre de dins cap a fora: $x^2\to\sin\to(\cdot)^2\to\sin\to\cos$. Per derivar ho llegirem <b>al revés</b>: $\cos\to\sin\to(\cdot)^2\to\sin\to x^2$.</p>
      <p class="callout warn"><b>Notació important:</b> $\sin^2(x)$ vol dir $\big(\sin x\big)^2$. Primer el sinus, després el quadrat. En canvi $\sin(x^2)$ és primer el quadrat i després el sinus.</p>`,
      parts: [
        Q(R`Quina és la capa <b>exterior</b> de $(x^2+1)^5$?`, [R`La potència $(\cdot)^5$`, R`$x^2+1$`, R`$x^2$`], 0, 'Què calcularies l\'últim?'),
        Q(R`Quina és la capa <b>exterior</b> de $\sin^2(x)$?`, [R`El quadrat $(\cdot)^2$`, R`El sinus`], 0, R`$\sin^2 x=(\sin x)^2$.`),
        V(R`Si $f(u)=u^3$ i $g(x)=x+1$, quant val $f(g(1))$?`, 8, '8', R`Primer $g(1)$, després $f$ del resultat.`),
        Q(R`Ordre de les capes de $e^{\cos(3x)}$, de fora cap a dins:`, [R`$e^{\square}\to\cos\to3x$`, R`$\cos\to e^{\square}\to3x$`, R`$3x\to\cos\to e^{\square}$`], 0, 'L\'exponencial és el que es calcula l\'últim.'),
      ],
    },
    {
      id: 'chain-one', block: 'Regla de la cadena', title: 'La regla de la cadena (una capa)',
      body: R`
      <div class="formula">$$\big(f(g(x))\big)'=f'\big(g(x)\big)\cdot g'(x)$$</div>
      <p>En paraules: <b>deriva la de fora deixant-li l'interior intacte, i multiplica per la derivada de l'interior.</b></p>
      <div class="tblwrap"><table class="tbl">
      <tr><th>Funció</th><th>Exterior derivada (interior intacte)</th><th>× derivada interior</th><th>Resultat</th></tr>
      <tr><td>$\sin(x^2)$</td><td>$\cos(x^2)$</td><td>$2x$</td><td>$\cos(x^2)\cdot2x$</td></tr>
      <tr><td>$(3x+1)^5$</td><td>$5(3x+1)^4$</td><td>$3$</td><td>$15(3x+1)^4$</td></tr>
      <tr><td>$e^{x^2}$</td><td>$e^{x^2}$</td><td>$2x$</td><td>$2x\,e^{x^2}$</td></tr>
      <tr><td>$\ln(x^2+1)$</td><td>$\frac{1}{x^2+1}$</td><td>$2x$</td><td>$\frac{2x}{x^2+1}$</td></tr>
      </table></div>
      <p class="callout warn"><b>Errors típics:</b> escriure $\cos(2x)$ en comptes de $\cos(x^2)\cdot 2x$ (has canviat l'interior!), o oblidar el factor final.</p>`,
      parts: [
        E(R`Deriva $\sin(x^2)$.`, x => Math.cos(x * x) * 2 * x, '\\cos(x^2)\\cdot2x', R`Exterior $\sin$, interior $x^2$.`),
        E(R`Deriva $(3x+1)^5$.`, x => 15 * (3 * x + 1) ** 4, '5(3x+1)^4\\cdot3', R`Exterior $u^5$, interior $3x+1$.`),
        E(R`Deriva $e^{x^2}$.`, x => 2 * x * Math.exp(x * x), 'e^{x^2}\\cdot2x', R`$(e^u)'=e^u\cdot u'$.`),
        E(R`Deriva $\ln(x^2+1)$.`, x => 2 * x / (x * x + 1), '\\frac{2x}{x^2+1}', R`$(\ln u)'=\frac{u'}{u}$.`),
        E(R`Deriva $\cos(5x)$.`, x => -5 * Math.sin(5 * x), '-5\\sin(5x)', R`$(\cos u)'=-\sin u\cdot u'$.`),
      ],
    },
    {
      id: 'chain-multi', block: 'Regla de la cadena', title: 'Diverses capes',
      body: R`
      <p>Amb més capes simplement repetim: <b>cada capa aporta un factor</b>. Si $f=A(B(C(x)))$:</p>
      <div class="formula">$$f'(x)=A'\big(B(C(x))\big)\cdot B'\big(C(x)\big)\cdot C'(x)$$</div>
      <p><b>Exemple 1:</b> $(\sin^2x)'=\big((\sin x)^2\big)'=2\sin x\cdot\cos x$.</p>
      <p><b>Exemple 2:</b> $\big(\cos(\sin x)\big)'=-\sin(\sin x)\cdot\cos x$.</p>
      <p><b>Exemple 3:</b> $\big(e^{\sin(x^2)}\big)'=e^{\sin(x^2)}\cdot\cos(x^2)\cdot2x$ (tres capes, tres factors).</p>
      <p><b>Mètode segur:</b> escriu primer la llista de capes de fora cap a dins i després escriu un factor per cada una, d'esquerra a dreta.</p>`,
      parts: [
        E(R`Deriva $\sin^2(x)$.`, x => 2 * Math.sin(x) * Math.cos(x), '2\\sin x\\cos x', R`Capes: $(\cdot)^2\to\sin\to x$.`),
        E(R`Deriva $\cos(\sin x)$.`, x => -Math.sin(Math.sin(x)) * Math.cos(x), '-\\sin(\\sin x)\\cos x', R`Capes: $\cos\to\sin\to x$.`),
        E(R`Deriva $e^{\sin(x^2)}$.`, x => Math.exp(Math.sin(x * x)) * Math.cos(x * x) * 2 * x, 'e^{\\sin(x^2)}\\cos(x^2)\\,2x', R`Tres capes: $e^{\square}\to\sin\to x^2$.`),
        V(R`Quants factors té la derivada de $\cos\big(\sin(\sin^2(x^2))\big)$?`, 5, '5', 'Un per capa: cos, sin, quadrat, sin, x².'),
        E(R`<b>L'exercici de l'examen:</b> deriva $\cos\big(\sin(\sin^2(x^2))\big)$.`, x => -Math.sin(Math.sin(Math.sin(x * x) ** 2)) * Math.cos(Math.sin(x * x) ** 2) * 2 * Math.sin(x * x) * Math.cos(x * x) * 2 * x,
          '-\\sin(\\sin(\\sin^2(x^2)))\\cdot\\cos(\\sin^2(x^2))\\cdot2\\sin(x^2)\\cdot\\cos(x^2)\\cdot2x', 'Cinc factors, de fora cap a dins.'),
      ],
    },
    /* ---------------- BLOC 2 ---------------- */
    {
      id: 'lim-basic', block: 'Límits', title: 'Límits: la idea',
      body: R`
      <p>$\lim_{x\to a}f(x)=L$ vol dir: quan $x$ s'acosta a $a$, els valors $f(x)$ s'acosten a $L$.</p>
      <p><b>Límits a l'infinit</b> (quan $x$ es fa enorme):</p>
      <ul>
        <li>$\frac{1}{x}\to0$, $\frac{5}{x^3}\to0$: dividir per una cosa enorme dona gairebé zero.</li>
        <li>$x^2\to+\infty$, $x^3\to+\infty$ quan $x\to+\infty$.</li>
        <li>Quan $x\to-\infty$: $x^2\to+\infty$ (exponent parell), però $x^3\to-\infty$ (exponent senar).</li>
      </ul>
      <p><b>Un límit pot no existir</b>, per exemple si la funció <b>oscil·la</b> sense parar. Quan $x\to0$, $\frac1x$ es fa enorme i $\sin\left(\frac1x\right)$ va donant voltes entre $-1$ i $1$ cada cop més ràpid: $\lim_{x\to0}\sin(1/x)$ <b>no existeix</b>.</p>`,
      parts: [
        L(R`$\displaystyle\lim_{x\to+\infty}\frac{1}{x^2}$`, N(0), 'Dividir per una cosa enorme.'),
        L(R`$\displaystyle\lim_{x\to-\infty}x^3$`, NINF, R`Un número negatiu gran elevat a una potència senar.`),
        L(R`$\displaystyle\lim_{x\to+\infty}\left(3+\frac{2}{x}\right)$`, N(3), R`$\frac2x\to0$.`),
        L(R`$\displaystyle\lim_{x\to-\infty}(-2x^4)$`, NINF, R`$x^4\to+\infty$ i després el $-2$.`),
        L(R`$\displaystyle\lim_{x\to0}\sin\left(\frac1x\right)$`, DNE, 'Oscil·la.'),
      ],
    },
    {
      id: 'lim-bounded', block: 'Límits', title: '«Zero per acotada és zero»',
      body: R`
      <p>Aquest és <b>el</b> resultat clau de l'exercici 2 del seminari.</p>
      <p>Una funció és <b>acotada</b> si no se n'escapa d'un interval. Sempre $|\sin(\text{lo que sigui})|\le1$ i $|\cos(\text{lo que sigui})|\le1$.</p>
      <div class="formula"><b>Lema.</b> Si $g(x)\to0$ i $|b(x)|\le K$, aleshores $g(x)\cdot b(x)\to0$.</div>
      <p><b>Per què:</b> $|g(x)\,b(x)|\le K\,|g(x)|\to0$, i una cosa atrapada entre $-K|g|$ i $K|g|$ ha d'anar a $0$ (criteri del <b>sandvitx</b>).</p>
      <p><b>Com s'escriu a l'examen:</b> «Com que $|\sin(1/x)|\le1$, tenim $|x^2\sin(1/x)|\le x^2\to0$, i per tant $x^2\sin(1/x)\to0$.»</p>
      <div class="tblwrap"><table class="tbl">
      <tr><th>Expressió quan $x\to0$</th><th>Límit</th><th>Per què</th></tr>
      <tr><td>$x^k\sin(1/x)$, $k>0$</td><td>$0$</td><td>tendeix a 0 × acotada</td></tr>
      <tr><td>$\sin(1/x)$, $\cos(1/x)$</td><td>no existeix</td><td>oscil·la</td></tr>
      <tr><td>$\frac1x\cos(1/x)$</td><td>no existeix</td><td>oscil·la i explota</td></tr>
      </table></div>
      <p class="callout warn">Si sumes una cosa que té límit i una que no en té, el resultat <b>no té límit</b>. Ex: $2x\sin(1/x)-\cos(1/x)$ no té límit quan $x\to0$.</p>`,
      parts: [
        L(R`$\displaystyle\lim_{x\to0}x\sin\left(\frac1x\right)$`, N(0), R`$|x\sin(1/x)|\le|x|$.`),
        L(R`$\displaystyle\lim_{x\to0}x^3\cos\left(\frac1x\right)$`, N(0), 'Tendeix a 0 × acotada.'),
        L(R`$\displaystyle\lim_{x\to0}\cos\left(\frac1x\right)$`, DNE, 'Oscil·la.'),
        L(R`$\displaystyle\lim_{x\to0}\frac{1}{x}\sin\left(\frac1x\right)$`, DNE, R`$\frac1x$ no tendeix a 0.`),
        L(R`$\displaystyle\lim_{x\to0}\left(2x\sin\tfrac1x-\cos\tfrac1x\right)$`, DNE, 'El primer terme va a 0, el segon no té límit.'),
        O(R`Ordena els passos per demostrar que $x^2\sin(1/x)\to0$ quan $x\to0$:`, PROOF_LEMMA, 'Comença per la cota del sinus.'),
      ],
    },
    {
      id: 'lim-der', block: 'Límits', title: 'Derivada en un punt amb un límit',
      body: R`
      <p>Considera $f(x)=x^2\sin(1/x)$ per a $x\neq0$ i $f(0)=0$. Les regles de derivació serveixen per a $x\neq0$, però <b>no a $x=0$</b> (la fórmula hi té $1/0$). A $x=0$ cal fer servir la <b>definició</b>:</p>
      $$f'(0)=\lim_{h\to0}\frac{f(h)-f(0)}{h}=\lim_{h\to0}\frac{h^2\sin(1/h)}{h}=\lim_{h\to0}h\sin(1/h)=0.$$
      <p>Per a $x\neq0$: $f'(x)=2x\sin(1/x)+x^2\cos(1/x)\cdot\left(-\frac{1}{x^2}\right)=2x\sin(1/x)-\cos(1/x)$, i aquest <b>no té límit</b> quan $x\to0$. Per tant $f$ és derivable a $0$, però $f'$ no és contínua a $0$.</p>
      <h3>El teorema que fa servir l'enunciat</h3>
      <div class="formula"><b>Teorema.</b> Si $f$ és contínua en $0$, derivable per a $x\neq0$, i existeix $L=\lim_{x\to0}f'(x)$, aleshores $f$ és derivable en $0$ i $f'(0)=L$.</div>
      <p><b>Demostració</b> (amb el teorema del valor mitjà, TVM): $\frac{f(h)-f(0)}{h}=f'(c_h)$ per a algun $c_h$ entre $0$ i $h$. Quan $h\to0$, $c_h\to0$ i $f'(c_h)\to L$.</p>
      <p class="callout warn">Si $\lim f'(x)$ <b>no</b> existeix, el teorema no diu res: $f$ pot ser derivable igualment (com $x^2\sin(1/x)$).</p>`,
      parts: [
        E(R`Sigui $f(x)=x^3\sin(1/x)$. Calcula $f'(x)$ per a $x\neq0$.`, x => 3 * x * x * Math.sin(1 / x) - x * Math.cos(1 / x), '3x^2\\sin(1/x)-x\\cos(1/x)', R`Producte: $(x^3)'\sin(1/x)+x^3\cdot\cos(1/x)\cdot(-1/x^2)$.`),
        L(R`Per a la mateixa $f$, calcula $\displaystyle\lim_{x\to0}f'(x)$.`, N(0), 'Els dos termes són «tendeix a 0 × acotada».'),
        L(R`Calcula $f'(0)$ per definició: $\displaystyle\lim_{h\to0}\frac{h^3\sin(1/h)}{h}$.`, N(0), R`Simplifica: $h^2\sin(1/h)$.`),
        Q(R`Si $\lim_{x\to0}f'(x)$ <b>no</b> existeix, què podem concloure de la derivabilitat de $f$ en $0$?`, ['Res: cal calcular-la per definició', 'Que no és derivable', 'Que és derivable amb derivada 0'], 0, R`Recorda $x^2\sin(1/x)$.`),
        O('Ordena la demostració del teorema:', PROOF_TVM, 'Comença per les hipòtesis.'),
      ],
    },
    /* ---------------- BLOC 3 ---------------- */
    {
      id: 'roots', block: 'Estudi de funcions', title: 'Resoldre equacions polinòmiques',
      body: R`
      <p>Per trobar zeros i punts crítics hauràs de resoldre $p(x)=0$. Tres eines, per aquest ordre:</p>
      <ol class="steps">
        <li><b>Treure factor comú.</b> $x^3-4x=x(x^2-4)=x(x-2)(x+2)$ ⇒ $x=0,\pm2$.</li>
        <li><b>Segon grau.</b> $ax^2+bx+c=0\Rightarrow x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}$. Si $b^2-4ac\lt 0$ no hi ha solucions.</li>
        <li><b>Ruffini.</b> Les arrels enteres divideixen el terme independent. Ex: $x^3-6x^2+11x-6$: provem $x=1$: $1-6+11-6=0$ ✓. Dividint, $x^2-5x+6=(x-2)(x-3)$ ⇒ $x=1,2,3$.</li>
      </ol>
      <p><b>Simplificar arrels:</b> $\frac{1}{\sqrt3}=\frac{\sqrt3}{3}$, $\sqrt{12}=2\sqrt3$, $\sqrt{8}=2\sqrt2$. A la web pots escriure-ho de qualsevol manera (<code>1/sqrt(3)</code>).</p>`,
      parts: [
        LS(R`Zeros de $x^3-4x$:`, [[0, '0'], [2, '2'], [-2, '-2']], 'Factor comú x.'),
        LS(R`Solucions de $x^2-5x+6=0$:`, [[2, '2'], [3, '3']], 'Fórmula de segon grau o busca dos números que sumin 5 i multipliquin 6.'),
        LS(R`Solucions de $3x^2-1=0$:`, [[1 / s3, '\\frac{\\sqrt3}{3}'], [-1 / s3, '-\\frac{\\sqrt3}{3}']], R`$x^2=\frac13$.`),
        LS(R`Zeros de $x^3-6x^2+11x-6$:`, [[1, '1'], [2, '2'], [3, '3']], 'Ruffini amb x = 1.'),
        LS(R`Zeros de $x^2+1$:`, [], R`$x^2\ge0$ sempre. Escriu <code>cap</code>.`),
        LS(R`Zeros de $x^4-2x^2$:`, [[0, '0'], [s2, '\\sqrt2'], [-s2, '-\\sqrt2']], R`Factor comú $x^2$.`),
      ],
    },
    {
      id: 'mono', block: 'Estudi de funcions', title: 'Creixement i extrems: la taula de signes',
      body: R`
      <p>$f'>0$ ⇒ $f$ creix. $f'\lt 0$ ⇒ $f$ decreix. Per saber on passa cada cosa:</p>
      <ol class="steps"><li>Resol $f'(x)=0$ (punts crítics).</li><li>Aquests punts divideixen la recta en intervals.</li><li>A cada interval tria un <b>valor de prova</b> i mira el signe de $f'$.</li></ol>
      <p><b>Exemple:</b> $f(x)=x^3-3x$, $f'(x)=3x^2-3=3(x-1)(x+1)$, crítics $x=\pm1$.</p>
      <div class="tblwrap"><table class="tbl signs"><tr><th>$x$</th><td>$(-\infty,-1)$</td><td>$(-1,1)$</td><td>$(1,+\infty)$</td></tr>
      <tr><th>prova</th><td>$f'(-2)=9$</td><td>$f'(0)=-3$</td><td>$f'(2)=9$</td></tr>
      <tr><th>$f'$</th><td class="pos">+</td><td class="neg">−</td><td class="pos">+</td></tr><tr><th>$f$</th><td>↗</td><td>↘</td><td>↗</td></tr></table></div>
      <p>↗ després ↘ ⇒ <b>màxim local</b> ($x=-1$). ↘ després ↗ ⇒ <b>mínim local</b> ($x=1$).</p>
      <p class="callout warn"><b>Compte:</b> $f'(c)=0$ no vol dir sempre extrem. $f(x)=x^3$: $f'(0)=0$ però $f$ creix a banda i banda ⇒ <b>no</b> és extrem.</p>
      <p><b>Alternativa ràpida</b> (criteri de la 2a derivada): si $f'(c)=0$ i $f''(c)\lt 0$ ⇒ màxim; $f''(c)>0$ ⇒ mínim.</p>`,
      parts: [
        LS(R`Punts crítics de $f(x)=x^3-12x$:`, [[2, '2'], [-2, '-2']], R`$f'(x)=3x^2-12$.`),
        IV(R`Intervals de creixement de $x^3-12x$:`, [[-I, '-\\infty', -2, '-2'], [2, '2', I, '+\\infty']], R`Prova $f'(-3)$, $f'(0)$, $f'(3)$.`),
        IV(R`Intervals de decreixement de $x^3-12x$:`, [[-2, '-2', 2, '2']], R`On $f'\lt 0$.`),
        LS(R`Màxims locals de $x^3-12x$ (abscisses):`, [[-2, '-2']], '↗ i després ↘.'),
        LS(R`Mínims locals de $x^3-12x$ (abscisses):`, [[2, '2']], '↘ i després ↗.'),
        Q(R`$f(x)=x^3$ té un punt crític a $x=0$. Què és?`, ['No és ni màxim ni mínim', 'Un mínim', 'Un màxim'], 0, R`Mira el signe de $3x^2$ a banda i banda.`),
      ],
    },
    {
      id: 'curv', block: 'Estudi de funcions', title: 'Concavitat, convexitat i inflexió',
      body: R`
      <p>La <b>segona derivada</b> diu cap on es corba la gràfica:</p>
      <ul><li>$f''>0$ ⇒ <b>convexa</b>, forma $\cup$ (com un got que reté aigua).</li><li>$f''\lt 0$ ⇒ <b>còncava</b>, forma $\cap$.</li></ul>
      <p>Un <b>punt d'inflexió</b> és on $f''$ <b>canvia de signe</b> (la curvatura canvia).</p>
      <p><b>Exemple:</b> $f(x)=x^3-3x$: $f''(x)=6x$. Còncava a $(-\infty,0)$, convexa a $(0,+\infty)$, inflexió a $x=0$.</p>
      <p class="callout warn">$f''(c)=0$ no garanteix inflexió: $f(x)=x^4$ té $f''(0)=0$ però $f''=12x^2\ge0$ a banda i banda ⇒ no hi ha inflexió.</p>
      <p class="callout">Convenció de la web: <b>convexa = $\cup$</b>. A l'examen, per evitar confusions, escriu també el signe de $f''$ o dibuixa $\cup$ / $\cap$.</p>`,
      parts: [
        LS(R`Punts d'inflexió de $f(x)=x^3-3x^2$:`, [[1, '1']], R`$f''(x)=6x-6$.`),
        IV(R`On és convexa ($\cup$) $f(x)=x^3-3x^2$?`, [[1, '1', I, '+\\infty']], R`On $6x-6>0$.`),
        IV(R`On és còncava ($\cap$) $f(x)=x^3-3x^2$?`, [[-I, '-\\infty', 1, '1']], R`On $6x-6\lt 0$.`),
        LS(R`Punts d'inflexió de $f(x)=x^4-6x^2$:`, [[1, '1'], [-1, '-1']], R`$f''(x)=12x^2-12$.`),
        Q(R`$f(x)=x^4$ té $f''(0)=0$. Té un punt d'inflexió a $x=0$?`, ['No, perquè $f\'\'$ no canvia de signe', 'Sí, perquè $f\'\'(0)=0$'], 0, 'Inflexió = canvi de signe de f\'\'.'),
      ],
    },
    {
      id: 'abs', block: 'Estudi de funcions', title: 'Límits a l\'infinit i extrems absoluts',
      body: R`
      <p>En un polinomi, quan $x\to\pm\infty$ <b>només compta el terme de grau més alt</b>: $x^3-x=x^3\left(1-\frac1{x^2}\right)$ i el parèntesi tendeix a $1$.</p>
      <p><b>Extrem absolut</b> = el valor més gran (o més petit) de tota la funció, no només a prop d'un punt.</p>
      <ul>
        <li>Si $\lim f=+\infty$ (en algun costat) ⇒ <b>no hi ha màxim absolut</b>: sempre hi ha valors més grans.</li>
        <li>Si $\lim f=-\infty$ ⇒ <b>no hi ha mínim absolut</b>.</li>
        <li>Grau senar: un costat va a $+\infty$ i l'altre a $-\infty$ ⇒ cap extrem absolut.</li>
        <li>Grau parell i coeficient principal $>0$ ⇒ té mínim absolut (el mínim local més baix) i no màxim.</li>
      </ul>
      <p><b>Com s'escriu:</b> «Com que $\lim_{x\to+\infty}f(x)=+\infty$, per a tot $M$ existeix $x$ amb $f(x)>M$; per tant $f$ no té màxim absolut.»</p>`,
      parts: [
        L(R`$\displaystyle\lim_{x\to+\infty}(x^3-x)$`, INF, 'Mana x³.'),
        L(R`$\displaystyle\lim_{x\to-\infty}(x^3-x)$`, NINF, 'Mana x³, exponent senar.'),
        L(R`$\displaystyle\lim_{x\to-\infty}(-2x^4+x)$`, NINF, R`Mana $-2x^4$.`),
        Q(R`Extrems absoluts de $x^3-x$:`, ['Ni màxim ni mínim absoluts', 'Només mínim', 'Només màxim', 'Tots dos'], 0, 'Grau senar.'),
        Q(R`Extrems absoluts de $x^4-2x^2$:`, ['Només mínim absolut', 'Ni màxim ni mínim absoluts', 'Només màxim', 'Tots dos'], 0, 'Grau parell, coeficient positiu.'),
      ],
    },
    /* ---------------- BLOC 4 ---------------- */
    {
      id: 'ratlim-dom', block: 'Límits de quocients', title: 'El terme dominant',
      body: R`
      <p>Per calcular $\lim_{x\to\pm\infty}\frac{P(x)}{Q(x)}$ traiem factor comú la potència més gran de dalt i de baix:</p>
      $$\lim_{x\to+\infty}\frac{2x^2+3x}{5x^2-1}=\lim\frac{x^2\left(2+\frac3x\right)}{x^2\left(5-\frac{1}{x^2}\right)}=\frac{2+0}{5-0}=\frac25.$$
      <p>Només sobreviuen els <b>termes de grau més alt</b>: $\frac{P(x)}{Q(x)}\approx\frac{a_nx^n}{b_mx^m}=\frac{a_n}{b_m}x^{n-m}$.</p>
      <div class="tblwrap"><table class="tbl"><tr><th></th><th>$x\to+\infty$</th></tr>
      <tr><td>grau dalt $\lt$ grau baix</td><td>$0$</td></tr><tr><td>graus iguals</td><td>$\frac{a_n}{b_m}$ (quocient de coeficients principals)</td></tr><tr><td>grau dalt $>$ grau baix</td><td>$\pm\infty$ segons el signe de $\frac{a_n}{b_m}$</td></tr></table></div>
      <p>Si $x\to-\infty$ i $n>m$, compte amb $x^{n-m}$: si $n-m$ és senar, és negatiu.</p>`,
      parts: [
        L(R`$\displaystyle\lim_{x\to+\infty}\frac{2x^2+3x}{5x^2-1}$`, N(0.4, '\\frac25'), 'Graus iguals.'),
        L(R`$\displaystyle\lim_{x\to+\infty}\frac{x+7}{x^3-2}$`, N(0), 'Grau de dalt més petit.'),
        L(R`$\displaystyle\lim_{x\to+\infty}\frac{-3x^4+x}{x^2+1}$`, NINF, R`$\approx-3x^2$.`),
        L(R`$\displaystyle\lim_{x\to-\infty}\frac{2x^3}{x^2+5}$`, NINF, R`$\approx2x$, i $x\to-\infty$.`),
        L(R`$\displaystyle\lim_{x\to+\infty}\frac{4-x+6x^3}{2x^3+x^2}$`, N(3, '3'), R`Desordenat! Dalt mana $6x^3$.`),
      ],
    },
    {
      id: 'ratlim-proof', block: 'Límits de quocients', title: 'El cas general (demostració)',
      body: R`
      <p>L'exercici 4 del seminari demana el límit <b>en general</b>, amb lletres. S'ha de redactar així:</p>
      <div class="model">
      $$\frac{a_nx^n+\dots+a_0}{b_mx^m+\dots+b_0}=\frac{x^n\left(a_n+\frac{a_{n-1}}{x}+\dots+\frac{a_0}{x^n}\right)}{x^m\left(b_m+\frac{b_{m-1}}{x}+\dots+\frac{b_0}{x^m}\right)}=x^{n-m}\cdot\frac{A(x)}{B(x)}$$
      <p>Com que $\frac{a_j}{x^k}\to0$, tenim $A(x)\to a_n$ i $B(x)\to b_m\neq0$. Per tant:</p>
      <ul><li>$n\lt m$: $x^{n-m}\to0$ ⇒ límit $0$.</li><li>$n=m$: $x^{0}=1$ ⇒ límit $\frac{a_n}{b_m}$.</li><li>$n>m$: $x^{n-m}\to+\infty$ ⇒ límit $+\infty$ si $\frac{a_n}{b_m}>0$, $-\infty$ si $\frac{a_n}{b_m}\lt 0$.</li></ul>
      </div>
      <p><b>Amb l'Hôpital</b> (l'altra via que suggereix la pista): derivar dalt i baix $\min(n,m)$ vegades fins que un dels dos sigui constant. Per exemple, si $n=m$, després de $n$ derivades queda $\frac{n!\,a_n}{n!\,b_n}=\frac{a_n}{b_n}$.</p>`,
      parts: [
        O('Ordena els passos de la demostració general:', null, 'Primer es treu factor comú.'),
        Q(R`Si $n=m$, el límit quan $x\to+\infty$ és:`, [R`$\frac{a_n}{b_m}$`, '$0$', R`$+\infty$`, R`$\frac{a_0}{b_0}$`], 0, 'Les potències es cancel·len.'),
        Q(R`Si $n>m$ i $\frac{a_n}{b_m}\lt 0$, el límit quan $x\to+\infty$ és:`, [R`$-\infty$`, R`$+\infty$`, '$0$', R`$\frac{a_n}{b_m}$`], 0, R`$x^{n-m}\to+\infty$ multiplicat per un negatiu.`),
        Q(R`Per què $A(x)=a_n+\frac{a_{n-1}}{x}+\dots+\frac{a_0}{x^n}\to a_n$?`, [R`Perquè cada $\frac{a_j}{x^k}\to0$ quan $x\to+\infty$`, R`Perquè $a_n$ és el més gran`, 'Per l\'Hôpital'], 0, 'Constant dividit per una cosa enorme.'),
      ],
    },
    /* ---------------- BLOC 4b: aplicacions de la derivada ---------------- */
    {
      id: 'hop', block: 'Aplicacions de la derivada', title: "La regla de l'Hôpital",
      body: R`
      <p>Quan en un límit de quocient substitueixes i surt $\frac00$ o $\frac{\infty}{\infty}$, no saps quant val: depèn de <b>qui va més ràpid</b>. La regla de l'Hôpital ho resol comparant les velocitats, és a dir, les derivades:</p>
      <div class="formula">$$\lim_{x\to a}\frac{f(x)}{g(x)}=\lim_{x\to a}\frac{f'(x)}{g'(x)}\qquad\text{si és }\tfrac00\text{ o }\tfrac\infty\infty.$$</div>
      <p><b>Exemple:</b> $\displaystyle\lim_{x\to0}\frac{\sin 3x}{2x}$. Substituint: $\frac{0}{0}$. Derivant dalt i baix: $\displaystyle\lim_{x\to0}\frac{3\cos 3x}{2}=\frac32$.</p>
      <p class="callout warn"><b>Abans de derivar, substitueix.</b> Si no és indeterminació, la regla dona resultats falsos. I es deriva <b>per separat</b>: no és la regla del quocient.</p>
      <p><b>Altres indeterminacions</b> es converteixen en quocient: $0\cdot\infty$ amb $f\cdot g=\frac{f}{1/g}$; $\infty-\infty$ fent denominador comú; $1^\infty$, $0^0$, $\infty^0$ amb $f^g=e^{g\ln f}$.</p>
      <p><b>Jerarquia</b> a $+\infty$: $\ln x\ll x^n\ll e^x$.</p>`,
      parts: [SK.gen('h-form', 1), SK.gen('h-00', 1), SK.gen('h-step', 1), SK.gen('h-inf', 1), SK.gen('h-prod', 1), SK.gen('h-exp', 1)],
    },
    {
      id: 'ext', block: 'Aplicacions de la derivada', title: 'Extrems relatius: els dos criteris',
      body: R`
      <p>Un <b>màxim relatiu</b> és un cim: el punt més alt <i>del seu voltant</i>. Un <b>mínim relatiu</b>, una vall. Als cims i a les valls la tangent és horitzontal: $f'(c)=0$. Aquests punts s'anomenen <b>punts crítics</b>.</p>
      <p><b>Criteri de la 1a derivada:</b> mira el signe de $f'$ a banda i banda. $+\to-$: màxim. $-\to+$: mínim. Si no canvia: ni una cosa ni l'altra.</p>
      <p><b>Criteri de la 2a derivada:</b> $f''(c)>0$ vall (mínim), $f''(c)\lt 0$ muntanya (màxim), $f''(c)=0$ no decideix.</p>
      <p><b>Exemple:</b> $f(x)=x^2e^{-x}$. $f'(x)=2xe^{-x}-x^2e^{-x}=x(2-x)e^{-x}$. Crítics: $x=0$ i $x=2$. Signes: $-$ a $(-\infty,0)$, $+$ a $(0,2)$, $-$ a $(2,\infty)$. Mínim a $0$ ($f=0$) i màxim a $2$ ($f=\frac{4}{e^2}$).</p>
      <p><b>Extrems absoluts en $[a,b]$:</b> compara $f$ als crítics de dins i als extrems de l'interval.</p>`,
      parts: [SK.gen('x-crit', 1), SK.gen('x-mono', 1), SK.gen('x-first', 1), SK.gen('x-second', 1), SK.gen('x-value', 1), SK.gen('x-abs', 1)],
    },
    /* ---------------- BLOC 5 ---------------- */
    {
      id: 'original', block: 'El seminari', title: 'El seminari original, resolt i redactat',
      body: ORIGINAL, parts: [],
    },
  ];
  // la demostració general la comparteix amb el generador
  const proofPart = L_.find(l => l.id === 'ratlim-proof').parts[0];
  proofPart.items = G.PROOF_RATLIM;
  return { list: L_, ORIGINAL };
})();
