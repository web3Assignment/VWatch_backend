# YouTube Watch Party - Frontend Implementation Guide (JavaScript)

This guide details the step-by-step implementation of the React (JavaScript + Vite) frontend, including YouTube IFrame API integration, WebSockets synchronization, and role-based interface control.

---

## 1. Project Initialization & Dependencies

To bootstrap the React + JavaScript client:

```bash
# Initialize Vite template
npm create vite@latest watch-party-frontend -- --template react
cd watch-party-frontend

# Install dependencies
npm install socket.io-client lucide-react
```

---

## 2. WebSocket Context Provider (`src/context/SocketContext.jsx`)

Wrap the application in a custom context to manage the connection lifecycle:

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({ socket: null, isConnected: false });

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Establish connection to backend API
    const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      autoConnect: true,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```

---

## 3. YouTube Player Sync Component (`src/components/YoutubePlayer.jsx`)

To synchronise video state without causing infinite event loops, implement a reference-based state listener.

> [!IMPORTANT]
> **Preventing Event Loops:** When Client A triggers `seek`, the server broadcasts `sync_state` to Client B. When Client B updates its local player state, the local state change event must not trigger a redundant `seek` emit back to the server. Use a guard flag (`isSyncingFromServer`) to selectively ignore local triggers.

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export const YoutubePlayer = ({ roomId, userId, role, initialVideoId }) => {
  const { socket } = useSocket();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  // Guard flag to break feedback loops
  const isSyncingFromServer = useRef(false);
  const [videoId, setVideoId] = useState(initialVideoId);

  const canControl = role === 'HOST' || role === 'MODERATOR';

  useEffect(() => {
    // Inject YouTube IFrame API Script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Define global initialization callback
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [videoId]);

  const initPlayer = () => {
    playerRef.current = new window.YT.Player('youtube-iframe-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        // Disable YouTube default controls for simple viewers
        controls: canControl ? 1 : 0,
        disablekb: canControl ? 0 : 1,
        rel: 0,
      },
      events: {
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  // Listen to remote changes
  useEffect(() => {
    if (!socket) return;

    socket.on('sync_state', ({ isPlaying, currentTime, videoId: newVideoId }) => {
      isSyncingFromServer.current = true;

      if (newVideoId !== videoId) {
        setVideoId(newVideoId);
        return;
      }

      if (playerRef.current) {
        // Seek drift checks (e.g. seek if client is off by more than 2 seconds)
        const currentLocalTime = playerRef.current.getCurrentTime();
        if (Math.abs(currentLocalTime - currentTime) > 2) {
          playerRef.current.seekTo(currentTime, true);
        }

        // Trigger local playback action
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }

      // Reset guard flag after updates have resolved
      setTimeout(() => {
        isSyncingFromServer.current = false;
      }, 500);
    });

    return () => {
      socket.off('sync_state');
    };
  }, [socket, videoId]);

  // Handle local user actions
  const handlePlayerStateChange = (event) => {
    if (!socket || !canControl || isSyncingFromServer.current) return;

    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.getCurrentTime();

    if (event.data === window.YT.PlayerState.PLAYING) {
      socket.emit('play_state_change', {
        roomId,
        userId,
        isPlaying: true,
        currentTime,
        videoId,
      });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      socket.emit('play_state_change', {
        roomId,
        userId,
        isPlaying: false,
        currentTime,
        videoId,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
      <div id="youtube-iframe-player" className="w-full h-full" />
      {/* Click Shield to prevent standard iframe clicks for Viewers */}
      {!canControl && (
        <div className="absolute inset-0 bg-transparent z-10 cursor-not-allowed" />
      )}
    </div>
  );
};
```

---

## 4. Role Management Controls (`src/components/ParticipantList.jsx`)

Render control items conditionally based on whether the current client is the Host.

```jsx
import React from 'react';
import { Shield, UserMinus } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const ParticipantList = ({ roomId, currentUserId, currentRole, participants }) => {
  const { socket } = useSocket();

  const handlePromoteDemote = (targetUserId, currentTargetRole) => {
    if (!socket || currentRole !== 'HOST') return;
    const newRole = currentTargetRole === 'MODERATOR' ? 'PARTICIPANT' : 'MODERATOR';
    socket.emit('assign_role', { roomId, userId: currentUserId, targetUserId, newRole });
  };

  const handleKick = (targetUserId) => {
    if (!socket || currentRole !== 'HOST') return;
    if (confirm('Are you sure you want to remove this participant?')) {
      socket.emit('remove_participant', { roomId, userId: currentUserId, targetUserId });
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-800">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Participants</h3>
      <ul className="space-y-2">
        {participants.map((member) => (
          <li key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
            <span className="flex items-center gap-2 text-white">
              {member.username}
              {member.role === 'HOST' && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Host</span>}
              {member.role === 'MODERATOR' && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">Mod</span>}
            </span>
            
            {/* Action Buttons for Host only */}
            {currentRole === 'HOST' && member.id !== currentUserId && (
              <div className="flex gap-2">
                <button
                  onClick={() => handlePromoteDemote(member.id, member.role)}
                  className="p-1 hover:bg-slate-700 rounded text-purple-400"
                  title={member.role === 'MODERATOR' ? 'Demote to Participant' : 'Promote to Moderator'}
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleKick(member.id)}
                  className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  title="Remove from Room"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
```
