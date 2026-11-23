import { defineConfig } from 'vite'
import { globSync } from 'node:fs'
// Every page that scripts/pages.mjs writes
const input = globSync('**/*.html', { exclude: f => /^(dist|node_modules|content|public|\.git)/.test(String(f)) }) as string[]
export default defineConfig({ appType: 'mpa', build: { target: 'es2022', rollupOptions: { input } } })
