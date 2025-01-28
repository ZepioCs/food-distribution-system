"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { dbService } from "@/services/db.service"
import { supabase } from "@/services/auth.service"
import { IProfile } from "@/models/default"

export default function UserProfile() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<IProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profileData = await dbService.getProfile(user.id)
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await dbService.updateProfile(user.id, {
          username: profile.username,
          dietary_preferences: profile.dietary_preferences
        })
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await dbService.updatePassword(user.email!, newPassword)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast({
          title: "Success",
          description: "Password updated successfully"
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      })
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const publicUrl = await dbService.updateAvatar(user.id, file)
        setProfile(prev => prev ? {...prev, avatar_url: publicUrl} : null)
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive"
      })
    }
  }

  const handleDietaryPreferenceChange = (key: keyof NonNullable<IProfile['dietary_preferences']>, checked: boolean) => {
    setProfile(prev => {
      if (!prev) return null
      return {
        ...prev,
        dietary_preferences: {
          vegetarian: false,
          vegan: false,
          gluten_free: false,
          dairy_free: false,
          nut_free: false,
          ...prev.dietary_preferences,
          [key]: checked
        }
      }
    })
  }

  if (loading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-lg font-medium text-muted-foreground">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Dietary Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <Input 
                      id="avatar" 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile?.username || ""}
                      onChange={(e) => setProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile?.role || ""}
                      disabled
                    />
                  </div>
                </div>

                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences & Allergies</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                  <Switch
                    id="vegetarian"
                    checked={profile?.dietary_preferences?.vegetarian || false}
                    onCheckedChange={(checked) => handleDietaryPreferenceChange('vegetarian', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vegan">Vegan</Label>
                  <Switch
                    id="vegan"
                    checked={profile?.dietary_preferences?.vegan || false}
                    onCheckedChange={(checked) => handleDietaryPreferenceChange('vegan', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="gluten_free">Gluten Free</Label>
                  <Switch
                    id="gluten_free"
                    checked={profile?.dietary_preferences?.gluten_free || false}
                    onCheckedChange={(checked) => handleDietaryPreferenceChange('gluten_free', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="dairy_free">Dairy Free</Label>
                  <Switch
                    id="dairy_free"
                    checked={profile?.dietary_preferences?.dairy_free || false}
                    onCheckedChange={(checked) => handleDietaryPreferenceChange('dairy_free', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="nut_free">Nut Free</Label>
                  <Switch
                    id="nut_free"
                    checked={profile?.dietary_preferences?.nut_free || false}
                    onCheckedChange={(checked) => handleDietaryPreferenceChange('nut_free', checked)}
                  />
                </div>

                <Button type="submit">Save Preferences</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit">Change Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 