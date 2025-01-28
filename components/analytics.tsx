"use client"

import { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'
import { dbService } from "@/services/db.service"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyOrder {
  date: string;
  orders: number;
}

const Analytics = observer(() => {
  const t = useTranslations()
  const { toast: showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Set default dates (last year to today)
  const today = new Date()
  const lastYear = new Date()
  lastYear.setFullYear(today.getFullYear() - 1)
  
  const [dateRange, setDateRange] = useState({
    startDate: lastYear.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  })

  const [analyticsData, setAnalyticsData] = useState<{
    totalOrders: number;
    averageOrderValue: number;
    topItems: any[];
    dailyOrders: DailyOrder[];
    weeklyTrends: any[];
    monthlyOverview: any[];
  }>({
    totalOrders: 0,
    averageOrderValue: 0,
    topItems: [],
    dailyOrders: [],
    weeklyTrends: [],
    monthlyOverview: []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    showToast({
      title: t('Toast.info.title'),
      description: t('Toast.info.dataLoading')
    })

    try {
      const data = await dbService.getAnalytics({
        startDate: dateRange.startDate + 'T00:00:00Z',
        endDate: dateRange.endDate + 'T23:59:59Z'
      })
      setAnalyticsData(data)
    } catch (error) {
      showToast({
        title: t('Toast.error.title'),
        description: t('Toast.error.generic'),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch analytics on component mount
  useEffect(() => {
    fetchAnalytics()
  }, [])

  return (
    <div className="container space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Analytics.title')}</CardTitle>
          <CardDescription>{t('Analytics.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Analytics.metrics.totalOrders')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Analytics.metrics.averageOrderValue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.averageOrderValue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <Label htmlFor="startDate">{t('Analytics.filters.startDate')}</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="w-full md:w-auto">
                <Label htmlFor="endDate">{t('Analytics.filters.endDate')}</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchAnalytics} disabled={isLoading}>
                  {t('Analytics.filters.apply')}
                </Button>
              </div>
            </div>

            {analyticsData.dailyOrders.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('Analytics.charts.daily')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.dailyOrders}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('Analytics.noData')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default Analytics 