global.libamf = require('libamf');

global.CatalogItem = require('./catalog/CatalogItem');
global.CatalogItemRaceSeries = require('./catalog/CatalogItemRaceSeries');
global.CatalogItemWorldZone = require('./catalog/CatalogItemWorldZone');
global.CatalogItemPaint = require('./catalog/CatalogItemPaint');
global.CatalogItemChassis = require('./catalog/CatalogItemChassis');
global.CatalogChassisJointDynamic = require('./catalog/CatalogChassisJointDynamic');
global.CatalogChassisJointStatic = require('./catalog/CatalogChassisJointStatic');
global.CatalogChassisOffset = require('./catalog/CatalogChassisOffset');
global.CatalogChassisSlot = require('./catalog/CatalogChassisSlot');
global.CatalogItemNPC = require('./catalog/CatalogItemNPC');
global.CatalogItemDecal = require('./catalog/CatalogItemDecal');
global.CatalogItemEyeColor = require('./catalog/CatalogItemEyeColor');
global.CatalogItemWheel = require('./catalog/CatalogItemWheel');
global.CatalogItemTire = require('./catalog/CatalogItemTire');
global.CatalogCarItem = require('./catalog/CatalogCarItem');
global.CatalogPlayerItem = require('./catalog/CatalogPlayerItem');
global.CatalogPlayerStoreItem = require('./catalog/CatalogPlayerStoreItem');
global.CatalogItemAnimation = require('./catalog/CatalogItemAnimation');
global.CatalogItemSimpleAnimation = require('./catalog/CatalogItemSimpleAnimation');
global.CatalogItemRaceLevel = require('./catalog/CatalogItemRaceLevel');
global.CatalogItemWorldZone = require('./catalog/CatalogItemWorldZone');
global.CatalogItemDungeon = require('./catalog/CatalogItemDungeon');
global.CatalogItemRaceTrack = require('./catalog/CatalogItemRaceTrack');

var express = require('express');

global.mongoose = require('mongoose');

Database = require('./db/Database');
global.db = new Database();

var cors = require('cors');

global.Racecar = require('./racecar/Racecar');

_create = require('xmlbuilder2');
global.create = _create.create;

global.ArrayCollection = require('libamf/src/amf/flash/flex/ArrayCollection');

libamf.Service.RequireRegistration = false;
libamf.Server.DisableDefaultHome = true;

libamf.registerClassAlias('com.disney.cars.domain.catalog.Item', CatalogItem);
libamf.registerClassAlias('com.disney.cars.domain.catalog.racing.RaceSeries', CatalogItemRaceSeries);
libamf.registerClassAlias('com.disney.cars.domain.catalog.world.WorldZone', CatalogItemWorldZone);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.Paint', CatalogItemPaint);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.Chassis', CatalogItemChassis);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.ChassisJointDynamic', CatalogChassisJointDynamic);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.ChassisJointStatic', CatalogChassisJointStatic);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.ChassisOffset', CatalogChassisOffset);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.ChassisSlot', CatalogChassisSlot);
libamf.registerClassAlias('com.disney.cars.domain.catalog.interactive.Npc', CatalogItemNPC);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.Decal', CatalogItemDecal);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.EyeColor', CatalogItemEyeColor);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.Wheel', CatalogItemWheel);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.Tire', CatalogItemTire);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.car.CarItem', CatalogCarItem);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.PlayerItem', CatalogPlayerItem);
libamf.registerClassAlias('com.disney.cars.domain.catalog.player.PlayerStoreItem', CatalogPlayerStoreItem);
libamf.registerClassAlias('com.disney.cars.domain.catalog.effects.Animation', CatalogItemAnimation);
libamf.registerClassAlias('com.disney.cars.domain.catalog.effects.SimpleAnimation', CatalogItemSimpleAnimation);
libamf.registerClassAlias('com.disney.cars.domain.catalog.racing.RaceTrack', CatalogItemRaceTrack);
libamf.registerClassAlias('com.disney.cars.domain.catalog.world.DungeonItem', CatalogItemDungeon);
libamf.registerClassAlias('com.disney.cars.domain.catalog.racing.RaceLevel', CatalogItemRaceLevel);

libamf.registerClassAlias('com.disney.cars.domain.racecar.Racecar', Racecar);

global.server = new libamf.Server({
    path: '/carsds/messagebroker/amf'
});

let CatalogService = require('./services/CatalogService');
let PlayerService = require('./services/PlayerService');
let RaceCarService = require('./services/RaceCarService');

let catalogService = new CatalogService();
let raceCarService = new RaceCarService();
let playerService = new PlayerService();

server.registerService(catalogService);
server.registerService(raceCarService);
server.registerService(playerService);

// for parsing application/x-www-form-urlencoded
server.app.use(express.urlencoded({extended: true}));

server.app.use(cors());

var xmlparser = require('express-xml-bodyparser');
server.app.use(xmlparser());

// Setup sessions and include our web routes.
var crypto = require('crypto');
var session = require('express-session');

const redis = require('redis');
const redisStore = require('connect-redis')(session);

const redisClient = redis.createClient({
    legacyMode: true
});

redisClient.connect();

sess = {
    secret: crypto.randomBytes(32).toString('base64'),
    store: new redisStore({client: redisClient}),
    resave: false,
    saveUninitialized: true,

    cookie: {
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie
        maxAge: 1000 * 60 * 10 // session max age in miliseconds
    }
}

server.app.use(session(sess));

require('./services/web');