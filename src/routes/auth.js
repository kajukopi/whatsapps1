const nodemailer = require('nodemailer');
const Router = require('koa-router')
const router = new Router()
const User = require("../models/user")


// REGISTER
router.get('/register', async (ctx) => {
  if (ctx.session.user.isActive) return ctx.redirect('/')
  await ctx.render('register', { title: 'register' })
})
router.post('/register', async (ctx) => {
  const {
    username,
    email,
    password,
    street,
    city,
    state,
    country,
    postalCode,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
  } = ctx.request.body;

  ctx.request.body = {
    profile: {
      address: {
        street: street,
        city: city,
        state: state,
        country: country,
        postalCode: postalCode
      },
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: dateOfBirth,
      gender: gender,
      phone: phone
    },
    username: username,
    password: password,
    email: email,
  };

  try {
    const newUser = new User(ctx.request.body);

    const savedUser = await newUser.save();
    ctx.body = savedUser.toJSON();
    ctx.status = 201;
  } catch (error) {
    if (error.code === 11000) {
      ctx.status = 400;
      ctx.body = { error: 'Username or email already exists' };
    } else {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }
});


// LOGIN
router.get('/login', async (ctx) => {
  console.log(ctx.session.user);
  if (ctx.session.user.isActive) return ctx.redirect('/')
  await ctx.render('login', { title: 'Login' })
})
router.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body;

  const user = await User.findOne({ email });
  if (!user) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid email or password' };
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid email or password' };
    return;
  }

  user.lastLogin = Date.now();
  ctx.session.user = user.toJSON()
  await user.save();

  ctx.body = user.toJSON(); // Send user data without sensitive info
});


// REQUEST-PASSWORD-RESET
router.get('/request-password-reset', async (ctx) => {
  await ctx.render('request-password-reset', { title: 'Request Password Reset' })
})
router.post('/request-password-reset', async (ctx) => {
  const { email } = ctx.request.body;

  const user = await User.findOne({ email });
  if (!user) {
    ctx.status = 400;
    ctx.body = { error: 'No user with that email' };
    return;
  }

  user.generatePasswordReset();
  await user.save();

  // Send email logic here with `user.passwordResetToken`
  sendPasswordResetEmail(user)

  ctx.body = { message: 'Password reset link sent to email' };
});


// RESET-PASSWORD
router.get('/reset-password/:token', async (ctx) => {
  await ctx.render('reset-password', { title: 'Reset Password' })
})
router.post('/reset-password/:token', async (ctx) => {
  const { token } = ctx.params;
  const { password } = ctx.request.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    ctx.status = 400;
    ctx.body = { error: 'Password reset token is invalid or has expired.' };
    return;
  }

  user.password = password; // The pre-save hook will handle hashing
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  ctx.body = { message: 'Password has been reset successfully' };
});


// SEND PASSWORD RESET EMAIL
async function sendPasswordResetEmail(user) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Setup email data
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: user.email, // List of receivers
    subject: 'Password Reset Request', // Subject line
    text: `You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n
           Please click on the following link, or paste this into your browser to complete the process:\n\n
           ${process.env.HOST}/reset-password/${user.passwordResetToken}\n\n
           If you did not request this, please ignore this email and your password will remain unchanged.\n` // Plain text body
  };

  // Send mail with defined transport object
  await transporter.sendMail(mailOptions);
  console.log('Send mail with defined transport object');
}


module.exports = router