"use client"

import { useEffect, useState } from "react"
import { useCosmos } from "@/lib/cosmos-context"
import { useTheme } from "@/lib/theme-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Plus,
  Trash2,
  MoreHorizontal,
  Server,
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
    accountName,
    createDatabase,
    deleteDatabase,
    createContainer,
    deleteContainer,
  } = useCosmos()

  // Dialog states
  const [createDbDialogOpen, setCreateDbDialogOpen] = useState(false)
  const [createContainerDialogOpen, setCreateContainerDialogOpen] = useState(false)
  const [deleteDbDialogOpen, setDeleteDbDialogOpen] = useState(false)
  const [deleteContainerDialogOpen, setDeleteContainerDialogOpen] = useState(false)
  
  // Form states
  const [newDbName, setNewDbName] = useState("")
  const [newContainerName, setNewContainerName] = useState("")
  const [newPartitionKey, setNewPartitionKey] = useState("/id")
  const [targetDatabaseId, setTargetDatabaseId] = useState("")
  const [targetContainerId, setTargetContainerId] = useState("")

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

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) return
    const success = await createDatabase(newDbName.trim())
    if (success) {
      setCreateDbDialogOpen(false)
      setNewDbName("")
    }
  }

  const handleDeleteDatabase = async () => {
    if (!targetDatabaseId) return
    const success = await deleteDatabase(targetDatabaseId)
    if (success) {
      setDeleteDbDialogOpen(false)
      setTargetDatabaseId("")
    }
  }

  const handleCreateContainer = async () => {
    if (!newContainerName.trim() || !newPartitionKey.trim() || !targetDatabaseId) return
    const success = await createContainer(targetDatabaseId, newContainerName.trim(), newPartitionKey.trim())
    if (success) {
      setCreateContainerDialogOpen(false)
      setNewContainerName("")
      setNewPartitionKey("/id")
      setTargetDatabaseId("")
    }
  }

  const handleDeleteContainer = async () => {
    if (!targetDatabaseId || !targetContainerId) return
    const success = await deleteContainer(targetDatabaseId, targetContainerId)
    if (success) {
      setDeleteContainerDialogOpen(false)
      setTargetDatabaseId("")
      setTargetContainerId("")
    }
  }

  const openCreateContainerDialog = (databaseId: string) => {
    setTargetDatabaseId(databaseId)
    setCreateContainerDialogOpen(true)
  }

  const openDeleteDatabaseDialog = (databaseId: string) => {
    setTargetDatabaseId(databaseId)
    setDeleteDbDialogOpen(true)
  }

  const openDeleteContainerDialog = (databaseId: string, containerId: string) => {
    setTargetDatabaseId(databaseId)
    setTargetContainerId(containerId)
    setDeleteContainerDialogOpen(true)
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
        
        {/* Account Name */}
        {accountName && (
          <div className={cn(
            "mt-3 p-2 rounded-lg flex items-center gap-2 transition-colors",
            "dark:bg-slate-800/50",
            "bg-slate-200/50"
          )}>
            <Server className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className={cn(
              "text-xs font-medium truncate transition-colors",
              "dark:text-slate-300 text-slate-700"
            )}>
              {accountName}
            </span>
          </div>
        )}
      </div>

      {/* Theme Toggle & Actions */}
      <div className={cn(
        "p-3 border-b flex flex-col gap-2 transition-colors duration-300",
        "dark:border-slate-800",
        "border-slate-200"
      )}>
        <div className="flex gap-2">
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
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setCreateDbDialogOpen(true)}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Database
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
                <div className="flex items-center group">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                        "flex-1 justify-start gap-2 transition-colors",
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                          "dark:hover:bg-slate-700",
                          "hover:bg-slate-300"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openCreateContainerDialog(database.id)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Container
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-400"
                        onClick={() => openDeleteDatabaseDialog(database.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Database
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CollapsibleContent className="pl-6 space-y-1 mt-1">
                  {database.containers?.map((container) => (
                    <div key={container.id} className="flex items-center group/container">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                          "flex-1 justify-start gap-2 transition-colors",
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 opacity-0 group-hover/container:opacity-100 transition-opacity",
                              "dark:hover:bg-slate-700",
                              "hover:bg-slate-300"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-400"
                            onClick={() => openDeleteContainerDialog(database.id, container.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Container
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {database.containers?.length === 0 && !database.isLoading && (
                    <div className="flex items-center justify-between px-2 py-1">
                    <p className={cn(
                        "text-xs transition-colors",
                      "dark:text-slate-600 text-slate-400"
                    )}>No containers</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => openCreateContainerDialog(database.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
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

      {/* Create Database Dialog */}
      <Dialog open={createDbDialogOpen} onOpenChange={setCreateDbDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Database</DialogTitle>
            <DialogDescription>
              Enter a name for the new database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dbName">Database Name</Label>
              <Input
                id="dbName"
                placeholder="my-database"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDatabase()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDbDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDatabase} disabled={!newDbName.trim() || isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Container Dialog */}
      <Dialog open={createContainerDialogOpen} onOpenChange={setCreateContainerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Container</DialogTitle>
            <DialogDescription>
              Create a new container in database: <strong>{targetDatabaseId}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="containerName">Container Name</Label>
              <Input
                id="containerName"
                placeholder="my-container"
                value={newContainerName}
                onChange={(e) => setNewContainerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partitionKey">Partition Key</Label>
              <Input
                id="partitionKey"
                placeholder="/id"
                value={newPartitionKey}
                onChange={(e) => setNewPartitionKey(e.target.value)}
              />
              <p className={cn(
                "text-xs transition-colors",
                "dark:text-slate-500 text-slate-500"
              )}>
                The partition key path (e.g., /id, /userId, /category)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateContainerDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateContainer} 
              disabled={!newContainerName.trim() || !newPartitionKey.trim() || isLoading}
            >
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Database Confirmation */}
      <AlertDialog open={deleteDbDialogOpen} onOpenChange={setDeleteDbDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the database <strong>&quot;{targetDatabaseId}&quot;</strong>?
              <br /><br />
              <span className="text-red-500 font-medium">
                This will permanently delete all containers and documents within this database. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDatabase}
              className={cn(
                "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
                "hover:from-red-400 hover:to-rose-500"
              )}
            >
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Container Confirmation */}
      <AlertDialog open={deleteContainerDialogOpen} onOpenChange={setDeleteContainerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Container</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the container <strong>&quot;{targetContainerId}&quot;</strong> from database <strong>&quot;{targetDatabaseId}&quot;</strong>?
              <br /><br />
              <span className="text-red-500 font-medium">
                This will permanently delete all documents in this container. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContainer}
              className={cn(
                "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
                "hover:from-red-400 hover:to-rose-500"
              )}
            >
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Container
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
