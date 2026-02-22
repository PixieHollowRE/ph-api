/* global server:writable, create:writable */
/* global db, account:writeable */

server = global.server
create = global.create

const express = require('express')

const CryptoJS = require('crypto-js')
const { shopData } = require('../constants')

const loginQueue = []

server.app.get('/', (req, res) => {
  res.send('Pixie Hollow API service.')
})

function verifyAuthorization (token) {
  return token === process.env.API_TOKEN
}

function generateRandomNumber () {
  return Math.floor(Math.random() * 101)
}

async function generateToken (username) {
  const accData = await db.retrieveAccountData(username)

  const data = {
    playToken: username,
    SpeedChatPlus: accData.SpeedChatPlus,
    OpenChat: accData.OpenChat,
    Member: accData.Member,
    Timestamp: Math.floor(new Date().getTime() / 1000) + 10 * 60,
    dislId: accData.dislId,
    accountType: accData.accountType,
    LinkedToParent: accData.LinkedToParent,
    token: '',
    Banned: accData.Banned,
    Terminated: accData.Terminated
  }

  const key = CryptoJS.enc.Hex.parse(process.env.TOKEN_KEY)
  const iv = CryptoJS.lib.WordArray.random(16) // Generate random IV (16 bytes)

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  const ivBase64 = CryptoJS.enc.Base64.stringify(iv)
  const encryptedBase64 = encrypted.toString()

  return btoa(JSON.stringify({
    iv: ivBase64,
    data: encryptedBase64
  }))
}

