"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCosmos } from "@/lib/cosmos-context"
import { Sidebar } from "@/components/sidebar"
import { DataTable } from "@/components/data-table"
import { QueryBox } from "@/components/query-box"
import { DocumentDialog } from "@/components/document-dialog"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Database, FolderOpen } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { connection, selectedItem } = useCosmos()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is connected
    if (!connection.connectionString) {
      router.push("/")
    } else {
      setIsCheckingAuth(false)
    }
  }, [connection.connectionString, router])

  if (isCheckingAuth) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors",
        "dark:bg-slate-950 bg-slate-100"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className={cn(
            "transition-colors",
            "dark:text-slate-400 text-slate-600"
          )}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "h-screen w-screen flex overflow-hidden transition-colors",
      "dark:bg-slate-950 bg-slate-100"
    )}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background effects - only in dark mode */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none z-0 dark:opacity-100 opacity-0 transition-opacity" />
        
        <main className="flex-1 p-6 flex flex-col gap-4 relative z-10 overflow-hidden">
          {/* Database & Container Header */}
          {selectedItem.database && selectedItem.container && (
            <div className={cn(
              "flex items-center gap-6 pb-4 border-b transition-colors",
              "dark:border-slate-800 border-slate-200"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  "dark:bg-cyan-900/30 bg-cyan-100"
                )}>
                  <Database className={cn(
                    "w-5 h-5 transition-colors",
                    "dark:text-cyan-400 text-cyan-600"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-xs uppercase tracking-wider font-medium transition-colors",
                    "dark:text-slate-500 text-slate-500"
                  )}>Database</p>
                  <h2 className={cn(
                    "text-lg font-bold transition-colors",
                    "dark:text-white text-slate-900"
                  )}>{selectedItem.database}</h2>
                </div>
              </div>
              
              <div className={cn(
                "w-px h-10 transition-colors",
                "dark:bg-slate-700 bg-slate-300"
              )} />
              
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  "dark:bg-emerald-900/30 bg-emerald-100"
                )}>
                  <FolderOpen className={cn(
                    "w-5 h-5 transition-colors",
                    "dark:text-emerald-400 text-emerald-600"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-xs uppercase tracking-wider font-medium transition-colors",
                    "dark:text-slate-500 text-slate-500"
                  )}>Container</p>
                  <h2 className={cn(
                    "text-lg font-bold transition-colors",
                    "dark:text-white text-slate-900"
                  )}>{selectedItem.container}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Query Box */}
          <QueryBox />

          {/* Data Table */}
          <DataTable onCreateNew={() => setIsCreateDialogOpen(true)} />
        </main>
      </div>

      {/* Create Document Dialog */}
      <DocumentDialog
        document={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />
    </div>
  )
}
