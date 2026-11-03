import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {defineConfig, mergeConfig, type Plugin} from 'vite'
import {viteSingleFile} from 'vite-plugin-singlefile'
import websiteConfig from './vite.config'

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string
const introPath = fileURLToPath(new URL('./src/features/Intro/Intro.tsx', import.meta.url))
const dataUrl = (name: string, mime: string) =>
  `data:${mime};base64,${readFileSync(new URL(`./public/${name}`, import.meta.url)).toString('base64')}`

function inlinePublicImages(): Plugin {
  const icon = dataUrl('Logo.svg', 'image/svg+xml')
  const images = [
    ['Logo_PH.png', dataUrl('Logo_PH.png', 'image/png')],
    ['Logo_TP.png', dataUrl('Logo_TP.png', 'image/png')],
  ]
  return {
    name: 'image-pigeon-singlefile-public-images',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler: html => html.replace('href="/Logo.svg"', `href="${icon}"`),
    },
    transform(code, id) {
      if (id.split('?')[0] !== introPath) return
      let result = code
      for (const [name, url] of images) {
        const reference = '${import.meta.env.BASE_URL}' + name
        if (!result.includes(reference)) this.error(`單檔圖片入口已變更，請更新內嵌設定：${name}`)
        result = result.replaceAll(reference, url)
      }
      return {code: result, map: null}
    },
  }
}

export default mergeConfig(websiteConfig, defineConfig({
  plugins: [
    inlinePublicImages(),
    viteSingleFile({removeViteModuleLoader: true, outputFileName: `image-pigeon-${version}.html`}),
  ],
  build: {
    outDir: `release/html-${version}`,
    copyPublicDir: false,
    sourcemap: false,
  },
}))
