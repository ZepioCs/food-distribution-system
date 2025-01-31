"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { observer } from "mobx-react-lite"
import { useRouter, usePathname, useParams } from "next/navigation"
import { EUserRole } from "@/models/default"
import { useRootStore } from "@/providers/store-provider"
import Notifications from "@/components/notifications"
import { useTranslations } from 'next-intl'
import LanguageSwitcher from "./language-switcher"

function Layout({ children }: {children: React.ReactNode}) {
  const t = useTranslations()
  const { appStore } = useRootStore()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const navItems = [
    { name: t('Navigation.dashboard'), href: "/dashboard", roles: [EUserRole.TEACHER, EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.adminDashboard'), href: "/admin", roles: [EUserRole.ADMIN] },
    { name: t('Navigation.reports'), href: "/reports", roles: [EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.menuManagement'), href: "/menu", roles: [EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.analytics'), href: "/analytics", roles: [EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.aiModel'), href: "/ai-model", roles: [EUserRole.ADMIN] },
    { name: t('Navigation.profile'), href: "/profile", roles: [EUserRole.TEACHER, EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.settings'), href: "/settings", roles: [EUserRole.TEACHER, EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] },
    { name: t('Navigation.feedback'), href: "/feedback", roles: [EUserRole.TEACHER, EUserRole.FOOD_PROVIDER, EUserRole.ADMIN] }
  ]

  const handleLogout = async () => {
    await appStore.logout()
    router.push(`/${locale}/login`)
  }

  const handleNavigation = (href: string) => {
    const fullPath = `/${locale}${href}`
    if (pathname !== fullPath) {
      router.push(fullPath)
    }
  }

  if (!appStore.userRole) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out bg-background border-r
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t('Common.appName')}</h1>
              <nav className="mt-6 space-y-2">
                {navItems.map(
                  (item) =>
                    item.roles.includes(appStore.userRole as EUserRole) && (
                      <Button
                        key={item.name}
                        variant={pathname === `/${locale}${item.href}` ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleNavigation(item.href)}
                      >
                        {item.name}
                      </Button>
                    ),
                )}
              </nav>
            </div>
            {/* Logout button at bottom */}
            <div className="mt-auto p-6">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                onClick={handleLogout}
              >
                {t('Navigation.logout')}
              </Button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="w-full px-4 py-4 flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center space-x-2">
                <LanguageSwitcher />
                <Notifications />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleDarkMode}
                  aria-label={t('Theme.toggleDark')}
                >
                  {mounted && (resolvedTheme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />)}
                </Button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default observer(Layout)