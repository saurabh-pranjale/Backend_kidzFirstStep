const { client: paypalClient, orders } = require("../../utils/paypal");
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Order = require("../../models/order");
const Cart = require("../../models/cart");
const Product = require("../../models/products");
const paypal = require("../../utils/paypal");

const createOrder = async (req, res) => {
  try {
    const { cartItems, totalAmount } = req.body;

    const request = new orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: totalAmount.toFixed(2),
              },
            },
          },
          items: cartItems.map((item) => ({
            name: item.title,
            unit_amount: {
              currency_code: "USD",
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            sku: item.productId,
          })),
        },
      ],
      application_context: {
        return_url: "http://localhost:5173/shop/paypal-return",
        cancel_url: "http://localhost:5173/shop/paypal-cancel",
      },
    });

    const order = await paypalClient.execute(request);

    const approvalURL = order.result.links.find((link) => link.rel === "approve")?.href;

    res.json({
      success: true,
      orderId: order.result.id,
      approvalURL,
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ success: false, message: "Failed to create PayPal order" });
  }
};


const capturePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log("Order ID to capture:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required orderId",
      });
    }

    // ✅ Use orders from destructured import
    const request = new orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    // ✅ Use paypalClient, NOT paypal
    const captureResponse = await paypalClient.execute(request);

    const captureResult = captureResponse.result;

    if (captureResult.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${captureResult.status}`,
      });
    }

    const paymentId = captureResult.purchase_units[0].payments.captures[0].id;
    const payerId = captureResult.payer.payer_id;

    res.status(200).json({
      success: true,
      message: "Payment captured successfully",
      paymentId,
      orderId: captureResult.id,
      payerId,
    });

  } catch (error) {
    console.error("Error in capturePayment:", error);
    res.status(500).json({
      success: false,
      message: "Payment capture failed",
      error: error.message,
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error in getAllOrdersByUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { createOrder, capturePayment, getAllOrdersByUser, getOrderDetails };
