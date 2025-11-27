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
    const database = client.database(databaseId)
    const { resources: containers } = await database.containers.readAll().fetchAll()

    return NextResponse.json({
      success: true,
      data: containers.map((container) => ({
        id: container.id,
        _rid: container._rid,
        _self: container._self,
        _etag: container._etag,
        _ts: container._ts,
        partitionKey: container.partitionKey,
      })),
    })
  } catch (error) {
    console.error("Error fetching containers:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch containers",
      },
      { status: 500 }
    )
  }
}

