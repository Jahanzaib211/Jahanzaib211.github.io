// Share images for each page. Usage: node scripts/share-images.mjs CHROME (needs the preview on port 4987)
import { chromium } from 'playwright-core'; import { mkdirSync } from 'node:fs'
import SOL, { SLUGS } from '../content/solutions.mjs'; import INS from '../content/insights.mjs'
mkdirSync('public/og', { recursive: true })
const b = await chromium.launch({ executablePath: process.argv[2], args: ['--no-sandbox'] }), p = await b.newPage({ viewport: { width: 1200, height: 630 } })
await p.goto('http://127.0.0.1:4987/cookies/')
const shot = async (name, l, dir, text) => { await p.evaluate(([l, dir, text]) => { document.documentElement.lang = l; document.documentElement.dir = dir; document.body.className = 'sh'; document.body.innerHTML = `<style>body.sh{margin:0;width:1200px;height:630px;background:radial-gradient(700px 500px at 85% 15%,rgba(2,104,244,.5),transparent 70%),#050a16;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:76px 84px;box-sizing:border-box}.sh h1{font-size:${text.length > 48 ? 62 : 76}px;max-width:960px;margin:0}.sh img{width:150px}.sh .m{display:flex;gap:26px;align-items:center;font-weight:700;font-size:34px;direction:ltr}[dir=rtl] .sh .m{align-self:flex-start}</style><h1></h1><div class="m"><img src="/brand/alx-mark.svg">ALI LABS X</div>`; document.querySelector('h1').textContent = text }, [l, dir, text]); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120); await p.screenshot({ path: `public/og/${name}.jpg`, type: 'jpeg', quality: 78 }) }
for (const l of ['en', 'ar', 'ur', 'zh']) {
  const t = (await import(`../content/${l}.mjs`)).default, lg = l === 'zh' ? 'zh-Hans' : l
  for (const [k, x] of [['home', t.h1], ['solutions', t.solH], ['services', t.seo.sv], ['products', t.prH], ['approach', t.apH], ['company', t.coH]]) await shot(`${l}-${k}`, lg, t.dir, x)
  for (const k of ['nova-bots', 'nova', 'loco', 'storeloom']) await shot(`${l}-${k}`, lg, t.dir, t.st[k][0])
  for (const [i, k] of SLUGS.entries()) await shot(`${l}-${k}`, lg, t.dir, SOL[l][i][0])
}
for (const a of INS) await shot(`en-${a.slug}`, 'en', 'ltr', a.title)
await b.close()
