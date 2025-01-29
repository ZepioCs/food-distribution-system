"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminPanel from "./admin-panel"
import AdminGeneral from "./admin-general"
import AdminTesting from "./admin-testing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminUserManagement from "./admin-user-management"

export default function AdminDashboard() {
  const t = useTranslations('Admin')
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
          <TabsTrigger value="user-management">{t('tabs.user-management')}</TabsTrigger>
          <TabsTrigger value="requests">{t('tabs.requests')}</TabsTrigger>
          <TabsTrigger value="testing">{t('tabs.testing')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalTab.title')}</CardTitle>
              <CardDescription>{t('generalTab.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGeneral />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-management">
          <AdminUserManagement />
        </TabsContent>
        
        <TabsContent value="requests">
          <AdminPanel />
        </TabsContent>
        
        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>{t('testingTab.title')}</CardTitle>
              <CardDescription>{t('testingTab.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('testingTab.endpoints.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminTesting />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 