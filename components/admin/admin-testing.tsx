"use client"

import { useTranslations } from 'next-intl'
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function AdminTesting() {
  const t = useTranslations('Admin')
  const { toast } = useToast()

  const handleTestEndpoint = async (endpoint: string) => {
    try {
      // Simulate endpoint test
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: t('testingTab.endpointTested'),
        description: `${endpoint} ${t('testingTab.endpointWorking')}`,
      })
    } catch (error) {
      toast({
        title: t('testingTab.testFailed'),
        description: `${endpoint} ${t('testingTab.endpointError')}`,
        variant: "destructive",
      })
    }
  }

  const endpoints = [
    'auth/session',
    'users/profile',
    'menu/items',
    'orders/list',
    'notifications/list',
    'feedback/list',
    'analytics/summary'
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('testingTab.endpoints.name')}</TableHead>
          <TableHead>{t('testingTab.endpoints.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {endpoints.map((endpoint) => (
          <TableRow key={endpoint}>
            <TableCell>{endpoint}</TableCell>
            <TableCell>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTestEndpoint(endpoint)}
              >
                {t('testingTab.endpoints.test')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}