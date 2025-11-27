import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, query } = await request.json()

    if (!connectionString || !databaseId || !containerId || !query) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, container ID, and query are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const container = client.database(databaseId).container(containerId)

    const { resources, requestCharge } = await container.items
      .query(query)
      .fetchAll()

    return NextResponse.json({
      success: true,
      data: {
        documents: resources || [],
        requestCharge,
        hasMoreResults: false,
      },
    })
  } catch (error) {
    console.error("Error executing query:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute query",
      },
      { status: 500 }
    )
  }
}

