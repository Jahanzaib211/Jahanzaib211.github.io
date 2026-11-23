import { defineConfig } from 'vite'
const tops = ['', 'solutions/', 'services/', 'products/', 'approach/', 'company/'].map(p => p + 'index.html')
const stories = ['nova-bots', 'nova', 'loco', 'storeloom'].map(p => `products/${p}.html`)
const input = ['', 'ar/', 'ur/', 'zh/'].flatMap(l => [...tops, ...stories].map(p => l + p)).concat('privacy.html', 'terms.html', '404.html')
export default defineConfig({ build: { target: 'es2022', rollupOptions: { input } } })
