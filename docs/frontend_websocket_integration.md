# Frontend WebSocket Integration Guide (Socket.io)

This guide documents how the frontend integrates with the real-time WebSocket backend (using the `socket.io-client` library) to synchronize the YouTube video player, handle chat, process live reactions, and manage user roles.

---

## 1. Installation & Initialization

Install the Socket.io client library in your frontend project (React, Vue, or Vanilla JS):
```bash
npm install socket.io-client
```

### Establish Connection with Authentication
Because the backend validates connections using JWT, you **must** pass the token in the `auth` handshake configuration:

```javascript
import { io } from "socket.io-client";

// Replace with your backend server URL
const BACKEND_URL = "http://13.203.9.101:5000"; 

const token = localStorage.getItem("token"); // Retrieve JWT from localStorage

const socket = io(BACKEND_URL, {
  auth: {
    token: token
  },
  autoConnect: true
});

// Test connection
socket.on("connect", () => {
  console.log("Successfully connected to WebSocket server!");
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message); // E.g., "Authentication token required."
});
```

---

## 2. Room Joining Flow

### Emit: Join a Room
As soon as the user enters the Room UI page, grab the `roomId` from the route parameters and join:
```javascript
socket.emit("join_room", { roomId: "ROOM_UUID_HERE" });
```

### Listen: Successful Join (`user_joined`)
The server immediately responds to the connecting client with their current room permissions and the active playback state:
```javascript
socket.on("user_joined", (data) => {
  const { userId, role, playbackState, participants } = data;
  
  // 1. Save your local role (e.g. to determine if you show Play/Pause buttons)
  localStorage.setItem("userRole", role); 
  
  // 2. Initialize your YouTube Player with these values
  youtubePlayer.loadVideoById(playbackState.videoId);
  youtubePlayer.seekTo(playbackState.currentTime);
  if (playbackState.isPlaying) {
    youtubePlayer.playVideo();
  } else {
    youtubePlayer.pauseVideo();
  }

  // 3. Render the active user list in the side panel
  renderUserPanel(participants);
});
```

---

## 3. Video Player Synchronization

### A. Play / Pause Control
Only user roles of **`HOST`** or **`MODERATOR`** are authorized to emit this.

* **Emit (When Host/Mod clicks Play/Pause)**:
  ```javascript
  // Triggered by your video player's state change listener
  socket.emit("play_state_change", {
    isPlaying: true, // true if played, false if paused
    currentTime: player.getCurrentTime(),
    videoId: "dQw4w9WgXcQ"
  });
  ```

### B. Seeking (Jumping Timeline)
Only **`HOST`** or **`MODERATOR`** can sync seeks.

* **Emit (When Host/Mod drags timeline slider)**:
  ```javascript
  socket.emit("seek", {
    currentTime: 145.2, // new seek timestamp in seconds
    videoId: "dQw4w9WgXcQ"
  });
  ```

### C. Changing Video Link
Only **`HOST`** or **`MODERATOR`** can load a new video.

* **Emit (When Host/Mod submits a new YouTube URL)**:
  ```javascript
  socket.emit("change_video", {
    videoId: "y6120QOlsfU" // Extract the 11-char video ID from the link
  });
  ```

### D. Synchronizing Players (`sync_state`)
All guests/participants must listen to `sync_state` to keep their players in sync.

* **Listen (For everyone in the room)**:
  ```javascript
  socket.on("sync_state", (data) => {
    const { isPlaying, currentTime, videoId } = data;

    // 1. If video changed, load the new video
    if (currentVideoId !== videoId) {
      player.loadVideoById(videoId);
    }

    // 2. Sync timeline if drifting by more than 2 seconds (to avoid stuttering)
    const timeDrift = Math.abs(player.getCurrentTime() - currentTime);
    if (timeDrift > 2) {
      player.seekTo(currentTime);
    }

    // 3. Sync Play/Pause action
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  });
  ```

---

## 4. Live Chat & Reaction Integration

### A. Live Chat
* **Emit: Send Message**:
  ```javascript
  const sendMessage = (text) => {
    socket.emit("send_chat", { message: text });
  };
  ```

* **Listen: Receive Message**:
  ```javascript
  socket.on("chat_message", (chatPayload) => {
    const { id, message, created_at, user } = chatPayload;
    
    // Append message to your chat message list UI
    appendChatMessage({
      id,
      sender: user.username,
      text: message,
      timestamp: created_at
    });
  });
  ```

### B. Ephemeral Reactions (Emojis)
Reactions are short-lived animations that show over the player UI. They are not stored in the database.

* **Emit: Send Reaction**:
  ```javascript
  const sendReaction = (emojiChar) => {
    socket.emit("reaction", {
      emoji: emojiChar, // e.g., "🎉"
      userId: myUserId,
      username: myUsername
    });
  };
  ```

* **Listen: Receive Reaction**:
  ```javascript
  socket.on("reaction", (data) => {
    const { emoji, userId, username, roomId } = data;
    
    // Trigger floating/flying emoji animation in frontend UI
    showFloatingEmoji(emoji, username);
  });
  ```

---

## 5. Live Moderation (Host Controls)

These events can only be executed by the **`HOST`**.

### Promote / Demote Roles
```javascript
// Example: Promoting User B to Moderator
socket.emit("assign_role", {
  targetUserId: "USER_B_ID",
  newRole: "MODERATOR" // Options: 'MODERATOR', 'PARTICIPANT', 'VIEWER'
});
```

* **Listen** for changes (`role_assigned`):
  ```javascript
  socket.on("role_assigned", (data) => {
    const { userId, role, participants } = data;
    
    // If the updated role is YOURS, update your local UI permissions
    if (userId === myUserId) {
      localStorage.setItem("userRole", role);
      togglePlayerControls(role); // Enable/disable play/pause controls dynamically
    }
    renderUserPanel(participants);
  });
  ```

### Kicking Users
```javascript
// Host kicks User B
socket.emit("remove_participant", { targetUserId: "USER_B_ID" });
```

* **Listen** for getting kicked (`kicked`):
  ```javascript
  // Put this on every participant client
  socket.on("kicked", () => {
    alert("You have been kicked from this watch room by the host.");
    socket.disconnect();
    window.location.href = "/dashboard"; // Redirect to safety
  });
  ```

---

## 6. Live Participant Updates

Render the active participant drawer by listening to these state changes:

```javascript
// Runs when anyone joins
socket.on("participants_updated", ({ participants }) => {
  renderUserPanel(participants);
});

// Runs when anyone is kicked or leaves
socket.on("participant_removed", ({ userId, participants }) => {
  renderUserPanel(participants);
});
```
