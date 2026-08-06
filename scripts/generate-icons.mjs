// Genera los íconos de la PWA a partir de public/estudiarioimg1.png (el
// isotipo que subieron). Si en el futuro cambian el logo, reemplacen ese
// archivo (PNG con canal alfa, cuadrado, motivo centrado) y vuelvan a correr:
//   node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'public', 'estudiarioimg1.png')
const outDir = path.join(root, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

const BRAND_BG = '#355C7D'

function roundedSquareBg(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_BG}"/></svg>`,
  )
}

// El PNG original tiene un glow suave y asimétrico alrededor del motivo:
// un trim() automático por alfa agarra ese glow de forma dispareja y el
// resultado queda descentrado. Recortamos a mano un cuadrado centrado en el
// contenido realmente opaco (bordes con alfa > 200), con un margen parejo.
async function trimmedMark() {
  const CENTER_X = 502
  const CENTER_Y = 486
  const HALF = 290
  return sharp(source)
    .extract({ left: CENTER_X - HALF, top: CENTER_Y - HALF, width: HALF * 2, height: HALF * 2 })
    .toBuffer()
}

async function iconOnBrandBg(size, markScale) {
  const trimmed = await trimmedMark()
  const markSize = Math.round(size * markScale)
  const markBuf = await sharp(trimmed)
    .resize(markSize, markSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1 })
    .png()
    .toBuffer()
  return sharp(roundedSquareBg(size, Math.round(size * 0.22)))
    .composite([{ input: markBuf, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function run() {
  for (const size of [192, 512]) {
    const buf = await iconOnBrandBg(size, 0.86)
    await sharp(buf).toFile(path.join(outDir, `pwa-${size}x${size}.png`))
  }

  // Maskable: el contenido debe caber en el ~65% central (safe zone de Android)
  for (const size of [192, 512]) {
    const buf = await iconOnBrandBg(size, 0.62)
    await sharp(buf).toFile(path.join(outDir, `maskable-${size}x${size}.png`))
  }

  // Apple touch icon: sin transparencia, iOS ignora el alpha.
  const appleBuf = await iconOnBrandBg(180, 0.86)
  await sharp(appleBuf).flatten({ background: BRAND_BG }).png().toFile(path.join(outDir, 'apple-touch-icon.png'))

  // Favicon: a tamaños chicos priorizamos que se note el contraste.
  for (const size of [32, 16]) {
    const buf = await iconOnBrandBg(size, 0.95)
    await sharp(buf).toFile(path.join(outDir, `favicon-${size}x${size}.png`))
  }

  // Versión chica recortada y afilada del isotipo, para usar en <img> a
  // tamaños de interfaz (sidebar, barra superior mobile) sin depender de que
  // el navegador reescale el archivo original de 1024px con su glow suave.
  const trimmed = await trimmedMark()
  await sharp(trimmed)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 1 })
    .png()
    .toFile(path.join(root, 'public', 'logo-mark.png'))

  console.log('Íconos generados en public/icons/ a partir de estudiarioimg1.png')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
