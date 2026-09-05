import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';
import {cpSync,existsSync,readFileSync} from 'node:fs';

function copyRuntimeAssets(){
  return {
    name:'kfe-runtime-assets',
    closeBundle(){
      const out=resolve('dist');
      if(existsSync('js')) cpSync('js',resolve(out,'js'),{recursive:true});
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
  base:process.env.KFE_PAGES_BUILD==='true'?'/KANISHKA-ENTERPRISES-PWA/':'/',
  plugins:[vue(),copyRuntimeAssets()],
  server:{host:'0.0.0.0'},
  build:{target:'es2022'},
  optimizeDeps:{include:['vue']}
});
