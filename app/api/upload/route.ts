import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }

  try {
    const blob = await put(filename, request.body!, {
      access: "public",
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)
    return NextResponse.json({ error: "Failed to upload file", details: error }, { status: 500 })
  }
}
