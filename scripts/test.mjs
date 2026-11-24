// Runs the browser checks in parallel parts. BROWSER is chromium, firefox or webkit. SHARDS sets how many run at once.
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'
const n = Math.max(1, Number(process.env.SHARDS ?? Math.min(5, Math.floor(availableParallelism() / 2)))), t0 = Date.now()
const part = i => new Promise(r => { let out = ''; const p = spawn(process.execPath, ['--test', '--test-reporter=spec', 'tests/site.test.mjs'], { env: { ...process.env, SHARD: `${i}/${n}` } }); for (const s of [p.stdout, p.stderr]) s.on('data', d => { out += d; for (const l of String(d).split('\n')) if (/^(✔|✖|﹣) .*\(\d/.test(l)) console.log(l) }); p.on('close', code => r({ code, out })) })
const done = await Promise.all(Array.from({ length: n }, (_, i) => part(i))), sum = k => done.reduce((a, d) => a + Number(d.out.match(new RegExp(`ℹ ${k} (\\d+)`))?.[1] ?? 0), 0)
for (const d of done) if (d.code) console.log(d.out.split('✖ failing tests:')[1] ?? d.out)
console.log(`${process.env.BROWSER ?? 'chromium'}: ${sum('pass')} passed, ${sum('fail')} failed, ${sum('skipped')} skipped, ${n} parts, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
// A part that ran nothing is a failure, not a success
process.exit(done.some(d => d.code || !/ℹ pass [1-9]/.test(d.out)) ? 1 : 0)
