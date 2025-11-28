import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId } = await request.json()

    if (!connectionString || !databaseId) {
      return NextResponse.json(
        { success: false, error: "Connection string and database ID are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    await client.database(databaseId).delete()

    return NextResponse.json({
      success: true,
      data: { id: databaseId },
    })
  } catch (error) {
    console.error("Error deleting database:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete database" },
      { status: 500 }
    )
  }
}

