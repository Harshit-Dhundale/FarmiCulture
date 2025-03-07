const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { validateUserRegistration, validateUserLogin } = require('../validators/userValidator');
const handleValidationErrors = require('../middleware/errorHandler');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer'); // ✅ Import Multer
const nodemailer = require('nodemailer');
const otpStore = {}; 
const crypto = require('crypto');
const { google } = require('googleapis');
const redisClient = require('../config/redisClient');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });


// ✅ Multer Storage Configuration for Profile Picture Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ✅ Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 🔹 User Registration with Validation
router.post('/register', 
  validateUserRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }

      const user = new User(req.body);
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, please try again later' });
    }
});

// 🔹 Validate Token Route
router.get('/validate-token', authMiddleware, (req, res) => {
  res.status(200).json({ valid: true, user: req.user });
});

// 🔹 Get User Details
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 🔹 User Login with Validation
router.post('/login', 
  validateUserLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const user = await User.findOne({ 
        $or: [{ email: identifier }, { username: identifier }]
      });
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, please try again later' });
    }
});


router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store the OTP in Redis with a 5-minute expiration (300 seconds)
    await redisClient.setEx(email, 300, otp.toString());

    // Get the access token using OAuth2
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // Create a Nodemailer transporter using OAuth2
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // Prepare email options with the OTP
    const mailOptions = {
      from: `FarmiCulture <${EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for FarmiCulture Registration',
      html: `<p>Your OTP is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

// ✅ Verify OTP and Register User
router.post('/verify-otp', async (req, res) => {
  const { email, otp, userData } = req.body; // userData contains other registration details

  try {
    // Retrieve the stored OTP from Redis
    const storedOtp = await redisClient.get(email);

    // If no OTP exists or it doesn't match, return an error
    if (!storedOtp || parseInt(storedOtp) !== parseInt(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Remove the OTP from Redis after successful verification
    await redisClient.del(email);

    // Create user in database
    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Resend OTP Endpoint
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    // Generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store the new OTP with a 5-minute expiration.
    // For production, consider storing this in Redis.
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // Get a fresh access token using OAuth2
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // Create a Nodemailer transporter using OAuth2
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // Prepare the email options with the new OTP
    const mailOptions = {
      from: `FarmiCulture <${EMAIL_USER}>`,
      to: email,
      subject: 'Your new OTP for FarmiCulture Registration',
      html: `<p>Your new OTP is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

// Forgot password endpoint: Send OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate OTP and store it in Redis for 5 minutes
    const otp = Math.floor(100000 + Math.random() * 900000);
    await redisClient.setEx(`forgot:${email}`, 300, otp.toString());

    // Get access token for OAuth2
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `FarmiCulture <${EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Password Reset',
      html: `<p>Your OTP for resetting your password is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

router.post('/verify-forgot-password-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const storedOtp = await redisClient.get(`forgot:${email}`);
    if (!storedOtp || parseInt(storedOtp) !== parseInt(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Optionally, set a flag in Redis to indicate that OTP verification succeeded:
    await redisClient.setEx(`forgot-verified:${email}`, 300, 'true'); // valid for next 5 minutes for password reset
    // Remove the OTP once verified
    await redisClient.del(`forgot:${email}`);
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    // Check that the OTP was verified
    const verified = await redisClient.get(`forgot-verified:${email}`);
    if (!verified) {
      return res.status(400).json({ message: 'OTP not verified or expired' });
    }
    // Find the user and update the password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // This will trigger pre-save hook for hashing
    await user.save();

    // Optionally remove the verified flag
    await redisClient.del(`forgot-verified:${email}`);

    // Generate a new JWT if desired
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Password reset successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});


// 🔹 Update User Profile (Now Supports Profile Picture Upload)
router.put('/:userId', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // ✅ If profile picture is uploaded, update the path
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
