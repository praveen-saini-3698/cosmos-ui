"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  ConnectionState,
  DatabaseWithContainers,
  CosmosContainer,
  CosmosDocument,
  QueryResult,
  SelectedItem,
  PaginationState,
} from "./types"
import { getStoredConnection, storeConnection, clearStoredConnection } from "./utils"
import { toast } from "sonner"

interface CosmosContextType {
  // Connection state
  connection: ConnectionState
  setConnection: (connection: ConnectionState) => void
  disconnect: () => void
  
  // Database state
  databases: DatabaseWithContainers[]
  setDatabases: React.Dispatch<React.SetStateAction<DatabaseWithContainers[]>>
  loadDatabases: () => Promise<void>
  loadContainers: (databaseId: string) => Promise<void>
  
  // Selected state
  selectedItem: SelectedItem
  setSelectedItem: (item: SelectedItem) => void
  
  // Document state
  documents: CosmosDocument[]
  setDocuments: React.Dispatch<React.SetStateAction<CosmosDocument[]>>
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Actions
  loadDocuments: (database: string, container: string, page?: number) => Promise<void>
  executeQuery: (database: string, container: string, query: string) => Promise<void>
  createDocument: (database: string, container: string, document: Record<string, unknown>) => Promise<void>
  updateDocument: (database: string, container: string, documentId: string, document: Record<string, unknown>) => Promise<void>
  deleteDocument: (database: string, container: string, documentId: string, partitionKey: string) => Promise<void>
}

const CosmosContext = createContext<CosmosContextType | undefined>(undefined)

