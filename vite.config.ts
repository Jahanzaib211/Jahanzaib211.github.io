import { defineConfig } from 'vite'
const pages = ['nova-bots', 'nova', 'loco', 'storeloom'].map(p => `products/${p}.html`)
const input = ['', 'ar/', 'ur/', 'zh/'].flatMap(l => ['index.html', ...pages].map(p => l + p)).concat('privacy.html', 'terms.html', '404.html')
export default defineConfig({ build: { target: 'es2022', rollupOptions: { input } } })
