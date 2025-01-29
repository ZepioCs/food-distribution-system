"use client"

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { adminStore } from '@/stores/admin.store'

const AdminGeneral = observer(() => {
  const t = useTranslations('Admin.generalTab')
  const [timeRange, setTimeRange] = useState('allTime')
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])

  useEffect(() => {
    adminStore.fetchMetrics()
    const intervalId = setInterval(() => {
      adminStore.fetchMetrics()
    }, 30000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (adminStore.metrics) {
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case 'last30Days':
          startDate.setDate(now.getDate() - 30)
          break
        case 'last90Days':
          startDate.setDate(now.getDate() - 90)
          break
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'allTime':
          startDate = new Date(0)
          break
        default:
          startDate.setDate(now.getDate() - 90)
      }

      const dateFilteredOrders = adminStore.metrics.analytics.dailyOrders.filter(order => {
        const orderDate = new Date(order.date)
        return orderDate >= startDate && orderDate <= now
      })

      const aggregatedOrders = dateFilteredOrders.reduce((acc: { [key: string]: { date: string; orders: number; value: number } }, order) => {
        const date = order.date.split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            orders: 0,
            value: 0
          }
        }
        acc[date].orders += order.orders || 0
        acc[date].value += order.value || 0
        return acc
      }, {})

      const sortedOrders = Object.values(aggregatedOrders).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      setFilteredOrders(sortedOrders)
    }
  }, [timeRange, adminStore.metrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  if (adminStore.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('errorFetchingMetrics')}
        </AlertDescription>
      </Alert>
    )
  }

  if (!adminStore.metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metrics = adminStore.metrics

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Users Card */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t('metrics.totalUsers')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total}</div>
            <div className="h-px bg-border my-2" />
            <div className="pt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex flex-col">
                <span className="font-medium">{metrics.users.teachers}</span>
                <span>{t('metrics.teachers')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{metrics.users.foodProviders}</span>
                <span>{t('metrics.foodProviders')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{metrics.users.admins}</span>
                <span>{t('metrics.admins')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value Card */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t('metrics.averageOrderValue')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.orders.averageValue)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('metrics.averageOrderValue')}
            </p>
            <div className="h-px bg-border my-2" />
            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('metrics.averagePerDay')}</span>
                <span className="font-medium">{metrics.orders.averagePerDay}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('metrics.averagePerWeek')}</span>
                <span className="font-medium">{metrics.orders.averagePerWeek}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('metrics.averagePerMonth')}</span>
                <span className="font-medium">{metrics.orders.averagePerMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t('metrics.revenue')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.orders.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('metrics.totalRevenue')}
            </p>
            <div className="h-px bg-border my-2" />
            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('metrics.averageRevenuePerOrder')}</span>
                <span className="font-medium">{formatCurrency(metrics.orders.averageValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('metrics.dailyRevenue')}</span>
                <span className="font-medium">{formatCurrency(metrics.orders.averageValue * metrics.orders.averagePerDay)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('metrics.monthlyRevenue')}</span>
                <span className="font-medium">{formatCurrency(metrics.orders.averageValue * metrics.orders.averagePerMonth)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second info row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Active Notifications */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t('sections.notifications')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.notifications?.unread || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <span>{t('metrics.activeNotifications', { count: metrics.notifications?.total || 0 })}</span>
              <span className="text-sm">•</span>
              <span>Total: {metrics.notifications?.total || 0}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>{t('metrics.infoNotifications')}</span>
                </div>
                <span className="font-medium">{metrics.notifications?.info || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>{t('metrics.successNotifications')}</span>
                </div>
                <span className="font-medium">{metrics.notifications?.success || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span>{t('metrics.warningNotifications')}</span>
                </div>
                <span className="font-medium">{metrics.notifications?.warning || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span>{t('metrics.errorNotifications')}</span>
                </div>
                <span className="font-medium">{metrics.notifications?.error || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t('metrics.menuItems')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M3 2v6h6" />
              <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
              <path d="M21 22v-6h-6" />
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.menu.activeItems}</div>
            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>{t('metrics.totalItems')}</span>
                <span className="font-medium">{metrics.menu.totalItems}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span>Active Items</span>
                <span className="font-medium">{metrics.menu.activeItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Inactive Items</span>
                <span className="font-medium">{metrics.menu.totalItems - metrics.menu.activeItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Active %</span>
                <span className="font-medium">
                  {Math.round((metrics.menu.activeItems / metrics.menu.totalItems) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Order Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('sections.orderTrends')}</CardTitle>
            <CardDescription>
              {t('lastUpdated', { 
                time: adminStore.lastUpdated?.toLocaleTimeString() 
              })}
            </CardDescription>
          </div>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allTime">{t('filters.all')}</SelectItem>
              <SelectItem value="last30Days">{t('filters.last30Days')}</SelectItem>
              <SelectItem value="last90Days">{t('filters.last90Days')}</SelectItem>
              <SelectItem value="thisMonth">{t('filters.month')}</SelectItem>
              <SelectItem value="thisYear">{t('filters.year')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#82ca9d"
                    tickFormatter={(value: number) => String(Math.round(value))}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#8884d8"
                    tickFormatter={(value: number) => formatCurrency(value)}
                  />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number, name: string) => {
                      if (name === t('metrics.orderCount')) {
                        return [Math.round(value), name]
                      }
                      return [formatCurrency(value), name]
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{
                      paddingBottom: "20px"
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#82ca9d" 
                    name={t('metrics.orderCount')}
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    name={t('metrics.orderValue')}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-12 w-12 mb-4 text-muted-foreground/50"
              >
                <path d="M3 2v6h6" />
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
                <path d="M21 22v-6h-6" />
                <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
              </svg>
              <p className="text-sm">{t('noData')}</p>
              <p className="text-xs mt-1">{t('filters.tryDifferentRange')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.topItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
          {filteredOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.analytics.topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#82ca9d" tickFormatter={(value) => String(Math.round(value))}/>
                <YAxis yAxisId="right" orientation="right" stroke="#8884d8" tickFormatter={(value) => formatCurrency(value)}/>
                <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number, name: string) => {
                      if (name === t('metrics.orderCount')) {
                        return [Math.round(value), name]
                      }
                      return [formatCurrency(value), name]
                    }}
                  />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingTop: "10px",
                    paddingBottom: "10px"
                  }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="count" 
                  fill="#82ca9d" 
                  name={t('metrics.orderCount')}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="revenue" 
                  fill="#8884d8" 
                  name={t('metrics.revenue')}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-12 w-12 mb-4 text-muted-foreground/50"
              >
                <path d="M3 2v6h6" />
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
                <path d="M21 22v-6h-6" />
                <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
              </svg>
              <p className="text-sm">{t('noData')}</p>
              <p className="text-xs mt-1">{t('filters.tryDifferentRange')}</p>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default AdminGeneral 