const nodemailer = require('nodemailer');
const { logger } = require('./logger')

module.exports.sendMail = (email, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD// đây là mật khẩu ứng dụng gmail 
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: html
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      logger.error('Gửi email thất bại', { error: error.message, to: email, subject });
    } else {
      logger.info('Email sent', { to: email, subject, response: info.response });
    }
  });
}