"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useRootStore } from "@/providers/store-provider"
import { authService } from "@/services/auth.service"
import { dbService } from "@/services/db.service"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { appStore } = useRootStore()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getCurrentSession()
        if (session) {
          // If we have a session but not logged in in the store, get the profile and log in
          if (!appStore.isLoggedIn) {
            const profile = await dbService.getProfile(session.user.id)
            if (profile) {
              await appStore.login(profile.role)
            } else {
              router.push(`/${locale}/login`)
            }
          }
        } else {
          // No session, go to login unless we're already on the login page
          if (!window.location.pathname.includes('/login')) {
            router.push(`/${locale}/login`)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push(`/${locale}/login`)
      } finally {
        setIsLoading(false)
      }
    }

    void checkAuth()
  }, [appStore, router, locale])

  if (isLoading) {
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

  return children
} 