import {useEffect, useState} from "react";
import { FiMoon, FiSun  } from "react-icons/fi";
import {Button} from "@/component";

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
    <Button style='ghost' shape='circle' onClick={toggleTheme}>
      {theme === "dark" ? <FiMoon className='text-lg'/> : <FiSun className='text-lg'/>  }
    </Button>
  );
}