mongoose = global.mongoose;

var Fairies = new mongoose.model('Fairies', {
  _id: {type: Number},
  ownerId: {type: Number}, // This is the accountId,
  data: {}
});

module.exports = Fairies;
