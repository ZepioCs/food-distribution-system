"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRootStore } from "@/providers/store-provider"
import { observer } from "mobx-react-lite"
import { useTranslations } from 'next-intl'

const AIPredictions = observer(() => {
  const t = useTranslations('Reports')
  const [timeFrame, setTimeFrame] = useState("weekly")
  const { appStore } = useRootStore()

  useEffect(() => {
    void appStore.loadPredictions()
  }, [])

  useEffect(() => {
    if (appStore.availableYears.length > 0 && !appStore.isLoadingPredictions) {
      const firstYear = Math.min(...appStore.availableYears)
      if (firstYear !== appStore.selectedYear) {
        appStore.setSelectedYear(firstYear)
      }

      if (appStore.availableMonths.length > 0) {
        const firstMonth = Math.min(...appStore.availableMonths)
        if (firstMonth !== appStore.selectedMonth) {
          appStore.setSelectedMonth(firstMonth)
        }

        if (appStore.availableWeeks.length > 0) {
          const firstWeek = Math.min(...appStore.availableWeeks)
          if (firstWeek !== appStore.selectedWeek) {
            appStore.setSelectedWeek(firstWeek)
          }
        }
      }
    }
  }, [appStore.availableYears, appStore.isLoadingPredictions])

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  )

  const months = Array.from(
    { length: 12 },
    (_, i) => ({
      value: i,
      label: new Date(2024, i).toLocaleDateString('de-DE', { month: 'long' })
    })
  )

  const weeks = Array.from(
    { length: 5 },
    (_, i) => ({
      value: i + 1,
      label: t('filters.week', { number: i + 1 })
    })
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col space-y-4">
            <span>{t('types.aiPredictions')}</span>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="year" className="min-w-[50px]">{t('filters.year')}:</Label>
                  <Select
                    value={appStore.selectedYear.toString()}
                    onValueChange={(value) => appStore.setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger id="year" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years
                        .filter(year => appStore.availableYears.includes(year))
                        .map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="month" className="min-w-[50px]">{t('filters.month')}:</Label>
                  <Select
                    value={appStore.selectedMonth.toString()}
                    onValueChange={(value) => appStore.setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger id="month" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months
                        .filter(month => appStore.availableMonths.includes(month.value))
                        .map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {timeFrame === "weekly" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="week" className="min-w-[50px]">{t('filters.week')}:</Label>
                    <Select
                      value={appStore.selectedWeek.toString()}
                      onValueChange={(value) => appStore.setSelectedWeek(parseInt(value))}
                    >
                      <SelectTrigger id="week" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weeks
                          .filter(week => appStore.availableWeeks.includes(week.value))
                          .map((week) => (
                            <SelectItem key={week.value} value={week.value.toString()}>
                              {t('filters.week_number', { number: week.value })}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label htmlFor="time-frame" className="min-w-[50px]">{t('filters.view')}:</Label>
                  <Select value={timeFrame} onValueChange={setTimeFrame}>
                    <SelectTrigger id="time-frame" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t('types.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('types.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={appStore.predictionData[timeFrame as keyof typeof appStore.predictionData]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={timeFrame === "weekly" ? "day" : "week_name"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="breakfast" fill="#8884d8" name={t('meals.breakfast')} />
            <Bar dataKey="lunch" fill="#82ca9d" name={t('meals.lunch')} />
            <Bar dataKey="dinner" fill="#ffc658" name={t('meals.dinner')} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

export default AIPredictions

