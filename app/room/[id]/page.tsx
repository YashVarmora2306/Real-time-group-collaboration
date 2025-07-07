"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Send,
  Paperclip,
  Download,
  Users,
  Clock,
  Copy,
  ImageIcon,
  Video,
  FileText,
  Trash2,
  Crown,
  RefreshCw,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { RoomNotFound } from "@/components/room-not-found"
import {
  getRoom,
  updateRoomMembers,
  deleteRoom,
  addMessage,
  uploadFile,
  type RoomData,
  type Message,
} from "@/lib/room-storage"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [message, setMessage] = useState("")
  const [userName, setUserName] = useState("")
  const [hasJoined, setHasJoined] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")
  const [isCreator, setIsCreator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [roomNotFound, setRoomNotFound] = useState(false)

  const loadRoom = async () => {
    setIsLoading(true)
    const roomId = params.id as string
    const room = await getRoom(roomId)

    if (!room) {
      setRoomNotFound(true)
      setIsLoading(false)
      return
    }

    setRoomData(room)
    setIsLoading(false)

    // Check if user already joined
    const storedUserName = localStorage.getItem(`user_${roomId}`)
    if (storedUserName && room.members.includes(storedUserName)) {
      setUserName(storedUserName)
      setHasJoined(true)
      setIsCreator(storedUserName === room.creator)
    }
  }

  useEffect(() => {
    loadRoom()
  }, [params.id])

  useEffect(() => {
    if (roomData) {
      const timer = setInterval(() => {
        const now = Date.now()
        const remaining = roomData.expiresAt - now

        if (remaining <= 0) {
          toast({
            title: "Room Expired",
            description: "This room has expired and all content has been deleted.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m`)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [roomData, router, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [roomData?.messages])

  // Auto-refresh room data every 5 seconds
  useEffect(() => {
    if (hasJoined && roomData) {
      const interval = setInterval(() => {
        loadRoom()
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [hasJoined, roomData])

  const joinRoom = async () => {
    if (!userName.trim() || !roomData || isJoining) {
      toast({
        title: "Missing Name",
        description: "Please enter your name to join.",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)

    try {
      if (roomData.members.length >= roomData.memberLimit) {
        toast({
          title: "Room Full",
          description: "This room has reached its member limit.",
          variant: "destructive",
        })
        return
      }

      // Check if username is already taken
      if (roomData.members.includes(userName)) {
        toast({
          title: "Name Taken",
          description: "This name is already in use. Please choose a different name.",
          variant: "destructive",
        })
        return
      }

      const updatedMembers = [...roomData.members, userName]
      const success = await updateRoomMembers(roomData.id, updatedMembers)

      if (success) {
        localStorage.setItem(`user_${roomData.id}`, userName)
        setHasJoined(true)
        setIsCreator(userName === roomData.creator)

        // Refresh room data to get updated members list
        await loadRoom()

        toast({
          title: "Joined Room",
          description: `Welcome to ${roomData.name}!`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to join room. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining room:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while joining the room.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !roomData || !userName || isSending) return

    setIsSending(true)

    try {
      const newMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        type: "text",
        content: message,
        sender: userName,
        timestamp: Date.now(),
      }

      const success = await addMessage(roomData.id, newMessage)

      if (success) {
        setMessage("")
        // Refresh room data to get the new message
        await loadRoom()
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the message.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !roomData || !userName) return

    try {
      toast({
        title: "Uploading File",
        description: "Please wait while your file is being uploaded...",
      })

      const fileUrl = await uploadFile(file) // This is a client-side blob URL for demo

      const fileMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        type: "file",
        content: `Shared a file: ${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: fileUrl,
        sender: userName,
        timestamp: Date.now(),
      }

      const success = await addMessage(roomData.id, fileMessage)

      if (success) {
        // Refresh room data to get the new message
        await loadRoom()
        toast({
          title: "File Shared",
          description: `${file.name} has been shared successfully!`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to share file. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error handling file upload:", error)
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomData?.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Room link has been copied to clipboard.",
    })
  }

  const collapseRoom = async () => {
    if (!roomData || !isCreator) return

    try {
      const success = await deleteRoom(roomData.id)

      if (success) {
        toast({
          title: "Room Deleted",
          description: "The room and all its content have been permanently deleted.",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: "Failed to delete room. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the room.",
        variant: "destructive",
      })
    }
  }

  const downloadFile = (fileUrl: string, fileName: string) => {
    if (fileUrl) {
      const a = document.createElement("a")
      a.href = fileUrl
      a.download = fileName || "download"
      a.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (fileType?.startsWith("video/")) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-lg font-medium">Loading room...</div>
  }

  if (roomNotFound) {
    return <RoomNotFound roomId={params.id as string} />
  }

  if (!roomData) {
    // This case should ideally not be reached if roomNotFound is handled
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium">Room data not loaded.</div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Room: {roomData.name}</CardTitle>
            {roomData.description && <p className="text-sm text-gray-600">{roomData.description}</p>}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Crown className="w-4 h-4" />
              Created by {roomData.creator}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>
                Members: {roomData.members.length}/{roomData.memberLimit}
              </span>
              <span>Expires in: {timeLeft}</span>
            </div>
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              disabled={isJoining}
            />
            <Button onClick={joinRoom} className="w-full" disabled={!userName.trim() || isJoining}>
              {isJoining ? "Joining..." : "Join Room"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{roomData.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {roomData.members.length}/{roomData.memberLimit}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeLeft}
              </span>
              <span className="flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {roomData.creator}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadRoom} disabled={isLoading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={copyRoomLink}>
              <Copy className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            {isCreator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Room
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Room</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this room? This action cannot be undone and will permanently
                      delete all messages, files, and remove all members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={collapseRoom} className="bg-red-600 hover:bg-red-700">
                      Delete Room
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Members Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Members ({roomData.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roomData.members.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">{member.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member}</span>
                  {member === roomData.creator && <Crown className="w-3 h-3 text-yellow-600" />}
                  {member === userName && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm">Messages & Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {roomData.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{msg.sender.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{msg.sender}</span>
                        {msg.sender === roomData.creator && <Crown className="w-3 h-3 text-yellow-600" />}
                        <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {msg.type === "text" ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-3 max-w-sm">
                          <div className="flex items-center gap-2 mb-2">
                            {getFileIcon(msg.fileType || "")}
                            <span className="text-sm font-medium">{msg.fileName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {msg.fileSize ? formatFileSize(msg.fileSize) : ""}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(msg.fileUrl || "", msg.fileName || "download")}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                  disabled={isSending}
                />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button onClick={sendMessage} disabled={!message.trim() || isSending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
