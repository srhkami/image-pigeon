export const SUPPORTED_IMAGE_FILE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
  '.jfif',
])

export const SUPPORTED_IMAGE_FILE_ACCEPT = Array.from(SUPPORTED_IMAGE_FILE_EXTENSIONS).join(',')
