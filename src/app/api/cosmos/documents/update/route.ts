import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, documentId, document } = await request.json()

    if (!connectionString || !databaseId || !containerId || !documentId || !document) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, container ID, document ID, and document are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const container = client.database(databaseId).container(containerId)

    // Get the partition key value from the document
    // First, get the container definition to find the partition key path
    const { resource: containerDef } = await container.read()
    const partitionKeyPath = containerDef?.partitionKey?.paths?.[0]?.replace("/", "") || "id"
    const partitionKeyValue = document[partitionKeyPath] || document.id

    const { resource } = await container
      .item(documentId, partitionKeyValue)
      .replace(document)

    return NextResponse.json({
      success: true,
      data: resource,
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update document",
      },
      { status: 500 }
    )
  }
}

