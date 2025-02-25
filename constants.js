const CatalogItemPaint = global.CatalogItemPaint;
const CatalogItemChassis = global.CatalogItemChassis;
const CatalogItemNPC = global.CatalogItemNPC;
const CatalogItemWorldZone = global.CatalogItemWorldZone;
const CatalogItemDecal = global.CatalogItemDecal;
const CatalogItemEyeColor = global.CatalogItemEyeColor;
const CatalogItemWheel = global.CatalogItemWheel;
const CatalogItemTire = global.CatalogItemTire;
const CatalogItemSimpleAnimation = global.CatalogItemSimpleAnimation;
const CatalogItemDungeon = global.CatalogItemDungeon;

var clientData = {};

clientData[5500] = {
    'name': 'Stock',
    'classObj': new CatalogItemChassis("stock")
};

clientData[5501] = {
    'name': 'Sports',
    'classObj': new CatalogItemChassis("sports")
};

clientData[5502] = {
    'name': 'Mini',
    'classObj': new CatalogItemChassis("mini")
};

clientData[5503] = {
    'name': 'Stock',
    'classObj': new CatalogItemChassis("stock")
};

clientData[20210] = {
    'name': 'Red Lightening',
    'classObj': new CatalogItemPaint(15804939)
};

clientData[15001] = {
    'name': 'Downtown',
    'classObj': new CatalogItemWorldZone()
};

clientData[10101] = {
    'name': 'Eye Color',
    'classObj': new CatalogItemEyeColor(0)
};

clientData[10102] = {
    'name': 'Blue',
    'classObj': new CatalogItemEyeColor(7249143)
};

clientData[10103] = {
    'name': 'Green',
    'classObj': new CatalogItemEyeColor(7322195)
};

clientData[10104] = {
    'name': 'Brown',
    'classObj': new CatalogItemEyeColor(12414237)
};

clientData[30601] = {
    'name': 'Wheel',
    'classObj': new CatalogItemWheel('car_t_cst_rim_01.jpg')
};

clientData[30502] = {
    'name': 'Tire',
    'classObj': new CatalogItemTire('car_t_cst_tir_wall_black.jpg')
};

clientData[51103] = {
    'name': 'Car Decal',
    'classObj': new CatalogItemDecal()
};

clientData[51104] = {
    'name': 'Car Decal',
    'classObj': new CatalogItemDecal()
};

clientData[20206] = {
    'name': 'Gray Vee',
    'classObj': new CatalogItemPaint(10526621)
};

clientData[20207] = {
    'name': 'Octagonal Orange',
    'classObj': new CatalogItemPaint(15033856)
};

clientData[15002] = {
    'name': 'FillmoresFields',
    'classObj': new CatalogItemWorldZone()
};

clientData[15003] = {
    'name': 'RedhoodValley',
    'classObj': new CatalogItemWorldZone()
};

clientData[31010] = {
    'name': '?',
    'classObj': new CatalogItemNPC()
};

clientData[15006] = {
    'name': 'WillysButte',
    'classObj': new CatalogItemWorldZone()
};

clientData[20209] = {
    'name': 'Powerhouse Purple',
    'classObj': new CatalogItemPaint(10571765)
};

clientData[20201] = {
    'name': 'DJ Blue',
    'classObj': new CatalogItemPaint(167913)
};

clientData[20205] = {
    'name': 'Chick Hicks Green',
    'classObj': new CatalogItemPaint(7322195)
};

clientData[33275] = {
    'name': '?',
    'classObj': new CatalogItemSimpleAnimation()
};

clientData[33274] = {
    'name': '?',
    'classObj': new CatalogItemSimpleAnimation()
}

clientData[60025] = {
    'name': '?',
    'classObj': new CatalogItemSimpleAnimation()
}

clientData[1000] = {
    'name': '?',
    'classObj': new CatalogItemDungeon(1000)
}

module.exports = {clientData};