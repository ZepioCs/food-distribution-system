"use client"

import { useParams, useRouter, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { i18n } from "@/i18n.config"

const languages = {
  en: "English",
  de: "German",
  es: "Spanish",
  it: "Italian",
  ru: "Russian"
}

export default function LanguageSwitcher() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const currentLocale = (params?.locale as string) || "en"
  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "")

  const handleLanguageChange = (newLocale: string) => {
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {i18n.locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {languages[locale as keyof typeof languages]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 