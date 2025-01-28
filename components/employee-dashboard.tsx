"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { observer } from "mobx-react-lite"
import { useRootStore } from "@/providers/store-provider"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { useTranslations } from 'next-intl'

// Create a wrapper component for the dashboard
const EmployeeDashboardWrapper = () => {
  return (
    <EmployeeDashboardContent />
  )
}

// Main dashboard content component
const EmployeeDashboardContent = observer(() => {
  const t = useTranslations('EmployeeDashboard')
  const [exportFrom, setExportFrom] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { mealStore, settingsStore } = useRootStore()

  useEffect(() => {
    void mealStore.loadMealHistory()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterDate, searchQuery])

  const filteredHistory = mealStore.mealHistory
    .filter(meal => {
      const dateMatch = filterDate ? meal.date.startsWith(filterDate) : true
      
      const searchLower = searchQuery.toLowerCase()
      const priceMatch = meal.cost.toString().includes(searchQuery)
      const itemMatch = meal.meal?.name?.toLowerCase().includes(searchLower)
      
      return dateMatch && (!searchQuery || (priceMatch && itemMatch))
    })

  const groupedHistory = Object.entries(
    filteredHistory.reduce((acc, history) => {
      const date = new Date(history.date).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = {
          items: [],
          totalCost: 0
        }
      }
      acc[date].items.push({
        name: history.meal?.name,
        quantity: history.quantity,
        cost: history.cost
      })
      acc[date].totalCost += history.cost
      return acc
    }, {} as Record<string, { items: Array<{ name: string | undefined, quantity: number, cost: number }>, totalCost: number }>)
  )

  const itemsPerPage = settingsStore.settings.tablePageSize
  const totalPages = Math.ceil(groupedHistory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData = groupedHistory.slice(startIndex, endIndex)

  const exportHistory = () => {
    const dataToExport = exportFrom 
      ? mealStore.mealHistory.filter(meal => meal.date >= exportFrom) 
      : mealStore.mealHistory

    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "meal_history.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <div className="flex items-center gap-2">
                <Input
                  id="filter-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full sm:w-[160px]"
                />
              </div>
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('table.items')}</TableHead>
                  <TableHead className="text-right">{t('table.cost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      {searchQuery || filterDate ? t('search.noResults') : t('search.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map(([date, data]) => (
                    <TableRow key={date}>
                      <TableCell>{date}</TableCell>
                      <TableCell>
                        {data.items.map((item, index) => (
                          <div key={index}>
                            {item.quantity}x {item.name} (${item.cost.toFixed(2)})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">${data.totalCost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="font-bold">
                  <TableCell>{t('table.total')}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    ${filteredHistory.reduce((sum, history) => sum + history.cost, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t('table.page', { page: currentPage, total: totalPages })}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('export.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div>
              <Label htmlFor="export-from">{t('export.fromDate')}</Label>
              <Input id="export-from" type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
            </div>
            <Button onClick={exportHistory}>{t('export.button')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default EmployeeDashboardWrapper