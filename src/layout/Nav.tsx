import BtnThemeToggle from "./BtnThemeToggle.tsx";
import ModalDisclaimer from "@/features/About/ModalDisclaimer.tsx";
import {useState} from "react";
import ModalChangelog from "@/features/About/ModalChangelog.tsx";
import {Dropdown, DropdownToggle, DropdownContent} from "@/component";
import {HiMenuAlt2} from "react-icons/hi";

export default function Nav() {

  const [isDisclaimerShow, setIsDisclaimerShow] = useState<boolean>(false);
  const [isChangelogShow, setIsChangelogShow] = useState<boolean>(false);

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-20">
      <div className="navbar-start">
        <Dropdown>
          <DropdownToggle style='ghost' shape='circle' dropdownIcon={false}>
            <HiMenuAlt2 className="h-5 w-5"/>
          </DropdownToggle>
          <DropdownContent>
            <ul className="menu">
              <li>
                <button onClick={() => setIsDisclaimerShow(true)}>免責聲明</button>
              </li>
              <li>
                <button onClick={() => setIsChangelogShow(true)}>更新日誌</button>
              </li>
            </ul>
          </DropdownContent>
        </Dropdown>
      </div>
      <div className="navbar-center">
        <a className="btn btn-ghost text-xl">貼圖小鴿手</a>
      </div>
      <div className="navbar-end">
        <BtnThemeToggle/>
      </div>
      <ModalDisclaimer isShow={isDisclaimerShow} setIsShow={setIsDisclaimerShow}/>
      <ModalChangelog isShow={isChangelogShow} setIsShow={setIsChangelogShow}/>
    </div>
  )
}