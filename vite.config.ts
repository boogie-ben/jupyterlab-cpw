import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { relative, join } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import { visualizer } from 'rollup-plugin-visualizer'
import { nodeExternals } from 'rollup-plugin-node-externals'
import dts from 'vite-plugin-dts'

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url))

const outDir = resolve('./lib')
const outDirSrc = resolve('./lib/src')

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      nodeExternals({ devDeps: true, builtins: true }),
      vue(),
      vueJsx(),
      dts({
        copyDtsFiles: true,
        // 去除src/目录层级
        beforeWriteFile: (filepath, content) => ({ filePath: join(outDir, relative(outDirSrc, filepath)), content }),
      }),
    ],
    build: {
      lib: { entry: resolve('./src/index.ts') },
      target: 'es2018',
      outDir,
      minify: false,
      cssCodeSplit: true,
      cssMinify: false,
      sourcemap: true,
      // 开发环境使用wtach脚本时，在build时会清除lib目录，导致watch:labextension出错，所以禁止清空lib
      // 注意第一次run watch之前要先build一次
      emptyOutDir: mode !== 'dev',
      rollupOptions: {
        treeshake: mode !== 'dev',
        // external: (source) => source.includes('node_modules'),
        output: [{
          format: 'es' as any,
          // entryFileNames: '[name].js',
          // 去除src/目录层级
          entryFileNames: info => info.name.replace('src/', '') + '.js',
          preserveModules: true,
        }],
      },
    },
  }
})
