const Wishlist = require("../../models/wishlist");
const Product = require("../../models/products");
const { addToCart } = require("../../controllers/product/cart-controller"); // Reusing existing logic

// ✅ Add to Wishlist
const addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // Check if already in wishlist
    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
      return res.status(409).json({ success: false, message: "Already in wishlist" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const newWishlistItem = await Wishlist.create({ userId, productId });
    res.status(201).json({ success: true, message: "Added to wishlist", data: newWishlistItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Wishlist Items (with product details)
const getWishlistItems = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const items = await Wishlist.find({ userId }).populate({
      path: "productId",
      select: "title image price salePrice",
    });

    const filteredItems = items.filter(item => item.productId !== null);

    const formatted = filteredItems.map(item => ({
      wishlistId: item._id,
      productId: item.productId._id,
      title: item.productId.title,
      image: item.productId.image,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Remove from Wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    await Wishlist.findOneAndDelete({ userId, productId });

    res.status(200).json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Add Wishlist Product to Cart
const addWishlistProductToCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // Remove from wishlist
    await Wishlist.findOneAndDelete({ userId, productId });

    // Set quantity to 1
    req.body.quantity = 1;

    // Reuse addToCart logic
    return await addToCart(req, res); //req.body ensures all 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addToWishlist,
  getWishlistItems,
  removeFromWishlist,
  addWishlistProductToCart,
};
