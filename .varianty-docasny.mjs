import { chromium } from 'playwright-core';
import sharp from 'sharp';

const ADRESA = 'http://localhost:4321/web-za-kninicky/mapa/';

/**
 * Varianty palety mapy. Klíč je název vrstvy tak, jak ji zapisuje generátor;
 * hodnota je barva. Vykreslují se vedle sebe, protože z kódu se paleta mapy
 * posoudit nedá — to už si tenhle projekt jednou vyzkoušel.
 */
const VARIANTY = {
  'A — současná (modrá noc)': null, // beze změny, pro srovnání
  'B — do zeleně (sedne k pásu)': {
    pozadi: '#0e1b15',
    pole: '#293a30',
    les: '#1b3326',
    prumysl: '#414c45',
    zastavba: '#5e6f66',
    zelen: '#245139',
    voda: '#2f82bd',
    cesticka: '#4c6157',
    ulice: '#9db5a8',
    silnice: '#aec4b6',
    hlavni: '#c8dbcd',
    zeleznice: '#8fa598',
    potok: '#4694c4',
  },
  'C — světlá mapa': {
    pozadi: '#dfe7df',
    pole: '#e7ede4',
    les: '#c2d6c3',
    prumysl: '#d3d8d4',
    zastavba: '#f6f8f6',
    zelen: '#cfe0cd',
    voda: '#8fc0e0',
    cesticka: '#b9c4bc',
    ulice: '#ffffff',
    silnice: '#ffffff',
    hlavni: '#ffffff',
    zeleznice: '#a8b3aa',
    potok: '#7bb2d8',
  },
  'D — kontrastní noc': {
    pozadi: '#060f0b',
    pole: '#22312a',
    les: '#122a1d',
    prumysl: '#3c4740',
    zastavba: '#75877c',
    zelen: '#1d4630',
    voda: '#2b7ec2',
    cesticka: '#42574c',
    ulice: '#c2d6c8',
    silnice: '#d6e4da',
    hlavni: '#eef4f0',
    zeleznice: '#8fa598',
    potok: '#4694c4',
  },
};

function css(v) {
  if (!v) return '';
  return `
    .mapa-plocha { background: ${v.pozadi} !important; }
    .mapa-plocha .mapa-pole path { fill: ${v.pole} !important; }
    .mapa-plocha .mapa-les path { fill: ${v.les} !important; }
    .mapa-plocha .mapa-prumysl path { fill: ${v.prumysl} !important; }
    .mapa-plocha .mapa-zastavba path { fill: ${v.zastavba} !important; }
    .mapa-plocha .mapa-zelen path { fill: ${v.zelen} !important; }
    .mapa-plocha .mapa-vodni-plocha path { fill: ${v.voda} !important; }
    .mapa-plocha .mapa-cesticka path { stroke: ${v.cesticka} !important; }
    .mapa-plocha .mapa-ulice path { stroke: ${v.ulice} !important; }
    .mapa-plocha .mapa-silnice path { stroke: ${v.silnice} !important; }
    .mapa-plocha .mapa-silnice-hlavni path { stroke: ${v.hlavni} !important; }
    .mapa-plocha .mapa-zeleznice path { stroke: ${v.zeleznice} !important; }
    .mapa-plocha .mapa-potok path, .mapa-plocha .mapa-reka path { stroke: ${v.potok} !important; }
  `;
}

async function spust() {
  for (const k of ['msedge', 'chrome', 'chromium']) {
    try { return await chromium.launch({ channel: k }); } catch {}
  }
  throw new Error('Nenasel jsem prohlizec.');
}

const cil = process.argv[2];
const p = await spust();
const k = await p.newContext({ viewport: { width: 1100, height: 1200 }, deviceScaleFactor: 2 });
const s = await k.newPage();
await s.goto(ADRESA, { waitUntil: 'load' });
await s.waitForTimeout(1600);

const dlazdice = [];
for (const [nazev, v] of Object.entries(VARIANTY)) {
  await s.evaluate((text) => {
    document.getElementById('varianta')?.remove();
    if (!text) return;
    const st = document.createElement('style');
    st.id = 'varianta';
    st.textContent = text;
    document.head.appendChild(st);
  }, css(v));
  await s.waitForTimeout(400);
  const buf = await s.locator('.mapa-plocha').screenshot();
  dlazdice.push({ nazev, buf: await sharp(buf).resize({ width: 520 }).toBuffer() });
}
await p.close();

const m = await sharp(dlazdice[0].buf).metadata();
const S = m.width, V = m.height, POPISEK = 46;
const celkem = dlazdice.length * (S + 12);
const popisky = dlazdice.map((d, i) =>
  `<text x="${i * (S + 12) + 10}" y="30" fill="#15201a" font-size="22" font-weight="bold" font-family="sans-serif">${d.nazev}</text>`,
);
await sharp({ create: { width: celkem, height: V + POPISEK, channels: 3, background: '#eef2ee' } })
  .composite([
    ...dlazdice.map((d, i) => ({ input: d.buf, left: i * (S + 12), top: POPISEK })),
    { input: Buffer.from(`<svg width="${celkem}" height="${V + POPISEK}" xmlns="http://www.w3.org/2000/svg">${popisky.join('')}</svg>`), left: 0, top: 0 },
  ])
  .jpeg({ quality: 92 })
  .toFile(`${cil}/varianty.jpg`);
console.log('hotovo');
