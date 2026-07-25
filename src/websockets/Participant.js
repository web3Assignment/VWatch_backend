const Role = {
  HOST: 'HOST',
  MODERATOR: 'MODERATOR',
  PARTICIPANT: 'PARTICIPANT',
  VIEWER: 'VIEWER'
};

class Participant {
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

module.exports = {
  Role,
  Participant
};
