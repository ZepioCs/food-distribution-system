"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { dbService } from "@/services/db.service"
import { INotification } from "@/models/default"
import { useRootStore } from "@/providers/store-provider"
import { cn } from "@/lib/utils"
import { supabase } from "@/services/auth.service"
import { useTranslations } from 'next-intl'

const getNotificationStyles = (type: INotification['type']) => {
  switch (type) {
    case 'error':
      return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/50'
    case 'warning':
      return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50'
    case 'success':
      return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/50'
    case 'info':
    default:
      return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/50'
  }
}

const getNotificationIcon = (type: INotification['type']) => {
  switch (type) {
    case 'error':
      return '🚫'
    case 'warning':
      return '⚠️'
    case 'success':
      return '✅'
    case 'info':
    default:
      return 'ℹ️'
  }
}

export default function Notifications() {
  const t = useTranslations('Notifications')
  const { appStore } = useRootStore()
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (appStore.isLoggedIn) {
      loadNotifications()
    }
  }, [appStore.isLoggedIn])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const notifs = await dbService.getNotifications(user.id)
        setNotifications(notifs)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await dbService.markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      await dbService.deleteNotification(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 border-b">
          <h4 className="font-semibold">{t('title')}</h4>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('noNotifications')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 relative transition-colors",
                    getNotificationStyles(notification.type),
                    !notification.read && "bg-opacity-80"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span>{getNotificationIcon(notification.type)}</span>
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-background/80"
                        onClick={() => handleDelete(notification.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 hover:bg-background/80"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          {t('markAllRead')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 