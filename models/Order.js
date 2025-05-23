const mongoose = require('mongoose');

// Each note is an object containing the note text and a timestamp
const orderNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 9000 + 1000);
      return `ORD-${timestamp}-${random}`;
    },
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1'],
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
    },
  ],

  totalAmount: { type: Number, required: true },

  razorpayOrderId: {
    type: String,
    required: true,
    index: true,
  },
  razorpayPaymentId: { type: String },

  // Payment status (Razorpay callback)
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },

  // High-level status for the order
  orderStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },

  deliveryStatus: {
    type: String,
    enum: ['processing', 'shipped', 'out-for-delivery', 'delivered'],
    default: 'processing',
  },

  estimatedDelivery: { type: Date },

  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },

  // Timestamp when payment is verified or marked as failed
  paymentVerifiedAt: { type: Date },

  // ------------- NEW FIELD -------------
  // An array of notes, each with text and timestamp
  orderNotes: [orderNoteSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ------------------------------
// PRE-SAVE HOOK
// ------------------------------
orderSchema.pre('save', function (next) {
  // Generate a unique order ID if not already set
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }

  // Remove auto-delivery check – rely on the cron job to update deliveryStatus

  // Update `updatedAt` timestamp
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);