const CatalogCarItem = require('./CatalogCarItem');

class CatalogItemPaint extends CatalogCarItem {
    constructor(color) {
        super();

        this.color = color;
    }
}

module.exports = CatalogItemPaint