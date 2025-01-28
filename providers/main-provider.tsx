"use client"

import { StoreProvider } from "@/providers/store-provider"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes"
import { Analytics } from "@vercel/analytics/react"
import AuthWrapper from "@/wrapper/auth-wrapper"

export function MainProvider({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster />
        <Analytics />
        <AuthWrapper>{children}</AuthWrapper>
      </ThemeProvider>
    </StoreProvider>
  )
} 