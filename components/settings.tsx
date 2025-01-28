"use client"

import { observer } from "mobx-react-lite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useRootStore } from "@/providers/store-provider"
import { useTheme } from "next-themes"
import { useTranslations } from 'next-intl'
import LanguageSwitcher from "./language-switcher"

const Settings = observer(() => {
  const t = useTranslations('Settings')
  const { settingsStore } = useRootStore()
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system')
    settingsStore.updateSetting('theme', value as 'light' | 'dark' | 'system')
  }

  return (
    <div className="container space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('theme.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('theme.description')}
                </p>
              </div>
              <Select
                value={theme}
                onValueChange={handleThemeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('theme.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('theme.options.light')}</SelectItem>
                  <SelectItem value="dark">{t('theme.options.dark')}</SelectItem>
                  <SelectItem value="system">{t('theme.options.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('language.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('language.description')}
                </p>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">{t('notifications.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.description')}
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settingsStore.settings.notifications}
                onCheckedChange={(checked) => settingsStore.updateSetting('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-logout">{t('autoLogout.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('autoLogout.description')}
                </p>
              </div>
              <Switch
                id="auto-logout"
                checked={settingsStore.settings.autoLogout}
                onCheckedChange={(checked) => settingsStore.updateSetting('autoLogout', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('tablePageSize.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('tablePageSize.description')}
                </p>
              </div>
              <Select
                value={settingsStore.settings.tablePageSize.toString()}
                onValueChange={(value) => settingsStore.updateSetting('tablePageSize', parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('tablePageSize.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{t('tablePageSize.options.five')}</SelectItem>
                  <SelectItem value="10">{t('tablePageSize.options.ten')}</SelectItem>
                  <SelectItem value="20">{t('tablePageSize.options.twenty')}</SelectItem>
                  <SelectItem value="50">{t('tablePageSize.options.fifty')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => settingsStore.resetSettings()}
            >
              {t('reset.button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default Settings

