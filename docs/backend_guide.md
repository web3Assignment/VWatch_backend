# YouTube Watch Party - Backend Implementation Guide (JavaScript)

This guide details the step-by-step setup and implementation of the Node.js, Express, and Socket.io server with Object-Oriented Room management using modern JavaScript (ES Modules).

---

## 1. Project Initialization & Dependencies

To establish the backend service, initialize a standard Node.js project configured to use ES Modules:

```bash
# Create directory structure
mkdir watch-party-backend
cd watch-party-backend
npm init -y

# Install production dependencies
npm install express socket.io mysql2 dotenv cors jsonwebtoken bcryptjs

# Install development dependencies
npm install --save-dev nodemon
```

### 1.1 Package Configuration (`package.json`)
Ensure the package is set to `"type": "module"` to support `import/export` statements:
```json
{
  "name": "watch-party-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "mysql2": "^3.0.0",
    "socket.io": "^4.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### 1.2 Environment Variables (`.env`)
Configure local database credentials and JWT security values:
```env
PORT=5000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=watch_party_db
JWT_SECRET=super_secret_jwt_sign_key
```

---

## 2. MySQL Database Connection Pool (`src/config/db.js`)

Use promise-based MySQL configuration to leverage connection pooling and async/await syntax in JavaScript:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

---

## 3. OOP WebSocket Room Architecture

Implement the classes using native JavaScript. Create `src/rooms/` directory.

### 3.1 Participant Definition (`src/rooms/Participant.js`)
```javascript
export const Role = {
  HOST: 'HOST',
  MODERATOR: 'MODERATOR',
  PARTICIPANT: 'PARTICIPANT',
  VIEWER: 'VIEWER'
};

export class Participant {
  constructor(id, socketId, username, role) {
    this.id = id;
    this.socketId = socketId;
    this.username = username;
    this.role = role;
    this.joinedAt = new Date();
  }

  updateRole(newRole) {
    this.role = newRole;
  }
}
```

### 3.2 Room Definition (`src/rooms/Room.js`)
Encapsulates playback syncing and participant lifecycle methods.
```javascript
import { Role } from './Participant.js';

export class Room {
  constructor(id, hostId, initialVideoId = 'dQw4w9WgXcQ') {
    this.id = id;
    this.hostId = hostId;
    this.participants = new Map(); // Key: userId, Value: Participant
    this.createdAt = new Date();
    this.playbackState = {
      videoId: initialVideoId,
      currentTime: 0,
      isPlaying: false,
      lastUpdated: new Date()
    };
  }

  addParticipant(p) {
    this.participants.set(p.id, p);
  }

  removeParticipant(userId) {
    const p = this.participants.get(userId);
    if (p) {
      this.participants.delete(userId);
      // Host reassignment trigger
      if (this.hostId === userId && this.participants.size > 0) {
        this.reassignHost();
      }
    }
    return p || null;
  }

  reassignHost() {
    // 1. Prioritize Moderators
    for (const p of this.participants.values()) {
      if (p.role === Role.MODERATOR) {
        this.hostId = p.id;
        p.updateRole(Role.HOST);
        return;
      }
    }
    // 2. Fallback to first participant
    const nextUser = this.participants.values().next().value;
    if (nextUser) {
      this.hostId = nextUser.id;
      nextUser.updateRole(Role.HOST);
    }
  }

  getParticipant(userId) {
    return this.participants.get(userId);
  }

  updatePlayback(videoId, currentTime, isPlaying) {
    this.playbackState.videoId = videoId;
    this.playbackState.currentTime = currentTime;
    this.playbackState.isPlaying = isPlaying;
    this.playbackState.lastUpdated = new Date();
  }
}
```

### 3.3 Room Manager Singleton (`src/rooms/RoomManager.js`)
Manages all active rooms in server memory.
```javascript
import { Room } from './Room.js';

export class RoomManager {
  static instance = null;

  constructor() {
    this.rooms = new Map();
  }

  static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  createRoom(roomId, creatorId, initialVideoId) {
    const room = new Room(roomId, creatorId, initialVideoId);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }
}
```

---

## 4. Socket.io Event Handling (`src/socket.js`)

This represents the main logic server orchestrating message validations.

```javascript
import { RoomManager } from './rooms/RoomManager.js';
import { Participant, Role } from './rooms/Participant.js';
import { pool } from './config/db.js';

