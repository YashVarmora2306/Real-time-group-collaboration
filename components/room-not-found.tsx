"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface RoomNotFoundProps {
  roomId: string
}

export function RoomNotFound({ roomId }: RoomNotFoundProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Room Not Available</CardTitle>
          <CardDescription>This room doesn't exist, has expired, or has been deleted by the creator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Room ID:</strong> {roomId}
          </div>

          <Button onClick={() => router.push("/")} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create New Room
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Rooms are automatically deleted when they expire or when the creator deletes them.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
