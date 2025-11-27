"use client"

import { useEffect } from "react"
import { useCosmos } from "@/lib/cosmos-context"
import { useTheme } from "@/lib/theme-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  Database,
  FolderOpen,
  ChevronRight,
  RefreshCw,
  LogOut,
  Layers,
  Sun,
  Moon,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const {
    databases,
    setDatabases,
    loadDatabases,
    loadContainers,
    selectedItem,
    setSelectedItem,
    loadDocuments,
    disconnect,
    isLoading,
    setPagination,
  } = useCosmos()

  useEffect(() => {
    loadDatabases()
  }, [loadDatabases])

  const handleDatabaseClick = async (databaseId: string) => {
    const database = databases.find((db) => db.id === databaseId)
    if (!database?.containers || database.containers.length === 0) {
      await loadContainers(databaseId)
    } else {
      // Toggle expansion
      setDatabases((prev) =>
        prev.map((db) =>
          db.id === databaseId ? { ...db, isExpanded: !db.isExpanded } : db
        )
      )
    }
  }

  const handleContainerClick = async (databaseId: string, containerId: string) => {
    setSelectedItem({ database: databaseId, container: containerId })
    // Reset pagination when selecting a new container
    setPagination({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      continuationTokens: [undefined],
    })
    await loadDocuments(databaseId, containerId, 0)
  }

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  const handleRefresh = () => {
    loadDatabases()
  }

  return (
    <div className={cn(
      "w-72 min-w-72 shrink-0 h-screen flex flex-col border-r backdrop-blur-sm transition-colors duration-300",
      "dark:border-slate-800 dark:bg-slate-950/50",
      "border-slate-200 bg-slate-50/80"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b transition-colors duration-300",
        "dark:border-slate-800",
        "border-slate-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={cn(
                "font-bold transition-colors",
                "dark:text-white text-slate-900"
              )}>Cosmos UI</h1>
              <p className={cn(
                "text-xs transition-colors",
                "dark:text-slate-500 text-slate-500"
              )}>Database Explorer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle & Actions */}
      <div className={cn(
        "p-3 border-b flex gap-2 transition-colors duration-300",
        "dark:border-slate-800",
        "border-slate-200"
      )}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className={cn(
            "dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20",
            "text-red-500 hover:text-red-600 hover:bg-red-100"
          )}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Database List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {isLoading && databases.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : databases.length === 0 ? (
            <div className={cn(
              "text-center py-8 transition-colors",
              "dark:text-slate-500 text-slate-500"
            )}>
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No databases found</p>
            </div>
          ) : (
            databases.map((database) => (
              <Collapsible
                key={database.id}
                open={database.isExpanded}
                onOpenChange={() => handleDatabaseClick(database.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 transition-colors",
                      "dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50",
                      "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
                      selectedItem.database === database.id && cn(
                        "dark:bg-slate-800/50 dark:text-white",
                        "bg-slate-200/50 text-slate-900"
                      )
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform",
                        database.isExpanded && "rotate-90"
                      )}
                    />
                    <Database className="w-4 h-4 text-cyan-500" />
                    <span className="truncate flex-1 text-left">{database.id}</span>
                    {database.isLoading && <Spinner size="sm" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1 mt-1">
                  {database.containers?.map((container) => (
                    <Button
                      key={container.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 transition-colors",
                        "dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800/50",
                        "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50",
                        selectedItem.database === database.id &&
                          selectedItem.container === container.id &&
                          cn(
                            "dark:bg-cyan-900/30 dark:text-cyan-400 border-l-2 border-cyan-500",
                            "bg-cyan-100 text-cyan-700 border-l-2 border-cyan-500"
                          )
                      )}
                      onClick={() => handleContainerClick(database.id, container.id)}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="truncate">{container.id}</span>
                    </Button>
                  ))}
                  {database.containers?.length === 0 && !database.isLoading && (
                    <p className={cn(
                      "text-xs px-2 py-1 transition-colors",
                      "dark:text-slate-600 text-slate-400"
                    )}>No containers</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "p-3 border-t transition-colors duration-300",
        "dark:border-slate-800",
        "border-slate-200"
      )}>
        <p className={cn(
          "text-xs text-center transition-colors",
          "dark:text-slate-600 text-slate-500"
        )}>
          {databases.length} database{databases.length !== 1 ? "s" : ""} connected
        </p>
      </div>
    </div>
  )
}