export function CosmosProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
  })
  const [databases, setDatabases] = useState<DatabaseWithContainers[]>([])
  const [selectedItem, setSelectedItem] = useState<SelectedItem>({})
  const [documents, setDocuments] = useState<CosmosDocument[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalCount: 0,
    continuationTokens: [undefined],
  })
  const [isLoading, setIsLoading] = useState(false)

  // Check for stored connection on mount
  useEffect(() => {
    const stored = getStoredConnection()
    if (stored) {
      setConnectionState({
        isConnected: false,
        connectionString: stored,
      })
    }
  }, [])

  const setConnection = useCallback((conn: ConnectionState) => {
    setConnectionState(conn)
    if (conn.isConnected && conn.connectionString) {
      storeConnection(conn.connectionString)
    }
  }, [])

  const disconnect = useCallback(() => {
    setConnectionState({ isConnected: false })
    clearStoredConnection()
    setDatabases([])
    setSelectedItem({})
    setDocuments([])
    setPagination({
      pageIndex: 0,
      pageSize: 10,
      totalCount: 0,
      continuationTokens: [undefined],
    })
  }, [])

  const loadDatabases = useCallback(async () => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: connection.connectionString }),
      })

      const data = await response.json()
      if (data.success) {
        setDatabases(data.data.map((db: DatabaseWithContainers) => ({ ...db, containers: [], isExpanded: false })))
      } else {
        toast.error("Failed to load databases", { description: data.error })
      }
    } catch (error) {
      toast.error("Failed to load databases", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString])

  const loadContainers = useCallback(async (databaseId: string) => {
    if (!connection.connectionString) return

    setDatabases((prev) =>
      prev.map((db) =>
        db.id === databaseId ? { ...db, isLoading: true } : db
      )
    )

    try {
      const response = await fetch("/api/cosmos/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDatabases((prev) =>
          prev.map((db) =>
            db.id === databaseId
              ? { ...db, containers: data.data, isLoading: false, isExpanded: true }
              : db
          )
        )
      } else {
        toast.error("Failed to load containers", { description: data.error })
        setDatabases((prev) =>
          prev.map((db) =>
            db.id === databaseId ? { ...db, isLoading: false } : db
          )
        )
      }
    } catch (error) {
      toast.error("Failed to load containers", { description: String(error) })
      setDatabases((prev) =>
        prev.map((db) =>
          db.id === databaseId ? { ...db, isLoading: false } : db
        )
      )
    }
  }, [connection.connectionString])

  const loadDocuments = useCallback(async (database: string, container: string, page: number = 0) => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const continuationToken = pagination.continuationTokens[page]
      
      const response = await fetch("/api/cosmos/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId: database,
          containerId: container,
          pageSize: pagination.pageSize,
          continuationToken,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const result: QueryResult = data.data
        setDocuments(result.documents)
        setPagination((prev) => {
          const newTokens = [...prev.continuationTokens]
          if (result.continuationToken && page === newTokens.length - 1) {
            newTokens.push(result.continuationToken)
          }
          return {
            ...prev,
            pageIndex: page,
            continuationTokens: newTokens,
            totalCount: result.hasMoreResults ? (page + 2) * prev.pageSize : (page + 1) * prev.pageSize,
          }
        })
      } else {
        toast.error("Failed to load documents", { description: data.error })
      }
    } catch (error) {
      toast.error("Failed to load documents", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString, pagination.continuationTokens, pagination.pageSize])

  const executeQuery = useCallback(async (database: string, container: string, query: string) => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId: database,
          containerId: container,
          query,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDocuments(data.data.documents)
        setPagination({
          pageIndex: 0,
          pageSize: 10,
          totalCount: data.data.documents.length,
          continuationTokens: [undefined],
        })
        toast.success("Query executed successfully", {
          description: `${data.data.documents.length} documents returned`,
        })
      } else {
        // Clear documents on query error
        setDocuments([])
        setPagination({
          pageIndex: 0,
          pageSize: 10,
          totalCount: 0,
          continuationTokens: [undefined],
        })
        toast.error("Query failed", { description: data.error })
      }
    } catch (error) {
      // Clear documents on query error
      setDocuments([])
      setPagination({
        pageIndex: 0,
        pageSize: 10,
        totalCount: 0,
        continuationTokens: [undefined],
      })
      toast.error("Query failed", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString])

  const createDocument = useCallback(async (
    database: string,
    container: string,
    document: Record<string, unknown>
  ) => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId: database,
          containerId: container,
          document,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Document created successfully")
        // Reload documents
        await loadDocuments(database, container, 0)
      } else {
        toast.error("Failed to create document", { description: data.error })
      }
    } catch (error) {
      toast.error("Failed to create document", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString, loadDocuments])

  const updateDocument = useCallback(async (
    database: string,
    container: string,
    documentId: string,
    document: Record<string, unknown>
  ) => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/documents/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId: database,
          containerId: container,
          documentId,
          document,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Document updated successfully")
        // Reload documents
        await loadDocuments(database, container, pagination.pageIndex)
      } else {
        toast.error("Failed to update document", { description: data.error })
      }
    } catch (error) {
      toast.error("Failed to update document", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString, loadDocuments, pagination.pageIndex])

  const deleteDocument = useCallback(async (
    database: string,
    container: string,
    documentId: string,
    partitionKey: string
  ) => {
    if (!connection.connectionString) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/cosmos/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connection.connectionString,
          databaseId: database,
          containerId: container,
          documentId,
          partitionKey,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success("Document deleted successfully")
        // Reload documents
        await loadDocuments(database, container, pagination.pageIndex)
      } else {
        toast.error("Failed to delete document", { description: data.error })
      }
    } catch (error) {
      toast.error("Failed to delete document", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }, [connection.connectionString, loadDocuments, pagination.pageIndex])

  return (
    <CosmosContext.Provider
      value={{
        connection,
        setConnection,
        disconnect,
        databases,
        setDatabases,
        loadDatabases,
        loadContainers,
        selectedItem,
        setSelectedItem,
        documents,
        setDocuments,
        pagination,
        setPagination,
        isLoading,
        setIsLoading,
        loadDocuments,
        executeQuery,
        createDocument,
        updateDocument,
        deleteDocument,
      }}
    >
      {children}
    </CosmosContext.Provider>
  )
}

export function useCosmos() {
  const context = useContext(CosmosContext)
  if (context === undefined) {
    throw new Error("useCosmos must be used within a CosmosProvider")
  }
  return context
}

