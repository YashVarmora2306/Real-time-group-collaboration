// Database-backed room storage using Neon PostgreSQL

export interface RoomData {
  id: string
  name: string
  description: string
  memberLimit: number
  timeLimit: number
  createdAt: number
  expiresAt: number
  creator: string
  members: string[]
  messages: Message[]
  files: any[]
}

export interface Message {
  id: string
  type: "text" | "file"
  content: string
  fileName?: string
  fileSize?: number
  fileType?: string
  fileUrl?: string
  sender: string
  timestamp: number
}

export async function saveRoom(roomData: RoomData): Promise<boolean> {
  try {
    console.log("[room-storage] Calling API to save room:", roomData.id)
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roomData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[room-storage] Failed to save room via API:", errorData)
      return false
    }

    console.log("[room-storage] Room saved successfully via API:", roomData.id)
    return true
  } catch (error) {
    console.error("[room-storage] Error calling save room API:", error)
    return false
  }
}

export async function getRoom(roomId: string): Promise<RoomData | null> {
  try {
    console.log("[room-storage] Calling API to get room:", roomId)
    const response = await fetch(`/api/rooms/${roomId}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`[room-storage] Failed to fetch room ${roomId} via API:`, response.status, errorData)
      return null
    }

    const roomData = await response.json()

    // Validate the room data structure
    if (!roomData.id || !roomData.name || !roomData.creator) {
      console.error("[room-storage] Invalid room data structure received:", roomData)
      return null
    }

    console.log("[room-storage] Room fetched successfully via API:", roomData.id)
    return roomData
  } catch (error) {
    console.error("[room-storage] Error calling get room API:", error)
    return null
  }
}

export async function updateRoomMembers(roomId: string, members: string[]): Promise<boolean> {
  try {
    console.log("[room-storage] Calling API to update room members:", roomId)
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ members }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[room-storage] Failed to update room members via API:", errorData)
      return false
    }
    console.log("[room-storage] Room members updated successfully via API:", roomId)
    return true
  } catch (error) {
    console.error("[room-storage] Error calling update room members API:", error)
    return false
  }
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    console.log("[room-storage] Calling API to delete room:", roomId)
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[room-storage] Failed to delete room via API:", errorData)
      return false
    }
    console.log("[room-storage] Room deleted successfully via API:", roomId)
    return true
  } catch (error) {
    console.error("[room-storage] Error calling delete room API:", error)
    return false
  }
}

export async function addMessage(roomId: string, message: Message): Promise<boolean> {
  try {
    console.log("[room-storage] Calling API to add message to room:", roomId)
    const response = await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[room-storage] Failed to add message via API:", errorData)
      return false
    }
    console.log("[room-storage] Message added successfully via API:", roomId)
    return true
  } catch (error) {
    console.error("[room-storage] Error calling add message API:", error)
    return false
  }
}

export async function getAllRooms(): Promise<RoomData[]> {
  try {
    console.log("[room-storage] Calling API to get all rooms.")
    const response = await fetch("/api/rooms")

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[room-storage] Failed to fetch all rooms via API:", errorData)
      return []
    }

    const rooms = await response.json()
    console.log(`[room-storage] Fetched ${rooms.length} rooms via API.`)
    return rooms
  } catch (error) {
    console.error("[room-storage] Error calling get all rooms API:", error)
    return []
  }
}

// File upload helper (in production, use a proper file storage service)
export function uploadFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    // For demo purposes, create a blob URL
    // In production, upload to a service like Vercel Blob, AWS S3, etc.
    const url = URL.createObjectURL(file)
    resolve(url)
  })
}

// These are no longer needed as database handles cleanup and initialization
export const cleanupExpiredRooms = () => {
  console.log("[room-storage] cleanupExpiredRooms (no-op, handled by DB API)")
}
export const initializeSharedStorage = () => {
  console.log("[room-storage] initializeSharedStorage (no-op, handled by DB API)")
}
