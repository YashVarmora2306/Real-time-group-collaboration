import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const roomData = await request.json()
    console.log("[API/rooms] Creating room:", roomData.id, roomData.name)

    // Insert room
    await sql`
      INSERT INTO rooms (id, name, description, member_limit, time_limit, created_at, expires_at, creator, members)
      VALUES (${roomData.id}, ${roomData.name}, ${roomData.description}, ${roomData.memberLimit}, 
              ${roomData.timeLimit}, ${roomData.createdAt}, ${roomData.expiresAt}, ${roomData.creator}, 
              ${JSON.stringify(roomData.members)})
    `
    console.log("[API/rooms] Room created successfully:", roomData.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API/rooms] Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room", details: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("[API/rooms] Fetching all rooms...")
    // Clean up expired rooms first
    const cleanupResult = await sql`
      DELETE FROM rooms 
      WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000
    `
    console.log(`[API/rooms] Cleaned up ${cleanupResult.length} expired rooms.`)

    // Get all active rooms
    const rooms = await sql`
      SELECT * FROM rooms 
      WHERE expires_at > EXTRACT(EPOCH FROM NOW()) * 1000
      ORDER BY created_at DESC
    `
    console.log(`[API/rooms] Found ${rooms.length} active rooms.`)
    return NextResponse.json(rooms)
  } catch (error) {
    console.error("[API/rooms] Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms", details: error.message }, { status: 500 })
  }
}
