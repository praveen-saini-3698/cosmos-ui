import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, document } = await request.json()

    if (!connectionString || !databaseId || !containerId || !document) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, container ID, and document are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const container = client.database(databaseId).container(containerId)

    const { resource } = await container.items.create(document)

    return NextResponse.json({
      success: true,
      data: resource,
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      },
      { status: 500 }
    )
  }
}

