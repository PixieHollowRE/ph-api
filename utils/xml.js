/* global create: writeable */

create = global.create

function createXML (data) {
  const xml = create()
    .ele(data)
    .end({ prettyPrint: true })
  return xml
}

module.exports = createXML
