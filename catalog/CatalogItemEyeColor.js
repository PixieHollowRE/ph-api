const CatalogCarItem = require('./CatalogCarItem');

class CatalogItemEyeColor extends CatalogCarItem {
    constructor(color) {
        super();

        this.color = color;
    }
}

module.exports = CatalogItemEyeColor