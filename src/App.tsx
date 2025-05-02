import './App.css'
import Nav from "./component/Nav.tsx";
import ImageUpload from "./component/ImageUpload/ImageUpload.tsx";
import {Toaster} from "react-hot-toast";


function App() {
  return (
    <div className='h-full w-full'>
      <Nav/>
      <div className='container'>
        <div>
          <ImageUpload/>
        </div>
      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
