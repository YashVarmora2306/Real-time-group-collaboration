import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    const message = await request.json()
    console.log(`[API/messages/${roomId}] Adding message:`, message.id, message.sender)

    // Insert message
    await sql`
      INSERT INTO messages (id, room_id, type, content, file_name, file_size, file_type, file_url, sender, timestamp)
      VALUES (${message.id}, ${roomId}, ${message.type}, ${message.content}, 
              ${message.fileName || null}, ${message.fileSize || null}, ${message.fileType || null}, 
              ${message.fileUrl || null}, ${message.sender}, ${message.timestamp})
    `
    console.log(`[API/messages/${roomId}] Message added successfully.`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API/messages/${params.id}] Error adding message:`, error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
