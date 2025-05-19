const { default: mongoose } = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  category: {
    type: [String],
    enum: ["soft toys", "musical toys", "best seller", "new arrival", "learning toys"],
    required: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  image: {
    type: [String],
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
  },
  stock: {
    type: Number,
    default: 0, // You can set initial stock here
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtual for discounted price
productSchema.virtual('discountedPrice').get(function () {
  return this.price - (this.price * this.discount / 100);
});

const Products = mongoose.model('Products', productSchema);

module.exports = Products;
