// Prototype decorations mirror the Canvas map's order, font metrics and labels.
import { resolveColor, withAlpha } from './viz/core.js';
const plainName = (s, n = 34) => { const t = s.replace(/\$([^$]*)\$/g, (_, x) => x.replace(/\\[a-zA-Z]+\s?/g, '').replace(/[{}^_]/g, '')); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
export function paintSceneDecorations(c, phase) {
 const k=this.k, focus=this.hover||this.sel, fc=focus?(focus===this.sel?this.selClosure:this.closure(focus)):null, rk=Math.max(.55,Math.min(1.5,k));
 const off=(x0,y0,x1,y1)=>x1<0||x0>this.W||y1<0||y0>this.H;
 if (phase==='background') {
      // field regions
      for (const F of this.G.map?.fields || []) {
        if (!this.show.fields.has(F.field)) continue;
        const x0 = this.sx(F.x0), y0 = this.sy(F.y0), x1 = this.sx(F.x1), y1 = this.sy(F.y1);
        if (off(x0, y0, x1, y1)) continue;
        c.fillStyle = withAlpha('field-' + F.field, 0.035); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 18 * Math.min(1, k * 4)); c.fill();
        // the title must fit its region: fall back to the short name, then shrink
        let fs = Math.max(13, Math.min(30, 60 * k)), txt = F.title.toUpperCase();
        c.save(); c.letterSpacing = '0.08em'; c.fillStyle = withAlpha('field-' + F.field, 0.95); c.textAlign = 'left'; c.textBaseline = 'bottom';
        const room = x1 - x0 - 8, fit = () => { c.font = `600 ${fs}px Inter, system-ui, sans-serif`; return c.measureText(txt).width; };
        if (fit() > room) { txt = (this.G.fieldById?.get(F.field)?.short || F.field).toUpperCase(); if (fit() > room) { fs = Math.max(9, fs * room / c.measureText(txt).width); fit(); } }
        c.fillText(txt, x0 + 4, y0 - 4); c.restore();
      }
      // chapter bands
      c.font = '600 11px Inter, system-ui, sans-serif';
      for (const C of this.G.collections) {
        if (!this.show.fields.has(C.field)) continue;
        C.chapters.forEach((Ch, i) => {
          const b = Ch.band; if (!b) return;
          if (!Ch.count && !this.show.planned) return;
          const x0 = this.sx(b.x0), x1 = this.sx(b.x1), y0 = this.sy(b.y0), y1 = this.sy(b.y1);
          if (off(x0, y0, x1, y1)) return;
          c.fillStyle = withAlpha(C.id, (i % 2 ? 0.035 : 0.065) * (Ch.count ? 1 : 0.5)); c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 8 * Math.min(1, k)); c.fill();
          const wpx = x1 - x0;
          if (wpx < 18) return;
          c.fillStyle = withAlpha(C.id, Ch.count ? 0.9 : 0.5); c.textAlign = 'left'; c.textBaseline = 'top';
          const label = wpx > 150 ? `${Ch.n} · ${Ch.title}` : wpx > 60 ? `Ch ${Ch.n}` : `${Ch.n}`;
          c.save(); c.beginPath(); c.rect(x0, y0, wpx, 30); c.clip(); c.fillText(label, x0 + 6, y0 + 7); c.restore();
        });
      }
      for (const R of k < 0.13 ? [] : this.G.map?.rows || []) {
        if (!this.show.fields.has(this.fieldOf.get(R.col))) continue;
        const fs = Math.max(13, Math.min(28, 26 * k));
        const x = this.sx(R.x), y = this.sy(R.y); if (off(x, y - fs - 8, x + 600, y)) continue;
        c.font = `italic 500 ${fs}px Newsreader, serif`; c.fillStyle = withAlpha(R.col, 1); c.textAlign = 'left'; c.textBaseline = 'bottom';
        c.fillText(R.label, x + 4, y - 6);
      }
      c.font = '600 11px Inter, system-ui, sans-serif';

 } else {
    // labels
    const occupied = [];
    const free = (x, y, w, h) => { for (const o of occupied) if (x < o[0] + o[2] && x + w > o[0] && y < o[1] + o[3] && y + h > o[1]) return false; occupied.push([x, y, w, h]); return true; };
    c.textBaseline = 'middle'; c.textAlign = 'left';
    const label = (n, strong) => {
      if (!this.visible(n)) return;
      const x = this.sx(n.x), y = this.sy(n.y); if (x < -100 || x > this.W || y < 0 || y > this.H) return;
      const txt = `${n.it.num} ${plainName(n.it.name, strong ? 60 : 30)}`;
      c.font = `${strong ? 600 : 500} ${strong ? 12.5 : 11}px Inter, system-ui, sans-serif`;
      const w = c.measureText(txt).width; const r = Math.max(1.6, n.r * rk) + (this.hl && this.hl.has(n.it.id) ? 4 : 0);
      if (!strong && !free(x + r + 3, y - 7, w + 4, 14)) return;
      c.lineWidth = 3.5; c.strokeStyle = withAlpha('bg', 0.9); c.strokeText(txt, x + r + 4, y);
      c.fillStyle = resolveColor(strong ? 'ink' : n.ghost ? 'faint' : 'muted'); c.fillText(txt, x + r + 4, y);
    };
    if (focus) label(focus, true);
    if (this.sel && this.sel !== focus) label(this.sel, true);
    if (this.hl && !fc) { let m = 0; for (const n of this.nodes) { if (!this.hl.has(n.it.id)) continue; label(n, false); if (++m > 160) break; } return; }
    if (k >= 1.15) for (const n of this.nodes) { if (fc && n !== focus && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
    else if (k >= 0.35) for (const n of this.top) { if (fc && !fc.anc.has(n.it.id) && !fc.desc.has(n.it.id)) continue; label(n, false); }
 }
}
