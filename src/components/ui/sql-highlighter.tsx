"use client"

import React, { useRef, useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"

// SQL token types
type TokenType = "keyword" | "function" | "string" | "number" | "operator" | "identifier" | "alias" | "comment" | "punctuation"

// Theme-aware color map for SQL highlighting
const getColorMap = (isDark: boolean): Record<TokenType, string> => ({
  keyword: isDark ? "#c084fc" : "#9333ea",      // purple - SELECT, FROM, WHERE, etc.
  function: isDark ? "#22d3ee" : "#0891b2",     // cyan - COUNT, SUM, etc.
  string: isDark ? "#34d399" : "#059669",       // emerald - 'string values'
  number: isDark ? "#fbbf24" : "#d97706",       // amber - 123, 45.67
  operator: isDark ? "#f472b6" : "#db2777",     // pink - =, !=, <, >, AND, OR
  identifier: isDark ? "#60a5fa" : "#2563eb",   // blue - c.fieldName
  alias: isDark ? "#94a3b8" : "#64748b",        // slate - c, r
  comment: isDark ? "#6b7280" : "#9ca3af",      // gray - -- comments
  punctuation: isDark ? "#94a3b8" : "#64748b",  // slate - , ( )
})

// SQL keywords
const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE",
  "ORDER", "BY", "ASC", "DESC", "TOP", "DISTINCT", "AS", "JOIN", "LEFT",
  "RIGHT", "INNER", "OUTER", "ON", "GROUP", "HAVING", "LIMIT", "OFFSET",
  "NULL", "IS", "TRUE", "FALSE", "EXISTS", "ALL", "ANY", "CASE", "WHEN",
  "THEN", "ELSE", "END", "UNION", "INTERSECT", "EXCEPT", "VALUE", "ARRAY"
])

// SQL functions
const SQL_FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "ARRAY_CONTAINS", "CONTAINS",
  "STARTSWITH", "ENDSWITH", "CONCAT", "LENGTH", "LOWER", "UPPER", "TRIM",
  "SUBSTRING", "REPLACE", "ABS", "CEILING", "FLOOR", "ROUND", "POWER",
  "SQRT", "LOG", "EXP", "SIN", "COS", "TAN", "ASIN", "ACOS", "ATAN",
  "GetCurrentDateTime", "GetCurrentTimestamp", "DateTimeAdd", "DateTimeDiff",
  "ST_DISTANCE", "ST_WITHIN", "ST_INTERSECTS", "ST_ISVALID", "ST_ISVALIDDETAILED",
  "ARRAY_LENGTH", "ARRAY_SLICE", "IS_ARRAY", "IS_BOOL", "IS_DEFINED",
  "IS_NULL", "IS_NUMBER", "IS_OBJECT", "IS_PRIMITIVE", "IS_STRING"
])

