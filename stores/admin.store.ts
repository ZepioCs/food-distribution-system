import { makeAutoObservable, runInAction } from 'mobx'
import { dbService } from '@/services/db.service'
import { IFeedback, IMeal, IMealHistory, INotification, IProfile } from '@/models/default'

export interface SystemMetrics {
  users: {
    total: number
    teachers: number
    foodProviders: number
    admins: number
  }
  orders: {
    total: number
    averagePerDay: number
    averagePerWeek: number
    averagePerMonth: number
    averageValue: number
    totalValue: number
  }
  menu: {
    totalItems: number
    activeItems: number
  }
  feedback: {
    total: number
    unresolved: number
  }
  notifications: {
    total: number
    unread: number
    info: number
    success: number
    warning: number
    error: number
  }
  analytics: {
    dailyOrders: Array<{ date: string; orders: number; value: number }>
    topItems: Array<{ name: string; count: number; revenue: number }>
  }
}

class AdminStore {
  metrics: SystemMetrics | null = null
  isLoading = false
  error: string | null = null
  lastUpdated: Date | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetchMetrics() {
    try {
      this.isLoading = true
      this.error = null

      const [
        users,
        orders,
        menuItems,
        feedback,
        notifications,
        analytics
      ] = await Promise.all([
        dbService.getAllProfiles(),
        dbService.getAllOrders(),
        dbService.getAllMenuItems(),
        dbService.getFeedback(),
        dbService.getAllNotifications(),
        dbService.getAnalytics({ 
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          useTimeRange: false
        })
      ])

      if (!users || !orders || !menuItems || !feedback || !notifications || !analytics) {
        throw new Error('Failed to fetch some metrics data')
      }

      // Calculate averages
      const ordersByDay = new Map<string, number>()
      const ordersByWeek = new Map<string, number>()
      const ordersByMonth = new Map<string, number>()

      orders.forEach((order: IMealHistory) => {
        const date = new Date(order.date)
        const dayKey = date.toISOString().split('T')[0]
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

        ordersByDay.set(dayKey, (ordersByDay.get(dayKey) || 0) + 1)
        ordersByWeek.set(weekKey, (ordersByWeek.get(weekKey) || 0) + 1)
        ordersByMonth.set(monthKey, (ordersByMonth.get(monthKey) || 0) + 1)
      })

      const averagePerDay = ordersByDay.size > 0 
        ? Array.from(ordersByDay.values()).reduce((a, b) => a + b, 0) / ordersByDay.size 
        : 0

      const averagePerWeek = ordersByWeek.size > 0
        ? Array.from(ordersByWeek.values()).reduce((a, b) => a + b, 0) / ordersByWeek.size
        : 0

      const averagePerMonth = ordersByMonth.size > 0
        ? Array.from(ordersByMonth.values()).reduce((a, b) => a + b, 0) / ordersByMonth.size
        : 0

      runInAction(() => {
        this.metrics = {
          users: {
            total: users.length,
            teachers: users.filter((u: IProfile) => u.role === 'teacher').length,
            foodProviders: users.filter((u: IProfile) => u.role === 'food_provider').length,
            admins: users.filter((u: IProfile) => u.role === 'admin').length
          },
          orders: {
            total: orders.length,
            averagePerDay: Math.round(averagePerDay * 10) / 10,
            averagePerWeek: Math.round(averagePerWeek * 10) / 10,
            averagePerMonth: Math.round(averagePerMonth * 10) / 10,
            averageValue: analytics.averageOrderValue,
            totalValue: analytics.totalCost
          },
          menu: {
            totalItems: menuItems.length,
            activeItems: menuItems.filter((i: IMeal) => i.type > 0).length
          },
          feedback: {
            total: feedback.length,
            unresolved: feedback.filter((f: IFeedback) => !f.resolved).length
          },
          notifications: {
            total: notifications.length,
            unread: notifications.filter((n: INotification) => !n.read).length,
            info: notifications.filter((n: INotification) => n.type === 'info').length,
            success: notifications.filter((n: INotification) => n.type === 'success').length,
            warning: notifications.filter((n: INotification) => n.type === 'warning').length,
            error: notifications.filter((n: INotification) => n.type === 'error').length
          },
          analytics: {
            dailyOrders: analytics.dailyOrders,
            topItems: analytics.topItems
          }
        }
        this.lastUpdated = new Date()
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch metrics'
      })
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  startAutoRefresh(intervalMs: number = 30000) {
    setInterval(() => this.fetchMetrics(), intervalMs)
  }
}

export const adminStore = new AdminStore() 