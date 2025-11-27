"use client"

import { useState, useMemo, useEffect } from "react"
import { useCosmos } from "@/lib/cosmos-context"
import { CosmosDocument } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
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
import { DocumentDialog } from "./document-dialog"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Clock,
  ChevronDown,
  Calendar,
  Search,
  X,
} from "lucide-react"

interface DataTableProps {
  onCreateNew: () => void
}

// Format Unix timestamp to readable date/time
function formatTimestamp(ts: number | null): string {
  if (!ts) return "-"
  try {
    // Cosmos DB _ts is in seconds, not milliseconds
    const date = new Date(ts * 1000)
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return "-"
  }
}

// Parse various date formats and return timestamp in seconds
function parseToTimestamp(value: unknown): number | null {
  if (!value) return null
  
  try {
    // If it's already a number (Unix timestamp)
    if (typeof value === "number") {
      // Check if it's in milliseconds (13 digits) or seconds (10 digits)
      if (value > 1e12) {
        return value / 1000 // Convert ms to seconds
      }
      return value
    }
    
    // If it's a string, try to parse it as a date
    if (typeof value === "string") {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.getTime() / 1000
      }
    }
    
    return null
  } catch {
    return null
  }
}

// Calculate days since a given timestamp
function getDaysSince(ts: number | null): string {
  if (!ts) return "-"
  try {
    const recordDate = new Date(ts * 1000)
    const now = new Date()
    const diffTime = now.getTime() - recordDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      // Future date
      const futureDays = Math.abs(diffDays)
      return futureDays === 1 ? "in 1 day" : `in ${futureDays} days`
    } else if (diffDays === 0) {
      // Calculate hours if less than a day
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return diffMinutes < 0 ? "just now" : `${diffMinutes}m ago`
      }
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return "1 day"
    } else {
      return `${diffDays} days`
    }
  } catch {
    return "-"
  }
}

// Get age badge color based on days
function getAgeBadgeClass(ts: number | null): string {
  if (!ts) return "dark:bg-slate-800 dark:text-slate-400 bg-slate-200 text-slate-600"
  
  const diffSeconds = Date.now() / 1000 - ts
  
  if (diffSeconds < 0) {
    // Future date - blue
    return "dark:bg-blue-900/30 dark:text-blue-400 bg-blue-100 text-blue-700"
  } else if (diffSeconds < 86400) {
    // Less than 1 day - green
    return "dark:bg-emerald-900/30 dark:text-emerald-400 bg-emerald-100 text-emerald-700"
  } else if (diffSeconds < 604800) {
    // Less than 1 week - amber
    return "dark:bg-amber-900/30 dark:text-amber-400 bg-amber-100 text-amber-700"
  } else {
    // Older than 1 week - gray
    return "dark:bg-slate-800 dark:text-slate-400 bg-slate-200 text-slate-600"
  }
}

