import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json()

    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: "Connection string is required" },
        { status: 400 }
      )
    }

    // Test the connection by trying to read databases
    const client = new CosmosClient(connectionString)
    await client.databases.readAll().fetchAll()

    return NextResponse.json({
      success: true,
      data: { connected: true },
    })
  } catch (error) {
    console.error("Error connecting to Cosmos DB:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to Cosmos DB",
      },
      { status: 500 }
    )
  }
}

