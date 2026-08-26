import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {copyFileSync,cpSync,existsSync} from 'node:fs';

function copyRuntimeAssets(){
  return {
    name:'kfe-runtime-assets',
    transformIndexHtml(html){
      const host='<div id="vue-runtime"></div>';
      const script='<script type="module" src="/src/main.js"></script>';
      return html.includes('id="vue-runtime"')?html:html.replace('</body>',`${host}${script}</body>`);
    },
    closeBundle(){
      const out=resolve('dist');
      const files=['manifest.json','service-worker.js','icon-192.png','icon-512.png'];
      for(const file of files){if(existsSync(file))copyFileSync(file,resolve(out,file));}
      if(existsSync('js'))cpSync('js',resolve(out,'js'),{recursive:true});
    }
  };
}

export default defineConfig({
  appType:'spa',
  plugins:[copyRuntimeAssets()],
  server:{host:'0.0.0.0'},
  build:{target:'es2022'},
  optimizeDeps:{include:['vue']}
});
