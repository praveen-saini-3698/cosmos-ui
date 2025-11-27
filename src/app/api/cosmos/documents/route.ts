import { NextRequest, NextResponse } from "next/server"
import { CosmosClient } from "@azure/cosmos"

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseId, containerId, pageSize = 10, continuationToken } = await request.json()

    if (!connectionString || !databaseId || !containerId) {
      return NextResponse.json(
        { success: false, error: "Connection string, database ID, and container ID are required" },
        { status: 400 }
      )
    }

    const client = new CosmosClient(connectionString)
    const container = client.database(databaseId).container(containerId)

    const queryIterator = container.items.readAll({
      maxItemCount: pageSize,
      continuationToken: continuationToken || undefined,
    })

    const response = await queryIterator.fetchNext()

    return NextResponse.json({
      success: true,
      data: {
        documents: response.resources || [],
        continuationToken: response.continuationToken,
        requestCharge: response.requestCharge,
        hasMoreResults: response.hasMoreResults,
      },
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch documents",
      },
      { status: 500 }
    )
  }
}

