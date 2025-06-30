const express = require("express");
const {
  addToWishlist,
  getWishlistItems,
  removeFromWishlist,
  addWishlistProductToCart,
} = require("../../controllers/product/wishlist-controller");

const router = express.Router();

// POST /api/wishlist/add
router.post("/add", addToWishlist);

// GET /api/wishlist/:userId
router.get("/:userId", getWishlistItems);

// DELETE /api/wishlist/:userId/:productId
router.delete("/:userId/:productId", removeFromWishlist);

// POST /api/wishlist/move-to-cart
router.post("/move-to-cart", addWishlistProductToCart);

module.exports = router;
