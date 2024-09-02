const memberApiController = require('./member');
const paymentApiController = require('./payment');
const payoutApiController = require('./payout');
const promotionApiController = require('./promotion');
const additionalApiController = require('./additional');

module.exports = {
  memberApiController,
  paymentApiController,
  promotionApiController,
  additionalApiController
};
