"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useRootStore } from "@/providers/store-provider"
import { EUserRole } from "@/models/default"
import Layout from "@/components/layout"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const { appStore } = useRootStore()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  useEffect(() => {
    // Redirect non-admin users to dashboard
    if (appStore.userRole !== EUserRole.ADMIN) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [appStore.userRole, router, locale])

  // Only render admin dashboard for admin users
  if (appStore.userRole !== EUserRole.ADMIN) {
    return null
  }

  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  )
} 