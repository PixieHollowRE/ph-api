/* global mongoose: writeable */

mongoose = global.mongoose

const Account = new mongoose.model('Account', {
  _id: { type: Number },
  username: { type: String },
  password: { type: String },
  playerId: { type: Number } // DistributedFairyPlayer object id
})

module.exports = Account
