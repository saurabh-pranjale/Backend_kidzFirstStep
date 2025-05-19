
const Product = require('../../models/products');
const cloudinary = require('../../utils/cloudinary');


// Create a new product
const createProduct = async (req, res) => {
  try {
    const { title, brand, price, description, category, quantity, discount = 0, ratings = 0 } = req.body;

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Normalize to array
    const imageFiles = Array.isArray(req.files.image) ? req.files.image : [req.files.image];

    // Upload all images to Cloudinary
    const imageUploadPromises = imageFiles.map(file =>
      cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'products',
        resource_type: 'image'
      })
    );

    const uploadResults = await Promise.all(imageUploadPromises);
    const imageUrls = uploadResults.map(result => result.secure_url);

    const product = new Product({
      title,
      brand,
      price,
      description,
      category: Array.isArray(category) ? category : [category],
      image: imageUrls, // Save all uploaded image URLs
      quantity,
      discount,
      ratings
    });

    const savedProduct = await product.save();
    res.status(201).json({ message: 'Product Added', savedProduct });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a product (PATCH)
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
