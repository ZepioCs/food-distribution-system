"use client"

import { useState, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRootStore } from "@/providers/store-provider"
import { useRouter, useParams } from "next/navigation"
import { authService } from "@/services/auth.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { dbService } from "@/services/db.service"
import LanguageSwitcher from "./language-switcher"
import { useTranslations } from 'next-intl'
import { EUserRole } from "@/models/default"

const Login = observer(() => {
  const t = useTranslations('Login')
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
      const profile = await dbService.getProfile(data.user?.id)
      const userRole = profile.role as EUserRole
      appStore.login(userRole)
      appStore.profile = profile
      router.replace(`/${locale}/dashboard`)
      toast({
        title: t('Auth.loginSuccess'),
        description: t('Auth.welcomeBack'),
      })
    } catch (error: any) {
      toast({
        title: t('Auth.loginFailed'),
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
  
    console.log("Starting registration...")
    console.log("Password length:", registerPassword.length)
  
    try {
      if (registerPassword.length < 6) {
        console.log("Password too short, showing toast")
        toast({
          title: "Password too weak",
          description: "Password should be at least 6 characters long",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
  
      await authService.register({
        email: registerEmail,
        password: registerPassword,
        username: registerUsername,
        role: registerRole as EUserRole,
      })
      
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      let errorMessage = "Registration failed"
      
      if (typeof error.message === 'string') {
        try {
          const parsedError = JSON.parse(error.message)
          if (parsedError.code === "weak_password") {
            errorMessage = "Password is too weak. " + 
              parsedError.weak_password.reasons
                .map((reason: any) => {
                  switch(reason) {
                    case "length": return "Password should be at least 6 characters"
                    case "characters": return "Password should include different types of characters"
                    default: return reason
                  }
                })
                .join(". ")
          } else {
            errorMessage = parsedError.message || error.message
          }
        } catch {
          errorMessage = error.message
        }
      }
  
      toast({
        title: "Registration failed",
        description: errorMessage,
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
              <TabsTrigger value="login">{t('tabs.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('tabs.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('form.emailPlaceholder')}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('form.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('form.passwordPlaceholder')}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? t('form.loading') : t('form.loginButton')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('form.email')}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('form.emailPlaceholder')}
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">{t('form.username')}</Label>
                  <Input
                    id="register-username"
                    placeholder={t('form.usernamePlaceholder')}
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('form.password')}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder={t('form.passwordPlaceholder')}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('form.role')}</Label>
                  <Select value={registerRole} onValueChange={(value: any) => setRegisterRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.rolePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
                      <SelectItem value="food_provider">{t('roles.foodProvider')}</SelectItem>
                      <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? t('form.loading') : t('form.registerButton')}
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