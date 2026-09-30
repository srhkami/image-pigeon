'use strict'

const https = require('node:https')

const UPDATE_ENDPOINT = 'https://api.pigeonhand.tw/web/apps/1/'
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function checkForUpdates(currentVersion, {get = https.get, timeoutMs = 8000, maxBytes = 64 * 1024} = {}) {
  return new Promise(resolve => {
    let request
    let settled = false
    const finish = result => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
      request?.destroy()
    }
    const unavailable = () => finish({status: 'unavailable'})
    const timer = setTimeout(unavailable, timeoutMs)
    try {
      request = get(UPDATE_ENDPOINT, {headers: {Accept: 'application/json'}}, response => {
        response.on('error', unavailable)
        response.on('aborted', unavailable)
        response.on('close', unavailable)
        if (settled || response.statusCode !== 200) {
          response.resume()
          unavailable()
          return
        }
        const chunks = []
        let bytes = 0
        response.on('data', chunk => {
          if (settled) return
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          bytes += buffer.length
          if (bytes > maxBytes) { unavailable(); return }
          chunks.push(buffer)
        })
        response.on('end', () => {
          if (settled) return
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (!data || typeof data !== 'object'
              || typeof data.app_version !== 'string' || data.app_version.length > 32 || !VERSION_PATTERN.test(data.app_version)
              || typeof data.whats_new !== 'string' || data.whats_new.length > 16384
              || typeof data.updated_at !== 'string' || data.updated_at.length > 64
              || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(data.updated_at) || !Number.isFinite(Date.parse(data.updated_at))) {
              unavailable()
              return
            }
            // 不把遠端下載網址或其他欄位交給網頁，手動入口使用固定允許清單。
            finish({status: 'ok', currentVersion, app_version: data.app_version, whats_new: data.whats_new, updated_at: data.updated_at})
          } catch { unavailable() }
        })
      })
      request.on('error', unavailable)
    } catch { unavailable() }
  })
}

module.exports = {checkForUpdates}
