import {useEffect, useState} from "react";
import { FiMoon, FiSun  } from "react-icons/fi";

export default function BtnThemeToggle() {

  const [theme, setTheme] = useState(() => {
    // 初始化從 localStorage 讀取，或預設為 light
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    // 每次主題變更時，更新 <html data-theme="">
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button onClick={toggleTheme} className='btn btn-ghost btn-circle'>
      {theme === "dark" ? <FiMoon className='text-lg'/> : <FiSun className='text-lg'/>  }
    </button>
  );
}