"use client"

import { useState } from "react"
import { observer } from "mobx-react-lite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'
import { dbService } from "@/services/db.service"

const Feedback = observer(() => {
  const t = useTranslations('Feedback')
  const toast = useTranslations('Toast')
  const { toast: showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    message: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await dbService.submitFeedback({
        category: formData.category,
        subject: formData.subject,
        message: formData.message
      })
      showToast({
        title: toast('success.title'),
        description: toast('success.feedbackSent')
      })
      setFormData({
        category: "",
        subject: "",
        message: ""
      })
    } catch (error) {
      showToast({
        title: toast('error.title'),
        description: toast('error.feedbackFailed'),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('form.category')}</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('categories.general')}</SelectItem>
                  <SelectItem value="bug">{t('categories.bug')}</SelectItem>
                  <SelectItem value="feature">{t('categories.feature')}</SelectItem>
                  <SelectItem value="improvement">{t('categories.improvement')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('form.subject')}</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('form.message')}</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isLoading}>
                {t('form.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
})

export default Feedback 