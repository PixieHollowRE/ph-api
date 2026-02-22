/* global mongoose: writeable */
/* global create: writeable */
/* global libamf: writeable */

mongoose = global.mongoose
create = global.create
libamf = global.libamf

const Account = require('./models/Account')
const Fairy = require('./models/Fairy')

const bcrypt = require('bcrypt')

const axios = require('axios').default

const saltRounds = 12

const userAgent = 'Sunrise Games - Pixie Hollow API'

class Database {
  constructor () {
    this.connect()
  }

  async connect () {
    await mongoose.connect('mongodb://127.0.0.1:27017/PixieHollow')

    console.log('Connected to MongoDB!')

    this.db = mongoose.connection

    // Create id sequence
    const doIdSequence = await this.db.collection('globals').findOne({ _id: 'doid' })
    if (!doIdSequence) {
      console.log('Creating doid sequence...')
      this.db.collection('globals').insertOne({
        _id: 'doid',
        seq: 100000000
      })
    }

    this.db.on('error', console.error.bind(console, 'MongoDB connection error:'))
  }

  async getNextDoId () {
    const ret = await this.db.collection('globals').findOneAndUpdate(
      { _id: 'doid' }, // filter
      { $inc: { seq: 1 } }, // update
      { returnOriginal: true } // options
    )
    console.log(ret)
    return ret.seq
  }

  async handleFlashLogin (req, res) {
    let username = req.body.username
    let password = req.body.password
    let loginType = req.body.loginType

    if (username === undefined && password === undefined) {
      username = req.query.username
      password = req.query.password
    }

    if (username !== undefined) {
      username = username.toLowerCase()
    }

    if (loginType === undefined) {
      loginType = req.query.loginType
    }

    let validCredentials
    let accountId
    if (loginType === 'swid') {
      const ses = req.session
      if (ses.logged && ses.username && ses.userId) {
        validCredentials = true
        accountId = ses.userId
        username = ses.username
      }
    } else {
      validCredentials = await this.verifyCredentials(username, password)
      accountId = await this.getAccountIdFromUser(username)
    }
    let errorResp = ''

    const root = create().ele('result')

    const success = root.ele('success')
    success.txt(validCredentials)

    const err = root.ele('error')

    if (!validCredentials) {
      errorResp = 'PARAM_ERROR'
    }

    err.txt(errorResp)

    const input = root.ele('input')
    input.ele('cookieValue')

    input.ele('loginType').txt('hard')

    root.ele('token')
    root.ele('type').txt('hard')
    root.ele('banURL')

    const results = root.ele('results')
    results.ele('username').txt(username)
    results.ele('userId').txt(accountId)

    const xml = root.end({ prettyPrint: true })
    res.setHeader('content-type', 'text/xml')
    res.send(xml)
  }

  async handleAccountLogin (req, res) {
    let username = req.body.username
    let password = req.body.password

    if (username === undefined && password === undefined) {
      username = req.query.username
      password = req.query.password
    }

    if (username !== undefined) {
      username = username.toLowerCase()
    }

    const validCredentials = await this.verifyCredentials(username, password)
    const accountId = await this.getAccountIdFromUser(username)

    if (validCredentials) {
      await db.createDefaultSession(req, username, accountId, false)
    }

    const root = create().ele('AccountLoginResponse')
    const success = root.ele('success')
    success.txt(validCredentials)

    root.ele('account', { account_id: accountId })

    const xml = root.end({ prettyPrint: true })
    res.setHeader('content-type', 'text/xml')
    res.send(xml)
  }

  async createDefaultSession (req, username, accountId, justRegistered) {
    const ses = req.session

    ses.username = username
    ses.success = '1'
    ses.status = 'logged_in_player'
    ses.logged = true
    ses.userId = accountId

    if (!justRegistered) {
      const fairy = await this.retrieveFairy(accountId)
      ses.fairyId = fairy._id
    }
  }

  async isUsernameAvailable (username) {
    const account = await Account.exists({ username })

    if (account) {
      return false
    }

    return true
  }

  async doesFairyExist (identifier) {
    const fairy = await Fairy.findOne({ $or: [{ _id: identifier }, { accountId: identifier }] })

    if (fairy) {
      return true
    }

    return false
  }

  async retrieveFairy (identifier) {
    const fairy = await Fairy.findOne({ $or: [{ _id: identifier }, { accountId: identifier }] })

    if (fairy) {
      return fairy
    }

    return false
  }