function highlightSqlToHtml(sql: string, isDark: boolean): string {
  const colorMap = getColorMap(isDark)
  let result = ""
  let i = 0

  const addToken = (type: TokenType, value: string, bold = false) => {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    const fontWeight = bold ? "; font-weight: 600" : ""
    result += `<span style="color: ${colorMap[type]}${fontWeight}">${escaped}</span>`
  }

  const addPlain = (value: string) => {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    result += escaped
  }

  while (i < sql.length) {
    const char = sql[i]

    // Whitespace
    if (/\s/.test(char)) {
      let whitespace = ""
      while (i < sql.length && /\s/.test(sql[i])) {
        whitespace += sql[i]
        i++
      }
      addPlain(whitespace)
      continue
    }

    // Single line comment (--)
    if (char === "-" && sql[i + 1] === "-") {
      let comment = ""
      while (i < sql.length && sql[i] !== "\n") {
        comment += sql[i]
        i++
      }
      addToken("comment", comment)
      continue
    }

    // String (single quotes)
    if (char === "'") {
      let str = "'"
      i++
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          // Escaped quote
          str += "''"
          i += 2
          continue
        }
        if (sql[i] === "'") {
          str += "'"
          i++
          break
        }
        str += sql[i]
        i++
      }
      addToken("string", str)
      continue
    }

    // Double quoted identifier
    if (char === '"') {
      let str = '"'
      i++
      while (i < sql.length && sql[i] !== '"') {
        str += sql[i]
        i++
      }
      if (sql[i] === '"') {
        str += '"'
        i++
      }
      addToken("identifier", str)
      continue
    }

    // Number
    if (/\d/.test(char) || (char === "." && /\d/.test(sql[i + 1] || ""))) {
      let num = ""
      while (i < sql.length && /[\d.eE+-]/.test(sql[i])) {
        num += sql[i]
        i++
      }
      addToken("number", num)
      continue
    }

    // Operators
    if (/[=<>!]/.test(char)) {
      let op = char
      i++
      // Check for multi-char operators like !=, >=, <=, <>
      if ((char === "!" || char === "<" || char === ">") && sql[i] === "=") {
        op += "="
        i++
      } else if (char === "<" && sql[i] === ">") {
        op += ">"
        i++
      }
      addToken("operator", op)
      continue
    }

    // Punctuation
    if (/[(),*]/.test(char)) {
      addToken("punctuation", char)
      i++
      continue
    }

    // Dot (for c.field notation)
    if (char === ".") {
      addToken("punctuation", char)
      i++
      continue
    }

    // Word (keyword, function, identifier)
    if (/[a-zA-Z_@]/.test(char)) {
      let word = ""
      const start = i
      while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) {
        word += sql[i]
        i++
      }

      const upperWord = word.toUpperCase()
      
      // Check if it's followed by ( - could be a function
      let lookAhead = i
      while (lookAhead < sql.length && /\s/.test(sql[lookAhead])) {
        lookAhead++
      }
      const isFunction = sql[lookAhead] === "("

      if (SQL_KEYWORDS.has(upperWord)) {
        addToken("keyword", word, true)
      } else if (SQL_FUNCTIONS.has(upperWord) || isFunction) {
        addToken("function", word)
      } else {
        // Check if preceded by . (it's a field name)
        const prevChar = sql[start - 1]
        if (prevChar === ".") {
          addToken("identifier", word)
        } else {
          // Single letter alias (like c, r) or identifier
          if (word.length === 1) {
            addToken("alias", word)
          } else {
            addToken("identifier", word)
          }
        }
      }
      continue
    }

    // Unknown character
    addPlain(char)
    i++
  }

  return result
}

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  minHeight?: string
}

export function SqlEditor({ 
  value, 
  onChange, 
  className, 
  placeholder = "Enter your SQL query...",
  disabled,
  minHeight = "100px"
}: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const [isDark, setIsDark] = useState(true)

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    
    return () => observer.disconnect()
  }, [])

  // Sync scroll between textarea and highlight
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Get highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!value) return ""
    try {
      return highlightSqlToHtml(value, isDark)
    } catch {
      return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    }
  }, [value, isDark])

  return (
    <div 
      className={cn(
        "relative flex rounded-lg border overflow-hidden transition-colors",
        "dark:border-slate-700 dark:bg-slate-900/80",
        "border-slate-200 bg-slate-50",
        disabled && "opacity-50",
        className
      )}
      style={{ minHeight }}
    >
      {/* Editor container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax highlighted background */}
        <pre
          ref={highlightRef}
          className={cn(
            "absolute inset-0 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden pointer-events-none transition-colors",
            "dark:text-slate-300",
            "text-slate-700"
          )}
          style={{ minHeight }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ 
            __html: highlightedHtml || `<span class="${isDark ? 'text-slate-600' : 'text-slate-400'}">${placeholder}</span>` 
          }}
        />
        
        {/* Actual textarea (transparent text) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className={cn(
            "relative w-full bg-transparent text-transparent font-mono text-sm p-3 resize-none outline-none leading-relaxed whitespace-pre-wrap overflow-auto",
            "dark:caret-cyan-400",
            "caret-cyan-600",
            "focus:ring-0"
          )}
          style={{ minHeight }}
          placeholder=""
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

