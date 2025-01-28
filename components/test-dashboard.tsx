"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { dbService } from "@/services/db.service"
import { supabase } from "@/services/auth.service"
import { IProfile } from "@/models/default"

export default function TestDashboard() {
  const { toast } = useToast()
  const [users, setUsers] = useState<IProfile[]>([])
  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
    userId: "" as string
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true })

      console.log('Users loaded:', data)

      if (error) throw error
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    }
  }

  const handleCreateNotification = async () => {
    try {
      if (!notificationData.userId) {
        toast({
          title: "Error",
          description: "Please select a user",
          variant: "destructive"
        })
        return
      }

      await dbService.createNotification({
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false
      })

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      // Reset form
      setNotificationData({
        title: "",
        message: "",
        type: "info",
        userId: ""
      })
    } catch (error) {
      console.error('Error creating test notification:', error)
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateNotification() }} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={notificationData.userId}
                  onValueChange={(value: string) => 
                    setNotificationData(prev => ({ ...prev, userId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.username} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Notification Message</Label>
                <Textarea
                  id="message"
                  value={notificationData.message}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select
                  value={notificationData.type}
                  onValueChange={(value: "info" | "warning" | "success" | "error") => 
                    setNotificationData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit">Send Test Notification</Button>
          </form>
        </CardContent>
      </Card>

      {/* Add more test features here */}
    </div>
  )
} 