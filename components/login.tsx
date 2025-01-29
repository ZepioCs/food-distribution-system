"use client"

import { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRootStore } from "@/providers/store-provider"
import { useRouter, useParams } from "next/navigation"
import { authService, supabase } from "@/services/auth.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { dbService } from "@/services/db.service"
import LanguageSwitcher from "./language-switcher"
import { useTranslations } from 'next-intl'
import { EUserRole } from "@/models/default"

const Login = observer(() => {
  const tLogin = useTranslations('Login')
  const tAuth = useTranslations('Auth')
  const [isLoading, setIsLoading] = useState(false)
  const { appStore } = useRootStore()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const locale = params?.locale as string || 'en'

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (appStore.isLoggedIn) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [appStore.isLoggedIn, router, locale])

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register state
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerRole, setRegisterRole] = useState<"teacher" | "food_provider" | "admin">("teacher")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await authService.login({
        email: loginEmail,
        password: loginPassword,
      })

      // First check if there's a pending registration request
      const requests = await dbService.getRegisterRequests()
      const pendingRequest = requests.find(req => req.user_id === data.user?.id)
      
      if (pendingRequest) {
        toast({
          title: tAuth('loginFailed'),
          description: tAuth('registrationPendingDescription'),
          variant: "destructive",
        })
        await authService.logout()
        setIsLoading(false)
        return
      }

      // If no pending request, get the profile
      const profile = await dbService.getProfile(data.user?.id)
      if (!profile) {
        toast({
          title: tAuth('loginFailed'),
          description: tAuth('accountNotFound'),
          variant: "destructive",
        })
        await authService.logout()
        setIsLoading(false)
        return
      }

      // Check if user is approved
      if (!profile.is_approved) {
        toast({
          title: tAuth('loginFailed'),
          description: tAuth('accountNotApproved'),
          variant: "destructive",
        })
        await authService.logout()
        setIsLoading(false)
        return
      }

      const userRole = profile.role as EUserRole
      appStore.login(userRole)
      appStore.profile = profile
      router.replace(`/${locale}/dashboard`)
      toast({
        title: tAuth('loginSuccess'),
        description: tAuth('welcomeBack'),
      })
    } catch (error: any) {
      toast({
        title: tAuth('loginFailed'),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (registerPassword.length < 6) {
        toast({
          title: tAuth('passwordTooWeak'),
          description: tAuth('passwordTooWeakDescription'),
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Register using authService
      const { user } = await authService.register({
        email: registerEmail,
        password: registerPassword,
        username: registerUsername,
        role: registerRole as EUserRole
      })

      if (!user) throw new Error('Registration failed')

      if (registerRole === EUserRole.TEACHER) {
        // For teachers, just update the profile to be approved
        await dbService.updateProfile(user.id, {
          is_approved: true
        })
        
        toast({
          title: tAuth('registrationSuccessful'),
          description: tAuth('teacherRegistrationSuccess'),
        })
      } else {
        // For admin and food provider roles, create a register request
        await dbService.createRegisterRequest({
          user_id: user.id,
          email: registerEmail,
          username: registerUsername,
          role: registerRole
        })

        toast({
          title: tAuth('registrationPending'),
          description: tAuth('registrationPendingDescription'),
        })
      }

      // Redirect to login page after 3 seconds for all users
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      toast({
        title: tAuth('registrationFailed'),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">FoodDist</CardTitle>
            <LanguageSwitcher />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{tLogin('tabs.login')}</TabsTrigger>
              <TabsTrigger value="register">{tLogin('tabs.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{tLogin('form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={tLogin('form.emailPlaceholder')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{tLogin('form.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={tLogin('form.passwordPlaceholder')}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? tLogin('form.loading') : tLogin('form.loginButton')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">{tLogin('form.email')}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={tLogin('form.emailPlaceholder')}
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">{tLogin('form.username')}</Label>
                  <Input
                    id="register-username"
                    placeholder={tLogin('form.usernamePlaceholder')}
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{tLogin('form.password')}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder={tLogin('form.passwordPlaceholder')}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{tLogin('form.role')}</Label>
                  <Select value={registerRole} onValueChange={(value: any) => setRegisterRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={tLogin('form.rolePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">{tLogin('roles.teacher')}</SelectItem>
                      <SelectItem value="food_provider">{tLogin('roles.foodProvider')}</SelectItem>
                      <SelectItem value="admin">{tLogin('roles.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? tLogin('form.loading') : tLogin('form.registerButton')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
})

export default Login