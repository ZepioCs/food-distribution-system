"use client"

import { useEffect, useState } from "react"
import { useTranslations } from 'next-intl'
import { dbService } from "@/services/db.service"
import { useToast } from "@/hooks/use-toast"
import { IProfile, EUserRole } from "@/models/default"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AdminUserManagement = () => {
  const t = useTranslations('Admin')
  const { toast } = useToast()
  const [users, setUsers] = useState<IProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IProfile | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: EUserRole.TEACHER
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await dbService.getAllProfiles()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast({
        title: t('fetchError'),
        description: t('errorFetchingUsers'),
        variant: "destructive",
      })
    }
  }

  const handleAddUser = async () => {
    setIsLoading(true)
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8)

      // Register the user
        await dbService.createRegisterRequest({
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          user_id: Math.random().toString(36).slice(-8)
        })

        toast({
        title: t('userAdded'),
        description: t('userAddedDescription', { email: newUser.email }),
        })
      
      setIsAddUserDialogOpen(false)
      setNewUser({
        email: '',
        username: '',
        role: EUserRole.TEACHER
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to add user:', error)
      toast({
        title: t('addError'),
        description: t('errorAddingUser'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
        await dbService.updateProfile(selectedUser.user_id, {
          username: selectedUser.username,
          role: selectedUser.role
        })

        toast({
          title: t('userUpdated'),
          description: t('userUpdatedDescription', { email: selectedUser.email }),
        })
      
      setIsEditUserDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
      toast({
        title: t('updateError'),
        description: t('errorUpdatingUser'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('confirmDeleteUser'))) return

    setIsLoading(true)
    try {
      // Note: Implement user deletion in dbService
      // await dbService.deleteUser(userId)
      toast({
        title: t('userDeleted'),
        description: t('userDeletedDescription'),
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast({
        title: t('deleteError'),
        description: t('errorDeletingUser'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('userManagement.title')}</CardTitle>
              <CardDescription>{t('userManagement.description')}</CardDescription>
            </div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>{t('userManagement.addUser')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('userManagement.addNewUser')}</DialogTitle>
                  <DialogDescription>
                    {t('userManagement.addUserDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t('userManagement.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">{t('userManagement.username')}</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">{t('userManagement.role')}</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: EUserRole) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('userManagement.selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EUserRole.TEACHER}>{t('roles.teacher')}</SelectItem>
                        <SelectItem value={EUserRole.FOOD_PROVIDER}>{t('roles.foodProvider')}</SelectItem>
                        <SelectItem value={EUserRole.ADMIN}>{t('roles.admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleAddUser} disabled={isLoading}>
                    {t('add')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('userManagement.username')}</TableHead>
                <TableHead>{t('userManagement.email')}</TableHead>
                <TableHead>{t('userManagement.role')}</TableHead>
                <TableHead>{t('userManagement.createdAt')}</TableHead>
                <TableHead>{t('userManagement.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{t(`roles.${user.role}`)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsEditUserDialogOpen(true)
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.user_id)}
                        disabled={isLoading}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {t('userManagement.noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userManagement.editUser')}</DialogTitle>
            <DialogDescription>
              {t('userManagement.editUserDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">{t('userManagement.username')}</Label>
                <Input
                  id="edit-username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">{t('userManagement.role')}</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: EUserRole) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('userManagement.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EUserRole.TEACHER}>{t('roles.teacher')}</SelectItem>
                    <SelectItem value={EUserRole.FOOD_PROVIDER}>{t('roles.foodProvider')}</SelectItem>
                    <SelectItem value={EUserRole.ADMIN}>{t('roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEditUser} disabled={isLoading}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminUserManagement