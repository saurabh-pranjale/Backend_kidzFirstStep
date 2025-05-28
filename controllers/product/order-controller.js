const paypal = require("../../utils/paypal");
const Order = require("../../models/order");
const Cart = require("../../models/cart");
const Product = require("../../models/products");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
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
      cartId,
    } = req.body;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:5173/shop/paypal-return",
        cancel_url: "http://localhost:5173/shop/paypal-cancel",
      },
      transactions: [
        {
          item_list: {
            items: cartItems.map((item) => ({
              name: item.title,
              sku: item.productId,
              price: item.price.toFixed(2),
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: totalAmount.toFixed(2),
          },
          description: "Order description",
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.error("PayPal Payment Creation Error:", error.response);
        return res.status(500).json({
          success: false,
          message: "Failed to create PayPal payment",
        });
      }

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
        paymentId,
        payerId,
        cartId,
      });
      await newlyCreatedOrder.save();

      const approvalURL = paymentInfo.links.find((link) => link.rel === "approval_url").href;
      res.json({ success: true, approvalURL, orderId: newlyCreatedOrder._id });
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } 
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, orderId, payerId } = req.body;
    console.log(payerId,orderId,payerId)

    if (!paymentId || !orderId || !payerId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const captureDetails = { payer_id: payerId };
    paypal.payment.execute(paymentId, captureDetails, async (error, payment) => {
      if (error) {
        console.error("PayPal Payment Capture Error:", error);
        return res.status(500).json({
          success: false,
          message: "Payment capture failed",
        });
      }

      if (payment.state !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Payment not approved",
        });
      }
        
      console.log(orderId,"id")
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
      order.paymentId = paymentId;
      order.payerId = payerId;

      

      for (let item of order.cartItems) {
        console.log(item.productId,"product")
        let product = await Product.findById(item.productId);

        

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

      const cartId = order.cartId;
      if (cartId) {
        await Cart.findByIdAndDelete(cartId);
      }

      res.status(200).json({
        success: true,
        message: "Payment captured successfully",
      });
    });
  } catch (error) {
    console.error("Error in capturePayment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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
