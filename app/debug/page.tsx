"use client"

import { AlertDialogAction } from "@/components/ui/alert-dialog"

import { AlertDialogCancel } from "@/components/ui/alert-dialog"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import { AlertDialogDescription } from "@/components/ui/alert-dialog"

import { AlertDialogTitle } from "@/components/ui/alert-dialog"

import { AlertDialogHeader } from "@/components/ui/alert-dialog"

import { AlertDialogContent } from "@/components/ui/alert-dialog"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { AlertDialog } from "@/components/ui/alert-dialog"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Database, Search, Plus, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testRoomId, setTestRoomId] = useState("") // Keep this empty initially
  const [testResult, setTestResult] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const testDatabase = async () => {
    setLoading(true)
    setError("")
    addLog("Testing database connection and schema...")

    try {
      const response = await fetch("/api/db-test")
      const data = await response.json()

      if (data.success) {
        setDbStatus(data)
        addLog("✅ Database connection successful")
        addLog(`Tables found: ${data.tables.map((t: any) => t.table_name).join(", ")}`)
        addLog(`Total rooms in database: ${data.roomCount}`)
      } else {
        setError(data.error)
        addLog(`❌ Database test failed: ${data.error}`)
      }
    } catch (err: any) {
      setError(err.message)
      addLog(`❌ Network error during DB test: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const recreateTables = async () => {
    setLoading(true)
    setError("")
    addLog("Recreating database tables (this will delete all data!)...")

    try {
      const response = await fetch("/api/db-test", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        addLog("✅ Tables recreated successfully")
        toast({
          title: "Success",
          description: "Database tables recreated successfully",
        })
        // Refresh database status and rooms
        await testDatabase()
        await loadRooms()
      } else {
        addLog(`❌ Failed to recreate tables: ${data.error}`)
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      addLog(`❌ Error recreating tables: ${err.message}`)
      setError(`Error recreating tables: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadRooms = async () => {
    addLog("Loading rooms from database...")
    try {
      const response = await fetch("/api/rooms")
      if (response.ok) {
        const data = await response.json()
        setRooms(Array.isArray(data) ? data : [])
        addLog(`✅ Loaded ${Array.isArray(data) ? data.length : 0} rooms`)
      } else {
        const errorData = await response.json()
        addLog(`❌ Failed to load rooms: ${errorData.error}`)
        setError(`Failed to load rooms: ${errorData.error}`)
      }
    } catch (err: any) {
      addLog(`❌ Network error loading rooms: ${err.message}`)
      setError(`Network error: ${err.message}`)
    }
  }

  const testSpecificRoom = async () => {
    if (!testRoomId.trim()) {
      setTestResult("Please enter a room ID.")
      return
    }

    addLog(`Testing room: ${testRoomId}`)
    setTestResult("Testing...")

    try {
      const response = await fetch(`/api/rooms/${testRoomId}`)
      if (response.ok) {
        const data = await response.json()
        setTestResult(`✅ Room found: ${data.name} (Creator: ${data.creator})`)
        addLog(`✅ Room ${testRoomId} found: ${data.name}`)
      } else {
        const errorData = await response.json()
        setTestResult(`❌ Room not found: ${errorData.error}`)
        addLog(`❌ Room ${testRoomId} not found: ${errorData.error}`)
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`)
      addLog(`❌ Error testing room ${testRoomId}: ${err.message}`)
    }
  }

  const createTestRoom = async () => {
    const newTestRoomId = "test-" + Math.random().toString(36).substring(2, 8)
    const testRoom = {
      id: newTestRoomId,
      name: "Debug Test Room",
      description: "A test room created from debug panel",
      memberLimit: 10,
      timeLimit: 24,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      creator: "Debug User",
      members: ["Debug User"],
    }

    addLog(`Creating test room: ${testRoom.id}`)

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testRoom),
      })

      if (response.ok) {
        addLog(`✅ Test room created: ${testRoom.id}`)
        toast({
          title: "Test Room Created",
          description: `Room ID: ${testRoom.id}`,
        })
        setTestRoomId(testRoom.id) // Set the newly created ID for testing
        loadRooms()
      } else {
        const errorData = await response.json()
        addLog(`❌ Failed to create test room: ${errorData.error}`)
        toast({
          title: "Error",
          description: `Failed to create test room: ${errorData.error}`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      addLog(`❌ Network error creating test room: ${err.message}`)
      setError(`Network error: ${err.message}`)
    }
  }

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link)
    addLog(`📋 Copied link for room: ${roomId}`)
    toast({
      title: "Link Copied",
      description: "Room link copied to clipboard",
    })
  }

  useEffect(() => {
    testDatabase()
    loadRooms()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Connection & Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testDatabase} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Database
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={loading}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Recreate Tables
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL data in your `rooms` and `messages`
                      tables and recreate them.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={recreateTables}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={loadRooms} variant="outline" disabled={loading}>
                Refresh Rooms List
              </Button>
            </div>

            {dbStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-3 rounded-lg ${dbStatus.success ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-center gap-2">
                    {dbStatus.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <p className="text-sm font-medium">Connection</p>
                  </div>
                  <p className={`text-lg font-bold ${dbStatus.success ? "text-green-600" : "text-red-600"}`}>
                    {dbStatus.success ? "Connected" : "Failed"}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Tables</p>
                  <p className="text-lg font-bold text-blue-600">{dbStatus.tables?.length || 0}/2</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Total Rooms</p>
                  <p className="text-lg font-bold text-purple-600">{dbStatus.roomCount || 0}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">DB Type</p>
                  <p className="text-lg font-bold text-orange-600">Neon PostgreSQL</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">Error:</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Test Specific Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter room ID to test"
                value={testRoomId}
                onChange={(e) => setTestRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && testSpecificRoom()}
              />
              <Button onClick={testSpecificRoom} disabled={!testRoomId.trim()}>
                Test Room
              </Button>
              <Button onClick={createTestRoom} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Room
              </Button>
            </div>
            {testResult && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-mono">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No rooms found. Create a test room to get started.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{room.name}</h4>
                          <p className="text-xs text-gray-600">ID: {room.id}</p>
                          <p className="text-xs text-gray-600">Creator: {room.creator}</p>
                          <p className="text-xs text-gray-600">
                            Members: {Array.isArray(room.members) ? room.members.length : 0}/{room.member_limit}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => copyRoomLink(room.id)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button size="sm" onClick={() => window.open(`/room/${room.id}`, "_blank")}>
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={logs.join("\n")}
                readOnly
                className="h-96 text-xs font-mono"
                placeholder="Debug logs will appear here..."
              />
              <Button size="sm" variant="outline" className="mt-2 bg-transparent" onClick={() => setLogs([])}>
                Clear Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
