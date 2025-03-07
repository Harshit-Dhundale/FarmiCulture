const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order.js');
const Product = require('../models/Product.js');
const crypto = require('crypto');
const razorpay = require('../config/razorpay.js');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// ✅ Order Creation with Validation
router.post(
  '/create',
  [
    body('user').isMongoId().withMessage('Invalid user ID'),
    body('products').isArray({ min: 1 }).withMessage('Cart cannot be empty'),
    body('products.*.product').isMongoId().withMessage('Invalid product ID'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Invalid quantity'),
    body('totalAmount').isFloat({ min: 1 }).withMessage('Invalid total amount'),
    body('shippingAddress.street').notEmpty().withMessage('Street address required'),
    body('shippingAddress.city').notEmpty().withMessage('City required'),
    body('shippingAddress.state').notEmpty().withMessage('State required'),
    body('shippingAddress.postalCode').isPostalCode('IN').withMessage('Invalid Indian postal code'),
  ],
  async (req, res) => {
    // ✅ Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array(),
      });
    }

    try {
      console.log('Received order creation request:', req.body);
      const { user, products, totalAmount, shippingAddress } = req.body;

      // ✅ Validate products exist and have sufficient stock
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.product} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Only ${product.stock} units available for ${product.name}`,
          });
        }
      }

      // ✅ Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `order_${Date.now()}`,
      });

      // ✅ Save the order in the database
      const order = new Order({
        user,
        products: products.map((p) => ({
          product: p.product,
          quantity: p.quantity,
          price: parseFloat(p.price),
        })),
        totalAmount: parseFloat(totalAmount),
        razorpayOrderId: razorpayOrder.id,
        shippingAddress,
        estimatedDelivery: new Date(Date.now() + 5 * 86400000), // 5 days
      });

      await order.save();

      // ✅ Populate user & products before sending response
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'username email')
        .populate('products.product', 'name price imageUrl');

      res.json({
        success: true,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        order: {
          _id: populatedOrder._id,
          orderId: populatedOrder.orderId,
          totalAmount: populatedOrder.totalAmount,
          products: populatedOrder.products,
        },
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({
        error: 'Order creation failed',
        details: error.error?.description || error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
);

// ✅ Verify Razorpay Payment
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // 🔹 Validate Razorpay Signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    // 🔹 Update order status & reduce product stock
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    ).populate('user');

    // 🔹 Reduce stock for each product in the order
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.json({
      success: true,
      order,
      deliveryDate: order.estimatedDelivery,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Payment verification error' });
  }
});

// ✅ Get orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort('-createdAt')
      .populate('products.product');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ✅ Get all orders (Admin View)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'username email')
      .sort('-createdAt');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});


// routes/orders.js
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('products.product', 'name price imageUrl');  // Include imageUrl here
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error fetching order' });
  }
});

// ✅ Update Order Delivery Status (Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Status update failed' });
  }
});

// ✅ Payment Retry Endpoint
router.post('/:id/retry', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 🔹 Create a new Razorpay order for retrying payment
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: `retry_${order.orderId}`,
    });

    // 🔹 Update order with new Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({ success: true, razorpayOrder });
  } catch (error) {
    res.status(500).json({ error: 'Payment retry failed', details: error.message });
  }
});

// ✅ Admin Order Filters (By Status & Date Range)
router.get('/admin', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 🔹 Fetch filtered orders & include user details
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

module.exports = router;
