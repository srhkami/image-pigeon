export const IGNORED_UPDATE_DATE_KEY = 'image-pigeon.ignored-update-date'

type StorageWriter = {
  setItem: (key: string, value: string) => void,
}

type VersionVisibilityInput = {
  currentVersion: string,
  latestVersion: string,
  updatedAt: string,
  ignoredDate: string | null,
  sessionDismissedVersion: string | null,
}

export function toRocSevenDigitDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const rocYear = year - 1911
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  if (
    rocYear < 1
    || rocYear > 999
    || parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month - 1
    || parsedDate.getUTCDate() !== day
  ) {
    return null
  }

  return `${String(rocYear).padStart(3, '0')}${match[2]}${match[3]}`
}

export function ignoreLatestVersion(storage: StorageWriter, updatedAt: string): boolean {
  const latestDate = toRocSevenDigitDate(updatedAt)
  if (!latestDate) return false

  storage.setItem(IGNORED_UPDATE_DATE_KEY, latestDate)
  return true
}

export function shouldShowLatestVersion({
  currentVersion,
  latestVersion,
  updatedAt,
  ignoredDate,
  sessionDismissedVersion,
}: VersionVisibilityInput): boolean {
  if (latestVersion === currentVersion || sessionDismissedVersion === latestVersion) {
    return false
  }

  const latestDate = toRocSevenDigitDate(updatedAt)
  return !latestDate || latestDate !== ignoredDate
}
