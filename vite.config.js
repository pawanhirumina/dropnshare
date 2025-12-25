import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                download: resolve(__dirname, 'download.html'),
                about: resolve(__dirname, 'about.html'),
                notfound: resolve(__dirname, '404.html'),
            },
        },
    },
});
