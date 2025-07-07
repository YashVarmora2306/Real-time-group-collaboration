import type { Socket } from "socket.io-client"

export interface SocketMessage {
  type: "message" | "member_join" | "member_leave" | "room_update"
  data: any
  roomId: string
  timestamp: number
}

class SocketManager {
  private socket: Socket | null = null
  private roomId: string | null = null
  private messageHandlers: ((message: SocketMessage) => void)[] = []

  connect(roomId: string, userName: string) {
    if (this.socket?.connected && this.roomId === roomId) {
      return // Already connected to this room
    }

    this.disconnect() // Disconnect from previous room if any
    this.roomId = roomId

    // In a real implementation, you'd connect to your Socket.IO server
    // For now, we'll simulate WebSocket behavior with a mock implementation
    this.socket = {
      connected: true,
      emit: (event: string, data: any) => {
        console.log(`[Socket] Emitting ${event}:`, data)
        // In real implementation, this would send to server
      },
      on: (event: string, handler: Function) => {
        console.log(`[Socket] Listening for ${event}`)
        // In real implementation, this would listen to server events
      },
      off: (event: string, handler?: Function) => {
        console.log(`[Socket] Removing listener for ${event}`)
      },
      disconnect: () => {
        console.log("[Socket] Disconnecting")
        this.socket = null
      },
    } as any

    // Join the room
    this.socket.emit("join-room", { roomId, userName })

    // Listen for messages
    this.socket.on("room-message", (message: SocketMessage) => {
      this.messageHandlers.forEach((handler) => handler(message))
    })

    console.log(`[Socket] Connected to room ${roomId}`)
  }

  disconnect() {
    if (this.socket) {
      if (this.roomId) {
        this.socket.emit("leave-room", { roomId: this.roomId })
      }
      this.socket.disconnect()
      this.socket = null
      this.roomId = null
    }
  }

  sendMessage(message: SocketMessage) {
    if (this.socket?.connected) {
      this.socket.emit("room-message", message)
    }
  }

  onMessage(handler: (message: SocketMessage) => void) {
    this.messageHandlers.push(handler)
  }

  removeMessageHandler(handler: (message: SocketMessage) => void) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketManager = new SocketManager()
