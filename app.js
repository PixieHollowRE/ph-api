// Include our configuration info.
require('dotenv').config()

// Include our globals.
require('./globals')

app = global.app

/* global app: writeable */

app.listen(8013, () => {
  console.log('Listening on port 8013')
})
