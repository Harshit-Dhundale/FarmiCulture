// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// (Optional) Create a product (for admin use)
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { name, price, category, subCategory, stock, quantityUnit, quantityValue, imageUrl } = req.body;

    if (!name || !price || !category || !subCategory || !stock || !quantityUnit || !quantityValue) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const product = new Product({
      name,
      description: req.body.description || '',
      price,
      imageUrl: imageUrl || '/images/products/default.jpg', // Use default if no image is provided
      category,
      subCategory,
      stock,
      quantityUnit,
      quantityValue,
    });

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// DELETE product by ID
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// UPDATE product by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});


module.exports = router;