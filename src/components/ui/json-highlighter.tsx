"use client"

import React, { useMemo, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface JsonHighlighterProps {
  json: string
  className?: string
}

type TokenType = "key" | "string" | "number" | "boolean" | "null" | "brace" | "bracket" | "colon" | "comma"

const tokenColors: Record<TokenType, string> = {
  key: "text-cyan-600 dark:text-cyan-400 font-semibold",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-amber-600 dark:text-amber-400",
  boolean: "text-purple-600 dark:text-purple-400",
  null: "text-rose-600 dark:text-rose-400",
  brace: "text-yellow-600 dark:text-yellow-300",
  bracket: "text-yellow-600 dark:text-yellow-300",
  colon: "text-slate-500 dark:text-slate-400",
  comma: "text-slate-500 dark:text-slate-400",
}

export function JsonHighlighter({ json, className }: JsonHighlighterProps) {
  const highlighted = useMemo(() => {
    try {
      // Parse and re-stringify to ensure valid JSON with consistent formatting
      const parsed = JSON.parse(json)
      const formatted = JSON.stringify(parsed, null, 2)
      return highlightJson(formatted)
    } catch {
      // If invalid JSON, return as plain text
      return <span className="text-slate-700 dark:text-slate-300">{json}</span>
    }
  }, [json])

  return (
    <pre className={cn("font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto", className)}>
      {highlighted}
    </pre>
  )
}

function highlightJson(json: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let i = 0
  let keyIndex = 0

  const addToken = (type: TokenType, value: string) => {
    result.push(
      <span key={keyIndex++} className={tokenColors[type]}>
        {value}
      </span>
    )
  }

  const addWhitespace = (value: string) => {
    result.push(<span key={keyIndex++}>{value}</span>)
  }

  while (i < json.length) {
    const char = json[i]

    // Whitespace
    if (/\s/.test(char)) {
      let whitespace = ""
      while (i < json.length && /\s/.test(json[i])) {
        whitespace += json[i]
        i++
      }
      addWhitespace(whitespace)
      continue
    }

    // Braces
    if (char === "{" || char === "}") {
      addToken("brace", char)
      i++
      continue
    }

    // Brackets
    if (char === "[" || char === "]") {
      addToken("bracket", char)
      i++
      continue
    }

    // Colon
    if (char === ":") {
      addToken("colon", char)
      i++
      continue
    }

    // Comma
    if (char === ",") {
      addToken("comma", char)
      i++
      continue
    }

    // String (could be key or value)
    if (char === '"') {
      let str = '"'
      i++
      while (i < json.length) {
        if (json[i] === "\\") {
          str += json[i] + (json[i + 1] || "")
          i += 2
          continue
        }
        if (json[i] === '"') {
          str += '"'
          i++
          break
        }
        str += json[i]
        i++
      }

      // Check if this is a key (followed by :)
      let lookAhead = i
      while (lookAhead < json.length && /\s/.test(json[lookAhead])) {
        lookAhead++
      }
      const isKey = json[lookAhead] === ":"

      addToken(isKey ? "key" : "string", str)
      continue
    }

    // Number
    if (/[-\d]/.test(char)) {
      let num = ""
      while (i < json.length && /[-\d.eE+]/.test(json[i])) {
        num += json[i]
        i++
      }
      addToken("number", num)
      continue
    }

    // Boolean true
    if (json.slice(i, i + 4) === "true") {
      addToken("boolean", "true")
      i += 4
      continue
    }

    // Boolean false
    if (json.slice(i, i + 5) === "false") {
      addToken("boolean", "false")
      i += 5
      continue
    }

    // Null
    if (json.slice(i, i + 4) === "null") {
      addToken("null", "null")
      i += 4
      continue
    }

    // Unknown character
    result.push(<span key={keyIndex++}>{char}</span>)
    i++
  }

  return result
}

// Theme-aware color map for HTML highlighting
const getColorMap = (isDark: boolean): Record<TokenType, string> => ({
  key: isDark ? "#22d3ee" : "#0891b2", // cyan
  string: isDark ? "#34d399" : "#059669", // emerald
  number: isDark ? "#fbbf24" : "#d97706", // amber
  boolean: isDark ? "#c084fc" : "#9333ea", // purple
  null: isDark ? "#fb7185" : "#e11d48", // rose
  brace: isDark ? "#fde047" : "#ca8a04", // yellow
  bracket: isDark ? "#fde047" : "#ca8a04", // yellow
  colon: isDark ? "#94a3b8" : "#64748b", // slate
  comma: isDark ? "#94a3b8" : "#64748b", // slate
})

// Highlight JSON string and return as HTML string for dangerouslySetInnerHTML
function highlightJsonToHtml(json: string, isDark: boolean): string {
  const colorMap = getColorMap(isDark)

  let result = ""
  let i = 0

  const addToken = (type: TokenType, value: string) => {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    const fontWeight = type === "key" ? "; font-weight: 600" : ""
    result += `<span style="color: ${colorMap[type]}${fontWeight}">${escaped}</span>`
  }

  const addWhitespace = (value: string) => {
    result += value
  }

  while (i < json.length) {
    const char = json[i]

    // Whitespace
    if (/\s/.test(char)) {
      let whitespace = ""
      while (i < json.length && /\s/.test(json[i])) {
        whitespace += json[i]
        i++
      }
      addWhitespace(whitespace)
      continue
    }

    // Braces
    if (char === "{" || char === "}") {
      addToken("brace", char)
      i++
      continue
    }

    // Brackets
    if (char === "[" || char === "]") {
      addToken("bracket", char)
      i++
      continue
    }

    // Colon
    if (char === ":") {
      addToken("colon", char)
      i++
      continue
    }

    // Comma
    if (char === ",") {
      addToken("comma", char)
      i++
      continue
    }

    // String (could be key or value)
    if (char === '"') {
      let str = '"'
      i++
      while (i < json.length) {
        if (json[i] === "\\") {
          str += json[i] + (json[i + 1] || "")
          i += 2
          continue
        }
        if (json[i] === '"') {
          str += '"'
          i++
          break
        }
        str += json[i]
        i++
      }

      // Check if this is a key (followed by :)
      let lookAhead = i
      while (lookAhead < json.length && /\s/.test(json[lookAhead])) {
        lookAhead++
      }
      const isKey = json[lookAhead] === ":"

      addToken(isKey ? "key" : "string", str)
      continue
    }

    // Number
    if (/[-\d]/.test(char)) {
      let num = ""
      while (i < json.length && /[-\d.eE+]/.test(json[i])) {
        num += json[i]
        i++
      }
      addToken("number", num)
      continue
    }

    // Boolean true
    if (json.slice(i, i + 4) === "true") {
      addToken("boolean", "true")
      i += 4
      continue
    }

    // Boolean false
    if (json.slice(i, i + 5) === "false") {
      addToken("boolean", "false")
      i += 5
      continue
    }

    // Null
    if (json.slice(i, i + 4) === "null") {
      addToken("null", "null")
      i += 4
      continue
    }

    // Unknown character - escape it
    const escaped = char
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    result += escaped
    i++
  }

  return result
}

// For edit mode - with syntax highlighting overlay
interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function JsonEditor({ value, onChange, className, placeholder, disabled }: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const [lineCount, setLineCount] = useState(1)
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

  // Calculate line count
  useEffect(() => {
    const lines = (value.match(/\n/g) || []).length + 1
    setLineCount(Math.max(lines, 20))
  }, [value])

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
      return highlightJsonToHtml(value, isDark)
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
        "dark:border-slate-700 dark:bg-slate-950",
        "border-slate-300 bg-white",
        className
      )}
    >
      {/* Line numbers */}
      <div className={cn(
        "flex-shrink-0 border-r px-3 py-3 select-none overflow-hidden transition-colors",
        "dark:bg-slate-900/80 dark:border-slate-800",
        "bg-slate-100 border-slate-200"
      )}>
        <div className={cn(
          "flex flex-col font-mono text-sm text-right leading-[1.625] transition-colors",
          "dark:text-slate-600",
          "text-slate-400"
        )}>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i + 1}>{i + 1}</span>
          ))}
        </div>
      </div>
      
      {/* Editor container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax highlighted background */}
        <pre
          ref={highlightRef}
          className={cn(
            "absolute inset-0 p-3 font-mono text-sm leading-[1.625] whitespace-pre overflow-hidden pointer-events-none transition-colors",
            "dark:text-slate-300",
            "text-slate-700"
          )}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedHtml || `<span class="${isDark ? 'text-slate-600' : 'text-slate-400'}">${placeholder || ""}</span>` }}
        />
        
        {/* Actual textarea (transparent text) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className={cn(
            "absolute inset-0 w-full h-full bg-transparent text-transparent font-mono text-sm p-3 resize-none outline-none leading-[1.625] whitespace-pre overflow-auto",
            "dark:caret-cyan-400",
            "caret-cyan-600"
          )}
          placeholder=""
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
