// Creates ticket records. Each ticket needs a short unique id.
function createTicket(title) {
  return { id: null, title: title }
}

module.exports = { createTicket }
