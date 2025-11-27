import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Encode connection string for localStorage
export function encodeConnectionString(connectionString: string): string {
  return btoa(encodeURIComponent(connectionString))
}

// Decode connection string from localStorage
export function decodeConnectionString(encodedString: string): string {
  try {
    return decodeURIComponent(atob(encodedString))
  } catch {
    return ""
  }
}

// Store connection in localStorage
export function storeConnection(connectionString: string): void {
  const encoded = encodeConnectionString(connectionString)
  localStorage.setItem("cosmos_connection", encoded)
}

// Retrieve connection from localStorage
export function getStoredConnection(): string {
  const encoded = localStorage.getItem("cosmos_connection")
  if (!encoded) return ""
  return decodeConnectionString(encoded)
}

// Clear stored connection
export function clearStoredConnection(): void {
  localStorage.removeItem("cosmos_connection")
}

// Parse connection string to extract endpoint and key
export function parseConnectionString(connectionString: string): {
  endpoint: string
  key: string
} | null {
  try {
    const parts = connectionString.split(";")
    let endpoint = ""
    let key = ""

    for (const part of parts) {
      if (part.startsWith("AccountEndpoint=")) {
        endpoint = part.replace("AccountEndpoint=", "")
      } else if (part.startsWith("AccountKey=")) {
        key = part.replace("AccountKey=", "")
      }
    }

    if (endpoint && key) {
      return { endpoint, key }
    }
    return null
  } catch {
    return null
  }
}

// Build connection string from endpoint and key
export function buildConnectionString(endpoint: string, key: string): string {
  return `AccountEndpoint=${endpoint};AccountKey=${key};`
}

