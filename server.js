// Load environment variables and required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { URL } = require('url');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Configure proxy trust for production
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 2 : 1);

// Setup Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Get allowed client origin from environment variable (defaults to localhost)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware: CORS, JSON parsing, NoSQL injection sanitization, and Rate Limiting
app.use(cors({
  origin: CLIENT_URL,
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(express.json());
app.use(mongoSanitize());
app.use(limiter);

// Connect to MongoDB
connectDB();

// Determine API route prefix from environment variable
// If REACT_APP_BACKEND is provided as a full URL, extract its pathname (e.g., "/api")
let baseApiPath = '/api';
try {
  const urlObj = new URL(process.env.REACT_APP_BACKEND);
  baseApiPath = urlObj.pathname;
} catch (error) {
  baseApiPath = process.env.REACT_APP_BACKEND || '/api';
}

// Import Routes
const userRoutes = require('./routes/user');
const cropRoutes = require('./routes/crops');
const fertilizerRoutes = require('./routes/fertilizer');
const diseaseRoutes = require('./routes/disease');
const farmsRoutes = require('./routes/farms');
const postsRouter = require('./routes/posts'); 
const postsRoutes = require('./routes/posts');
const contactRoutes = require('./routes/contact');
const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');
const uploadRoutes = require('./routes/upload');

// Mount Routes using the derived baseApiPath
app.use(`${baseApiPath}/users`, userRoutes);
app.use(`${baseApiPath}/crops`, cropRoutes);
app.use(`${baseApiPath}/fertilizers`, fertilizerRoutes);
app.use(`${baseApiPath}/diseases`, diseaseRoutes);
app.use(`${baseApiPath}/posts`, postsRouter);
app.use(`${baseApiPath}/posts`, postsRoutes);
app.use(`${baseApiPath}/farms`, farmsRoutes);
app.use(`${baseApiPath}/contact`, contactRoutes);
app.use(`${baseApiPath}/products`, productsRoute);
app.use(`${baseApiPath}/orders`, ordersRoute);
app.use(`${baseApiPath}/upload`, uploadRoutes);

// Serve static files from the "uploads" folder
app.use('/uploads', express.static('uploads'));

// API Endpoints for Interacting with Python Services
app.post(`${baseApiPath}/predict_crop`, async (req, res) => {
  try {
    const response = await axios.post(`${process.env.PYTHON_SERVICE}/predict_crop`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post(`${baseApiPath}/predict_fertilizer`, async (req, res) => {
  try {
    const response = await axios.post(`${process.env.PYTHON_SERVICE}/predict_fertilizer`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// File Upload Configuration for Disease Prediction
const upload = multer({ dest: 'uploads/' });
app.post(`${baseApiPath}/predict_disease`, upload.single('file'), async (req, res) => {
  const file = req.file;
  const crop = req.body.crop; // Assuming 'crop' is sent as part of the form data

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), file.originalname);
    formData.append('crop', crop);

    const response = await axios.post(`${process.env.PYTHON_SERVICE}/predict_disease`, formData, {
      headers: { ...formData.getHeaders() },
    });
    fs.unlinkSync(file.path); // Clean up file after sending it
    res.json(response.data);
  } catch (error) {
    console.error('Error calling predict_disease:', error.message);
    res.status(500).send(error.message);
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});