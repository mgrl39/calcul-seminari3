'use strict';
/* Gràfiques SVG senzilles i nítides */
const Plot = (() => {
  let uid = 0;
  function niceStep(range) {
    const raw = range / 8;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  const fmt = v => String(+v.toFixed(4));

  function svg({ f, xmin, xmax, ymin, ymax, pts = [], extra = [], samples = 700, w = 600, h = 360, reveal = false }) {
    const id = 'clip' + (++uid);
    const xs = [], ys = [];
    for (let i = 0; i <= samples; i++) {
      const x = xmin + (xmax - xmin) * i / samples;
      xs.push(x); ys.push(f(x));
    }
    if (ymin === undefined || ymax === undefined) {
      const fin = ys.filter(isFinite).sort((a, b) => a - b);
      let lo = fin[Math.floor(fin.length * 0.02)], hi = fin[Math.ceil(fin.length * 0.98) - 1];
      for (const p of pts) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.15;
      ymin = lo - pad; ymax = hi + pad;
    }
    const L = 46, R = 14, T = 14, B = 30;
    const X = x => L + (x - xmin) / (xmax - xmin) * (w - L - R);
    const Y = y => T + (ymax - y) / (ymax - ymin) * (h - T - B);
    let g = '';
    const sx = niceStep(xmax - xmin), sy = niceStep(ymax - ymin);
    for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) {
      g += `<line x1="${X(x)}" y1="${T}" x2="${X(x)}" y2="${h - B}" class="pg"/>`;
      g += `<text x="${X(x)}" y="${h - B + 18}" class="pt" text-anchor="middle">${fmt(x)}</text>`;
    }
    for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) {
      g += `<line x1="${L}" y1="${Y(y)}" x2="${w - R}" y2="${Y(y)}" class="pg"/>`;
      g += `<text x="${L - 6}" y="${Y(y) + 4}" class="pt" text-anchor="end">${fmt(y)}</text>`;
    }
    if (xmin < 0 && xmax > 0) g += `<line x1="${X(0)}" y1="${T}" x2="${X(0)}" y2="${h - B}" class="pa"/>`;
    if (ymin < 0 && ymax > 0) g += `<line x1="${L}" y1="${Y(0)}" x2="${w - R}" y2="${Y(0)}" class="pa"/>`;

    const path = (fn, cls) => {
      let d = '', pen = false;
      const span = ymax - ymin;
      for (let i = 0; i <= samples; i++) {
        const x = xmin + (xmax - xmin) * i / samples;
        const y = fn(x);
        if (!isFinite(y) || y > ymax + span * 3 || y < ymin - span * 3) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
        pen = true;
      }
      return `<path d="${d}" class="${cls}" clip-path="url(#${id})"/>`;
    };
    for (const e of extra) g += path(e.f, e.cls || 'penv');
    if (reveal) g += '<g class="reveal">';
    g += path(f, 'pc');
    for (const p of pts) {
      if (p.x < xmin || p.x > xmax) continue;
      g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" class="pp ${p.cls || ''}"><title>${p.label || ''}</title></circle>`;
    }
    if (reveal) g += '</g>';
    return `<svg viewBox="0 0 ${w} ${h}" class="plot" role="img" aria-label="Gràfica">
      <defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${w - L - R}" height="${h - T - B}"/></clipPath></defs>${g}</svg>`;
  }
  return { svg };
})();
