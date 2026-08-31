import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {cpSync,existsSync} from 'node:fs';

function copyRuntimeAssets(){
  return {
    name:'kfe-runtime-assets',
    transformIndexHtml:{
      order:'pre',
      handler(html){
        if(html.includes('/src/main.js')) return html;
        return {html,tags:[...(html.includes('id="vue-runtime"')?[]:[{tag:'div',attrs:{id:'vue-runtime'},injectTo:'body'}]),{tag:'script',attrs:{type:'module',src:'/src/main.js'},injectTo:'body'}]};
      }
    },
    closeBundle(){const out=resolve('dist');if(existsSync('js'))cpSync('js',resolve(out,'js'),{recursive:true});}
  };
}

export default defineConfig({
  appType:'spa',
  // GitHub Pages needs the repository base path; local/CI browser validation needs root.
  base:process.env.GITHUB_ACTIONS==='true'?'/KANISHKA-ENTERPRISES-PWA/':'/',
  plugins:[vue(),copyRuntimeAssets()],
  server:{host:'0.0.0.0'},
  build:{target:'es2022'},
  optimizeDeps:{include:['vue']}
});
