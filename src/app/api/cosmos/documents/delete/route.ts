import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, documentId, partitionKey } = await request.json()

    if (!connectionString || !databaseId || !containerId || !documentId) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, container ID, and document ID are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const container = client.database(databaseId).container(containerId)

    await container.item(documentId, partitionKey || documentId).delete()

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 }
    )
  }
}

