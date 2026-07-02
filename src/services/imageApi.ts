import {ProjectImportResponse} from '@/types/project.ts'
import {requestJson} from '@/services/apiClient.ts'

type ImportImageParams = {
  files: File[]
  sessionId?: string
  quality: 50 | 75 | 90
  minSize: number
}

type ImportLongScreenParams = {
  file: File
  sessionId?: string
  quality: 50 | 75 | 90
  minSize: number
}

export async function importImages(params: ImportImageParams): Promise<ProjectImportResponse> {
  const body = new FormData()
  if (params.sessionId) {
    body.append('session_id', params.sessionId)
  }

  params.files.forEach(file => {
    body.append('files', file)
  })
  body.append('quality', `${params.quality}`)
  body.append('min_size', `${params.minSize}`)

  return requestJson<ProjectImportResponse>('/api/images/import', {
    method: 'POST',
    body,
  })
}

export async function importLongScreen(params: ImportLongScreenParams): Promise<ProjectImportResponse> {
  const body = new FormData()
  if (params.sessionId) {
    body.append('session_id', params.sessionId)
  }

  body.append('file', params.file)
  body.append('quality', `${params.quality}`)
  body.append('min_size', `${params.minSize}`)

  return requestJson<ProjectImportResponse>('/api/images/import-long-screen', {
    method: 'POST',
    body,
  })
}

export function getAssetImageUrl(sessionId: string, assetId: string): string {
  return `/api/sessions/${sessionId}/assets/${assetId}/image`
}
