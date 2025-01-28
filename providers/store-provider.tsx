"use client"

import { createContext, useContext, ReactNode } from "react"
import { RootStore } from "@/store/root.store"
import { enableStaticRendering } from "mobx-react-lite"

// Enable static rendering for server-side
enableStaticRendering(typeof window === "undefined")

let store: RootStore | null = null

function initializeStore() {
  const _store = store ?? new RootStore()
  // For SSG and SSR always create a new store
  if (typeof window === "undefined") return _store
  // Create the store once in the client
  if (!store) store = _store
  return store
}

const StoreContext = createContext<RootStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = initializeStore()
  
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  )
}

export function useRootStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useRootStore must be used within StoreProvider")
  }
  return context
} 