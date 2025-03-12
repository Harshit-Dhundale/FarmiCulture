// services/emailService.js
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path'); // Added to resolve the file path

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

const sendOrderConfirmationEmail = async (toEmail, orderDetails, user) => {
  try {
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
        accessToken,
      },
    });

    // Updated email template: using the embedded logo (CID) in the header.
    const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - FarmiCulture</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          /* Embedded CSS for email compatibility */
          body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f7fafc; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: #2f855a; padding: 2rem; text-align: center; }
          .logo { width: 120px; height: auto; }
          .content { padding: 2rem; color: #2d3748; }
          .order-card { background: #f7fafc; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
          .icon { color: #2f855a; margin-right: 8px; font-size: 18px; }
          .product-list { width: 100%; border-collapse: collapse; }
          .product-list td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .track-button { 
            background: #2f855a; color: white; 
            padding: 12px 24px; border-radius: 6px; 
            text-decoration: none; display: inline-block;
          }
          .footer { background: #edf2f7; padding: 1.5rem; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Use the attached logo via CID -->
            <img src="cid:logo@farmiculture" class="logo" alt="FarmiCulture Logo">
          </div>
          
          <div class="content">
            <h1 style="color: #2f855a;">Order Confirmation 🎉</h1>
            <p>Hi ${user.name}, thank you for your order!</p>
            
            <div class="order-card">
              <h2 style="margin-top: 0;">
                <i class="fas fa-receipt icon"></i>
                Order Summary
              </h2>
              
              <table class="product-list">
                ${orderDetails.products.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.quantity} x ₹${p.price}</td>
                    <td>₹${(p.quantity * p.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
              
              <div style="margin-top: 1.5rem;">
                <p>
                  <i class="fas fa-wallet icon"></i>
                  <strong>Total Amount:</strong> ₹${orderDetails.totalAmount}
                </p>
                <p>
                  <i class="fas fa-truck icon"></i>
                  <strong>Estimated Delivery:</strong> 
                  ${new Date(orderDetails.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
  
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${orderDetails.trackingLink}" class="track-button">
                <i class="fas fa-map-marker-alt"></i>
                Track Your Order
              </a>
            </div>
  
            <div style="margin-top: 2rem;">
              <h3><i class="fas fa-info-circle icon"></i> Next Steps</h3>
              <ul style="list-style: none; padding-left: 0;">
                <li><i class="fas fa-check-circle" style="color: #2f855a;"></i> Your payment has been received</li>
                <li><i class="fas fa-box" style="color: #2f855a;"></i> We're preparing your order for shipment</li>
                <li><i class="fas fa-phone" style="color: #2f855a;"></i> Contact support: support@farmiculture.com</li>
              </ul>
            </div>
          </div>
  
          <div class="footer">
            <p>Follow us on:</p>
            <div style="margin: 1rem 0;">
              <a href="[Facebook URL]" style="color: #2d3748; margin: 0 8px;">
                <i class="fab fa-facebook fa-lg"></i>
              </a>
              <a href="[Twitter URL]" style="color: #2d3748; margin: 0 8px;">
                <i class="fab fa-twitter fa-lg"></i>
              </a>
              <a href="[Instagram URL]" style="color: #2d3748; margin: 0 8px;">
                <i class="fab fa-instagram fa-lg"></i>
              </a>
            </div>
            <p style="font-size: 0.9rem; color: #718096;">
              © ${new Date().getFullYear()} FarmiCulture. All rights reserved.<br>
              [Company Address] | <a href="[Privacy Policy URL]">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
      `;

    const mailOptions = {
      from: `FarmiCulture 🌱 <${EMAIL_USER}>`,
      to: toEmail,
      subject: `🎉 Your FarmiCulture Order #${orderDetails.orderId} is Confirmed!`,
      html: emailTemplate,
      attachments: [{
        // Attach the local logo image
        filename: 'logo1.jpg',
        path: path.join(__dirname, '../client/public/assets/logo1.jpg'),
        cid: 'logo@farmiculture' // same CID as in the email template
      }]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

module.exports = { sendOrderConfirmationEmail };