async function handleWhoAmIRequest (req, res) {
  const ses = req.session

  let success = false
  let accountId = -1
  let userName = ''
  let speedChatPrompt = 'false'

  if (ses.success) {
    success = true
  }

  const root = create().ele('WhoAmIResponse')

  const item = root.ele('success')
  req.query.isFirst === undefined ? item.txt(true) : item.txt(success)

  const status = root.ele('status')
  const user = root.ele('username')

  if (ses.logged && ses.username && ses.userId) {
    status.txt('logged_in_fairy')
    user.txt(ses.username)

    accountId = ses.userId
    userName = ses.username

    const accData = await db.retrieveAccountData(userName)
    speedChatPrompt = `${Boolean(!accData.SpeedChatPlus)}`
  } else {
    status.txt('not_logged_in')
  }

  account = root.ele('account', { account_id: accountId })
  account.ele('first_name')
  account.ele('dname').txt(userName)
  account.ele('age').txt(0)
  account.ele('isChild').txt(true)
  account.ele('access').txt('basic')
  account.ele('touAccepted').txt(true)
  account.ele('speed_chat_prompt').txt(speedChatPrompt)
  account.ele('dname_submitted').txt(true)
  account.ele('dname_approved').txt(true)

  root.ele('userTestAccessAllowed').txt('false')

  const serverTime = root.ele('server-time')
  serverTime.ele('day').txt(new Date().toLocaleDateString('en-ZA'))
  serverTime.ele('time').txt('0:0')
  serverTime.ele('day-of-week').txt(new Date().toLocaleDateString('en-US', { weekday: 'short' }))

  if (ses.fairyId) {
    root.ele('fairy_id').txt(ses.fairyId)
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
}

server.app.get('/fairies/api/AccountLogoutRequest', async (req, res) => {
  req.session.destroy()

  const root = create().ele('AccountLogoutResponse')
  root.ele('success').txt('true')

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.get('/fairies/api/WhoAmIRequest', async (req, res) => {
  await handleWhoAmIRequest(req, res)
})

server.app.post('/fairies/api/WhoAmIRequest', async (req, res) => {
  await handleWhoAmIRequest(req, res)
})

server.app.get('/dxd/flashAPI/login', async (req, res) => {
  await db.handleFlashLogin(req, res)
})

server.app.post('/dxd/flashAPI/login', async (req, res) => {
  await db.handleFlashLogin(req, res)
})

server.app.post('/dxd/flashAPI/checkUsernameAvailability', async (req, res) => {
  const username = req.body.username
  let status

  if (process.env.LOCALHOST_INSTANCE === 'true') {
    status = await db.isUsernameAvailable(username)
  } else {
    // TODO: Integrate registration into Sunrise database and re-enable in-game registrations for production
    status = false
  }

  const root = create().ele('response')
  root.ele('success').txt(status)

  if (!status) {
    // Specified username is taken, give some suggestions to choose from.
    const results = root.ele('results')

    const words = [
      'Amazing',
      'Cool',
      'Super',
      'Fantastic'
    ]

    const randomIndex = Math.floor(Math.random() * words.length)

    results.ele('suggestedUsername1').txt(`${username}${generateRandomNumber()}`)
    results.ele('suggestedUsername2').txt(`${username}${generateRandomNumber()}`)
    results.ele('suggestedUsername3').txt(`${words[randomIndex]}${username}`)
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.post('/dxd/flashAPI/createAccount', async (req, res) => {
  const username = req.body.username.toLowerCase()
  const status = await db.createAccount(username, req.body.password)
  const accountId = await db.getAccountIdFromUser(req.body.username)

  const root = create().ele('response')
  root.ele('success').txt(status)

  const results = root.ele('results')
  results.ele('userId').txt(accountId)

  // Start our session if we do not already have one.
  // TODO: Should we redirect instead if they are already signed in?
  if (!req.session.logged) {
    await db.createSession(req, username, accountId, true)
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.post('/fairies/api/AccountLoginRequest', async (req, res) => {
  await db.handleAccountLogin(req, res)
})

server.app.get('/fairies/api/AccountLoginRequest', async (req, res) => {
  await db.handleAccountLogin(req, res)
})

server.app.get('/fairies/api/GameEntranceRequest', (req, res) => {
  const root = create().ele('GameEntranceRequestResponse')
  const item = root.ele('success')
  item.txt('true')

  const queue = root.ele('queue')
  const canEnter = queue.ele('can_enter_game')
  canEnter.txt(loginQueue.length > 0 ? 'false' : 'true')

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.get('/fairies/api/QueueStatsRequest', (req, res) => {
  const root = create().ele('QueueStatsRequestResponse')

  const queue = root.ele('queue')

  // TODO: Implement queue
  queue.ele('est_queue_before_you').txt(0)

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.post('/fairies/api/GenerateTokenRequest', async (req, res) => {
  const root = create().ele('GenerateTokenRequestResponse')

  const ses = req.session

  const item = root.ele('success')
  item.txt(ses ? 'true' : 'false')

  if (ses.username) {
    const token = root.ele('token')
    token.txt(process.env.LOCALHOST_INSTANCE === 'true' ? ses.username : await generateToken(ses.username))
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

/*
server.app.post('/fairies/api/RedeemPromoCodeRequest', async (req, res) => {
  const root = create().ele('RedeemPromoCodeRequestResponse')
  const ses = req.session

  const code = await db.retrieveRedeemableCode(req.body.code)
  const redeemed = await db.checkCodeRedeemedByUser(ses.username, req.body.code)

  const success = ses.username && code && !redeemed
  const item = root.ele('success')
  item.txt(success ? 'true' : 'false')

  if (!success) {
    const error = root.ele('error')

    if (!ses.username) {
      error.att('code', 'USER_NOT_LOGGED_IN')
    }

    if (ses.username && !code) {
      error.att('code', 'INVALID_PROMO_CODE')
    }

    if (redeemed) {
      error.att('code', 'ALREADY_REDEEMED_PROMO_CODE')
    }
  }

  if (ses.username && code && !redeemed) {
    const description = (code.type === 'coins') ? 'car coins' : code.description

    const reward = root.ele('reward')
    reward.ele('description').txt(description)
    reward.ele('quantity').txt(code.quantity)

    if (code.type !== 'coins') {
      reward.ele('thumbnail').txt(code.thumbnail)
    }

    const car = await db.retrieveCarByOwnerAccount(ses.username)

    if (car) {
      const carData = car.toObject().carData

      if (code.type === 'coins') {
        carData.carCoins += code.quantity
      }

      if (code.type === 'consumable' || code.type === 'fizzyfuel') {
        let hasConsumable = false

        for (let i = 0; i < carData.consumableItemList.length; i++) {
          const consumable = carData.consumableItemList[i]

          if (consumable[0] === code.rewardId) {
            if ((code.type === 'consumable' && consumable[1] < 99) || (code.type === 'fizzyfuel' && consumable[1] < 10)) {
              consumable[1] += code.quantity
            }

            hasConsumable = true
            break
          }
        }

        if (!hasConsumable) {
          carData.consumableItemList.push([code.rewardId, code.quantity])
        }
      }

      if (code.type === 'paintjob') {
        if (!carData.detailings) {
          carData.detailings = []
        }

        if (!carData.detailings.includes(code.rewardId)) {
          carData.detailings.push(code.rewardId)
        }
      }

      car.carData = carData
      await car.save()
      await db.setCodeAsRedeemedByUser(ses.username, req.body.code)
    }
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})
*/

server.app.use(express.json())

server.app.post('/fairies/api/internal/setFairyData', async (req, res) => {
  if (!verifyAuthorization(req.headers.authorization)) {
    return res.status(401).send('Authorization failed.')
  }

  const data = req.body

  if (data.playToken && data.fieldData) {
    const fairy = await db.retrieveFairyByOwnerAccount(data.playToken)
    console.log(fairy, data.fieldData)
    Object.assign(fairy, data.fieldData)
    await fairy.save()
    return res.status(200).send({ success: true, message: 'Success.' })
  }

  return res.status(501).send({ success: false, message: 'Something went wrong.' })
})

server.app.get('/fairies/api/internal/retrieveAccount', async (req, res) => {
  if (!verifyAuthorization(req.headers.authorization)) {
    return res.status(401).send('Authorization failed.')
  }

  res.setHeader('content-type', 'application/json')
  if (req.query.userName) {
    let account = await db.retrieveAccountFromUser(req.query.userName)
    if (account) {
      account = account.toObject()
      delete account.password
      return res.end(JSON.stringify(
        account
      ))
    }
  }

  return res.status(404).send({ message: `Could not find account from username ${req.query.userName}` })
})

server.app.get('/fairies/api/internal/retrieveFairy', async (req, res) => {
  if (!verifyAuthorization(req.headers.authorization)) {
    return res.status(401).send('Authorization failed.')
  }

  res.setHeader('content-type', 'application/json')
  if (req.query.identifier) {
    res.end(JSON.stringify(
      await db.retrieveFairy(req.query.identifier))
    )
    return
  }

  if (req.query.playToken) {
    res.end(JSON.stringify(
      await db.retrieveFairyByOwnerAccount(req.query.playToken))
    )
    return
  }

  return res.status(400).send({})
})

server.app.get('/fairies/api/internal/retrieveObject/:identifier', async (req, res) => {
  if (!verifyAuthorization(req.headers.authorization)) {
    return res.status(401).send('Authorization failed.')
  }

  res.setHeader('content-type', 'application/json')
  if (req.params.identifier) {
    // Check for account
    let account = await db.retrieveAccountFromIdentifier(req.params.identifier)
    if (account) {
      // Convert Mongoose docs to JS objects so we can make
      // changes to it.
      account = account.toObject()
      // Don't send the account's hashed password
      delete account.password

      account.objectName = 'Account'
      return res.end(JSON.stringify(
        account
      ))
    }

    // Check for Fairy
    let fairy = await db.retrieveFairy(req.params.identifier)
    if (fairy) {
      fairy = fairy.toObject()

      if (fairy._id === Number(req.params.identifier)) {
        fairy.objectName = 'DistributedFairyPlayer'
      } else {
        fairy.objectName = 'Unknown'
      }

      return res.end(JSON.stringify(
        fairy
      ))
    }

    return res.status(404).send({ message: `Object ${req.params.identifier} not found!` })
  }
})

server.app.post('/fairies/api/internal/updateObject/:identifier', async (req, res) => {
  if (!verifyAuthorization(req.headers.authorization)) {
    return res.status(401).send('Authorization failed.')
  }

  const data = req.body

  let updated = false
  if (req.params.identifier) {
    // Check for account
    const account = await db.retrieveAccountFromIdentifier(req.params.identifier)
    if (account) {
      Object.assign(account, data)
      await account.save()
      updated = true
    }

    if (!updated) {
      const fairy = await db.retrieveFairy(req.params.identifier)
      if (fairy) {
        Object.assign(fairy, data)
        await fairy.save()
        updated = true
      }
    }

    if (updated) {
      return res.send({ message: 'Updated successfully!' })
    } else {
      return res.status(404).send({ message: `Could not update ${req.params.identifier}` })
    }
  }
})

server.app.post('/dxd/flashAPI/getFamilyStructure', (req, res) => {
  // TODO: Implement parent accounts
  const root = create().ele('response')
  root.ele('success').txt(0)

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.post('/dxd/flashAPI/lookupAccount', async (req, res) => {
  const root = create().ele('response')
  const ses = req.session

  if (ses && ses.userId) {
    const userId = ses.userId
    const account = await db.retrieveAccountFromIdentifier(userId)

    if (account) {
      root.ele('success').txt(1)

      root.ele('acceptedTOU').txt(true) // TODO: Does not seem we have the TOU text, so we auto accept for now

      const results = root.ele('results')

      const accData = await db.retrieveAccountData(account.username)

      results.ele('firstName').txt(accData.FirstName)
      results.ele('lastName').txt(accData.LastName)
      results.ele('email').txt(accData.Email)
      results.ele('username').txt(account.username)
      results.ele('swid').txt(accData.dislId)
      results.ele('age').txt(accData.Age)
      results.ele('userId').txt(userId)

      if (accData.Age >= 18) {
        results.ele('hoh').txt(true)
      }

      if (accData.SpeedChatPlus === 1) {
        results.ele('canWhitelistChat').txt(true)
        results.ele('canWhitelistChatValidationType').txt(0)
      } else {
        results.ele('canWhitelistChat').txt(false)
      }

      if (accData.OpenChat === 1) {
        results.ele('chatLevel').txt(3) // TODO: Implement the chat types
        results.ele('chatLevelValidationType').txt(0)
      } else {
        results.ele('chatLevel').txt(0)
      }
    }
  }

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  console.log(xml)
  res.send(xml)
})

server.app.post('/commerce/flashapi/lookupOffers', async (req, res) => {
  // TODO: Implement me
  const root = create().ele('response')
  root.ele('success').txt(1)

  root.ele('offers')

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.post('/commerce/flashapi/lookupSubscriptions', async (req, res) => {
  // TODO: Same as above
  const root = create().ele('response')
  root.ele('success').txt(1)

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.get('/dxd/flashAPI/getTermsOfUseText', async (req, res) => {
  // TODO: Same as above
  const root = create().ele('response')
  root.ele('success').txt(1)

  const results = root.ele('results')
  results.ele('tou')

  const xml = root.end({ prettyPrint: true })
  res.setHeader('content-type', 'text/xml')
  res.send(xml)
})

server.app.get('/getShopItemData', async (req, res) => {
  return res.end(JSON.stringify(shopData))
})

server.app.post('/fairies/api/SubmitDNameRequest', (req, res) => {
  const root = create().ele('SubmitDNameRequestResponse')

  const item = root.ele('success')
  item.txt('true')

  const xml = root.end({ prettyPrint: true })
  res.send(xml)
})

server.app.post('/fairies/api/FairiesProfileRequest', async (req, res) => {
  // NOTE: Sunrise only supports one Fairy or Sparrow Man character per account.
  // Sunrise is aiming for accuracy as close as possible, even if the client may allow it still.

  // Prior to November 10, 2011, you could create up to three fairies or sparrow men.
  // After that date, you could only create one fairy per Disney account.
  const ses = req.session

  const loggedInFairy = false
  const includeAvatar = 'dna' in req.body
  const includeBio = 'bio' in req.body

  let fairyId = req.body.fairy_id ?? null
  const userId = req.body.user_id ?? null

  if (fairyId !== null) {
    fairyId = parseInt(fairyId)
  } else {
    fairyId = ses?.fairyId ?? null
  }

  if (userId !== null) {
    // Grab the fairyId from the account instead.
    const account = await db.retrieveAccountFromIdentifier(userId)
    fairyId = account.playerId
  }

  const fairyData = await db.retrieveFairy(fairyId)
  const fairiesToSend = fairyData ? [fairyData] : []

  const root = create().ele('response')
  root.ele('success').txt('true')
  root.ele('user_id').txt(String(ses.userId))
  root.ele('status').txt(fairyId != null ? 'logged_in_fairy' : 'logged_in')

  const fairiesEl = root.ele('fairies')

  for (const fairy of fairiesToSend) {
    const fairyEl = fairiesEl.ele('fairy').att('fairy_id', String(fairy._id))
    fairyEl.ele('address').txt(fairy.address)
    fairyEl.ele('more_options').txt(String(fairy.moreOptions))
    fairyEl.ele('tutorial').txt(String(fairy.tutorialBitmask[0]))
    fairyEl.ele('tutorial_hi').txt(String(fairy.tutorialBitmask[1]))
    fairyEl.ele('created').txt(fairy.created.toISOString().split('T')[0])
    fairyEl.ele('name').txt(fairy.name)
    fairyEl.ele('talent').txt(String(fairy.talent))
    fairyEl.ele('gender').txt(String(fairy.gender))
    fairyEl.ele('chosen').txt(String(fairy.chosen || false))
    fairyEl.ele('icon').txt(String(fairy.icon || 0))
    fairyEl.ele('game_prof_bg').txt(fairy.game_prof_bg || '')

    if (loggedInFairy) {
      fairyEl.ele('logged_in_fairy').txt('true')
    }

    if (includeBio) {
      fairyEl.ele('bio').txt(fairy.bio || '')
    }

    if (includeAvatar && fairy.avatar) {
      const avatarEl = fairyEl.ele('avatar')

      if (fairy.avatar.proportions) {
        for (const [type, value] of Object.entries(fairy.avatar.proportions)) {
          if (value != null) {
            avatarEl.ele('proportion').att('type', type.toUpperCase()).txt(String(value))
          }
        }
      }

      if (fairy.avatar.rotations) {
        for (const [type, value] of Object.entries(fairy.avatar.rotations)) {
          if (value != null) {
            avatarEl.ele('rotation').att('type', type.toUpperCase()).txt(String(value))
          }
        }
      }

      const simpleFields = [
        'hair_back', 'hair_front', 'face', 'eye', 'wing',
        'hair_color', 'eye_color', 'skin_color', 'wing_color'
      ]
      for (const field of simpleFields) {
        if (fairy.avatar[field] != null) {
          avatarEl.ele(field).txt(String(fairy.avatar[field]))
        }
      }

      avatarEl.ele('gender').txt(String(fairy.gender))

      if (fairy.avatar.items) {
        for (const item of fairy.avatar.items) {
          const itemEl = avatarEl.ele('item').att('type', item.type)
          itemEl.ele('item_id').txt(String(item.item_id))
          itemEl.ele('color').att('number', String(item.color_number)).txt(String(item.color_value))
        }
      }
    }
  }

  const xml = root.end({ prettyPrint: true })
  res.send(xml)
})

server.app.post('/fairies/api/FairiesNewFairyRequest', async (req, res) => {
  ;
  const fairyData = req.body.fairiesnewfairyrequest.fairy[0]

  const root = create().ele('response')

  const ses = req.session

  const item = root.ele('success')
  item.txt(ses ? 'true' : 'false')

  const fairyId = ses ? await db.createFairy(ses.userId, fairyData) : -1
  ses.fairyId = fairyId
  root.ele('fairy_id').txt(fairyId)

  const xml = root.end({ prettyPrint: true })
  res.send(xml)
})

server.app.post('/fairies/api/ChooseFairyRequest', (req, res) => {
  const root = create().ele('response')

  const item = root.ele('success')
  item.txt('true')

  const xml = root.end({ prettyPrint: true })
  res.send(xml)
})

server.app.post('/fairies/api/FairiesInventoryRequest', (req, res) => {
  const root = create().ele('response')
  root.ele('success').txt('true')

  const inventory = root.ele('inventory')
  inventory.ele('type').txt('wardrobe')

  const items = [
    { item_id: 2501, inv_id: 3612, slot: 0, created_by_id: 0, gifted_by_id: 0, quality: 3, color: { number: 1, value: 37 } },
    { item_id: 2503, inv_id: 3876, slot: 1, created_by_id: 0, gifted_by_id: 0, quality: 3, color: { number: 1, value: 39 } },
    { item_id: 2503, inv_id: 3877, slot: 2, created_by_id: 0, gifted_by_id: 0, quality: 3, color: { number: 1, value: 39 } }
  ]

  items.forEach(i => {
    const inv = inventory.ele('inv_item')
    inv.ele('item_id').txt(String(i.item_id))
    inv.ele('inv_id').txt(String(i.inv_id))
    inv.ele('slot').txt(String(i.slot))
    inv.ele('created_by_id').txt(String(i.created_by_id))
    inv.ele('gifted_by_id').txt(String(i.gifted_by_id))
    inv.ele('quality').txt(String(i.quality))
    inv.ele('color').att('number', String(i.color.number)).txt(String(i.color.value))
  })

  const xml = root.end({ prettyPrint: true })
  res.send(xml)
})

// Remove userSession at the very end of the router stack, add routes above this call please.
server.app.use((req, res, next) => {
  // eslint-disable-next-line no-undef
  userSession = {}
  next()
})
