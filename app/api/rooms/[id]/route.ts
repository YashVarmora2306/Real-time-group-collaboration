import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    console.log(`[API/rooms/${roomId}] Fetching room details...`)

    // Get room data
    const rooms = await sql`
      SELECT * FROM rooms 
      WHERE id = ${roomId}
    `

    if (rooms.length === 0) {
      console.log(`[API/rooms/${roomId}] Room not found in DB.`)
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const room = rooms[0]

    // Check if room has expired
    const now = Date.now()
    if (room.expires_at < now) {
      console.log(`[API/rooms/${roomId}] Room has expired. Deleting...`)
      // Delete the expired room
      await sql`DELETE FROM rooms WHERE id = ${roomId}`
      return NextResponse.json({ error: "Room has expired" }, { status: 404 })
    }

    console.log(`[API/rooms/${roomId}] Room found and valid. Fetching messages...`)

    // Get messages for this room
    const messages = await sql`
      SELECT * FROM messages 
      WHERE room_id = ${roomId}
      ORDER BY timestamp ASC
    `

    console.log(`[API/rooms/${roomId}] Found ${messages.length} messages.`)

    // Combine room data with messages
    const roomData = {
      ...room,
      memberLimit: room.member_limit,
      timeLimit: room.time_limit,
      createdAt: room.created_at,
      expiresAt: room.expires_at,
      members: room.members, // Ensure members is passed as is
      messages: messages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        fileUrl: msg.file_url,
        sender: msg.sender,
        timestamp: msg.timestamp,
      })),
      files: messages
        .filter((msg) => msg.type === "file")
        .map((msg) => ({
          id: msg.id,
          fileName: msg.file_name,
          fileSize: msg.file_size,
          fileType: msg.file_type,
          url: msg.file_url,
          sender: msg.sender,
          timestamp: msg.timestamp,
        })),
    }

    console.log(`[API/rooms/${roomId}] Successfully returning room data.`)
    return NextResponse.json(roomData)
  } catch (error) {
    console.error(`[API/rooms/${params.id}] Error fetching room:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch room",
        details: error.message,
        roomId: params.id,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    const updates = await request.json()
    console.log(`[API/rooms/${roomId}] Updating room:`, updates)

    // Update room members
    if (updates.members) {
      const result = await sql`
        UPDATE rooms 
        SET members = ${JSON.stringify(updates.members)}
        WHERE id = ${roomId}
      `
      console.log(`[API/rooms/${roomId}] Updated members, affected rows:`, result.length)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API/rooms/${params.id}] Error updating room:`, error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    console.log(`[API/rooms/${roomId}] Deleting room...`)

    // Delete room (messages will be deleted automatically due to CASCADE)
    const result = await sql`DELETE FROM rooms WHERE id = ${roomId}`
    console.log(`[API/rooms/${roomId}] Deleted room, affected rows:`, result.length)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API/rooms/${params.id}] Error deleting room:`, error)
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
}
