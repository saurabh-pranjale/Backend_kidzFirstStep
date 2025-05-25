const Product = require('../../models/products');
const cloudinary = require('../../utils/cloudinary');

// Create a new product (with multiple image uploads)
const createProduct = async (req, res) => {
  try {
    const {
      title,
      brand,
      price,
      salePrice = 0,
      description,
      category,
      totalStock,
      averageReview = 0
    } = req.body;

    // Ensure at least one image is uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Handle both single and multiple image uploads
    const imageFiles = Array.isArray(req.files.image)
      ? req.files.image
      : [req.files.image];

    // Upload images to Cloudinary
    const imageUploadPromises = imageFiles.map(file =>
      cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'products',
        resource_type: 'image'
      })
    );

    const uploadResults = await Promise.all(imageUploadPromises);
    const imageUrls = uploadResults.map(result => result.secure_url);

    // Create product
    const product = new Product({
      title,
      brand,
      price,
      salePrice,
      description,
      category,
      image: imageUrls, // Store all images in the array
      totalStock,
      averageReview
    });

    const savedProduct = await product.save();
    res.status(201).json({ message: 'Product added', product: savedProduct });
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

// Update a product (no image upload here)
const updateProduct = async (req, res) => {
  try {
    const {
      title,
      brand,
      price,
      salePrice,
      description,
      category,
      totalStock,
      averageReview
    } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(brand && { brand }),
      ...(price && { price }),
      ...(salePrice && { salePrice }),
      ...(description && { description }),
      ...(category && { category }),
      ...(totalStock && { totalStock }),
      ...(averageReview && { averageReview }),
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
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
