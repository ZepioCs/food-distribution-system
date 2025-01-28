"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useRootStore } from "@/providers/store-provider"

export default function Home() {
  const router = useRouter()
  const params = useParams()
  const { appStore } = useRootStore()
  const locale = (params?.locale as string) || 'en'

  useEffect(() => {
    // Only redirect to dashboard if we're already logged in
    // Otherwise, let the auth wrapper handle the redirection to login
    if (appStore.isLoggedIn) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [router, locale, appStore.isLoggedIn])
  
  // Show loading state while auth check is happening
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-lg font-medium text-muted-foreground">
          Loading...
        </div>
      </div>
    </div>
  )
} 