export type FileLike = {
  readonly name: string,
}

export type ImageFilePartition<T extends FileLike> = {
  readonly accepted: T[],
  readonly rejected: T[],
}

export function isExternalFileDrag(types: ArrayLike<string> | null | undefined): boolean {
  return Array.from(types ?? []).some(type => type === 'Files')
}

export function partitionSupportedImageFiles<T extends FileLike>(
  files: Iterable<T>,
  supportedExtensions: ReadonlySet<string>,
): ImageFilePartition<T> {
  const accepted: T[] = []
  const rejected: T[] = []

  for (const file of files) {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (supportedExtensions.has(extension)) {
      accepted.push(file)
    } else {
      rejected.push(file)
    }
  }

  return {accepted, rejected}
}

export function updateDragDepth(currentDepth: number, delta: number): number {
  return Math.max(0, currentDepth + delta)
}

export function notifyOptionalProgress(
  bridge: {updateProgress?: (progress: number) => void} | undefined,
  progress: number,
): void {
  bridge?.updateProgress?.(progress)
}
