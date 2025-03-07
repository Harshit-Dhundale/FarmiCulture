const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true, 
    default: function() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `ORD-${timestamp}-${random}`;
  } 
}, // Unique Order ID
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User

  products: [
    {
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true, 
        min: [1, 'Quantity cannot be less than 1'] 
      },
      price: { 
        type: Number, 
        required: true, 
        min: [0, 'Price cannot be negative'] 
      } // Store product price at purchase time
    }
  ],

  totalAmount: { type: Number, required: true }, // Total Order Amount

  razorpayOrderId: { 
    type: String, 
    required: true, 
    index: true // 🔹 Indexed for faster queries
  },
  razorpayPaymentId: { type: String }, // Payment ID after success

  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },

  deliveryStatus: {
    type: String,
    enum: ['processing', 'shipped', 'out-for-delivery', 'delivered'],
    default: 'processing'
  },

  estimatedDelivery: { type: Date }, // Estimated delivery date

  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },

  createdAt: { type: Date, default: Date.now }, // Auto-set creation date
  updatedAt: { type: Date, default: Date.now }  // 🔹 Added updatedAt field
});

// 🔹 **Middleware to Generate Unique Order ID Before Saving**
orderSchema.pre('save', function (next) {
  // 🔹 Generate Unique Order ID if not present
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }

  // 🔹 Auto-Mark Order as Delivered if Past Estimated Delivery Date
  if (this.isModified('estimatedDelivery') && this.estimatedDelivery) {
    const deliveryDate = new Date(this.estimatedDelivery);
    if (new Date() > deliveryDate && this.deliveryStatus !== 'delivered') {
      this.deliveryStatus = 'delivered';
    }
  }

  // 🔹 Update `updatedAt` on Save
  this.updatedAt = Date.now();

  next();
});


module.exports = mongoose.model('Order', orderSchema);
