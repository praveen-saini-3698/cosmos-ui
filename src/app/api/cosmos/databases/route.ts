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

    const client = new CosmosClient(connectionString)
    const { resources: databases } = await client.databases.readAll().fetchAll()

    return NextResponse.json({
      success: true,
      data: databases.map((db) => ({
        id: db.id,
        _rid: db._rid,
        _self: db._self,
        _etag: db._etag,
        _ts: db._ts,
      })),
    })
  } catch (error) {
    console.error("Error fetching databases:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch databases",
      },
      { status: 500 }
    )
  }
}

