import {useEffect, useState} from "react";
import { FiMoon, FiSun  } from "react-icons/fi";
import {Button} from "@/component";
import {readBrowserPreference, writeBrowserPreference} from '@/services/browserPreferenceStorage.ts'

export default function BtnThemeToggle() {

  const [theme, setTheme] = useState(() => {
    // 儲存空間不可用時使用預設主題。
    return readBrowserPreference("theme") || "dark";
  });

  useEffect(() => {
    // 每次主題變更時，更新 <html data-theme="">
    document.documentElement.setAttribute("data-theme", theme);
    writeBrowserPreference("theme", theme);
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