import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[DB-TEST] Testing database connection...")

    // Test basic connection
    const testQuery = await sql`SELECT NOW() as current_time`
    console.log("[DB-TEST] Database connected successfully:", testQuery[0])

    // Check if tables exist
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('rooms', 'messages')
    `

    console.log(
      "[DB-TEST] Existing tables:",
      tablesCheck.map((t) => t.table_name),
    )

    // Get table structures (if tables exist)
    let roomsStructure = []
    let messagesStructure = []
    if (tablesCheck.some((t) => t.table_name === "rooms")) {
      roomsStructure = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'rooms' 
        ORDER BY ordinal_position
      `
    }
    if (tablesCheck.some((t) => t.table_name === "messages")) {
      messagesStructure = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        ORDER BY ordinal_position
      `
    }

    // Count existing rooms
    const roomCountResult = await sql`SELECT COUNT(*) as count FROM rooms`
    const roomCount = roomCountResult[0].count

    return NextResponse.json({
      success: true,
      connection: "Connected",
      timestamp: testQuery[0].current_time,
      tables: tablesCheck,
      roomsStructure,
      messagesStructure,
      roomCount: Number.parseInt(roomCount, 10),
    })
  } catch (error) {
    console.error("[DB-TEST] Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    console.log("[DB-TEST] Forcing recreation of tables...")

    // Drop tables with CASCADE to remove dependencies
    await sql`DROP TABLE IF EXISTS messages CASCADE`
    await sql`DROP TABLE IF EXISTS rooms CASCADE`

    // Recreate rooms table
    await sql`
      CREATE TABLE rooms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        member_limit INTEGER NOT NULL DEFAULT 10,
        time_limit INTEGER NOT NULL DEFAULT 24,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL,
        creator VARCHAR(255) NOT NULL,
        members JSONB DEFAULT '[]'::jsonb,
        created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Recreate messages table with foreign key
    await sql`
      CREATE TABLE messages (
        id VARCHAR(50) PRIMARY KEY,
        room_id VARCHAR(50) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL DEFAULT 'text',
        content TEXT NOT NULL,
        file_name VARCHAR(255),
        file_size BIGINT,
        file_type VARCHAR(100),
        file_url TEXT,
        sender VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`CREATE INDEX idx_rooms_expires_at ON rooms(expires_at)`
    await sql`CREATE INDEX idx_messages_room_id ON messages(room_id)`
    await sql`CREATE INDEX idx_messages_timestamp ON messages(timestamp)`

    console.log("[DB-TEST] Tables recreated successfully.")
    return NextResponse.json({ success: true, message: "Tables recreated successfully" })
  } catch (error) {
    console.error("[DB-TEST] Failed to recreate tables:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
