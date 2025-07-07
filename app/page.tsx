"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Clock, Shield, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import { saveRoom, type RoomData } from "@/lib/room-storage"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [roomName, setRoomName] = useState("")
  const [description, setDescription] = useState("")
  const [memberLimit, setMemberLimit] = useState("10")
  const [timeLimit, setTimeLimit] = useState("24")
  const [creatorName, setCreatorName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const createRoom = async () => {
    if (!roomName.trim() || !creatorName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a room name and your name.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const roomId = Math.random().toString(36).substring(2, 15)
      const roomData: RoomData = {
        id: roomId,
        name: roomName,
        description,
        memberLimit: Number.parseInt(memberLimit),
        timeLimit: Number.parseInt(timeLimit),
        createdAt: Date.now(),
        expiresAt: Date.now() + Number.parseInt(timeLimit) * 60 * 60 * 1000,
        creator: creatorName,
        members: [creatorName],
        messages: [],
        files: [],
      }

      const success = await saveRoom(roomData)

      if (success) {
        localStorage.setItem(`user_${roomId}`, creatorName)
        toast({
          title: "Room Created",
          description: `${roomName} has been created successfully!`,
        })
        router.push(`/room/${roomId}`)
      } else {
        toast({
          title: "Error",
          description: "Failed to create room. Please check the debug panel for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in createRoom:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the room.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ShareRoom</h1>
          <p className="text-lg text-gray-600">Create temporary rooms to share files, messages, and media</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Room
              </CardTitle>
              <CardDescription>Set up a temporary sharing space with custom limits and expiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creatorName">Your Name</Label>
                <Input
                  id="creatorName"
                  placeholder="Enter your name"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this room for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberLimit">Member Limit</Label>
                  <Select value={memberLimit} onValueChange={setMemberLimit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 members</SelectItem>
                      <SelectItem value="10">10 members</SelectItem>
                      <SelectItem value="25">25 members</SelectItem>
                      <SelectItem value="50">50 members</SelectItem>
                      <SelectItem value="100">100 members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Auto-Delete After</Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={createRoom}
                className="w-full"
                disabled={!roomName.trim() || !creatorName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Secure & Global</h4>
                    <p className="text-sm text-gray-600">
                      Rooms work across all devices and browsers with database storage
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Auto-Cleanup</h4>
                    <p className="text-sm text-gray-600">Rooms automatically delete after expiration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Creator Control</h4>
                    <p className="text-sm text-gray-600">Only creators can delete rooms instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What You Can Share</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Text messages and conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Photos and images (any format)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Videos and media files
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Documents and files (any size)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Debug Panel Link */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => window.open("/debug", "_blank")}>
            <Database className="w-4 h-4 mr-2" />
            Debug Panel
          </Button>
        </div>
      </div>
    </div>
  )
}
