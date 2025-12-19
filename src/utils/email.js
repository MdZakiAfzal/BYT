const sendEmail = async (options) => {
  // 1. In Production, use a service like SendGrid/Nodemailer
  // 2. For Dev, we just log it.
  
  console.log('================ EMAIL SENT ================');
  console.log(`EO: ${options.email}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log(`Tb: ${options.message}`);
  console.log('============================================');
};

module.exports = sendEmail;