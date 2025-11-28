"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useCosmos } from "@/lib/cosmos-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SqlEditor } from "@/components/ui/sql-highlighter"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Play, RotateCcw, Sparkles, AlignLeft } from "lucide-react"

const DEFAULT_QUERY = "SELECT * FROM c"

// SQL Formatter/Beautifier
function formatSql(sql: string): string {
  // Normalize whitespace
  let formatted = sql.replace(/\s+/g, " ").trim()
  
  // Handle operators with proper spacing using placeholders
  // First, normalize all operators to have consistent spacing
  // Order matters: handle multi-char operators first
  formatted = formatted.replace(/\s*!=\s*/g, " != ")
  formatted = formatted.replace(/\s*<>\s*/g, " <> ")
  formatted = formatted.replace(/\s*>=\s*/g, " >= ")
  formatted = formatted.replace(/\s*<=\s*/g, " <= ")
  
  // For single char operators, use word boundaries or specific patterns
  // to avoid breaking >= and <=
  formatted = formatted.replace(/([^<>!])=([^=])/g, "$1 = $2")
  formatted = formatted.replace(/([^<])>([^=])/g, "$1 > $2")
  formatted = formatted.replace(/([^>])<([^=<])/g, "$1 < $2")
  
  // Keywords that should start on a new line (with no indent)
  const mainKeywords = ["SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "UNION", "INTERSECT", "EXCEPT"]
  
  // Keywords that should start on a new line with indent
  const indentKeywords = ["AND", "OR"]
  
  // Process main keywords - add newline before
  mainKeywords.forEach(keyword => {
    const regex = new RegExp(`\\s+${keyword}\\s+`, "gi")
    formatted = formatted.replace(regex, `\n${keyword} `)
  })
  
  // Process indent keywords - add newline + indent before
  indentKeywords.forEach(keyword => {
    const regex = new RegExp(`\\s+${keyword}\\s+`, "gi")
    formatted = formatted.replace(regex, `\n  ${keyword} `)
  })

  // Handle SELECT fields - put each on new line if there are many
  const selectMatch = formatted.match(/^SELECT\s+(.*?)\s*\nFROM/i)
  if (selectMatch) {
    const fields = selectMatch[1]
    const fieldList = fields.split(",").map(f => f.trim())
    
    if (fieldList.length > 3) {
      const formattedFields = fieldList.map((f, i) => 
        i === 0 ? f : `       ${f}`
      ).join(",\n")
      formatted = formatted.replace(selectMatch[1], `\n  ${formattedFields}\n`)
    }
  }
  
  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n")
  
  // Fix any double/triple spaces
  formatted = formatted.replace(/ {2,}/g, " ")
  
  // Trim each line
  formatted = formatted.split("\n").map(line => line.trim()).join("\n")
  
  return formatted
}

// Helper functions to store/retrieve queries per container
function getStoredQuery(database: string, container: string): string | null {
  if (typeof window === "undefined") return null
  const key = `cosmos_query_${database}_${container}`
  return localStorage.getItem(key)
}

function storeQuery(database: string, container: string, query: string): void {
  if (typeof window === "undefined") return
  const key = `cosmos_query_${database}_${container}`
  localStorage.setItem(key, query)
}

export function QueryBox() {
  const { selectedItem, executeQuery, loadDocuments, isLoading, setPagination, setDocuments } = useCosmos()
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [limit, setLimit] = useState(10)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load stored query when container changes
  useEffect(() => {
    if (selectedItem.database && selectedItem.container) {
      const storedQuery = getStoredQuery(selectedItem.database, selectedItem.container)
      if (storedQuery) {
        setQuery(storedQuery)
      } else {
        setQuery(DEFAULT_QUERY)
      }
    } else {
      setQuery(DEFAULT_QUERY)
    }
  }, [selectedItem.database, selectedItem.container])

  // Check if query already has TOP clause
  const hasTopClause = useMemo(() => {
    return /\bTOP\s+\d+\b/i.test(query)
  }, [query])

  // Build final query with limit if needed
  const buildFinalQuery = useCallback(() => {
    if (hasTopClause) {
      return query
    }
    // Insert TOP clause after SELECT
    const selectMatch = query.match(/^(\s*SELECT\s+)/i)
    if (selectMatch) {
      return query.replace(/^(\s*SELECT\s+)/i, `$1TOP ${limit} `)
    }
    return query
  }, [query, hasTopClause, limit])

  const handleExecute = async () => {
    if (!selectedItem.database || !selectedItem.container) {
      toast.error("Please select a container first")
      return
    }

    if (!query.trim()) {
      toast.error("Please enter a query")
      return
    }

    const finalQuery = buildFinalQuery()
    
    // Store the query for this container before executing
    storeQuery(selectedItem.database, selectedItem.container, query)
    
    await executeQuery(selectedItem.database, selectedItem.container, finalQuery)
  }

  const handleReset = async () => {
    if (!selectedItem.database || !selectedItem.container) {
      toast.error("Please select a container first")
      return
    }

    // Reset to default query (don't remove from storage, just reset the current view)
    setQuery(DEFAULT_QUERY)
    setLimit(10)
    setPagination({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      continuationTokens: [undefined],
    })
    // Clear current documents and reload initial data
    setDocuments([])
    await loadDocuments(selectedItem.database, selectedItem.container, 0)
  }

  const isDisabled = !selectedItem.database || !selectedItem.container

  return (
    <div className={cn(
      "rounded-xl border backdrop-blur-sm overflow-hidden transition-colors",
      "dark:border-slate-800 dark:bg-slate-900/50",
      "border-slate-200 bg-white/50"
    )}>
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
          "dark:hover:bg-slate-800/30",
          "hover:bg-slate-100/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span className={cn(
            "font-medium text-sm transition-colors",
            "dark:text-white text-slate-900"
          )}>Query Editor</span>
          {selectedItem.container && query !== DEFAULT_QUERY && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full transition-colors",
              "dark:bg-cyan-900/30 dark:text-cyan-400",
              "bg-cyan-100 text-cyan-700"
            )}>
              Custom Query
            </span>
          )}
        </div>
        <span className={cn(
          "text-xs transition-colors",
          "dark:text-slate-500 text-slate-500"
        )}>
          {isExpanded ? "Click to collapse" : "Click to expand"}
        </span>
      </div>

      {isExpanded && (
        <div className={cn(
          "p-0 pt-0 space-y-3 border-t transition-colors",
          "dark:border-slate-800",
          "border-slate-200"
        )}>
          <SqlEditor
            value={query}
            onChange={setQuery}
            placeholder="Enter your SQL query here... e.g., SELECT * FROM c WHERE c.status = 'active'"
            minHeight="100px"
            disabled={isDisabled}
          />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!hasTopClause && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="limit" className="text-xs whitespace-nowrap">
                    Limit:
                  </Label>
                  <Input
                    id="limit"
                    type="number"
                    min={1}
                    max={1000}
                    value={limit}
                    onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-20 h-8 text-sm"
                    disabled={isDisabled}
                  />
                </div>
              )}
              <p className={cn(
                "text-xs transition-colors",
                "dark:text-slate-500 text-slate-500"
              )}>
                {isDisabled
                  ? "Select a container to run queries"
                  : hasTopClause
                  ? "Query has TOP clause"
                  : `Will add TOP ${limit} to query`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery(formatSql(query))}
                disabled={isLoading || isDisabled || !query.trim()}
                title="Format query"
              >
                <AlignLeft className="w-4 h-4 mr-2" />
                Format
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading || isDisabled}
                title="Reset to default query"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isLoading || isDisabled || !query.trim()}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
