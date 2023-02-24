server = global.server;
create = global.create;

server.app.get('/', (req, res) => {
    res.send('Pixie Hollow API service.')
})

server.app.get('/fairies/api/WhoAmIRequest', async (req, res) => {
    handleWhoAmI(req, res);
})

server.app.post('/fairies/api/WhoAmIRequest', async (req, res) => {
    handleWhoAmI(req, res);
})

function handleWhoAmI(req, res) {
    const ses = req.session;

    var success = false;
    var accountId = -1;

    if (ses.success) {
        success = true;
    }

    const root = create().ele('WhoAmIResponse');

    const item = root.ele('success');
    item.txt(true);

    const status = root.ele('status');
    const user = root.ele('username');

    if (ses.logged && ses.username && ses.userId) {
        status.txt('logged_in_fairy');
        user.txt(ses.username);

        accountId = ses.userId;
    } else {
        status.txt('not_logged_in');
    }

    account = root.ele('account', {'account_id': accountId})
    account.ele('first_name');
    account.ele('dname').txt('test');
    account.ele('age').txt(0);
    account.ele('isChild').txt(true);
    account.ele('access').txt('basic');
    account.ele('touAccepted').txt(true);
    account.ele('speed_chat_prompt').txt('false');
    account.ele('dname_submitted').txt(true);
    account.ele('dname_approved').txt(true);

    root.ele('userTestAccessAllowed').txt('false');

    serverTime = root.ele('server-time');
    serverTime.ele('day').txt(new Date().toLocaleDateString('en-ZA'));
    serverTime.ele('time').txt('0:0');
    serverTime.ele('day-of-week').txt(new Date().toLocaleDateString('en-US', {weekday: 'short'}));

    const xml = root.end({prettyPrint: true});
    res.send(xml);
}

server.app.get('/dxd/flashAPI/login', async (req, res) => {
    await db.handleFlashLogin(req, res);
})

server.app.post('/dxd/flashAPI/login', async (req, res) => {
    await db.handleFlashLogin(req, res);
})

server.app.post('/dxd/flashAPI/checkUsernameAvailability', async (req, res) => {
    const status = await db.isUsernameAvailable(req.body.username);

    const root = create().ele('response');
    root.ele('success').txt(status);

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/dxd/flashAPI/createAccount', async (req, res) => {
    var status = await db.createAccount(req.body.username, req.body.password);
    var accountId = await db.getAccountIdFromUser(req.body.username);

    const root = create().ele('response');
    root.ele('success').txt(status);

    const results = root.ele('results')
    results.ele('userId').txt(accountId);

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/AccountLoginRequest', async (req, res) => {
   await db.handleAccountLogin(req, res);
})

server.app.get('/fairies/api/AccountLoginRequest', async (req, res) => {
    await db.handleAccountLogin(req, res);
})

server.app.get('/fairies/api/GameEntranceRequest', (req, res) => {
    const root = create().ele('GameEntranceRequestResponse');
    const item = root.ele('success');
    item.txt('true');

    const queue = root.ele('queue');
    const canEnter = queue.ele('can_enter_game');
    canEnter.txt('true');

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/GenerateTokenRequest', (req, res) => {
    const root = create().ele('GenerateTokenRequestResponse');

    const ses = req.session;

    const item = root.ele('success');
    item.txt('true');

    if (ses.username) {
        const token = root.ele('token')
        token.txt(ses.username);
    }

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/SubmitDNameRequest', (req, res) => {
    const root = create().ele('SubmitDNameRequestResponse');

    const item = root.ele('success');
    item.txt('true');

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/FairiesProfileRequest', async (req, res) => {
    const root = create().ele('response');

    const ses = req.session;

    const item = root.ele('success');
    item.txt(ses ? 'true' : 'false');

    fairies = root.ele('fairies');

    const fairy = fairies.ele('fairy');

    fairy.ele('chosen').txt(true);

    const avatar = fairy.ele('avatar');

    console.log(req.body);

    if (req.body.current != '###') {
        ses.fairyId = req.body.current;
    }

    fairy.ele('fairy_id').txt(ses.fairyId);

    const fairyData = await db.retrieveFairy(ses.fairyId);
    console.log(fairyData);

    root.ele('user_id').txt(ses.userId);

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/FairiesNewFairyRequest', async (req, res) => {;
    const fairyData = req.body.fairiesnewfairyrequest.fairy[0];

    const root = create().ele('response');

    const ses = req.session;

    const item = root.ele('success');
    item.txt(ses ? 'true' : 'false');

    const fairy_id = await db.createFairy(ses.userId, fairyData) ? ses : -1;
    console.log(fairy_id);

    root.ele('fairy_id').txt(fairy_id);

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})

server.app.post('/fairies/api/ChooseFairyRequest', (req, res) => {
    const root = create().ele('response');

    const item = root.ele('success');
    item.txt('true');

    const xml = root.end({prettyPrint: true});
    res.send(xml);
})
