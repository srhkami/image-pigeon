---
id: work-order-image-pigeon-fastapi-session-project-format-phase-6b-opencode-2026-07-01
type: work-order
status: active
canonical: false
created_at: 2026-07-01T00:00:00+08:00
project: image-pigeon
phase: 6B
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-6-sliced-2026-07-01
---

# Phase 6B OpenCode Work Order：pywebview path + frontend 儲存/開啟 `.ipigeon/`

請在 repo root 執行。只能使用 repo-relative paths；不要 commit、不要 push；不要讀取 `.env`、credentials、或 repo 外路徑。

## 目標

接上 Phase 6A 後端 API，完成桌面 app 的新版專案儲存與開啟流程：

- pywebview `select_path` 增加 project folder 儲存/開啟模式。
- frontend 新增 project API client。
- UI 新增「儲存專案」與「開啟專案」。
- 開啟 `.ipigeon/` 後更新 `project` / `sessionId`，預覽圖片、備註、排序、旋轉仍存在。

## 必讀上下文

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` Phase 6
- `docs/plans/2026-07-01-0000-fastapi-session-project-format-phase-6-sliced-plan.md`
- `docs/result/2026-07-01-0000-fastapi-session-project-format-phase-6a-result.md`
- `py/main.py`
- `src/App.tsx`
- `src/layout/Nav.tsx`
- `src/layout/Footer.tsx`
- `src/features/Output/ModalOutput.tsx`
- `src/features/Output/SaveJson.tsx`
- `src/services/apiClient.ts`
- `src/services/imageApi.ts`
- `src/types/project.ts`
- `src/state/projectState.ts`
- `src/state/projectImageAdapter.ts`

## 後端 / pywebview scope

Modify `py/main.py` `Api.select_path`:

Add modes:

1. `project-save`
   - Use SAVE dialog if feasible with `save_filename=f'{title}.ipigeon'`, or folder dialog if pywebview SAVE cannot represent folder. Keep behavior practical for pywebview.
   - Return selected path string.
   - If user selects/saves a path without `.ipigeon` suffix, append `.ipigeon` before returning.
   - User-facing cancel message should remain clear.

2. `project-open`
   - Use FOLDER dialog.
   - Return selected folder path.

Do not remove existing `word` / `json` / `images` modes.

Update `src/globak.d.ts` / `src/utils/type.ts` if needed so TS accepts new select modes.

## Frontend API client scope

Create or extend service files:

- `src/services/projectApi.ts` (preferred new file)

Functions:

```ts
saveProject(params: { sessionId: string; project: ProjectV2; targetPath: string }): Promise<ProjectSaveResponse>
openProject(params: { projectPath: string }): Promise<ProjectOpenResponse>
```

Types can live in `src/types/project.ts`:

- `ProjectSaveResponse`
- `ProjectOpenResponse`
- response data shape `{ path: string; project: ProjectV2 }` and `{ sessionId: string; project: ProjectV2 }`

Use existing `requestJson` wrapper. Do not invent query params.

## Frontend state/adapter scope

Open project must update both canonical and transition states:

- `setProject(opened.project)`
- `setSessionId(opened.sessionId)`
- sync legacy `images` from opened ProjectV2 for compatibility with legacy JSON / output UI where still needed.

Add helper if needed, e.g. in `src/state/projectImageAdapter.ts`:

```ts
toCustomImagesFromProject(project: ProjectV2, sessionId: string): CustomImage[]
```

Rules:

- Use project `layout.itemOrder` order, not raw `items` order.
- Use `/api/sessions/{sessionId}/assets/{assetId}/image` preview URLs.
- Do not set `base64`.
- Preserve `remark`, `rotation`, width/height.

## Frontend UI scope

Implement UI in a small, understandable component. Preferred:

- Create `src/features/Project/OpenProject.tsx` or similar.
- Export from `src/features/index.ts` if needed.
- Place in `Nav` menu or navbar area, because project open/save is app-level, not image export. If placement requires props, update `App.tsx` to pass `project`, `sessionId`, `setProject`, `setSessionId`, `setImages` to `Nav` or the new component.

Required UI behavior:

1. 儲存專案
   - Disabled or clear warning if no `sessionId` or no project items.
   - Call `window.pywebview.api.select_path({ mode: 'project-save', title: project.document.title || '照片黏貼表' })`.
   - Check pywebview response with existing `checkStatus` if suitable.
   - Call `saveProject({ sessionId, project, targetPath })`.
   - Toast success/error via existing `showToast` or project convention.

2. 開啟專案
   - Call `window.pywebview.api.select_path({ mode: 'project-open' })`.
   - Call `openProject({ projectPath })`.
   - Update canonical/legacy states.
   - Turn off move mode only if necessary; do not introduce unrelated behavior.
   - Toast success/error.

3. Legacy JSON
   - `SaveJson` remains legacy only. Do not rename it back to project save.
   - Do not write Word/SaveImages options into `project`.

## Acceptance criteria

AC1. pywebview select_path supports `project-save` and `project-open`, old modes remain working.

AC2. Frontend can call `/api/project/save` with `{ sessionId, project, targetPath }` from project save UI.

AC3. Frontend can call `/api/project/open` and then set `project` / `sessionId` / preview bridge.

AC4. Opened project preview order uses `layout.itemOrder`.

AC5. Opened project preview preserves item `remark` and `rotation`.

AC6. Project save/open does not store Word/export options in `project`.

AC7. TypeScript build passes.

AC8. Existing lint may have unrelated errors; result report must distinguish unrelated lint from new files.

## Verification commands

Run and record exact outcomes:

```bash
uv run python -m unittest discover -s core/tests -p 'test_project_api.core' -v
uv run python -m unittest discover -s core/tests -v
uv run python -m compileall core
pnpm -s tsc -b
pnpm run build
pnpm run lint
```

Also run grep checks and record:

```bash
grep -R "project-save\|project-open" -n core/main.core src
```

If `python -m compileall py` creates `__pycache__`, remove those generated cache dirs before final result.

## Required result report

Create `docs/result/2026-07-01-0000-fastapi-session-project-format-phase-6b-result.md` with:

- frontmatter: `type: result`, `status: completed|partial|blocked`, `canonical: true`, `phase: 6B`
- completed items mapped to AC1-AC8
- changed files
- verification commands + exact outcomes
- blockers/deferred items

If blocked, still create the result report with `status: blocked` or `partial` and stop.
