import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId } = await request.json()

    if (!connectionString || !databaseId || !containerId) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, and container ID are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    await client.database(databaseId).container(containerId).delete()

    return NextResponse.json({
      success: true,
      data: { id: containerId },
    })
  } catch (error) {
    console.error("Error deleting container:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete container" },
      { status: 500 }
    )
  }
}

