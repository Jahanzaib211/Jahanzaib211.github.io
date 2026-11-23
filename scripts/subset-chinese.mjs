// Usage: node scripts/subset-chinese.mjs NotoSansSC.ttf (rerun when content/zh.mjs changes)
import subset from 'subset-font'; import { readFileSync, writeFileSync } from 'node:fs'
const text = [...new Set(readFileSync('content/zh.mjs', 'utf8') + readFileSync('content/solutions.mjs', 'utf8') + readFileSync('src/form.json', 'utf8') + readFileSync('content/consent.mjs', 'utf8') + JSON.stringify((await import('../content/pages-i18n.mjs')).default.zh) + '中文，。？！、')].join('')
const out = await subset(readFileSync(process.argv[2]), text, { targetFormat: 'woff2', variationAxes: { wght: { min: 400, max: 700 } } })
writeFileSync('public/assets/fonts/alx-chinese.woff2', out); console.log(out.length)
