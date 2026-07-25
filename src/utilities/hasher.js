const bcrypt = require('bcrypt');

class Hasher {
  static async generateHash(stringToHash) {
    const salt = await bcrypt.genSalt(Number(process.env.saltRounds || 10));
    const hashedString = await bcrypt.hash(stringToHash, salt);
    return hashedString;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Hasher;
