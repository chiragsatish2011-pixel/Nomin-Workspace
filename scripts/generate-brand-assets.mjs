/**
 * Generate every icon the app ships from one source mark.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Source:  brand/nomin-mark-source.webp  (square, transparent background)
 * Outputs: public/nomin-mark.png         1024px, for <Image> in the wordmark
 *          app/icon.png                  512px, Next.js app icon
 *          app/apple-icon.png            180px, iOS home screen
 *          app/favicon.ico               16/32/48, browser tab + Windows
 *          desktop/build/icon.ico        16…256, Electron app + installer
 *          desktop/build/icon.png        512px, Electron on Linux
 *          desktop/build/tray.png        32px, system tray
 *          desktop/build/badge.png       32px, Windows taskbar unread overlay
 *
 * Re-run this whenever brand/nomin-mark-source.webp changes. Everything it
 * writes is generated — edit the source, not the outputs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "brand", "nomin-mark-source.webp");

/**
 * Trim the transparent margin so the mark fills its box, then re-pad by a
 * small, even amount. Icons read better with a little breathing room than
 * bleeding to the edge, and an explicit pad keeps every size consistent.
 */
const PAD_RATIO = 0.06;

async function normalizedMark() {
  const trimmed = await sharp(SOURCE)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .toBuffer();
  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  const side = Math.max(width, height);
  const pad = Math.round(side * PAD_RATIO);
  const box = side + pad * 2;
  // Center the trimmed mark on a transparent square canvas.
  return sharp({
    create: {
      width: box,
      height: box,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: trimmed,
        left: Math.round((box - width) / 2),
        top: Math.round((box - height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

/** Render the normalized mark at one square size. */
function pngAt(mark, size) {
  return sharp(mark)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack PNGs into an .ico. The ICO format allows a PNG payload per entry
 * (Vista+), so no BMP encoding is needed — just the 6-byte ICONDIR, one
 * 16-byte ICONDIRENTRY per image, then the PNG bytes.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([
    header,
    ...entries,
    ...images.map((i) => i.data),
  ]);
}

async function main() {
  const mark = await normalizedMark();
  await mkdir(path.join(ROOT, "public"), { recursive: true });

  const outputs = [
    ["public/nomin-mark.png", 1024],
    ["app/icon.png", 512],
    ["app/apple-icon.png", 180],
  ];
  for (const [rel, size] of outputs) {
    await writeFile(path.join(ROOT, rel), await pngAt(mark, size));
    console.log(`wrote ${rel} (${size}px)`);
  }

  const faviconSizes = [16, 32, 48];
  const favicon = [];
  for (const size of faviconSizes) {
    favicon.push({ size, data: await pngAt(mark, size) });
  }
  await writeFile(path.join(ROOT, "app/favicon.ico"), buildIco(favicon));
  console.log(`wrote app/favicon.ico (${faviconSizes.join("/")}px)`);

  // ── Desktop shell (see desktop/) ──────────────────────────────────
  // electron-builder requires a 256px entry in the Windows .ico, uses a
  // 512px png on Linux, and the tray wants a small flat icon.
  const desktopBuild = path.join(ROOT, "desktop", "build");
  await mkdir(desktopBuild, { recursive: true });

  const appIcoSizes = [16, 24, 32, 48, 64, 128, 256];
  const appIco = [];
  for (const size of appIcoSizes) {
    appIco.push({ size, data: await pngAt(mark, size) });
  }
  await writeFile(path.join(desktopBuild, "icon.ico"), buildIco(appIco));
  console.log(`wrote desktop/build/icon.ico (${appIcoSizes.join("/")}px)`);

  for (const [name, size] of [
    ["icon.png", 512],
    ["tray.png", 32],
  ]) {
    await writeFile(path.join(desktopBuild, name), await pngAt(mark, size));
    console.log(`wrote desktop/build/${name} (${size}px)`);
  }

  // Windows has no numeric taskbar badge, so unread shows as an overlay
  // dot. Drawn here rather than derived from the mark: at 32px an overlay
  // has to be one solid shape to stay legible.
  const badge = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
      `<circle cx="16" cy="16" r="15" fill="#ffffff"/>` +
      `<circle cx="16" cy="16" r="12" fill="#7132f5"/>` +
      `</svg>`
  );
  await writeFile(
    path.join(desktopBuild, "badge.png"),
    await sharp(badge).png({ compressionLevel: 9 }).toBuffer()
  );
  console.log("wrote desktop/build/badge.png (32px)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
