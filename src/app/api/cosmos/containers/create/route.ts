import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, partitionKey } = await request.json()

    if (!connectionString || !databaseId || !containerId || !partitionKey) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, container ID, and partition key are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const database = client.database(databaseId)
    
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKey] },
    })

    return NextResponse.json({
      success: true,
      data: { id: container.id },
    })
  } catch (error) {
    console.error("Error creating container:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create container" },
      { status: 500 }
    )
  }
}

