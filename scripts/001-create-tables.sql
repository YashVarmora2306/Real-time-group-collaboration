-- Drop tables if they exist to ensure a clean slate for recreation
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Create rooms table
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
);

-- Create messages table
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, -- Foreign key with cascade delete
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    file_url TEXT,
    sender VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
