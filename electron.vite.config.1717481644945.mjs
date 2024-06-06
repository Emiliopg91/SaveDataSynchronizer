/* eslint-disable @typescript-eslint/explicit-function-return-type */
// electron.vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import fs from 'fs';
import path, { resolve } from 'path';

function findFile(fileName, dir) {
  const result = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);
    if (fileStat.isDirectory()) {
      findFile(fileName, filePath).forEach((f) => {
        result.push(f);
      });
    } else if (file.endsWith(fileName)) {
      result.push(path.join(dir, file).replaceAll('\\', '/'));
    }
  }
  return result;
}
var htmls = findFile('.html', 'src/renderer');
console.info('HTMLS: ', htmls);
var electron_vite_config_default = defineConfig({
  main: {
    plugins: []
  },
  preload: {
    plugins: []
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        input: htmls
      }
    },
    plugins: [react()]
  }
});
export { electron_vite_config_default as default };
