import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {cpSync,existsSync,readFileSync} from 'node:fs';

function restoreCanonicalSourceIndex(){
  return {
    name:'kfe-canonical-source-index',
    buildStart(){
      const source=resolve('index.source.html');
      const target=resolve('index.html');
      if(!existsSync(source)) throw new Error('Missing canonical source index: index.source.html');
      cpSync(source,target);
    }
  };
}

function copyRuntimeAssets(){
  return {
    name:'kfe-runtime-assets',
    closeBundle(){
      const out=resolve('dist');
      if(existsSync('js')) cpSync('js',resolve(out,'js'),{recursive:true});
      // These files live at repository root for the existing runtime/tests,
      // but GitHub Pages publishes only dist. Copy the complete PWA runtime
      // surface into the production artifact so the deployed app is not a
      // blank shell with missing service-worker/icons.
      for(const file of ['service-worker.js','icon-192.png','icon-512.png']){
        if(existsSync(file)) cpSync(file,resolve(out,file));
      }
    },
    configurePreviewServer(server){
      server.middlewares.use((req,res,next)=>{
        if(req.url?.split('?')[0]==='/manifest.json'){
          const manifest=resolve('dist','manifest.json');
          if(existsSync(manifest)){
            res.statusCode=200;
            res.setHeader('Content-Type','application/manifest+json');
            res.end(readFileSync(manifest));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  appType:'spa',
  // GitHub Pages is a project site. Keep the production base deterministic
  // instead of depending on npm's lifecycle environment.
  base:process.env.GITHUB_ACTIONS==='true'?'/KANISHKA-ENTERPRISES-PWA/':'/',
  plugins:[restoreCanonicalSourceIndex(),vue(),copyRuntimeAssets()],
  server:{host:'0.0.0.0'},
  build:{target:'es2022'},
  optimizeDeps:{include:['vue']}
});
