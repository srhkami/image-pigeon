'use strict'

const ALLOWED_EXTERNAL_URLS = Object.freeze([
  'https://line.me/ti/p/mvI1aBkiy6',
  'https://pigeonhand.tw/feedback/web',
  'https://pigeonhand.tw',
  'https://traffic.pigeonhand.tw',
  'https://github.com/srhkami/image-pigeon.git',
])

const allowedExternalUrls = new Set(ALLOWED_EXTERNAL_URLS)

function isAllowedExternalUrl(url) {
  return typeof url === 'string' && allowedExternalUrls.has(url)
}

function isTrustedAppUrl(url, entryUrl) {
  try {
    const candidate = new URL(url)
    const entry = new URL(entryUrl)
    return candidate.protocol === 'file:'
      && candidate.pathname === entry.pathname
      && candidate.search === ''
  } catch {
    return false
  }
}

module.exports = {
  ALLOWED_EXTERNAL_URLS,
  isAllowedExternalUrl,
  isTrustedAppUrl,
}
