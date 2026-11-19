'use strict';
/* Contingut teòric (HTML amb $TeX$) */
const THEORY = {
  chain: String.raw`
  <h3>La regla</h3>
  <div class="formula">$$\big(f(g(x))\big)' = f'\big(g(x)\big)\cdot g'(x)$$</div>
  <p>Amb més capes simplement es repeteix: $\big(f(g(h(x)))\big)' = f'\big(g(h(x))\big)\cdot g'\big(h(x)\big)\cdot h'(x)$.</p>
  <h3>Mètode infal·lible (3 passos)</h3>
  <ol class="steps">
    <li><b>Pela la ceba.</b> Identifica les capes de <b>fora cap a dins</b>. La capa exterior és l'<b>última operació</b> que faries si calculessis $f(x)$ amb la calculadora.</li>
    <li><b>Deriva la capa exterior i deixa-li l'argument intacte.</b> No toquis el que hi ha a dins.</li>
    <li><b>Multiplica per la derivada de l'argument</b> i torna al pas 2 amb aquest argument. Acabes quan arribes a la $x$.</li>
  </ol>
  <p>Resultat: <b>tants factors com capes</b> (comptant el polinomi interior).</p>
  <h3>Exemple de l'examen</h3>
  <p>$f(x) = \cos\big(\sin(\sin^2(x^2))\big)$. Ordre de fora cap a dins: $\cos \to \sin \to \square^2 \to \sin \to x^2$.</p>
  $$f'(x) = \underbrace{-\sin\big(\sin(\sin^2(x^2))\big)}_{\cos'} \cdot \underbrace{\cos\big(\sin^2(x^2)\big)}_{\sin'} \cdot \underbrace{2\sin(x^2)}_{(\square^2)'} \cdot \underbrace{\cos(x^2)}_{\sin'} \cdot \underbrace{2x}_{(x^2)'}$$
  <h3>Errors típics</h3>
  <ul>
    <li>$\sin^2(x^2)$ vol dir $\big(\sin(x^2)\big)^2$: <b>el quadrat és una capa per fora del sinus</b>.</li>
    <li>Oblidar l'últim factor (la derivada de l'interior, per exemple $2x$).</li>
    <li>Canviar l'argument en derivar: $(\cos u)' = -\sin u \cdot u'$, l'argument continua sent $u$.</li>
    <li>El signe menys de la derivada del cosinus.</li>
  </ul>
  <h3>Taula de derivades (amb cadena)</h3>
  <div class="tblwrap"><table class="tbl">
    <tr><th>Funció</th><th>Derivada</th><th>Funció</th><th>Derivada</th></tr>
    <tr><td>$u^n$</td><td>$n\,u^{n-1}\,u'$</td><td>$\sin u$</td><td>$\cos u\cdot u'$</td></tr>
    <tr><td>$\sqrt{u}$</td><td>$\dfrac{u'}{2\sqrt u}$</td><td>$\cos u$</td><td>$-\sin u\cdot u'$</td></tr>
    <tr><td>$e^u$</td><td>$e^u\,u'$</td><td>$\tan u$</td><td>$\dfrac{u'}{\cos^2 u} = (1+\tan^2u)\,u'$</td></tr>
    <tr><td>$\ln u$</td><td>$\dfrac{u'}{u}$</td><td>$\dfrac{1}{u}$</td><td>$-\dfrac{u'}{u^2}$</td></tr>
  </table></div>`,

  limder: String.raw`
  <h3>Definició de derivada</h3>
  <div class="formula">$$f'(a) = \lim_{h\to0}\frac{f(a+h)-f(a)}{h}$$</div>
  <p>Quan $f$ es defineix «a trossos» (una fórmula per a $x\neq0$ i un valor a $x=0$), les regles de derivació només valen per a $x\neq 0$. En $x=0$ cal fer servir la <b>definició</b> (o un límit).</p>
  <h3>El lema clau: «zero per acotada és zero»</h3>
  <div class="formula">Si $g(x)\to0$ i $|b(x)|\le K$, aleshores $g(x)\,b(x)\to 0$.</div>
  <p>Com que $|\sin(\cdot)|\le1$ i $|\cos(\cdot)|\le1$: $\;x^{k}\sin(1/x)\to0$ si $k>0$. Però $\sin(1/x)$ i $\cos(1/x)$ <b>sols no tenen límit</b> quan $x\to0$ (oscil·len), i $\frac{1}{x}\cos(1/x)$ ni tan sols està acotat.</p>
  <h3>Mètode per a $f(x) = x^k\sin(1/x)$, $f(0)=0$</h3>
  <ol class="steps">
    <li><b>Deriva per a $x\neq0$</b> (producte + cadena): $\left(\sin\tfrac1x\right)' = \cos\tfrac1x\cdot\left(-\tfrac1{x^2}\right)$.
      $$f'(x) = k\,x^{k-1}\sin\tfrac1x - x^{k-2}\cos\tfrac1x$$</li>
    <li><b>Límit de $f'(x)$</b>: analitza terme a terme. Potència positiva de $x$ × acotada $\to 0$. Si l'exponent és $0$ o negatiu: no té límit.</li>
    <li><b>Derivada en 0 per definició</b>: $\dfrac{f(h)-0}{h} = h^{k-1}\sin\tfrac1h \to 0$ si $k\ge2$.</li>
    <li><b>Conclou</b>: derivable en $0$? $f'$ contínua en $0$?</li>
  </ol>
  <h3>Taula resum (memoritza-la!)</h3>
  <div class="tblwrap"><table class="tbl">
    <tr><th>$k$</th><th>Contínua en 0</th><th>Derivable en 0</th><th>$\lim_{x\to0} f'(x)$</th><th>$f'$ contínua en 0</th></tr>
    <tr><td>$0$</td><td>✗</td><td>✗</td><td>—</td><td>✗</td></tr>
    <tr><td>$1$</td><td>✓</td><td>✗</td><td>no existeix</td><td>✗</td></tr>
    <tr><td>$2$</td><td>✓</td><td>✓ ($f'(0)=0$)</td><td><b>no existeix</b></td><td>✗</td></tr>
    <tr><td>$\ge3$</td><td>✓</td><td>✓ ($f'(0)=0$)</td><td>$0$</td><td>✓</td></tr>
  </table></div>
  <p class="callout warn"><b>Trampa del cas $k=2$:</b> si $\lim_{x\to0}f'(x)$ existeix, aleshores $f'(0)$ val això. Però si <b>no</b> existeix, no pots concloure res: cal anar a la definició (i pot ser que $f$ sí que sigui derivable!).</p>
  <p>Si s'afegeix un terme $a\,x$, totes les derivades en $0$ i el límit es desplacen en $a$.</p>`,

  study: String.raw`
  <h3>Checklist de l'estudi complet</h3>
  <ol class="steps">
    <li><b>Zeros</b>: resol $f(x)=0$. Treu factor comú; si no, Ruffini amb divisors del terme independent; després equació de segon grau.</li>
    <li><b>Primera derivada</b> $f'(x)$ i <b>punts crítics</b>: $f'(x)=0$.</li>
    <li><b>Taula de signes de $f'$</b>: els punts crítics parteixen la recta; tria un valor de prova a cada interval. $f'>0$ ⇒ creix ↗, $f'<0$ ⇒ decreix ↘.</li>
    <li><b>Classifica</b>: ↗ després ↘ ⇒ <b>màxim local</b>; ↘ després ↗ ⇒ <b>mínim local</b>; si no canvia ⇒ no és extrem. (Alternativa: $f''(c)<0$ màxim, $f''(c)>0$ mínim.)</li>
    <li><b>Segona derivada</b> $f''(x)$, resol $f''(x)=0$ i fes la taula de signes: $f''>0$ ⇒ <b>convexa</b> $\cup$, $f''<0$ ⇒ <b>còncava</b> $\cap$. On canvia de signe ⇒ <b>punt d'inflexió</b>.</li>
    <li><b>Límits a $\pm\infty$</b>: mana el terme de grau més alt.</li>
    <li><b>Extrems absoluts</b>: si algun límit és $+\infty$ no hi ha màxim absolut; si algun és $-\infty$ no hi ha mínim absolut.</li>
    <li><b>Esbós</b>: marca zeros, extrems i inflexions i uneix-los respectant creixement i curvatura.</li>
  </ol>
  <h3>Exemple de l'examen: $f(x)=x^3-x$</h3>
  <ul>
    <li>Zeros: $x(x^2-1)=0 \Rightarrow x = -1,\,0,\,1$.</li>
    <li>$f'(x)=3x^2-1=0 \Rightarrow x=\pm\frac{1}{\sqrt3}=\pm\frac{\sqrt3}{3}$.</li>
    <li>$f'>0$ a $\left(-\infty,-\frac{\sqrt3}{3}\right)\cup\left(\frac{\sqrt3}{3},+\infty\right)$ (creix), $f'<0$ a $\left(-\frac{\sqrt3}{3},\frac{\sqrt3}{3}\right)$ (decreix).</li>
    <li>Màxim local a $x=-\frac{\sqrt3}{3}$, mínim local a $x=\frac{\sqrt3}{3}$.</li>
    <li>$f''(x)=6x$: còncava a $(-\infty,0)$, convexa a $(0,+\infty)$, inflexió a $x=0$.</li>
    <li>$\lim_{x\to+\infty}f=+\infty$, $\lim_{x\to-\infty}f=-\infty$ ⇒ <b>no té ni màxim ni mínim absoluts</b>.</li>
  </ul>
  <h3>Fets que estalvien temps</h3>
  <ul>
    <li>Un polinomi de <b>grau senar</b> mai té extrems absoluts.</li>
    <li>Grau parell amb coeficient principal $>0$: té mínim absolut i no màxim (al revés si és $<0$).</li>
    <li>Equació de segon grau: $x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}$.</li>
    <li>Racionalitza: $\frac{1}{\sqrt3}=\frac{\sqrt3}{3}$ (a la web pots escriure qualsevol de les dues).</li>
    <li>Un punt crític on $f'$ no canvia de signe (p.ex. $x=0$ a $x^4-4x^3$) <b>no</b> és extrem.</li>
  </ul>
  <p class="callout"><b>Convenció</b>: aquí <b>convexa</b> = forma $\cup$ ($f''>0$) i <b>còncava</b> = forma $\cap$ ($f''<0$). Si el teu professor fa servir la convenció contrària, a l'examen indica sempre el signe de $f''$ o dibuixa $\cup$ / $\cap$.</p>`,

  ratlim: String.raw`
  <h3>La idea</h3>
  <p>Quan $|x|$ és molt gran, en un polinomi <b>només importa el terme de grau més alt</b>. Traient factor comú:</p>
  <div class="formula">$$\frac{a_nx^n+\dots+a_0}{b_mx^m+\dots+b_0} = \frac{x^n\left(a_n+\frac{a_{n-1}}{x}+\dots\right)}{x^m\left(b_m+\frac{b_{m-1}}{x}+\dots\right)} \;\sim\; \frac{a_n}{b_m}\,x^{\,n-m}$$</div>
  <p>Alternativa: aplicar l'Hôpital $\min(n,m)$ vegades fins que un dels dos polinomis sigui constant.</p>
  <h3>Taula de casos</h3>
  <div class="tblwrap"><table class="tbl">
    <tr><th>Cas</th><th>$x\to+\infty$</th><th>$x\to-\infty$</th></tr>
    <tr><td>$n\lt m$</td><td>$0$</td><td>$0$</td></tr>
    <tr><td>$n=m$</td><td>$\dfrac{a_n}{b_m}$</td><td>$\dfrac{a_n}{b_m}$</td></tr>
    <tr><td>$n>m$, $\frac{a_n}{b_m}>0$</td><td>$+\infty$</td><td>$+\infty$ si $n-m$ parell; $-\infty$ si senar</td></tr>
    <tr><td>$n>m$, $\frac{a_n}{b_m}<0$</td><td>$-\infty$</td><td>$-\infty$ si $n-m$ parell; $+\infty$ si senar</td></tr>
  </table></div>
  <h3>Trampes típiques</h3>
  <ul>
    <li><b>Termes desordenats</b>: $\frac{3 - x + 2x^4}{x^2 - 5x^4}$ té $a_n=2$, $b_m=-5$, i el límit és $-\frac25$.</li>
    <li><b>Polinomis factoritzats</b>: el terme principal de $(2x-1)^3(x^2+4)$ és $2^3\cdot1\cdot x^{5}=8x^5$.</li>
    <li><b>$x\to-\infty$</b>: $x^{n-m}$ amb exponent senar és negatiu!</li>
    <li>El terme independent $a_0/b_0$ <b>no</b> hi pinta res (això seria el límit quan $x\to0$).</li>
  </ul>`,

  hopital: String.raw`
  <h3>La regla</h3>
  <p>Si $\displaystyle\lim_{x\to a}\frac{f(x)}{g(x)}$ és una indeterminació $\frac00$ o $\frac{\infty}{\infty}$, $f$ i $g$ són derivables a prop de $a$ (amb $g'\neq0$) i existeix $\displaystyle\lim_{x\to a}\frac{f'(x)}{g'(x)}$, llavors</p>
  <div class="formula">$$\lim_{x\to a}\frac{f(x)}{g(x)}=\lim_{x\to a}\frac{f'(x)}{g'(x)}.$$</div>
  <p>Val igual per a $a=\pm\infty$ i per a límits laterals.</p>
  <h3>Mètode (4 passos)</h3>
  <ol class="steps">
    <li><b>Substitueix.</b> Si surt un número (o $\frac{k}{0}$ amb $k\neq0$), ja està: <b>no</b> hi ha indeterminació i l'Hôpital <b>no</b> es pot aplicar.</li>
    <li><b>Classifica.</b> $\frac00$ o $\frac\infty\infty$: directe. Les altres s'han de transformar (taula de sota).</li>
    <li><b>Deriva dalt i baix per separat</b> (no és la regla del quocient!) i torna a substituir.</li>
    <li>Si torna a sortir $\frac00$ o $\frac\infty\infty$, repeteix. <b>Escriu</b> a cada pas quina indeterminació tens.</li>
  </ol>
  <h3>Transformar les altres indeterminacions</h3>
  <div class="tblwrap"><table class="tbl">
    <tr><th>Tipus</th><th>Truc</th><th>Exemple</th></tr>
    <tr><td>$0\cdot\infty$</td><td>$f\cdot g=\dfrac{f}{1/g}$</td><td>$x\ln x=\dfrac{\ln x}{1/x}\to0$</td></tr>
    <tr><td>$\infty-\infty$</td><td>Denominador comú o conjugat</td><td>$\frac1x-\frac1{\sin x}=\frac{\sin x-x}{x\sin x}$</td></tr>
    <tr><td>$1^\infty,\ 0^0,\ \infty^0$</td><td>$f^g=e^{g\ln f}$</td><td>$\left(1+\frac ax\right)^x\to e^{a}$</td></tr>
  </table></div>
  <h3>Límits que surten sempre (val la pena saber-los)</h3>
  <ul>
    <li>$\displaystyle\lim_{x\to0}\frac{\sin(ax)}{bx}=\frac ab$, $\displaystyle\lim_{x\to0}\frac{e^{ax}-1}{bx}=\frac ab$, $\displaystyle\lim_{x\to0}\frac{\ln(1+ax)}{bx}=\frac ab$.</li>
    <li>$\displaystyle\lim_{x\to0}\frac{1-\cos x}{x^2}=\frac12$ (dues aplicacions).</li>
    <li><b>Jerarquia a $+\infty$:</b> $\ln x\ll x^n\ll e^{ax}$ ($a>0$). Per exemple $\frac{x^{10}}{e^x}\to0$ i $\frac{\ln x}{\sqrt x}\to0$.</li>
  </ul>
  <h3>Errors típics</h3>
  <ul>
    <li>Aplicar-la sense indeterminació: $\lim_{x\to0}\frac{x+1}{x+2}=\frac12$, però «derivant» sortiria $1$.</li>
    <li>Fer la derivada del quocient $\left(\frac fg\right)'$ en lloc de $\frac{f'}{g'}$.</li>
    <li>Pensar que si $\lim\frac{f'}{g'}$ no existeix, tampoc existeix $\lim\frac fg$. Ex.: $\frac{x+\sin x}{x}\to1$ a $+\infty$, però $\frac{1+\cos x}{1}$ oscil·la.</li>
  </ul>`,
  extrem: String.raw`
  <h3>Definicions</h3>
  <p>$f$ té un <b>màxim relatiu</b> a $c$ si $f(c)\ge f(x)$ per a tots els $x$ a prop de $c$ (i un <b>mínim relatiu</b> si $f(c)\le f(x)$). Si $f$ és derivable a $c$ i hi té un extrem relatiu, llavors $f'(c)=0$ (teorema de Fermat). Al revés no és cert: $x^3$ té $f'(0)=0$ i no té cap extrem.</p>
  <h3>Mètode</h3>
  <ol class="steps">
    <li><b>Domini.</b> On està definida $f$? ($\ln x$ demana $x>0$, un quocient demana denominador $\neq0$.)</li>
    <li><b>Deriva i factoritza</b> $f'$. Truc: $e^{(\dots)}>0$ sempre, i un quocient s'anul·la quan s'anul·la el numerador.</li>
    <li><b>Punts crítics:</b> resol $f'(x)=0$.</li>
    <li><b>Taula de signes de $f'$</b> amb els punts crítics <b>i</b> els punts fora del domini. $f'>0$: creix ↗; $f'\lt 0$: decreix ↘.</li>
    <li><b>Classifica</b> (criteri de la 1a derivada): ↗ després ↘ és màxim; ↘ després ↗ és mínim; si no canvia, cap dels dos.</li>
    <li><b>Valor</b> de l'extrem: $f(c)$, substituint a $f$ (no a $f'$).</li>
  </ol>
  <h3>Criteri de la segona derivada</h3>
  <p>Si $f'(c)=0$: $f''(c)>0\Rightarrow$ mínim (vall ∪); $f''(c)\lt 0\Rightarrow$ màxim (muntanya ∩); $f''(c)=0\Rightarrow$ <b>no decideix</b> (ex.: $x^4$ té mínim a $0$ i $x^3$ no en té, i en tots dos $f''(0)=0$).</p>
  <h3>Extrems absoluts</h3>
  <ul>
    <li><b>En un interval tancat $[a,b]$</b> (Weierstrass: sempre n'hi ha si $f$ és contínua): avalua $f$ als punts crítics de dins i als extrems $a$, $b$, i compara.</li>
    <li><b>A tot $\mathbb R$</b>: cal mirar els límits a $\pm\infty$. Si $f\to+\infty$ no hi ha màxim absolut; si $f\to-\infty$ no hi ha mínim absolut.</li>
  </ul>
  <h3>Exemple</h3>
  <p>$f(x)=x\,e^{-x}$. $f'(x)=e^{-x}-xe^{-x}=(1-x)e^{-x}$. Com que $e^{-x}>0$, $f'=0\iff x=1$. Signe: $f'>0$ a $(-\infty,1)$ i $f'\lt 0$ a $(1,+\infty)$. Màxim relatiu a $x=1$, amb $f(1)=\frac1e$. A més $f\to0$ a $+\infty$ i $f\to-\infty$ a $-\infty$: és màxim absolut i no hi ha mínim absolut.</p>`,
  syntax: String.raw`
  <div class="tblwrap"><table class="tbl">
    <tr><th>Vols escriure</th><th>Escriu</th></tr>
    <tr><td>$2x\cos(x^2)$</td><td><code>2x*cos(x^2)</code> o <code>2x cos(x^2)</code></td></tr>
    <tr><td>$\sin^2(x)$</td><td><code>sin(x)^2</code> o <code>sin^2(x)</code></td></tr>
    <tr><td>$e^{x^2}$</td><td><code>e^(x^2)</code> o <code>exp(x^2)</code></td></tr>
    <tr><td>$\sqrt{3}/3$</td><td><code>sqrt(3)/3</code></td></tr>
    <tr><td>$\frac{1}{\cos^2(x)}$</td><td><code>1/cos(x)^2</code></td></tr>
    <tr><td>$\ln(x)$, $\tan(x)$, $\pi$</td><td><code>ln(x)</code>, <code>tan(x)</code>, <code>pi</code></td></tr>
    <tr><td>$+\infty$, $-\infty$</td><td><code>inf</code>, <code>-inf</code></td></tr>
    <tr><td>No existeix</td><td><code>no existeix</code></td></tr>
    <tr><td>Llista $\{0, \pm\sqrt2\}$</td><td><code>0, sqrt(2), -sqrt(2)</code> o <code>0, ±sqrt(2)</code></td></tr>
    <tr><td>$(-\infty,-1)\cup(1,+\infty)$</td><td><code>(-inf, -1) U (1, inf)</code></td></tr>
    <tr><td>Conjunt buit</td><td><code>cap</code></td></tr>
  </table></div>
  <p>Les derivades es comproven <b>numèricament</b>: qualsevol expressió equivalent és correcta, simplificada o no. Mentre escrius veuràs una vista prèvia de com s'interpreta.</p>`,
};
