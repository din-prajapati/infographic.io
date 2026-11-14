// Builds the "The Horizon Residences" starting design with the app's own element factories (served by Vite),
// after uploading its sample images to R2 through the authenticated /api/v1/media endpoint. Run against a live
// dev server: node e2e/fixtures/horizon/build-seed.cjs <baseUrl> <token> <outFile>
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [base, token, out] = process.argv.slice(2);
async function upload(file, type) {
  const form = new FormData(); form.append('file', new Blob([fs.readFileSync(path.join(__dirname, file))], { type }), file);
  const r = await fetch(`${base}/api/v1/media`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
  if (r.status !== 201) throw new Error(`upload ${file} ${r.status}`); return (await r.json()).url;
}
(async () => {
  const hero = await upload('hero-building.jpg', 'image/jpeg'), logo = await upload('logo-horizon.png', 'image/png');
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto(`${base}/`);
  const canvasData = await page.evaluate(async ({ hero, logo }) => {
    const u = await import('/src/lib/canvasUtils.ts'), icons = await import('/src/lib/propertyIcons.ts');
    // Paint angles in this app: 0 = left→right, 90 = top→bottom (client/src/lib/paint.ts).
    const gold = '#C9A86A', ivory = '#F3EEE4', z = { v: 1 };
    const text = (name, content, x, y, width, height, style) => ({ ...u.createTextElement(), name, content, x, y, width, height, zIndex: z.v++, fontFamily: 'Montserrat', fontSize: 24, fontWeight: 400, color: ivory, align: 'left', lineHeight: 1.25, ...style });
    const shape = (name, type, x, y, width, height, style) => ({ ...u.createShapeElement(type, x, y), name, x, y, width, height, zIndex: z.v++, ...style });
    const image = (name, src, x, y, width, height, style = {}) => ({ ...u.createImageElement(src, x, y, width, height), name, zIndex: z.v++, objectFit: 'cover', ...style });
    const els = [];
    els.push(image('Hero photograph', hero, 640, 0, 440, 1080));
    els.push(shape('Sky blend', 'rectangle', 600, 0, 240, 1080, { fill: 'transparent', stroke: 'transparent', strokeWidth: 0, cornerRadius: 0, paints: { fill: { type: 'linear', angle: 0, stops: [{ color: '#0E1828', opacity: 1 }, { color: '#0E1828', opacity: 0 }] } } }));
    els.push(image('Brand logo', logo, 180, 62, 76, 76, { objectFit: 'contain' }));
    els.push(text('Brand name', 'THE HORIZON', 70, 150, 296, 40, { fontSize: 30, fontWeight: 500, color: gold, align: 'center', letterSpacing: 180 }));
    els.push(text('Residences label', '———  RESIDENCES  ———', 70, 192, 296, 22, { fontSize: 13, color: gold, align: 'center', letterSpacing: 300 }));
    els.push(text('Headline', 'Elevated Urban Living', 100, 258, 560, 230, { fontFamily: 'Playfair Display', fontSize: 92, color: ivory, lineHeight: 1.12 }));
    els.push(shape('Divider', 'rectangle', 108, 478, 76, 3, { fill: gold, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0 }));
    els.push(text('Subheading', 'A new address for contemporary lifestyles', 108, 506, 400, 90, { fontSize: 28, fontWeight: 300, color: '#E7E2D8', lineHeight: 1.35 }));
    const amenities = [['location', 'Prime\nLocation', 148], ['furnished', 'Luxury\nInteriors', 292], ['wifi', 'Smart\nAmenities', 428], ['keys', 'Private\nResidence Club', 560]];
    amenities.forEach(([id, label, cx], i) => {
      els.push(shape(`Amenity ring ${i + 1}`, 'circle', cx - 36, 704, 72, 72, { fill: 'transparent', stroke: gold, strokeWidth: 1.5 }));
      els.push({ ...icons.createPropertyIcon(id, { color: gold, strokeWidth: 1.6, x: cx - 18, y: 722, size: 36 }), zIndex: z.v++ });
      els.push(text(`Amenity label ${i + 1}`, label, cx - 80, 790, 160, 60, { fontSize: 18, color: '#ECE7DD', align: 'center', lineHeight: 1.3 }));
      if (i < 3) els.push(shape(`Amenity separator ${i + 1}`, 'rectangle', cx + 70, 712, 1.5, 120, { fill: '#FFFFFF55', stroke: 'transparent', strokeWidth: 0, cornerRadius: 0 }));
    });
    els.push(shape('CTA button', 'rectangle', 104, 900, 374, 74, { fill: '#0E1828', stroke: gold, strokeWidth: 2, cornerRadius: 2 }));
    els.push(text('CTA text', 'BOOK A PRIVATE TOUR  →', 104, 921, 374, 34, { fontSize: 21, fontWeight: 600, color: gold, align: 'center', letterSpacing: 90 }));
    return { elements: els, canvasWidth: 1080, canvasHeight: 1080, backgroundColor: '#0E1828', backgroundPaint: { type: 'linear', angle: 90, stops: [{ color: '#1B2B47', opacity: 1 }, { color: '#0B1322', opacity: 1 }] } };
  }, { hero, logo });
  fs.writeFileSync(out, JSON.stringify({ hero, logo, canvasData }, null, 2));
  console.log('elements', canvasData.elements.length, 'hero', new URL(hero).pathname, 'logo', new URL(logo).pathname);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
