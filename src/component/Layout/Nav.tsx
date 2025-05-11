import BtnThemeToggle from "./BtnThemeToggle.tsx";
import ModalAbout from "../About/ModalAbout.tsx";
import {useState} from "react";
import ModalSetting from "./ModalSetting.tsx";

export default function Nav() {

  const [isAboutShow, setIsAboutShow] = useState<boolean>(false)

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-20">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            <li><a href='https://trafficpigeon.com' target='_blank'>前往 交通鴿手</a></li>
            <li>
              <button onClick={() => setIsAboutShow(true)}>關於</button>
            </li>

          </ul>
        </div>
      </div>
      <div className="navbar-center">
        <a className="btn btn-ghost text-xl">貼圖小鴿手</a>
      </div>
      <div className="navbar-end">
        <ModalSetting/>
        <BtnThemeToggle/>
      </div>
      <ModalAbout isShow={isAboutShow} setIsShow={setIsAboutShow}/>
    </div>
  )
}