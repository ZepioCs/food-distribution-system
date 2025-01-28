import { Inter } from "next/font/google"
import "../globals.css"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import AuthWrapper from "@/wrapper/auth-wrapper"
import { MainProvider } from "@/providers/main-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FoodDist - Food Distribution System",
  description: "Efficient food distribution management",
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <MainProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </MainProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 