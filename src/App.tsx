import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage} from "./utils/type.ts";
import {clearProjectItems, createEmptyProject, getOrderedItemViewModels} from "./state/projectState.ts";
import {Nav} from "@/layout";
import {ImagePreview, Intro, ModalNewVersion} from "@/features";
import Sidebar from "@/layout/Sidebar.tsx";

function App() {

  const [, setImages] = useState<Array<CustomImage>>([]);
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false); // 排序模式
  const [project, setProject] = useState(createEmptyProject());
  const [sessionId, setSessionId] = useState<string | null>(null);

  const previewItems = getOrderedItemViewModels(project, sessionId ?? "")
  const projectItemCount = previewItems.length

  return (
    <div className='h-dvh overflow-hidden flex flex-col'>
      <Nav/>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <Sidebar
          setImages={setImages}
          itemCount={projectItemCount}
          project={project}
          setProject={setProject}
          sessionId={sessionId}
          setSessionId={setSessionId}
          onClearProject={() => setProject(clearProjectItems)}
          isMoveMode={isMoveMode}
          setIsMoveMode={setIsMoveMode}
        />
        <main className='min-w-0 flex-1 overflow-hidden'>
          {!projectItemCount ? (
            <Intro/>
          ) : (
            <ImagePreview
              project={project}
              setProject={setProject}
              sessionId={sessionId}
              setImages={setImages}
              isMoveMode={isMoveMode}
            />
          )}
        </main>
      </div>

      {/*對話框*/}
      <ModalNewVersion/>
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
