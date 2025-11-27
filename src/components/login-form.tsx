"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { useCosmos } from "@/lib/cosmos-context"
import { useTheme } from "@/lib/theme-context"
import { getStoredConnection, buildConnectionString, cn } from "@/lib/utils"
import { toast } from "sonner"
import { Database, Key, Link2, Sparkles, Sun, Moon } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { setConnection } = useCosmos()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  
  // Connection string form
  const [connectionString, setConnectionString] = useState("")
  
  // Credentials form
  const [endpoint, setEndpoint] = useState("")
  const [accountKey, setAccountKey] = useState("")

  // Load stored connection on mount
  useEffect(() => {
    const stored = getStoredConnection()
    if (stored) {
      setConnectionString(stored)
    }
  }, [])

  const testAndConnect = async (connString: string, shouldStore: boolean = true) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: connString }),
      })

      const data = await response.json()
      
      if (data.success) {
        setConnection({
          isConnected: true,
          connectionString: shouldStore ? connString : connString,
        })
        toast.success("Connected successfully!", {
          description: "Redirecting to dashboard...",
        })
        router.push("/dashboard")
      } else {
        toast.error("Connection failed", {
          description: data.error || "Failed to connect to Cosmos DB",
        })
      }
    } catch (error) {
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectionStringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connectionString.trim()) {
      toast.error("Please enter a connection string")
      return
    }
    await testAndConnect(connectionString, true)
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!endpoint.trim() || !accountKey.trim()) {
      toast.error("Please enter both endpoint and account key")
      return
    }
    const connString = buildConnectionString(endpoint, accountKey)
    await testAndConnect(connString, false)
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300",
      "dark:bg-slate-950",
      "bg-gradient-to-br from-slate-100 to-slate-200"
    )}>
      {/* Animated background - Dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent dark:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent dark:opacity-100 opacity-0 transition-opacity duration-300" />
      
      {/* Floating orbs - Dark mode */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse dark:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000 dark:opacity-100 opacity-0 transition-opacity duration-300" />
      
      {/* Grid pattern - Dark mode */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:opacity-100 opacity-0 transition-opacity duration-300" />

      {/* Light mode background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:64px_64px] dark:opacity-0 opacity-100 transition-opacity duration-300" />

      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-20"
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600" />
        )}
      </Button>

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Cosmos UI
            </CardTitle>
            <CardDescription className="mt-1">
              Connect to your Azure Cosmos DB instance
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="connection-string" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="connection-string" className="gap-2">
                <Link2 className="w-4 h-4" />
                Connection String
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-2">
                <Key className="w-4 h-4" />
                Credentials
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection-string">
              <form onSubmit={handleConnectionStringSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionString">Connection String</Label>
                  <Input
                    id="connectionString"
                    type="password"
                    placeholder="AccountEndpoint=https://...;AccountKey=..."
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className={cn(
                    "text-xs transition-colors",
                    "dark:text-slate-500 text-slate-500"
                  )}>
                    Your connection string will be stored locally (encoded) for convenience
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="credentials">
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Account Endpoint</Label>
                  <Input
                    id="endpoint"
                    type="url"
                    placeholder="https://your-account.documents.azure.com:443/"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountKey">Account Key</Label>
                  <Input
                    id="accountKey"
                    type="password"
                    placeholder="Your primary or secondary key"
                    value={accountKey}
                    onChange={(e) => setAccountKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className={cn(
                    "text-xs transition-colors",
                    "dark:text-slate-500 text-slate-500"
                  )}>
                    Credentials are not stored locally for security
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
