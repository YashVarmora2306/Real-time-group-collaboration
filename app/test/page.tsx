"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRoom, cleanupExpiredRooms, initializeSharedStorage } from "@/lib/room-storage"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    initializeSharedStorage()
    cleanupExpiredRooms()
    loadRooms()
  }, [])

  const loadRooms = () => {
    // Get all rooms from storage for testing
    try {
      const stored = localStorage.getItem("shareroom_global_rooms")
      if (stored) {
        const allRooms = JSON.parse(stored)
        setRooms(Object.values(allRooms))
      }
    } catch (e) {
      console.error("Error loading rooms:", e)
    }
  }

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Room link has been copied to clipboard.",
    })
  }

  const testRoom = (roomId: string) => {
    const room = getRoom(roomId)
    console.log("Room data:", room)
    alert(`Room ${roomId}: ${room ? "Found" : "Not Found"}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Room Testing & Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadRooms}>Refresh Rooms</Button>

            <div className="space-y-2">
              <h3 className="font-semibold">Available Rooms:</h3>
              {rooms.length === 0 ? (
                <p className="text-gray-500">No rooms found</p>
              ) : (
                rooms.map((room: any) => (
                  <div key={room.id} className="border p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{room.name}</h4>
                        <p className="text-sm text-gray-600">ID: {room.id}</p>
                        <p className="text-sm text-gray-600">Creator: {room.creator}</p>
                        <p className="text-sm text-gray-600">Expires: {new Date(room.expiresAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => testRoom(room.id)}>
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copyRoomLink(room.id)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
