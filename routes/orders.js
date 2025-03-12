const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order.js');
const Product = require('../models/Product.js');
const crypto = require('crypto');
const razorpay = require('../config/razorpay.js');
const dotenv = require('dotenv');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// Import your middlewares (make sure these exist in your project)
const authMiddleware = require('../middleware/authMiddleware.js');

dotenv.config();

const router = express.Router();

/**
 * ================================================
 * CREATE ORDER (No immediate stock decrement here)
 * ================================================
 */
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
    body('shippingAddress.postalCode')
      .isPostalCode('IN')
      .withMessage('Invalid Indian postal code'),
  ],
  async (req, res) => {
    // Validate request body
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

      // Validate that products exist and have enough stock (no decrement yet)
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            error: `Product ${item.product} not found`,
          });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Only ${product.stock} units available for ${product.name}`,
          });
        }
      }

      // Create a Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `order_${Date.now()}`,
      });

      // Save the order in the database (still no stock decrement here)
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
        estimatedDelivery: new Date(Date.now() + 5 * 86400000), // ~5 days
      });

      await order.save();

      // Populate user & products for response
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'username email')
        .populate('products.product', 'name price imageUrl');

      return res.json({
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
      return res.status(500).json({
        error: 'Order creation failed',
        details: error.error?.description || error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
);

/**
 * ===============================================
 * VERIFY RAZORPAY PAYMENT & DECREMENT STOCK HERE
 * ===============================================
 */
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Validate Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, error: 'Payment verification failed' });
    }

    // Mark order as paid and update payment ID
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    ).populate('user');

    // Reduce stock only AFTER successful payment
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    return res.json({
      success: true,
      order,
      deliveryDate: order.estimatedDelivery,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Payment verification error' });
  }
});

/**
 * =============================
 * GET ORDERS FOR A SPECIFIC USER
 * =============================
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort('-createdAt')
      .populate('products.product');

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * =========================
 * GET ALL ORDERS (ADMIN)
 * =========================
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'username email')
      .sort('-createdAt');

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching orders' });
  }
});

/**
 * =========================
 * GET SINGLE ORDER BY ID
 * =========================
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('products.product', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Error fetching order' });
  }
});

/**
 * ==================================
 * UPDATE ORDER DELIVERY STATUS (ADMIN)
 * ==================================
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: req.body.status },
      { new: true }
    );
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Status update failed' });
  }
});

/**
 * =========================
 * PAYMENT RETRY ENDPOINT
 * =========================
 */
router.post('/:id/retry', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create a new Razorpay order for retry
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: `retry_${order.orderId}`,
    });

    // Update the existing order with new Razorpay Order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.json({ success: true, razorpayOrder });
  } catch (error) {
    console.error('Payment retry failed:', error);
    return res
      .status(500)
      .json({ error: 'Payment retry failed', details: error.message });
  }
});

/**
 * ================================================
 * ADMIN ORDER FILTERS (BY STATUS & DATE RANGE)
 * ================================================
 */
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

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt');

    return res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders', details: error.message });
  }
});

/**
 * ======================
 * DELETE ORDER (ADMIN)
 * ======================
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to delete order', details: error.message });
  }
});
// POST /api/orders/:orderId/notes
router.post('/:orderId/notes', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { noteText } = req.body; // { noteText: "Some comment" }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add a note
    order.orderNotes.push({ text: noteText });
    await order.save();

    return res.json(order);
  } catch (err) {
    console.error("Error adding note:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New endpoint for sending confirmation email
router.post('/send-confirmation', async (req, res) => {
  try {
    const { email, orderDetails } = req.body;
    await sendOrderConfirmationEmail(email, orderDetails);
    res.status(200).json({ message: 'Confirmation email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending confirmation email' });
  }
});

module.exports = router;