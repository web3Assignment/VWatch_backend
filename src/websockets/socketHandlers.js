const jwt = require('jsonwebtoken');
const { User, Room: DBRoom, Participant: DBParticipant, ChatMessage, PlaybackLog } = require('../models');
const RoomManager = require('./RoomManager.js');
const { Participant, Role } = require('./Participant.js');
const logger = require('../utilities/logger.js');

const roomManager = RoomManager.getInstance();

const registerSocketHandlers = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication token required.'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretwatchpartykey');
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication failed. User not found.'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      logger.error(`"socketHandlers.js","io.use()","Socket authentication error: ${err.message}"`);
      return next(new Error('Unauthorized socket connection.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`"socketHandlers.js","connection","User connected to WebSocket: ${user.username} (${user.id})"`);

    // Event: Join Room
    socket.on('join_room', async ({ roomId }) => {
      try {
        socket.join(roomId);
        socket.roomId = roomId;

        let room = roomManager.getRoom(roomId);
        
        // If room is not initialized in-memory, fetch from MySQL
        if (!room) {
          const dbRoom = await DBRoom.findByPk(roomId);
          if (!dbRoom) {
            socket.emit('error_event', { message: 'Watch room does not exist.' });
            return;
          }
          room = roomManager.createRoom(roomId, dbRoom.hostId, dbRoom.currentVideoId);
          room.playbackState.currentTime = dbRoom.currentPlaybackTime;
          room.playbackState.isPlaying = dbRoom.isPlaying;
        }

        // Determine or assign participant role
        let role = Role.PARTICIPANT;
        if (room.hostId === user.id) {
          role = Role.HOST;
        } else {
          // Check if there is an existing role in the database
          const existingParticipant = await DBParticipant.findOne({
            where: { roomId, userId: user.id }
          });
          if (existingParticipant) {
            role = existingParticipant.role;
          } else {
            // Persist new participant to database
            await DBParticipant.create({
              roomId,
              userId: user.id,
              role: Role.PARTICIPANT,
              status: 'ACTIVE'
            });
          }
        }

        const participant = new Participant(user.id, socket.id, user.username, role);
        room.addParticipant(participant);

        // Notify DB that participant is ACTIVE
        await DBParticipant.update(
          { status: 'ACTIVE', role },
          { where: { roomId, userId: user.id } }
        );

        logger.info(`"socketHandlers.js","join_room","User ${user.username} joined room ${roomId} as ${role}"`);

        // Send initial state back to user
        socket.emit('user_joined', {
          userId: user.id,
          role,
          playbackState: room.playbackState,
          participants: Array.from(room.participants.values())
        });

        // Broadcast updated participants list to everyone in room
        io.to(roomId).emit('participants_updated', {
          participants: Array.from(room.participants.values())
        });
      } catch (error) {
        logger.error(`"socketHandlers.js","join_room","Error: ${error.message}"`);
        socket.emit('error_event', { message: 'Failed to join room.' });
      }
    });

    // Event: Play/Pause synchronization
    socket.on('play_state_change', async ({ isPlaying, currentTime, videoId }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const participant = room.getParticipant(user.id);
        if (!participant || (participant.role !== Role.HOST && participant.role !== Role.MODERATOR)) {
          socket.emit('error_event', { message: 'Permission Denied: Only Host or Moderator can change playback.' });
          return;
        }

        room.updatePlayback(videoId, currentTime, isPlaying);

        // Broadcast new state to all other participants
        socket.to(roomId).emit('sync_state', {
          isPlaying,
          currentTime,
          videoId
        });

        // Update room details in DB
        await DBRoom.update(
          { currentPlaybackTime: currentTime, isPlaying, currentVideoId: videoId },
          { where: { id: roomId } }
        );

        // Write to playback audit log
        await PlaybackLog.create({
          roomId,
          userId: user.id,
          action: isPlaying ? 'PLAY' : 'PAUSE',
          videoId,
          actionTimestamp: currentTime
        });

        logger.info(`"socketHandlers.js","play_state_change","Room ${roomId}: ${isPlaying ? 'PLAY' : 'PAUSE'} at ${currentTime}s by ${user.username}"`);
      } catch (error) {
        logger.error(`"socketHandlers.js","play_state_change","Error: ${error.message}"`);
      }
    });

    // Event: Seek synchronization
    socket.on('seek', async ({ currentTime, videoId }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const participant = room.getParticipant(user.id);
        if (!participant || (participant.role !== Role.HOST && participant.role !== Role.MODERATOR)) {
          socket.emit('error_event', { message: 'Permission Denied: Only Host or Moderator can seek.' });
          return;
        }

        room.playbackState.currentTime = currentTime;

        // Broadcast seek action to other participants
        socket.to(roomId).emit('sync_state', {
          isPlaying: room.playbackState.isPlaying,
          currentTime,
          videoId
        });

        // Log seek event
        await PlaybackLog.create({
          roomId,
          userId: user.id,
          action: 'SEEK',
          videoId,
          actionTimestamp: currentTime
        });

        logger.info(`"socketHandlers.js","seek","Room ${roomId}: SEEK to ${currentTime}s by ${user.username}"`);
      } catch (error) {
        logger.error(`"socketHandlers.js","seek","Error: ${error.message}"`);
      }
    });

    // Event: Change YouTube Video
    socket.on('change_video', async ({ videoId }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const participant = room.getParticipant(user.id);
        if (!participant || (participant.role !== Role.HOST && participant.role !== Role.MODERATOR)) {
          socket.emit('error_event', { message: 'Permission Denied: Only Host or Moderator can change videos.' });
          return;
        }

        room.updatePlayback(videoId, 0, false);

        // Broadcast video change to everyone in the room
        io.to(roomId).emit('sync_state', {
          isPlaying: false,
          currentTime: 0,
          videoId
        });

        // Update DB
        await DBRoom.update(
          { currentVideoId: videoId, currentPlaybackTime: 0, isPlaying: false },
          { where: { id: roomId } }
        );

        // Log Change Video
        await PlaybackLog.create({
          roomId,
          userId: user.id,
          action: 'CHANGE_VIDEO',
          videoId,
          actionTimestamp: 0.0
        });

        logger.info(`"socketHandlers.js","change_video","Room ${roomId}: Video changed to ${videoId} by ${user.username}"`);
      } catch (error) {
        logger.error(`"socketHandlers.js","change_video","Error: ${error.message}"`);
      }
    });

    // Event: Assign Role (Host only)
    socket.on('assign_role', async ({ targetUserId, newRole }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room || room.hostId !== user.id) {
          socket.emit('error_event', { message: 'Permission Denied: Only the Host can assign roles.' });
          return;
        }

        const targetParticipant = room.getParticipant(targetUserId);
        if (!targetParticipant) {
          socket.emit('error_event', { message: 'Participant not found in active session.' });
          return;
        }

        if (newRole === Role.HOST) {
          socket.emit('error_event', { message: 'To transfer ownership, please perform a Host Transfer.' });
          return;
        }

        targetParticipant.updateRole(newRole);

        // Persist role in DB
        await DBParticipant.update(
          { role: newRole },
          { where: { roomId, userId: targetUserId } }
        );

        logger.info(`"socketHandlers.js","assign_role","Room ${roomId}: Host assigned ${newRole} to User ID ${targetUserId}"`);

        // Emit update to everyone
        io.to(roomId).emit('role_assigned', {
          userId: targetUserId,
          role: newRole,
          participants: Array.from(room.participants.values())
        });
      } catch (error) {
        logger.error(`"socketHandlers.js","assign_role","Error: ${error.message}"`);
      }
    });

    // Event: Remove Participant (Host only)
    socket.on('remove_participant', async ({ targetUserId }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room || room.hostId !== user.id) {
          socket.emit('error_event', { message: 'Permission Denied: Only the Host can kick participants.' });
          return;
        }

        const targetParticipant = room.getParticipant(targetUserId);
        if (!targetParticipant) return;

        room.removeParticipant(targetUserId);

        // Persist status disconnect in DB
        await DBParticipant.update(
          { status: 'DISCONNECTED' },
          { where: { roomId, userId: targetUserId } }
        );

        // Notify client and disconnect
        io.to(targetParticipant.socketId).emit('kicked');
        io.sockets.sockets.get(targetParticipant.socketId)?.leave(roomId);

        logger.info(`"socketHandlers.js","remove_participant","Room ${roomId}: Host kicked User ID ${targetUserId}"`);

        // Broadcast new participant list
        io.to(roomId).emit('participant_removed', {
          userId: targetUserId,
          participants: Array.from(room.participants.values())
        });
      } catch (error) {
        logger.error(`"socketHandlers.js","remove_participant","Error: ${error.message}"`);
      }
    });

    // Event: Chat message
    socket.on('send_chat', async ({ message }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        // Save message to MySQL
        const chatRecord = await ChatMessage.create({
          roomId,
          userId: user.id,
          message
        });

        const chatPayload = {
          id: chatRecord.id,
          message: chatRecord.message,
          created_at: chatRecord.created_at,
          user: {
            id: user.id,
            username: user.username
          }
        };

        // Broadcast chat event to all clients in the room
        io.to(roomId).emit('chat_message', chatPayload);
      } catch (error) {
        logger.error(`"socketHandlers.js","send_chat","Error: ${error.message}"`);
      }
    });

    // Event: Disconnecting (Lifecycle cleanup)
    socket.on('disconnecting', async () => {
      try {
        const rooms = Array.from(socket.rooms);
        for (const roomId of rooms) {
          // Exclude the user's private socket room ID
          if (roomId === socket.id) continue;

          const room = roomManager.getRoom(roomId);
          if (!room) continue;

          const originalHostId = room.hostId;
          room.removeParticipant(user.id);
          const currentHostId = room.hostId;

          // If the disconnected user was the host and a new host was reassigned
          if (originalHostId === user.id && currentHostId && currentHostId !== originalHostId) {
            // Update DBRoom hostId
            await DBRoom.update(
              { hostId: currentHostId },
              { where: { id: roomId } }
            );
            // Demote old host in DB
            await DBParticipant.update(
              { role: Role.PARTICIPANT },
              { where: { roomId, userId: user.id } }
            );
            // Promote new host in DB
            await DBParticipant.update(
              { role: Role.HOST },
              { where: { roomId, userId: currentHostId } }
            );

            logger.info(`"socketHandlers.js","disconnecting","Host changed in room ${roomId} from User ${user.username} to User ID ${currentHostId}"`);

            // Broadcast the host change to clients in the room
            io.to(roomId).emit('role_assigned', {
              userId: currentHostId,
              role: Role.HOST,
              participants: Array.from(room.participants.values())
            });
          }

          // Update MySQL entry for the disconnected user status
          await DBParticipant.update(
            { status: 'DISCONNECTED' },
            { where: { roomId, userId: user.id } }
          );

          logger.info(`"socketHandlers.js","disconnect","User ${user.username} left room ${roomId}"`);

          // Broadcast updated participant list
          socket.to(roomId).emit('participants_updated', {
            participants: Array.from(room.participants.values())
          });
        }
      } catch (error) {
        logger.error(`"socketHandlers.js","disconnecting","Error: ${error.message}"`);
      }
    });
  });
};

module.exports = registerSocketHandlers;