  async retrieveFairyByOwnerAccount (owner) {
    const fairy = await Fairy.findOne({ ownerAccount: owner })

    if (fairy) {
      return fairy
    }

    return false
  }

  async getAccountIdFromUser (username) {
    const account = await this.retrieveAccountFromUser(username)

    if (account) {
      return account._id
    }

    return -1
  }

  async getUserNameFromAccountId (accountId) {
    const account = await this.retrieveAccountFromIdentifier(accountId)

    if (account) {
      return account.username
    }

    return ''
  }

  async retrieveAccountData (username) {
    const data = new URLSearchParams()

    data.append('username', username)
    data.append('secretKey', process.env.API_TOKEN)

    const request = await axios.post('https://sunrise.games/api/internal/Account.php', data, {
      headers: {
        'Accept-Encoding': 'application/json',
        'User-Agent': userAgent
      }
    })
    return request.data
  }

  async checkLogin (username, password) {
    const data = new URLSearchParams()

    data.append('username', username)
    data.append('password', password)
    data.append('serverType', 'Pixie Hollow')

    return await axios.post('https://sunrise.games/api/login/alt/', data, {
      headers: {
        'Accept-Encoding': 'application/json',
        'User-Agent': userAgent
      }
    })
  }

  async retrieveAccountFromIdentifier (identifier) {
    return await Account.findById(identifier)
  }

  async retrieveAccountFromUser (username) {
    return await Account.findOne({ username })
  }

  async retrieveAccountFromFairyId (fairyId) {
    return await Account.findOne({ $or: [{ playerId: fairyId }] })
  }

  async verifyCredentials (username, password) {
    let account = await this.retrieveAccountFromUser(username)

    if (!account) {
      // Check if its in the Sunrise Games database.
      const res = await this.checkLogin(username, password)
      const errorCode = res.data.errorCode

      if (errorCode === 0) {
        // Create a brand new account
        account = await this.createAccount(username, password)
      } else {
        return false
      }
    }

    const match = bcrypt.compareSync(password, account.password)

    if (!match) {
      // Check if its in the Sunrise Games database.
      const res = await this.checkLogin(username, password)
      const errorCode = res.data.errorCode

      if (errorCode === 0) {
        // Our main Sunrise Games password changed, the one in the database is outdated.
        // Generate new hash for bcrypt
        account.password = bcrypt.hashSync(password, saltRounds)
        await account.save()
      } else {
        return false
      }
    }

    return match
  }

  async createFairy (accountId, fairyData) {
    const avatar = fairyData.avatar[0]

    const proportions = {}
    avatar.proportion.forEach(p => {
      proportions[p.$.type.toLowerCase()] = parseInt(p._)
    })

    const rotations = {}
    avatar.rotation.forEach(r => {
      rotations[r.$.type.toLowerCase()] = parseInt(r._)
    })

    const items = avatar.item.map(i => ({
      type: i.$.type,
      item_id: parseInt(i.item_id[0]),
      color_number: parseInt(i.color[0].$.number),
      color_value: parseInt(i.color[0]._)
    }))

    const account = await this.retrieveAccountFromIdentifier(accountId)

    // Store our fairy.
    const fairy = new Fairy({
      _id: await this.getNextDoId(),
      ownerAccount: await this.getUserNameFromAccountId(accountId),
      accountId,
      name: fairyData.name[0],
      talent: parseInt(fairyData.talent[0]),
      gender: parseInt(fairyData.gender[0]),
      avatar: {
        proportions,
        rotations,
        hair_back: parseInt(avatar.hair_back[0]),
        hair_front: parseInt(avatar.hair_front[0]),
        face: parseInt(avatar.face[0]),
        eye: parseInt(avatar.eye[0]),
        wing: parseInt(avatar.wing[0]),
        hair_color: parseInt(avatar.hair_color[0]),
        eye_color: parseInt(avatar.eye_color[0]),
        skin_color: parseInt(avatar.skin_color[0]),
        wing_color: parseInt(avatar.wing_color[0]),
        items
      }
    })

    const saved = await fairy.save()

    // Save the information into the account.
    account.playerId = fairy._id
    await account.save()

    return saved._id
  }

  async createAccount (username, password) {
    if (!await this.isUsernameAvailable(username)) {
      // Sanity check
      return false
    }

    // Store the account object.
    const account = new Account({
      _id: await this.getNextDoId(),
      username,
      password: bcrypt.hashSync(password, saltRounds)
    })

    return await account.save()
  }
}

module.exports = Database
