const { Role } = require('./Participant.js');

class Room {
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

module.exports = Room;