export function DataTable({ onCreateNew }: DataTableProps) {
  const {
    documents,
    pagination,
    selectedItem,
    loadDocuments,
    deleteDocument,
    isLoading,
  } = useCosmos()

  const [selectedDocument, setSelectedDocument] = useState<CosmosDocument | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<CosmosDocument | null>(null)
  const [ageColumn, setAgeColumn] = useState<string>("_ts")
  const [modifiedColumn, setModifiedColumn] = useState<string>("_ts")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Get all unique keys from documents for table columns
  const columns = useMemo(() => {
    if (documents.length === 0) return []
    
    const allKeys = new Set<string>()
    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        // Exclude system fields except we'll add _ts separately
        if (!key.startsWith("_")) {
          allKeys.add(key)
        }
      })
    })
    
    // Prioritize 'id' column first
    const keysArray = Array.from(allKeys)
    const idIndex = keysArray.indexOf("id")
    if (idIndex > 0) {
      keysArray.splice(idIndex, 1)
      keysArray.unshift("id")
    }
    
    // Limit to first 4 columns for display (leaving room for _ts and actions)
    return keysArray.slice(0, 4)
  }, [documents])

  // Detect date-like columns (columns that contain timestamps or date strings)
  const dateColumns = useMemo(() => {
    if (documents.length === 0) return ["_ts"]
    
    const potentialDateColumns = new Set<string>()
    potentialDateColumns.add("_ts") // Always include _ts
    
    documents.forEach((doc) => {
      Object.entries(doc).forEach(([key, value]) => {
        if (key === "_ts") return // Already added
        
        // Check if value looks like a date
        if (value) {
          // Check for Unix timestamp (number)
          if (typeof value === "number" && value > 1e9 && value < 1e13) {
            potentialDateColumns.add(key)
          }
          // Check for date string
          if (typeof value === "string") {
            const date = new Date(value)
            if (!isNaN(date.getTime()) && value.length > 8) {
              potentialDateColumns.add(key)
            }
          }
        }
      })
    })
    
    return Array.from(potentialDateColumns)
  }, [documents])

  // Reset columns when container changes
  useEffect(() => {
    setAgeColumn("_ts")
    setModifiedColumn("_ts")
    setSearchQuery("")
  }, [selectedItem.container])

  // Check if documents have _ts field
  const hasTimestamp = useMemo(() => {
    return documents.length > 0 && documents.some(doc => doc._ts !== undefined)
  }, [documents])

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents
    
    const query = searchQuery.toLowerCase()
    return documents.filter((doc) => {
      // Search through all values in the document
      return Object.values(doc).some((value) => {
        if (value === null || value === undefined) return false
        const stringValue = typeof value === "object" 
          ? JSON.stringify(value).toLowerCase()
          : String(value).toLowerCase()
        return stringValue.includes(query)
      })
    })
  }, [documents, searchQuery])

  const handlePreviousPage = () => {
    if (pagination.pageIndex > 0 && selectedItem.database && selectedItem.container) {
      loadDocuments(selectedItem.database, selectedItem.container, pagination.pageIndex - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.continuationTokens.length > pagination.pageIndex + 1 && selectedItem.database && selectedItem.container) {
      loadDocuments(selectedItem.database, selectedItem.container, pagination.pageIndex + 1)
    }
  }

  const handleRowClick = (document: CosmosDocument) => {
    setSelectedDocument(document)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (document: CosmosDocument, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedDocument(document)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (document: CosmosDocument, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !selectedItem.database || !selectedItem.container) return
    
    // Try to find a partition key value - commonly used partition keys
    const partitionKeyValue = documentToDelete.id
    
    await deleteDocument(
      selectedItem.database,
      selectedItem.container,
      documentToDelete.id,
      partitionKeyValue
    )
    setDeleteDialogOpen(false)
    setDocumentToDelete(null)
  }

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-"
    if (typeof value === "object") return JSON.stringify(value).substring(0, 50) + "..."
    if (typeof value === "string" && value.length > 50) return value.substring(0, 50) + "..."
    return String(value)
  }

  // Get timestamp value for a document based on selected column
  const getTimestampValue = (doc: CosmosDocument, column: string): number | null => {
    const value = doc[column]
    return parseToTimestamp(value)
  }

  if (!selectedItem.database || !selectedItem.container) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className={cn(
            "w-16 h-16 mx-auto mb-4 transition-colors",
            "dark:text-slate-700 text-slate-300"
          )} />
          <h3 className={cn(
            "text-lg font-medium transition-colors",
            "dark:text-slate-400 text-slate-600"
          )}>No Container Selected</h3>
          <p className={cn(
            "text-sm mt-1 transition-colors",
            "dark:text-slate-600 text-slate-500"
          )}>
            Select a container from the sidebar to view documents
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side - Create button & result count */}
        <div className="flex items-center gap-4">
          <Button onClick={onCreateNew}>
            Create Document
          </Button>
          {searchQuery && documents.length > 0 && (
            <p className={cn(
              "text-sm transition-colors",
              "dark:text-slate-400 text-slate-600"
            )}>
              Found <span className="font-semibold">{filteredDocuments.length}</span> of {documents.length} documents
            </p>
          )}
        </div>
        
        {/* Right side - Search */}
        {documents.length > 0 && (
          <div className="relative flex justify-end">
            <div className="relative w-64 focus-within:w-80 transition-all duration-200">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                "dark:text-slate-500 text-slate-400"
              )} />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 pr-8 h-9 text-sm w-full",
                  "focus:ring-2 focus:ring-cyan-500/50"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                    "dark:hover:bg-slate-800 hover:bg-slate-200"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className={cn(
                "w-12 h-12 mx-auto mb-3 transition-colors",
                "dark:text-slate-700 text-slate-300"
              )} />
              <p className={cn(
                "transition-colors",
                "dark:text-slate-500 text-slate-500"
              )}>No documents found</p>
              <p className={cn(
                "text-xs mt-1 transition-colors",
                "dark:text-slate-600 text-slate-400"
              )}>
                Try using the Reset button in the Query Editor to reload data
              </p>
              <Button variant="outline" className="mt-3" onClick={onCreateNew}>
                Create a new document
              </Button>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className={cn(
                "w-12 h-12 mx-auto mb-3 transition-colors",
                "dark:text-slate-700 text-slate-300"
              )} />
              <p className={cn(
                "transition-colors",
                "dark:text-slate-500 text-slate-500"
              )}>No matching documents</p>
              <p className={cn(
                "text-xs mt-1 transition-colors",
                "dark:text-slate-600 text-slate-400"
              )}>
                Try a different search term
              </p>
              <Button variant="outline" className="mt-3" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column}
                  </TableHead>
                ))}
                {hasTimestamp && (
                  <>
                    <TableHead className="font-semibold">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={cn(
                            "flex items-center gap-1 hover:text-cyan-500 transition-colors",
                            "focus:outline-none"
                          )}>
                            <Clock className="w-3 h-3" />
                            Modified
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded transition-colors",
                              "dark:bg-slate-800 dark:text-slate-400",
                              "bg-slate-200 text-slate-600"
                            )}>
                              {modifiedColumn === "_ts" ? "_ts" : modifiedColumn}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Show date from</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup value={modifiedColumn} onValueChange={setModifiedColumn}>
                            {dateColumns.map((col) => (
                              <DropdownMenuRadioItem key={col} value={col}>
                                {col === "_ts" ? "_ts (System Modified)" : col}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={cn(
                            "flex items-center gap-1 hover:text-cyan-500 transition-colors",
                            "focus:outline-none"
                          )}>
                            <Calendar className="w-3 h-3" />
                            Age
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded transition-colors",
                              "dark:bg-slate-800 dark:text-slate-400",
                              "bg-slate-200 text-slate-600"
                            )}>
                              {ageColumn === "_ts" ? "_ts" : ageColumn}
                            </span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Calculate age from</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup value={ageColumn} onValueChange={setAgeColumn}>
                            {dateColumns.map((col) => (
                              <DropdownMenuRadioItem key={col} value={col}>
                                {col === "_ts" ? "_ts (System Modified)" : col}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableHead>
                  </>
                )}
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow
                  key={document.id || document._rid}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(document)}
                >
                  {columns.map((column) => (
                    <TableCell key={column}>
                      <span className="font-mono text-sm">
                        {formatCellValue(document[column])}
                      </span>
                    </TableCell>
                  ))}
                  {hasTimestamp && (
                    <>
                      <TableCell>
                        <span className={cn(
                          "text-xs transition-colors",
                          "dark:text-slate-400 text-slate-600"
                        )}>
                          {formatTimestamp(getTimestampValue(document, modifiedColumn))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full transition-colors",
                          getAgeBadgeClass(getTimestampValue(document, ageColumn))
                        )}>
                          {getDaysSince(getTimestampValue(document, ageColumn))}
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRowClick(document)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleEdit(document, e as unknown as React.MouseEvent)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-400"
                          onClick={(e) => handleDeleteClick(document, e as unknown as React.MouseEvent)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {documents.length > 0 && (
        <div className={cn(
          "flex items-center justify-between pt-4 border-t mt-4 transition-colors",
          "dark:border-slate-800",
          "border-slate-200"
        )}>
          <p className={cn(
            "text-sm transition-colors",
            "dark:text-slate-500 text-slate-500"
          )}>
            {searchQuery 
              ? `Showing ${filteredDocuments.length} of ${documents.length} • Page ${pagination.pageIndex + 1}`
              : `Page ${pagination.pageIndex + 1}`
            }
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pagination.pageIndex === 0 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pagination.continuationTokens.length <= pagination.pageIndex + 1 || isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Document Dialog */}
      <DocumentDialog
        document={selectedDocument}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        mode="view"
        onEdit={() => {
          setIsViewDialogOpen(false)
          setIsEditDialogOpen(true)
        }}
      />

      {/* Edit Document Dialog */}
      <DocumentDialog
        document={selectedDocument}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
              <br />
              <span className={cn(
                "font-mono mt-2 block transition-colors",
                "dark:text-slate-400 text-slate-600"
              )}>
                ID: {documentToDelete?.id}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={cn(
                "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
                "hover:from-red-400 hover:to-rose-500"
              )}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
