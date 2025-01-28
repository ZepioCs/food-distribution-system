"use client"

import Layout from "@/components/layout"
import AIPredictions from "@/components/ai-predictions"
import { useTranslations } from 'next-intl'

export default function ReportsPage() {
  const t = useTranslations('Reports')
  
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground mb-6">{t('description')}</p>
      <AIPredictions />
    </Layout>
  )
}

