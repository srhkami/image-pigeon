export type DesktopUpdateAvailableResult = {
  readonly status: 'ok',
  readonly currentVersion: string,
  readonly app_version: string,
  readonly whats_new: string,
  readonly updated_at: string,
}

export type DesktopUpdateResult = DesktopUpdateAvailableResult | {readonly status: 'unavailable'}

export type DesktopUpdateBridge = {
  checkForUpdates: () => Promise<DesktopUpdateResult>,
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type DesktopUpdateServiceOptions = {
  readonly desktop?: DesktopUpdateBridge,
  readonly storage?: StorageLike,
  readonly sessionStorage?: StorageLike,
}

declare global {
  interface Window {
    imagePigeonDesktop?: DesktopUpdateBridge,
  }
}

const IGNORED_UPDATE_DATE_KEY = 'image-pigeon.ignored-update-date'
const DISMISSED_NEW_VERSION_KEY = 'image-pigeon.dismissed-new-version'

function isThreePartVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version)
}

export function isRemoteVersionNewer(remoteVersion: string, currentVersion: string): boolean {
  if (!isThreePartVersion(remoteVersion) || !isThreePartVersion(currentVersion)) return false
  const remoteParts = remoteVersion.split('.').map(Number)
  const currentParts = currentVersion.split('.').map(Number)
  for (let index = 0; index < remoteParts.length; index += 1) {
    if (remoteParts[index] > currentParts[index]) return true
    if (remoteParts[index] < currentParts[index]) return false
  }
  return false
}

export function toMinguoUpdateDate(updatedAt: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(updatedAt)
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const minguoYear = year - 1911
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    minguoYear < 1
    || minguoYear > 999
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null
  return `${String(minguoYear).padStart(3, '0')}${match[2]}${match[3]}`
}

function getDesktopBridge(): DesktopUpdateBridge | undefined {
  if (typeof window === 'undefined') return undefined
  return window.imagePigeonDesktop
}

function getBrowserStorage(name: 'localStorage' | 'sessionStorage'): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window[name]
  } catch {
    return undefined
  }
}

function safelyRead(storage: StorageLike | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safelyWrite(storage: StorageLike | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value)
  } catch {
    // 儲存空間不可用時仍維持本頁關閉狀態。
  }
}

export function createDesktopUpdateService(options: DesktopUpdateServiceOptions = {}) {
  const desktop = options.desktop ?? getDesktopBridge()
  const storage = options.storage ?? getBrowserStorage('localStorage')
  const sessionStorage = options.sessionStorage ?? options.storage ?? getBrowserStorage('sessionStorage')
  let checkForUpdatesPromise: Promise<DesktopUpdateResult> | undefined
  let dismissedForSession = false

  const isDismissed = () => dismissedForSession || safelyRead(sessionStorage, DISMISSED_NEW_VERSION_KEY) === '1'

  return {
    checkForUpdates(): Promise<DesktopUpdateResult> {
      if (checkForUpdatesPromise) return checkForUpdatesPromise
      if (!desktop) return checkForUpdatesPromise = Promise.resolve({status: 'unavailable'})
      try {
        checkForUpdatesPromise = Promise.resolve(desktop.checkForUpdates())
          .catch(() => ({status: 'unavailable'}))
      } catch {
        checkForUpdatesPromise = Promise.resolve({status: 'unavailable'})
      }
      return checkForUpdatesPromise
    },
    shouldPrompt(result: DesktopUpdateResult): result is DesktopUpdateAvailableResult {
      if (result.status !== 'ok' || isDismissed()) return false
      const updateDate = toMinguoUpdateDate(result.updated_at)
      return updateDate !== null
        && safelyRead(storage, IGNORED_UPDATE_DATE_KEY) !== updateDate
        && isRemoteVersionNewer(result.app_version, result.currentVersion)
    },
    dismiss(): void {
      dismissedForSession = true
      safelyWrite(sessionStorage, DISMISSED_NEW_VERSION_KEY, '1')
    },
    ignore(result: DesktopUpdateAvailableResult): void {
      const updateDate = toMinguoUpdateDate(result.updated_at)
      if (updateDate) safelyWrite(storage, IGNORED_UPDATE_DATE_KEY, updateDate)
      dismissedForSession = true
      safelyWrite(sessionStorage, DISMISSED_NEW_VERSION_KEY, '1')
    },
  }
}

export const desktopUpdate = createDesktopUpdateService()
