"use client"

import { useState, useCallback, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRootStore } from "@/providers/store-provider"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'
import { dbService } from "@/services/db.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { CopyIcon } from "lucide-react"

const Profile = observer(() => {
  const t = useTranslations()
  const { appStore } = useRootStore()
  const { toast: showToast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const isValid = await appStore.initializeSession()
        if (!isValid) {
          router.replace('/login')
          return
        }
      } catch (error) {
        console.error('Failed to initialize profile:', error)
        router.replace('/login')
      } finally {
        setIsInitializing(false)
      }
    }

    if (!appStore.profile) {
      void initializeProfile()
    } else {
      setIsInitializing(false)
    }
  }, [appStore, router])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
  }, [])

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      showToast({
        title: t('Toast.error.title'),
        description: t('Toast.error.invalidInput'),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await dbService.changePassword(formData.currentPassword, formData.newPassword)
      showToast({
        title: t('Toast.success.title'),
        description: t('Toast.success.passwordChanged')
      })
      resetForm()
    } catch (error) {
      showToast({
        title: t('Toast.error.title'),
        description: t('Toast.error.passwordChangeFailed'),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, showToast, t, resetForm])

  const emailInitial = appStore.profile?.email?.charAt(0).toUpperCase() || ''

  if (isInitializing) {
    return (
      <div className="container space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <p>{t('Common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Profile.title')}</CardTitle>
          <CardDescription>{t('Profile.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">{t('Profile.personalInfo.title')}</TabsTrigger>
              <TabsTrigger value="security">{t('Profile.security.title')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={appStore.profile?.avatar_url} />
                  <AvatarFallback>{emailInitial}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold">{appStore.profile?.username || 'Kein benutzername'}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {appStore.profile?.user_id || 'Kein Id'}
                    </p>
                    <Button
                      variant="outline" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={async () => {
                        if (appStore.profile?.user_id) {
                          try {
                            await navigator.clipboard.writeText(appStore.profile.user_id)
                            showToast({
                              title: t('Toast.success.title'),
                              description: t('Toast.success.idCopied'),
                              variant: "default"
                            })
                          } catch (error) {
                            showToast({
                              title: t('Toast.error.title'), 
                              description: t('Toast.error.idCopyFailed'),
                              variant: "destructive"
                            })
                          }
                        }
                      }}
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('Profile.personalInfo.email')}</Label>
                  <Input
                    id="email"
                    value={appStore.profile?.email || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('Profile.personalInfo.role')}</Label>
                  <Input
                    id="role"
                    value={appStore.profile?.role ? t(`Profile.roles.${appStore.profile?.role.toLowerCase()}`) : ''}
                    disabled
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('Profile.security.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('Profile.security.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('Profile.security.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={resetForm}>
                    {t('Profile.buttons.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {t('Profile.security.updatePassword')}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
})

export default Profile 