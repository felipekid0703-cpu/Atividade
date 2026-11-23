import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'caderno-theme'

function getStoredTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      aria-label={`Ativar tema ${nextTheme === 'dark' ? 'escuro' : 'claro'}`}
      className="grid size-10 place-items-center rounded-full border hover:bg-muted"
      onClick={() => setTheme(nextTheme)}
      title={`Ativar tema ${nextTheme === 'dark' ? 'escuro' : 'claro'}`}
      type="button"
    >
      {theme === 'dark' ? <Sun aria-hidden size={18} /> : <Moon aria-hidden size={18} />}
    </button>
  )
}
