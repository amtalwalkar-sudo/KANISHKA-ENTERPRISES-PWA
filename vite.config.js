import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {cpSync,existsSync} from 'node:fs';

function copyRuntimeAssets(){
  return {
    name:'kfe-runtime-assets',
    closeBundle(){
      const out=resolve('dist');
      if(existsSync('js')) cpSync('js',resolve(out,'js'),{recursive:true});
    }
  };
}

export default defineConfig({
  appType:'spa',
  base:process.env.GITHUB_ACTIONS==='true'&&process.env.npm_lifecycle_event==='build'?'/KANISHKA-ENTERPRISES-PWA/':'/',
  plugins:[vue(),copyRuntimeAssets()],
  server:{host:'0.0.0.0'},
  build:{target:'es2022'},
  optimizeDeps:{include:['vue']}
});
