"use client"

import { useEffect } from "react"
import { useRootStore } from "./store-provider"
import { observer } from "mobx-react-lite"

export const ThemeProvider = observer(({ children }: { children: React.ReactNode }) => {
  const { settingsStore } = useRootStore()

  useEffect(() => {
    // Apply theme from settings
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(settingsStore.settings.theme)

    // Set language
    document.documentElement.lang = settingsStore.settings.language
  }, [settingsStore.settings.theme, settingsStore.settings.language])

  return <>{children}</>
}) 