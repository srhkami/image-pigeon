export const EXTERNAL_NAVIGATION_URLS = Object.freeze({
  lineContact: 'https://line.me/ti/p/mvI1aBkiy6',
  feedbackForm: 'https://pigeonhand.tw/feedback/web',
  releaseFolder: 'https://drive.google.com/drive/folders/1VRCiQbSn09LS3aWd4mgw_Eczls9wJsRm?usp=drive_link',
  pigeonHand: 'https://pigeonhand.tw',
  trafficPigeonHand: 'https://traffic.pigeonhand.tw',
  sourceRepository: 'https://github.com/srhkami/image-pigeon.git',
} as const)

const externalNavigationAllowlist = new Set<string>(Object.values(EXTERNAL_NAVIGATION_URLS))

export function isAllowedExternalNavigation(url: string): boolean {
  return externalNavigationAllowlist.has(url)
}
