const nodemailer = require('nodemailer');
const logger = require('../utilities/logger.js');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

const sendOtpEmail = async (emailAddress, otp) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"VWatch" <noreply@vwatch.com>';

  if (!transporter) {
    logger.warn(`"emailService.js","sendOtpEmail()","SMTP credentials not fully configured. Email not sent. Logging OTP for developer use: [${otp}] for Email: [${emailAddress}]"`);
    return { success: true, loggedToConsole: true };
  }

  const mailOptions = {
    from,
    to: emailAddress,
    subject: `VWatch Email Verification Code: ${otp}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VWatch Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d12; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600px" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #16161f; border-radius: 16px; border: 1px solid #27273a; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #27273a;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-shadow: 0 0 10px rgba(255, 0, 85, 0.5);">
                <span style="color: #ff0055;">V</span>Watch
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;">Verify Your Account</h2>
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                Welcome to VWatch! Thank you for signing up. Please verify your email address to get started. Use the 6-digit verification code below:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(255, 0, 85, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%); border: 1px solid rgba(255, 0, 85, 0.3); border-radius: 12px; padding: 18px 40px; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #ff0055; text-shadow: 0 0 8px rgba(255, 0, 85, 0.3);">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #71717a; text-align: center;">
                This OTP is valid for <strong>10 minutes</strong>. For security reasons, do not share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0e0e15; border-top: 1px solid #27273a; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #52525b; line-height: 1.5;">
                If you did not request this verification, you can safely ignore this email. Someone may have typed your email address by mistake.
              </p>
              <p style="margin: 0; font-size: 12px; color: #3f3f46; font-weight: 600; letter-spacing: 0.5px;">
                © 2026 VWatch. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`"emailService.js","sendOtpEmail()","OTP email successfully sent to ${emailAddress}"`);
    return { success: true };
  } catch (error) {
    logger.error(`"emailService.js","sendOtpEmail()","Failed to send email to ${emailAddress}: ${error.message}"`);
    throw new Error('Could not send verification email. Please try again later.');
  }
};

module.exports = {
  sendOtpEmail
};
