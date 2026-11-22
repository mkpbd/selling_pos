import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/shared/constants/storage-keys'
import type { Theme } from '@/shared/types'
import { ThemeContext, type ThemeContextValue } from './theme-context'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.theme)
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
  } catch {
    return 'system'
  }
}

function subscribeSystem(onChange: () => void) {
  const mql = window.matchMedia(DARK_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSystemDark = () => window.matchMedia(DARK_QUERY).matches

/** Class-strategy theme provider (toggles `.dark` on <html>). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const systemDark = useSyncExternalStore(subscribeSystem, getSystemDark, () => false)
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, next)
    } catch {
      // Ignore storage failures; the theme still applies for this session.
    }
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
