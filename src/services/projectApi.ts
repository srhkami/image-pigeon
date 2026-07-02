import {ProjectOpenResponse, ProjectSaveResponse, ProjectV2} from '@/types/project.ts'
import {requestJson} from '@/services/apiClient.ts'

type SaveProjectParams = {
  sessionId: string
  project: ProjectV2
  targetPath: string
}

type OpenProjectParams = {
  projectPath: string
}

export async function saveProject(params: SaveProjectParams): Promise<ProjectSaveResponse> {
  return requestJson<ProjectSaveResponse>('/api/project/save', {
    method: 'POST',
    body: {
      sessionId: params.sessionId,
      project: params.project,
      targetPath: params.targetPath,
    },
  })
}

export async function openProject(params: OpenProjectParams): Promise<ProjectOpenResponse> {
  return requestJson<ProjectOpenResponse>('/api/project/open', {
    method: 'POST',
    body: params,
  })
}
