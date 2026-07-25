const Room = require('./Room.js');

class RoomManager {
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

module.exports = RoomManager;
