"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ICategory, IMeal } from "@/models/default"
import { useRootStore } from "@/providers/store-provider"
import { useTranslations } from "next-intl"

interface AddFoodMenuProps {
  onAddMenuMeal: (meal: Omit<IMeal, 'id'>) => void
  trigger?: React.ReactNode
}

export default function AddFoodMenu({ onAddMenuMeal, trigger }: AddFoodMenuProps) {
  const t = useTranslations('MenuManagement')
  const { appStore } = useRootStore()
  const [open, setOpen] = useState(false)
  const [menuItem, setMenuItem] = useState<Omit<IMeal, 'id'>>({
    name: "",
    price: 0,
    description: "",
    image: "",
    type: 0
  })


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddMenuMeal(menuItem)
    setMenuItem({ name: "", price: 0, description: "", image: "", type: 0 })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="whitespace-nowrap">{t('addItem')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addItem')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">{t('form.name')}</Label>
            <Input
              id="item-name"
              value={menuItem.name}
              onChange={(e) => setMenuItem({ ...menuItem, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-price">{t('form.price')}</Label>
            <Input
              id="item-price"
              type="number"
              step="0.01"
              value={menuItem.price}
              onChange={(e) => setMenuItem({ ...menuItem, price: Number(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-description">{t('form.description')}</Label>
            <Textarea
              id="item-description"
              value={menuItem.description}
              onChange={(e) => setMenuItem({ ...menuItem, description: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-category">{t('form.category')}</Label>
            <Select
              value={menuItem.type.toString()}
              onValueChange={(value) => setMenuItem({ ...menuItem, type: Number(value) })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.category')} />
              </SelectTrigger>
              <SelectContent>
                {appStore.categories?.map((category: ICategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-image">{t('form.image')}</Label>
            <Input
              id="item-image"
              type="url"
              value={menuItem.image}
              onChange={(e) => setMenuItem({ ...menuItem, image: e.target.value })}
              required
            />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">{t('form.add')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

