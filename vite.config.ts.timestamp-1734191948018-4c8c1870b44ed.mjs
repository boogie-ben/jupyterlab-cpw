// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/node_modules/vite/dist/node/index.js";
import { relative, join } from "node:path";
import vue from "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { nodeExternals } from "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/node_modules/rollup-plugin-node-externals/dist/index.js";
import dts from "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Boogie/Desktop/jupyterlab-cpw/vite.config.ts";
var resolve = (p) => fileURLToPath(new URL(p, __vite_injected_original_import_meta_url));
var outDir = resolve("./lib");
var outDirSrc = resolve("./lib/src");
var vite_config_default = defineConfig(({ mode }) => {
  return {
    plugins: [
      nodeExternals({ devDeps: true, builtins: true }),
      vue(),
      vueJsx(),
      dts({
        copyDtsFiles: true,
        // 去除src/目录层级
        beforeWriteFile: (filepath, content) => ({ filePath: join(outDir, relative(outDirSrc, filepath)), content })
      })
    ],
    build: {
      lib: { entry: resolve("./src/index.ts") },
      target: "es2018",
      outDir,
      minify: false,
      cssCodeSplit: true,
      cssMinify: false,
      sourcemap: true,
      // 开发环境使用wtach脚本时，在build时会清除lib目录，导致watch:labextension出错，所以禁止清空lib
      // 注意第一次run watch之前要先build一次
      emptyOutDir: mode !== "dev",
      rollupOptions: {
        treeshake: mode !== "dev",
        // external: (source) => source.includes('node_modules'),
        output: [{
          format: "es",
          // entryFileNames: '[name].js',
          // 去除src/目录层级
          entryFileNames: (info) => info.name.replace("src/", "") + ".js",
          preserveModules: true
        }]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxCb29naWVcXFxcRGVza3RvcFxcXFxqdXB5dGVybGFiLWNwd1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQm9vZ2llXFxcXERlc2t0b3BcXFxcanVweXRlcmxhYi1jcHdcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0Jvb2dpZS9EZXNrdG9wL2p1cHl0ZXJsYWItY3B3L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCB7IHJlbGF0aXZlLCBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xyXG4vLyBpbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJ1xyXG5pbXBvcnQgeyBub2RlRXh0ZXJuYWxzIH0gZnJvbSAncm9sbHVwLXBsdWdpbi1ub2RlLWV4dGVybmFscydcclxuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXHJcblxyXG5jb25zdCByZXNvbHZlID0gKHA6IHN0cmluZykgPT4gZmlsZVVSTFRvUGF0aChuZXcgVVJMKHAsIGltcG9ydC5tZXRhLnVybCkpXHJcblxyXG5jb25zdCBvdXREaXIgPSByZXNvbHZlKCcuL2xpYicpXHJcbmNvbnN0IG91dERpclNyYyA9IHJlc29sdmUoJy4vbGliL3NyYycpXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgbm9kZUV4dGVybmFscyh7IGRldkRlcHM6IHRydWUsIGJ1aWx0aW5zOiB0cnVlIH0pLFxyXG4gICAgICB2dWUoKSxcclxuICAgICAgdnVlSnN4KCksXHJcbiAgICAgIGR0cyh7XHJcbiAgICAgICAgY29weUR0c0ZpbGVzOiB0cnVlLFxyXG4gICAgICAgIC8vIFx1NTNCQlx1OTY2NHNyYy9cdTc2RUVcdTVGNTVcdTVDNDJcdTdFQTdcclxuICAgICAgICBiZWZvcmVXcml0ZUZpbGU6IChmaWxlcGF0aCwgY29udGVudCkgPT4gKHsgZmlsZVBhdGg6IGpvaW4ob3V0RGlyLCByZWxhdGl2ZShvdXREaXJTcmMsIGZpbGVwYXRoKSksIGNvbnRlbnQgfSksXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIGxpYjogeyBlbnRyeTogcmVzb2x2ZSgnLi9zcmMvaW5kZXgudHMnKSB9LFxyXG4gICAgICB0YXJnZXQ6ICdlczIwMTgnLFxyXG4gICAgICBvdXREaXIsXHJcbiAgICAgIG1pbmlmeTogZmFsc2UsXHJcbiAgICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICAgICAgY3NzTWluaWZ5OiBmYWxzZSxcclxuICAgICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgICAvLyBcdTVGMDBcdTUzRDFcdTczQUZcdTU4ODNcdTRGN0ZcdTc1Mjh3dGFjaFx1ODExQVx1NjcyQ1x1NjVGNlx1RkYwQ1x1NTcyOGJ1aWxkXHU2NUY2XHU0RjFBXHU2RTA1XHU5NjY0bGliXHU3NkVFXHU1RjU1XHVGRjBDXHU1QkZDXHU4MUY0d2F0Y2g6bGFiZXh0ZW5zaW9uXHU1MUZBXHU5NTE5XHVGRjBDXHU2MjQwXHU0RUU1XHU3OTgxXHU2QjYyXHU2RTA1XHU3QTdBbGliXHJcbiAgICAgIC8vIFx1NkNFOFx1NjEwRlx1N0IyQ1x1NEUwMFx1NkIyMXJ1biB3YXRjaFx1NEU0Qlx1NTI0RFx1ODk4MVx1NTE0OGJ1aWxkXHU0RTAwXHU2QjIxXHJcbiAgICAgIGVtcHR5T3V0RGlyOiBtb2RlICE9PSAnZGV2JyxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIHRyZWVzaGFrZTogbW9kZSAhPT0gJ2RldicsXHJcbiAgICAgICAgLy8gZXh0ZXJuYWw6IChzb3VyY2UpID0+IHNvdXJjZS5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJyksXHJcbiAgICAgICAgb3V0cHV0OiBbe1xyXG4gICAgICAgICAgZm9ybWF0OiAnZXMnIGFzIGFueSxcclxuICAgICAgICAgIC8vIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcclxuICAgICAgICAgIC8vIFx1NTNCQlx1OTY2NHNyYy9cdTc2RUVcdTVGNTVcdTVDNDJcdTdFQTdcclxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBpbmZvID0+IGluZm8ubmFtZS5yZXBsYWNlKCdzcmMvJywgJycpICsgJy5qcycsXHJcbiAgICAgICAgICBwcmVzZXJ2ZU1vZHVsZXM6IHRydWUsXHJcbiAgICAgICAgfV0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4UyxTQUFTLGVBQWUsV0FBVztBQUNqVixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLFVBQVUsWUFBWTtBQUMvQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBRW5CLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sU0FBUztBQVA2SyxJQUFNLDJDQUEyQztBQVM5TyxJQUFNLFVBQVUsQ0FBQyxNQUFjLGNBQWMsSUFBSSxJQUFJLEdBQUcsd0NBQWUsQ0FBQztBQUV4RSxJQUFNLFNBQVMsUUFBUSxPQUFPO0FBQzlCLElBQU0sWUFBWSxRQUFRLFdBQVc7QUFFckMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsY0FBYyxFQUFFLFNBQVMsTUFBTSxVQUFVLEtBQUssQ0FBQztBQUFBLE1BQy9DLElBQUk7QUFBQSxNQUNKLE9BQU87QUFBQSxNQUNQLElBQUk7QUFBQSxRQUNGLGNBQWM7QUFBQTtBQUFBLFFBRWQsaUJBQWlCLENBQUMsVUFBVSxhQUFhLEVBQUUsVUFBVSxLQUFLLFFBQVEsU0FBUyxXQUFXLFFBQVEsQ0FBQyxHQUFHLFFBQVE7QUFBQSxNQUM1RyxDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsS0FBSyxFQUFFLE9BQU8sUUFBUSxnQkFBZ0IsRUFBRTtBQUFBLE1BQ3hDLFFBQVE7QUFBQSxNQUNSO0FBQUEsTUFDQSxRQUFRO0FBQUEsTUFDUixjQUFjO0FBQUEsTUFDZCxXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUE7QUFBQTtBQUFBLE1BR1gsYUFBYSxTQUFTO0FBQUEsTUFDdEIsZUFBZTtBQUFBLFFBQ2IsV0FBVyxTQUFTO0FBQUE7QUFBQSxRQUVwQixRQUFRLENBQUM7QUFBQSxVQUNQLFFBQVE7QUFBQTtBQUFBO0FBQUEsVUFHUixnQkFBZ0IsVUFBUSxLQUFLLEtBQUssUUFBUSxRQUFRLEVBQUUsSUFBSTtBQUFBLFVBQ3hELGlCQUFpQjtBQUFBLFFBQ25CLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
