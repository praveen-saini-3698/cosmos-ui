// Database types
export interface CosmosDatabase {
  id: string
  _rid?: string
  _self?: string
  _etag?: string
  _ts?: number
}

export interface CosmosContainer {
  id: string
  _rid?: string
  _self?: string
  _etag?: string
  _ts?: number
  partitionKey?: {
    paths: string[]
    kind: string
    version?: number
  }
}

export interface CosmosDocument {
  id: string
  _rid?: string
  _self?: string
  _etag?: string
  _ts?: number
  _attachments?: string
  [key: string]: unknown
}

// Connection types
export interface ConnectionCredentials {
  endpoint: string
  key: string
}

export interface ConnectionState {
  isConnected: boolean
  connectionString?: string
  credentials?: ConnectionCredentials
}

// Query types
export interface QueryResult {
  documents: CosmosDocument[]
  continuationToken?: string
  requestCharge?: number
  hasMoreResults: boolean
}

// Pagination types
export interface PaginationState {
  pageIndex: number
  pageSize: number
  totalCount: number
  continuationTokens: (string | undefined)[]
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface DatabaseListResponse extends ApiResponse<CosmosDatabase[]> {}

export interface ContainerListResponse extends ApiResponse<CosmosContainer[]> {}

export interface DocumentListResponse extends ApiResponse<QueryResult> {}

export interface DocumentResponse extends ApiResponse<CosmosDocument> {}

// UI State types
export interface SelectedItem {
  database?: string
  container?: string
}

// Sidebar types
export interface DatabaseWithContainers extends CosmosDatabase {
  containers?: CosmosContainer[]
  isLoading?: boolean
  isExpanded?: boolean
}

