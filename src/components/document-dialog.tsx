"use client"

import { useState, useEffect } from "react"
import { useCosmos } from "@/lib/cosmos-context"
import { CosmosDocument } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { JsonHighlighter, JsonEditor } from "@/components/ui/json-highlighter"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Pencil, Save, Copy, Check } from "lucide-react"

interface DocumentDialogProps {
  document: CosmosDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "view" | "edit" | "create"
  onEdit?: () => void
}

export function DocumentDialog({
  document,
  open,
  onOpenChange,
  mode,
  onEdit,
}: DocumentDialogProps) {
  const { selectedItem, updateDocument, createDocument, isLoading } = useCosmos()
  const [jsonContent, setJsonContent] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (document && (mode === "view" || mode === "edit")) {
      setJsonContent(JSON.stringify(document, null, 2))
      setJsonError(null)
    } else if (mode === "create") {
      setJsonContent('{\n  "id": "",\n  \n}')
      setJsonError(null)
    }
  }, [document, mode, open])

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      JSON.parse(value)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }

  const handleSave = async () => {
    if (jsonError) {
      toast.error("Invalid JSON", { description: jsonError })
      return
    }

    if (!selectedItem.database || !selectedItem.container) {
      toast.error("No container selected")
      return
    }

    try {
      const parsedDocument = JSON.parse(jsonContent)

      if (mode === "create") {
        if (!parsedDocument.id) {
          toast.error("Document must have an 'id' field")
          return
        }
        await createDocument(selectedItem.database, selectedItem.container, parsedDocument)
      } else if (mode === "edit" && document) {
        await updateDocument(
          selectedItem.database,
          selectedItem.container,
          document.id,
          parsedDocument
        )
      }
      onOpenChange(false)
    } catch (e) {
      toast.error("Failed to save document", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Document"
      case "edit":
        return "Edit Document"
      default:
        return "View Document"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Enter the JSON content for the new document"
      case "edit":
        return `Editing document: ${document?.id}`
      default:
        return `Document ID: ${document?.id}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          {mode === "view" ? (
            <div className={cn(
              "h-[500px] rounded-lg border overflow-auto transition-colors",
              "dark:border-slate-700 dark:bg-slate-950",
              "border-slate-200 bg-slate-50"
            )}>
              <div className="p-4 min-w-max">
                <JsonHighlighter json={jsonContent} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <JsonEditor
                value={jsonContent}
                onChange={handleJsonChange}
                className="h-[500px]"
                placeholder="Enter JSON document..."
              />
              {jsonError && (
                <p className={cn(
                  "text-sm font-mono rounded-lg px-3 py-2 transition-colors",
                  "dark:text-red-400 dark:bg-red-950/30 dark:border dark:border-red-900/50",
                  "text-red-600 bg-red-50 border border-red-200"
                )}>
                  ⚠️ {jsonError}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {mode === "view" && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </Button>
              {onEdit && (
                <Button onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </>
          )}
          {(mode === "edit" || mode === "create") && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !!jsonError}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === "create" ? "Create" : "Save Changes"}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