const roomManager = RoomManager.getInstance();

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    
    // User Joining
    socket.on('join_room', async ({ roomId, userId, username }) => {
      socket.join(roomId);
      let room = roomManager.getRoom(roomId);
      
      // If room is not in-memory, load/create it
      if (!room) {
        // Query DB to verify room existence
        const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (rows.length === 0) {
          socket.emit('error_event', { message: 'Room not found.' });
          return;
        }
        const dbRoom = rows[0];
        room = roomManager.createRoom(roomId, dbRoom.host_id, dbRoom.current_video_id);
        room.playbackState.currentTime = dbRoom.current_playback_time;
        room.playbackState.isPlaying = dbRoom.is_playing;
      }

      // Role calculation
      const role = room.hostId === userId ? Role.HOST : Role.PARTICIPANT;
      const participant = new Participant(userId, socket.id, username, role);
      room.addParticipant(participant);

      // Save database participant record
      await pool.query(
        `INSERT INTO participants (room_id, user_id, role, status) 
         VALUES (?, ?, ?, 'ACTIVE') 
         ON DUPLICATE KEY UPDATE status='ACTIVE', role=?`,
        [roomId, userId, role, role]
      );

      // Sync state back to new client
      socket.emit('user_joined', {
        userId,
        role,
        playbackState: room.playbackState,
        participants: Array.from(room.participants.values())
      });

      // Notify other room participants
      socket.to(roomId).emit('participants_updated', {
        participants: Array.from(room.participants.values())
      });
    });

    // Play/Pause Action
    socket.on('play_state_change', async ({ roomId, userId, isPlaying, currentTime, videoId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const user = room.getParticipant(userId);
      if (!user || (user.role !== Role.HOST && user.role !== Role.MODERATOR)) {
        socket.emit('error_event', { message: 'Unauthorized playback action.' });
        return;
      }

      // Update room model
      room.updatePlayback(videoId, currentTime, isPlaying);

      // Broadcast changes
      socket.to(roomId).emit('sync_state', {
        isPlaying,
        currentTime,
        videoId
      });

      // Update DB
      await pool.query(
        'UPDATE rooms SET current_playback_time = ?, is_playing = ?, current_video_id = ? WHERE id = ?',
        [currentTime, isPlaying, videoId, roomId]
      );

      // Log event
      await pool.query(
        'INSERT INTO playback_logs (room_id, user_id, action, video_id, action_timestamp) VALUES (?, ?, ?, ?, ?)',
        [roomId, userId, isPlaying ? 'PLAY' : 'PAUSE', videoId, currentTime]
      );
    });

    // Seek Action
    socket.on('seek', async ({ roomId, userId, currentTime, videoId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const user = room.getParticipant(userId);
      if (!user || (user.role !== Role.HOST && user.role !== Role.MODERATOR)) {
        socket.emit('error_event', { message: 'Unauthorized seek action.' });
        return;
      }

      room.playbackState.currentTime = currentTime;
      socket.to(roomId).emit('sync_state', {
        isPlaying: room.playbackState.isPlaying,
        currentTime,
        videoId
      });

      await pool.query(
        'INSERT INTO playback_logs (room_id, user_id, action, video_id, action_timestamp) VALUES (?, ?, ?, ?, ?)',
        [roomId, userId, 'SEEK', videoId, currentTime]
      );
    });

    // Assign Role
    socket.on('assign_role', async ({ roomId, userId, targetUserId, newRole }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) {
        socket.emit('error_event', { message: 'Only the Host can assign roles.' });
        return;
      }

      const target = room.getParticipant(targetUserId);
      if (!target) return;

      target.updateRole(newRole);
      
      // Persist to DB
      await pool.query(
        'UPDATE participants SET role = ? WHERE room_id = ? AND user_id = ?',
        [newRole, roomId, targetUserId]
      );

      // Broadcast role changes to the whole room (including the target)
      io.to(roomId).emit('role_assigned', {
        userId: targetUserId,
        role: newRole,
        participants: Array.from(room.participants.values())
      });
    });

    // Remove Participant
    socket.on('remove_participant', async ({ roomId, userId, targetUserId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.hostId !== userId) {
        socket.emit('error_event', { message: 'Only the Host can remove participants.' });
        return;
      }

      const target = room.getParticipant(targetUserId);
      if (!target) return;

      room.removeParticipant(targetUserId);
      
      // DB Updates
      await pool.query(
        'UPDATE participants SET status = \'DISCONNECTED\' WHERE room_id = ? AND user_id = ?',
        [roomId, targetUserId]
      );

      // Kick socket
      io.to(target.socketId).emit('kicked');
      io.sockets.sockets.get(target.socketId)?.leave(roomId);

      io.to(roomId).emit('participant_removed', {
        userId: targetUserId,
        participants: Array.from(room.participants.values())
      });
    });

    // Disconnect Lifecycle
    socket.on('disconnecting', async () => {
      for (const roomId of socket.rooms) {
        const room = roomManager.getRoom(roomId);
        if (!room) continue;

        // Find participant by socket ID
        const user = Array.from(room.participants.values()).find(p => p.socketId === socket.id);
        if (user) {
          room.removeParticipant(user.id);
          
          await pool.query(
            'UPDATE participants SET status = \'DISCONNECTED\' WHERE room_id = ? AND user_id = ?',
            [roomId, user.id]
          );

          socket.to(roomId).emit('participants_updated', {
            participants: Array.from(room.participants.values())
          });
        }
      }
    });
  });
}
```
