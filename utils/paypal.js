const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// Read client ID and secret from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

// Create PayPal HTTP client instance
const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

module.exports = {
  client: paypalClient,
  orders: checkoutNodeJssdk.orders
};
