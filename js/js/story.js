/* ============================================================
   STORY CARD 🎴 — your week as one shareable image
   A 1080×1920 canvas painted with the week's real numbers and
   a tiny volume sparkline, saved straight to the gallery.
   Everything it shows is read from the same database the rest
   of the app reads; nothing is invented for the picture.
   ============================================================ */

import { t, num, getLang } from './i18n.js';
import { el, toast, sheet } from './ui.js';
import { rankState } from './xp.js';
import { allWorkouts } from './workouts.js';

const W = 1080, H = 1920;

function weekBounds() {
  const now = new Date();
  const d = new Date(now); d.setDate(d.getDate() - 7);
  return { from: d.getTime(), to: now.getTime() + 864e5 };
}

export async function weekFacts() {
  const [wk, rk] = await Promise.all([allWorkouts(), rankState().catch(() => null)]);
  const { from, to } = weekBounds();
  const inWeek = wk.filter(w => {
    const ts = w.start || Date.parse(w.date + 'T12:00:00') || 0;
    return ts >= from && ts <= to;
  });
  const days = 7;
  const volume = inWeek.reduce((a, w) => a + (w.volume || 0), 0);
  const sets = inWeek.reduce((a, w) => a + (w.sets || 0), 0);
  const mins = Math.round(inWeek.reduce((a, w) => a + ((w.end || 0) - (w.start || 0)), 0) / 60000);
  /* sparkline: volume per day, oldest → newest */
  const perDay = Array(days).fill(0);
  inWeek.forEach(w => {
    const ts = w.start || Date.parse(w.date + 'T12:00:00') || 0;
    const di = Math.min(6, Math.max(0, 6 - Math.floor((to - 864e5 - ts) / 864e5)));
    perDay[di] += w.volume || 0;
  });
  return {
    count: inWeek.length, volume, sets, mins, perDay,
    level: rk?.level || 1,
    prs: rk?.facts?.prs || 0,
    name: '',
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function openStoryCard() {
  const facts = await weekFacts();
  const fa = getLang() === 'fa';
  const maxV = Math.max(1, ...facts.perDay);

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  /* The sky. Two hues rather than three shades of the same one: a card lit
     by a single colour reads as a filter over a grey, and every card made
     this year looks like every other. */
  const sky = c.createLinearGradient(0, 0, W * .3, H);
  sky.addColorStop(0, '#101b2c'); sky.addColorStop(.5, '#0f1a26'); sky.addColorStop(1, '#0e2a2f');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);

  /* Two lights, warm above and green behind the medal, so the background
     has somewhere to travel between. */
  const cool = c.createRadialGradient(W * .78, 240, 40, W * .78, 240, 760);
  cool.addColorStop(0, 'rgba(88,166,255,.18)'); cool.addColorStop(1, 'rgba(88,166,255,0)');
  c.fillStyle = cool; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W / 2, 620, 60, W / 2, 620, 720);
  glow.addColorStop(0, 'rgba(38,208,124,.26)'); glow.addColorStop(1, 'rgba(38,208,124,0)');
  c.fillStyle = glow; c.fillRect(0, 0, W, H);

  const F = size => `${size}px Vazirmatn, Tahoma, sans-serif`;

  /* title */
  c.textAlign = 'center';
  c.fillStyle = '#7ee2ae';
  c.font = F(40); c.fillText(fa ? 'هفته‌ی من در فیت‌یار' : 'My week in FitYar', W / 2, 150);

  /* big level medal */
  c.save();
  c.translate(W / 2, 540);
  const mg = c.createRadialGradient(-70, -90, 20, 0, 0, 260);
  mg.addColorStop(0, '#9ff0c4'); mg.addColorStop(.55, '#27c877'); mg.addColorStop(1, '#0d7a45');
  c.fillStyle = mg;
  c.beginPath(); c.arc(0, 0, 240, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 10;
  c.beginPath(); c.arc(0, 0, 208, 0, 7); c.stroke();
  c.fillStyle = '#06331d';
  c.font = F(300); c.textBaseline = 'middle';
  c.fillText(String(facts.level), 0, 20);
  c.restore();
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#9db3c8'; c.font = F(44);
  c.fillText(fa ? 'سطح' : 'LEVEL', W / 2, 900);

  /* The numbers — four of them, in four places.

     They used to be four calls to one pair of coordinates: sets was drawn
     over workouts and minutes over volume, so half of this block was
     underneath the other half. Two rows now, and each stat carries a rule
     in its own colour, which is what tells them apart at a glance on a
     phone screen someone is scrolling past.

     The figures stay near-white. A coloured number on a dark card is
     harder to read than a white one, and the whole point of this card is
     that somebody screenshots it. */
  const stat = (x, yTop, v, l, tint) => {
    c.fillStyle = '#eef4fa'; c.font = F(78);
    c.fillText(v, x, yTop);
    c.fillStyle = tint;
    c.fillRect(x - 46, yTop + 22, 92, 6);
    c.fillStyle = '#9fb3c8'; c.font = F(38);
    c.fillText(l, x, yTop + 84);
  };
  const R1 = 1120, R2 = 1330;
  stat(W * .28, R1, num(facts.count), fa ? 'تمرین' : 'workouts', '#58a6ff');
  stat(W * .72, R1, num(Math.round(facts.volume / 1000)) + 'K', fa ? 'حجم (kg)' : 'volume', '#b98cff');
  stat(W * .28, R2, num(facts.sets), fa ? 'ست' : 'sets', '#3ddc84');
  stat(W * .72, R2, num(facts.mins), fa ? 'دقیقه' : 'minutes', '#ffb454');

  /* sparkline */
  const bx = 140, bw = W - 280, by = 1500, bh = 200;
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(bx, by + bh); c.lineTo(bx + bw, by + bh); c.stroke();
  c.beginPath();
  facts.perDay.forEach((v, i) => {
    const x = bx + (i / (facts.perDay.length - 1)) * bw;
    const y = by + bh - (v / maxV) * (bh - 30);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  });
  /* The week reads left to right in colour as well as in shape. */
  const lg = c.createLinearGradient(bx, 0, bx + bw, 0);
  lg.addColorStop(0, '#4fd6c4'); lg.addColorStop(.5, '#3ddc84'); lg.addColorStop(1, '#8ee86f');
  c.strokeStyle = lg; c.lineWidth = 10; c.lineJoin = 'round'; c.lineCap = 'round';
  c.stroke();
  c.lineTo(bx + bw, by + bh); c.lineTo(bx, by + bh); c.closePath();
  const fg = c.createLinearGradient(0, by, 0, by + bh);
  fg.addColorStop(0, 'rgba(47,217,138,.35)'); fg.addColorStop(1, 'rgba(47,217,138,0)');
  c.fillStyle = fg; c.fill();
  /* day dots */
  facts.perDay.forEach((v, i) => {
    const x = bx + (i / (facts.perDay.length - 1)) * bw;
    const y = by + bh - (v / maxV) * (bh - 30);
    c.beginPath(); c.arc(x, y, 12, 0, 7);
    c.fillStyle = v ? '#2fd98a' : 'rgba(255,255,255,.25)'; c.fill();
  });
  c.fillStyle = '#8fa6bb'; c.font = F(34);
  c.fillText(fa ? 'حجم هفته، روز به روز' : 'volume, day by day', W / 2, by + bh + 72);

  /* signature */
  c.fillStyle = 'rgba(255,255,255,.35)'; c.font = F(34);
  c.fillText(fa ? 'ساخته‌شده با فیت‌یار' : 'made with FitYar', W / 2, H - 58);

  /* preview + save + share */
  const url = cv.toDataURL('image/png');
  const img = el('img', { src: url, alt: t('storyCard') });
  img.style.cssText = 'width:min(64vw,270px);border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.45);display:block;margin:6px auto 14px';

  const save = el('button', { class: 'btn full', onclick: () => {
    const a = document.createElement('a');
    a.download = `fityar-story-${new Date().toISOString().slice(0, 10)}.png`;
    a.href = url;
    a.click();
    toast(t('storySaved'), 'ok');
  } }, '⬇️ ' + t('storyMake'));

  /* direct share where the platform has it */
  const shareBtn = el('button', { class: 'btn ghost full', style: 'margin-top:8px', onclick: async () => {
    try {
      const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
      const file = new File([blob], 'fityar-week.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        save.click();
      }
    } catch {}
  } }, '↗ ' + t('weekCardShare'));

  sheet(t('storyCard'), el('div', {}, el('div', { class: 'muted', style: 'text-align:center;margin-bottom:10px;font-size:var(--t-sm)' }, t('storyHint')), img, save, shareBtn));
}
