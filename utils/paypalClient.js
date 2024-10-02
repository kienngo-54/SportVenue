require('dotenv').config();
const paypal = require('@paypal/checkout-server-sdk');

function environment() {
  const clientId = process.env.CLIENT_ID ;
  const clientSecret = process.env.CLIENT_SECRET;

  return new paypal.core.SandboxEnvironment(clientId, clientSecret); // Sử dụng cho môi trường sandbox
  // return new paypal.core.LiveEnvironment(clientId, clientSecret); // Sử dụng cho môi trường live
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
