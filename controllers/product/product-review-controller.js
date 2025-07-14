const Order=require('../../models/order')
const User=require('../../models/user')
const Product=require('../../models/products')
const ProductReview=require('../../models/review')

const addProductReview = async (req, res) => {
    try {
      const { productId, userId, userName, reviewMessage, reviewValue } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const order = await Order.findOne({
        userId,
        "cartItems.productId": productId,
        orderStatus: "confirmed",
      });
  
      if (!order) {
        return res.status(404).json({ message: "You need to purchase" });
      }

  
      const checkExistingReview = await ProductReview.findOne({ productId });
  
      if (checkExistingReview) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }
  
      const newReview = new ProductReview({ productId, userId, userName, reviewMessage, reviewValue });
      await newReview.save();
  
      const reviews = await ProductReview.find({ productId });
 
      const totalReviewValue = reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0);
      const totalReviewLength = reviews.length;
      
      const averageReview = totalReviewValue / totalReviewLength;
  

      await Product.findByIdAndUpdate(productId, { averageReview });
  
      return res.status(201).json({success:true, message: "Review added successfully" });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  };
  
  const getProductReviews = async (req, res) => {
    try {
      const { productId } = req.params;
  
      const reviews = await ProductReview.find({ productId });
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        message: "Error",
      });
    }
  };
  
module.exports={getProductReviews,addProductReview}