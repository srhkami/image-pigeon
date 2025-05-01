import './App.css'
import Nav from "./component/Nav.tsx";
import ImageForm from "./component/ImageForm.tsx";


function App() {
  return (
    <div className='h-full w-full'>
      <Nav/>
      <div className='container'>
        <div>
          <ImageForm/>
        </div>
      </div>
    </div>
  )
}

export default App
