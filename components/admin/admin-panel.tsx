"use client"

import { useEffect, useState } from "react"
import { dbService } from "@/services/db.service"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EUserRole } from "@/models/default"
import { supabase } from "@/lib/supabase"

interface RegisterRequest {
  id: string
  user_id: string
  email: string
  username: string
  role: string
  created_at: string
}

export default function AdminPanel() {
  const { toast } = useToast()
  const t = useTranslations('Admin')
  const [requests, setRequests] = useState<RegisterRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const data = await dbService.getRegisterRequests()
      setRequests(data)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      toast({
        title: t('fetchError'),
        description: t('errorFetchingRequests'),
        variant: "destructive",
      })
    }
  }

  const handleAccept = async (request: RegisterRequest) => {
    setIsLoading(true)
    try {
      await dbService.updateProfile(request.user_id, {
        user_id: request.user_id,
        email: request.email,
        username: request.username,
        role: request.role as EUserRole,
        is_approved: true
      })

      await dbService.deleteRegisterRequest(request.id)

      toast({
        title: t('requestAccepted'),
        description: t('userApproved', { email: request.email }),
      })
      fetchRequests()
    } catch (error) {
      console.error('Failed to accept request:', error)
      toast({
        title: t('acceptError'),
        description: t('errorAcceptingRequest'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async (request: RegisterRequest) => {
    setIsLoading(true)
    try {
      // Delete the user's profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', request.user_id)

      if (profileError) throw profileError

      // Delete the user's auth entry
      const { error: authError } = await supabase.auth.admin.deleteUser(
        request.user_id
      )

      if (authError) throw authError

      // Delete the registration request
      await dbService.deleteRegisterRequest(request.id)

      toast({
        title: t('requestDeclined'),
        description: t('userDeclined', { email: request.email }),
      })
      fetchRequests()
    } catch (error) {
      console.error('Failed to decline request:', error)
      toast({
        title: t('declineError'),
        description: t('errorDecliningRequest'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.email')}</TableHead>
              <TableHead>{t('table.username')}</TableHead>
              <TableHead>{t('table.role')}</TableHead>
              <TableHead>{t('table.requestDate')}</TableHead>
              <TableHead>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.email}</TableCell>
                <TableCell>{request.username}</TableCell>
                <TableCell>{request.role}</TableCell>
                <TableCell>
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    onClick={() => handleAccept(request)}
                    disabled={isLoading}
                    variant="default"
                  >
                    {t('actions.accept')}
                  </Button>
                  <Button
                    onClick={() => handleDecline(request)}
                    disabled={isLoading}
                    variant="destructive"
                  >
                    {t('actions.decline')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {t('noRequests')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 