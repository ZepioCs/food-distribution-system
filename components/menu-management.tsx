"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AddFoodMenu from "@/components/add-food-menu"
import EditFoodMenu from "@/components/edit-food-menu"
import { IMeal } from "@/models/default"
import { useRootStore } from "@/providers/store-provider"
import { observer } from "mobx-react-lite"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Trash2Icon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useTranslations } from 'next-intl'

const LoadingSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="w-[100px] min-w-[100px]">
          <div className="h-24 w-24 rounded-md bg-muted" />
        </TableCell>
        <TableCell className="min-w-[150px]">
          <div className="h-4 w-[120px] bg-muted rounded" />
        </TableCell>
        <TableCell className="min-w-[200px]">
          <div className="h-4 w-[180px] bg-muted rounded" />
        </TableCell>
        <TableCell className="min-w-[120px]">
          <div className="h-4 w-[100px] bg-muted rounded" />
        </TableCell>
        <TableCell className="min-w-[100px]">
          <div className="h-4 w-[60px] bg-muted rounded" />
        </TableCell>
        <TableCell className="min-w-[180px] space-x-2">
          <div className="flex space-x-2">
            <div className="h-9 w-9 bg-muted rounded" />
            <div className="h-9 w-9 bg-muted rounded" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
)

const MenuManagement = observer(() => {
  const t = useTranslations('MenuManagement')
  const { appStore, settingsStore } = useRootStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    void appStore.loadMeals()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredMenuItems = appStore.menuItems.filter(meal => 
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const itemsPerPage = settingsStore.settings.tablePageSize
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData = filteredMenuItems.slice(startIndex, endIndex)

  return (
    <div className="h-full">
      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="truncate">{t('title')}</CardTitle>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('form.name')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                disabled={appStore.isLoadingMeals}
              />
            </div>
            <div className="flex-shrink-0">
              <AddFoodMenu onAddMenuMeal={appStore.addMenuMeal} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border">
            <div className="max-h-[calc(100vh-13rem)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-10 bg-background w-[100px] min-w-[100px] sticky top-0">{t('form.image')}</TableHead>
                    <TableHead className="h-10 bg-background min-w-[150px] sticky top-0">{t('table.name')}</TableHead>
                    <TableHead className="h-10 bg-background min-w-[200px] sticky top-0">{t('form.description')}</TableHead>
                    <TableHead className="h-10 bg-background min-w-[120px] sticky top-0">{t('table.category')}</TableHead>
                    <TableHead className="h-10 bg-background min-w-[100px] sticky top-0">{t('table.price')}</TableHead>
                    <TableHead className="h-10 bg-background min-w-[180px] sticky top-0 right-0">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {appStore.isLoadingMeals ? (
                      <LoadingSkeleton />
                    ) : filteredMenuItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {searchQuery ? t('messages.noResults') : t('messages.noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPageData.map((meal: IMeal) => (
                        <TableRow key={meal.id}>
                          <TableCell className="w-[100px] min-w-[100px]">
                            {meal.image ? (
                              <div className="relative h-24 w-24 overflow-hidden rounded-md">
                                <Image
                                  src={meal.image}
                                  alt={meal.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center">
                                {t('form.noImage')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium min-w-[150px]">{meal.name}</TableCell>
                          <TableCell className="max-w-[200px] min-w-[200px] truncate">{meal.description}</TableCell>
                          <TableCell className="capitalize min-w-[120px]">{meal.category}</TableCell>
                          <TableCell className="min-w-[100px]">${meal.price.toFixed(2)}</TableCell>
                          <TableCell className="space-x-2 min-w-[180px] sticky right-0 bg-background">
                            <EditFoodMenu 
                              meal={meal} 
                              onUpdateMenuMeal={(id, mealData) => appStore.updateMenuMeal(id, mealData)} 
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="destructive"
                                  size="icon"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">{t('deleteItem')}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {t('messages.deleteConfirm', { name: meal.name })}
                                    </p>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={(e) => {
                                      e.preventDefault()
                                      const popover = e.currentTarget.closest('[role="dialog"]')
                                      if (popover) {
                                        ;(popover as HTMLElement).setAttribute('data-state', 'closed')
                                      }
                                    }}>
                                      {t('buttons.cancel')}
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => appStore.deleteMenuMeal(meal.id)}
                                    >
                                      {t('buttons.delete')}
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && !appStore.isLoadingMeals && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('table.pagination', { current: currentPage, total: totalPages })}
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
        </CardContent>
      </Card>
    </div>
  )
})

export default MenuManagement