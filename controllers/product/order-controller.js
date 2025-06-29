const { client: paypalClient, orders } = require("../../utils/paypal");
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const Order = require("../../models/order");
const Cart = require("../../models/cart");
const Product = require("../../models/products");
const paypal = require("../../utils/paypal");

const createOrder = async (req, res) => {
  try {
    const { userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId,
      payerId,
      cartId, } = req.body;

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

    const paypalOrderId = order.result.id;

    const newlyCreatedOrder = new Order({
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId:paypalOrderId,
      payerId,
      cartId,
    });
    await newlyCreatedOrder.save();

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

    // STEP 1: Try capturing payment from PayPal
    const request = new orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    let captureResponse;
    try {
      captureResponse = await paypalClient.execute(request);
    } catch (err) {
      // Handle ORDER_ALREADY_CAPTURED error cleanly
      if (err.statusCode === 422 && err.message.includes("ORDER_ALREADY_CAPTURED")) {
        console.warn("Order already captured on PayPal side");

        // Attempt to update the local DB anyway
        const order = await Order.findOne({ paymentId: orderId });
        if (order) {
          order.paymentStatus = "paid";
          order.orderStatus = "confirmed";
          await order.save();
        }

        return res.status(200).json({
          success: true,
          message: "Order was already captured",
        });
      }

      // Handle other network or API errors
      console.error("Network error during PayPal capture:", err);
      return res.status(503).json({
        success: false,
        message: "Network error during payment capture. Please try again.",
        error: err.message,
      });
    }

    const captureResult = captureResponse.result;

    if (captureResult.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${captureResult.status}`,
      });
    }

    // STEP 2: Update order in DB
    const order = await Order.findOne({ paymentId: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found with given PayPal Order ID",
      });
    }

    // Check if order is already updated
    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order already marked as paid",
      });
    }

    const captureId = captureResult.purchase_units[0].payments.captures[0].id;
    const payerId = captureResult.payer.payer_id;

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.payerId = payerId;
    // Keep `orderId` as the paymentId (not overwriting)
    // Optionally, you can store `captureId` separately

    // STEP 3: Update stock
    for (let item of order.cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for ID: ${item.productId}`,
        });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.title}. Available: ${product.totalStock}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    await order.save();

    // STEP 4: Clean up cart
    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    res.status(200).json({
      success: true,
      message: "Payment captured and order confirmed",
      captureId,
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
