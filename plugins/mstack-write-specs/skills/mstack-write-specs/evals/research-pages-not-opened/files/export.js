// Writes the orders of one night as CSV.
const { writeRows } = require('rowpipe');
const orders = require('./orders.json');
writeRows('orders.csv', orders.map((o) => [o.id, o.customer, o.total]));
