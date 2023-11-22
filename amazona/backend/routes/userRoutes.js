import express from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { isAuth, isAdmin, generateToken, baseUrl, generateAndSaveDiscountCode } from '../utils.js';
import dotenv from 'dotenv';
import DiscountCode from '../models/discountCodes.js';
import ExpressionOfInterest from '../models/expressionofinterestModel.js';
dotenv.config();


const userRouter = express.Router();

userRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      const updatedUser = await user.save();
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  })
);

userRouter.get(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);


let cachedMailjet;

export const initializeMailjet = async () => {
  if (!cachedMailjet) {
    const MailjetModule = await import('node-mailjet');

    if (
      MailjetModule.default &&
      MailjetModule.default.Client &&
      typeof MailjetModule.default.Client.apiConnect === 'function'
    ) {
      cachedMailjet = MailjetModule.default.Client.apiConnect(
        process.env.MAILJET_API_KEY,
        process.env.MAILJET_SECRET_KEY
      );
    } else {
      throw new Error('Unable to find Mailjet connect function');
    }
  }
  return cachedMailjet;
};


userRouter.post(
  '/forget-password',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

  if (user) {
      // Additional check for brands
      if (user.isBrand && !user.isBrandApproved) {
        res.status(403).send({ message: 'Brand account not approved.' });
        return;
      }

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '3h',
      });
      user.resetToken = token;
      await user.save();


      // Reset link
      console.log(`${baseUrl()}/reset-password/${token}`);

      try {
        const mail = await initializeMailjet();
        const response = await mail
          .post('send', { version: 'v3.1' })
          .request({
            Messages: [
              {
                From: {
                  Email: process.env.MAILJET_FROM_EMAIL,
                  Name: process.env.MAILJET_FROM_NAME,
                },
                To: [
                  {
                    Email: user.email,
                    Name: user.name,
                  },
                ],
                Subject: 'Reset Password',
                HTMLPart: `
                  <p>Please click the following link to reset your password:</p>
                  <a href="${baseUrl()}/reset-password/${token}">Reset Password</a>
                `,
              },
            ],
          });
        console.log(response);
        res.send({ message: 'We sent a reset password link to your email.' });
      } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send({ message: 'Error sending email.' });
      }
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  })
);

userRouter.post('/mailjet/add-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const mail = await initializeMailjet(); // Initialize the Mailjet client
        
        // Save the email to Mailjet
        await mail.post('contact', { version: 'v3' }).request({
            Email: email,
            IsExcludedFromCampaigns: 'false',
            Name: email.split('@')[0] // Use the part before the "@" as a simple name
        });

        // Generate discount code
        const discountCode = await generateAndSaveDiscountCode(); // Removed the someValue argument

        // Send discount code to the user
        await mail.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: process.env.MAILJET_FROM_EMAIL,
                        Name: process.env.MAILJET_FROM_NAME,
                    },
                    To: [
                        {
                            Email: email,
                            Name: email.split('@')[0], // Use the part before the "@" as a simple name
                        },
                    ],
                    Subject: 'Welcome! Your Discount Code Inside!',
                    HTMLPart: `
                        <p>Thank you for joining us! Here's your unique discount code: ${discountCode}</p>
                        <p>Use this code at checkout to get your discount.</p>
                    `,
                },
            ],
        });

        res.json({ success: true, message: 'Added email and sent discount code successfully.' });
    } catch (err) {
        console.error(err.statusCode, err.message);
        res.status(500).json({ success: false, message: 'Error processing your request.' });
        
    }
});


userRouter.post('/validate-discount',isAuth, async (req, res) => {
    const { discountCode } = req.body;
    const userId = req.user._id;  

    try {
        const foundCode = await DiscountCode.findOne({ code: discountCode, isActive: true });

        if (!foundCode) {
            res.status(400).json({ success: false, message: 'Invalid or expired discount code.' });
            return;
        }

        if (foundCode.usedBy.includes(userId.toString())) {
            res.status(400).json({ success: false, message: "You've already used this discount code." });
            return;
        }
        res.json({ success: true, discountAmount: foundCode.value });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

userRouter.post('/use-discount', isAuth, async (req, res) => {
    const { discountCode } = req.body;
    const userId = req.user._id;  

    console.log("Discount code from request:", discountCode);
    console.log("User ID from request:", userId);

    try {
        const foundCode = await DiscountCode.findOne({ code: discountCode });

        console.log("Found discount code from DB:", foundCode);

        if (!foundCode) {
            res.status(400).json({ success: false, message: 'Invalid discount code.' });
            return;
        }

        foundCode.usedBy.push(userId);
        await foundCode.save();

        console.log("Updated discount code after push:", foundCode);

        res.json({ success: true, message: 'Discount code marked as used.' });
    } catch (error) {
        console.error("Error encountered:", error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});


const sendBrandApprovalEmail = async (name, email, subscriptionLink) => {
  const mailjet = await initializeMailjet();

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: process.env.MAILJET_FROM_EMAIL,
          Name: process.env.MAILJET_FROM_NAME,
        },
        To: [
          {
            Email: email,
            Name: name
          }
        ],
        Subject: 'Welcome to Our Brand Membership',
        TextPart: 'Brand Membership Approval',
        HTMLPart: `
          <h3>Hi ${name},</h3>
          <p>We are excited to inform you that you have been accepted as an approved brand member! This is a significant first step in partnering with us.</p>
          <p>Please follow <a href="${subscriptionLink}">this link</a> to apply for our subscription services. Once your subscription is active, you will be able to log in and start selling on our platform.</p>
          <p>Welcome aboard,</p>
          <p><b>Vente Vault</b></p>
        `
      }
    ]
  });
  
  return request.then((result) => {
    console.log(result.body);
  }).catch((err) => {
    console.error(err.statusCode);
  });
};


userRouter.post('/send-subscription-link', async (req, res) => {
  console.log("Request body:", req.body);
  try {
    const { userId, userEmail,userName } = req.body;
    // Use your static Stripe link
    const subscriptionLink = `https://buy.stripe.com/test_14kaHy8QX6C242AaEE`;

    await sendBrandApprovalEmail(userName, userEmail, subscriptionLink);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error("Error details:", error); // Log the complete error object
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});





userRouter.post(
  '/reset-password',
  expressAsyncHandler(async (req, res) => {
    // Verifies the token to make sure it's valid and not expired
    jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        // If the token is invalid or expired
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        // If the token is valid, find the user with that resetToken
        const user = await User.findOne({ resetToken: req.body.token });
        if (user) {
          // If the user is found, hash the new password
          user.password = bcrypt.hashSync(req.body.password, 8);
          user.resetToken = undefined; // Clear the resetToken after successful password reset
          await user.save(); // Save the new password
          res.send({
            message: 'Password reset successfully',
          });
        } else {
          // If no user is found with the resetToken
          res.status(404).send({ message: 'User not found' });
        }
      }
    });
  })
);

userRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = Boolean(req.body.isAdmin);

      // Update the brand-related fields
      if (req.body.isBrand !== undefined) { // Check if isBrand was explicitly provided
        user.isBrand = Boolean(req.body.isBrand);
      }
      if (req.body.isBrandApproved !== undefined) { // Check if isBrandApproved was explicitly provided
        user.isBrandApproved = Boolean(req.body.isBrandApproved);
      }

      const updatedUser = await user.save();
      res.send({ message: 'User Updated', user: updatedUser });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);


userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === 'admin@example.com') {
        res.status(400).send({ message: 'Can Not Delete Admin User' });
        return;
      }
      await user.deleteOne();
            res.send({ message: 'User Deleted' });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isBrand: user.isBrand,
          isBrandApproved: user.isBrandApproved,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

// userRouter.post(
//   '/brand/signin',
//   expressAsyncHandler(async (req, res) => {
//     const user = await User.findOne({ email: req.body.email, isBrand: true });
//     if (user) {
//       if (user.isBrandApproved && bcrypt.compareSync(req.body.password, user.password)) {
//         res.send({
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           isAdmin: user.isAdmin,
//           isBrand: user.isBrand,
//           password: user.password,
//           isBrandApproved: user.isBrandApproved,
//           token: generateToken(user),
//         });
//       } else if (!user.isBrandApproved) {
//         res.status(401).send({ message: 'Brand account is not approved yet' });
//       } else {
//         res.status(401).send({ message: 'Invalid email or password' });
//       }
//     } else {
//       res.status(401).send({ message: 'Invalid brand email or password' });
//     }
//   })
// );

userRouter.post('/expression-of-interest', async (req, res) => {
  try {
    const { brandName, contactName, email, password, website, message } = req.body;

    // Hash the password before saving to User database
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create a new User with isBrand set to true
    const user = new User({
      name: brandName,
      email: email,
      password: hashedPassword,
      isBrand: true,
      isAdmin:false,

      // Set other required fields as necessary, such as isAdmin, isBrandApproved, etc.
    });

    // Save the user to the database
    const newUser = await user.save();

    // Save the expression of interest to the database
    const expression = new ExpressionOfInterest({
      brandName,
      contactName,
      email,
      website,
      message,
      user: newUser._id, // Store reference to the user
    });

    // Save the expression of interest to the database
    const savedExpression = await expression.save();

    // Initialize Mailjet
    const mailjet = await initializeMailjet();

    // Send email to admin
    const emailData = {
      'Messages': [
         {
          'From': {
             Email: process.env.MAILJET_FROM_EMAIL,
             Name: process.env.MAILJET_FROM_NAME,
          },
          'To': [
            {
              'Email': 'info@remilabel.com', // Admin email
              'Name': 'Remi'
            }
          ],
          'Subject': 'New Expression of Interest',
          'HTMLPart': `<h3>New Expression of Interest</h3>
                       <p><strong>Brand Name:</strong> ${brandName}</p>
                       <p><strong>Contact Name:</strong> ${contactName}</p>
                       <p><strong>Email:</strong> ${email}</p>
                       <p><strong>Website:</strong> ${website}</p>
                       <p><strong>Message:</strong> ${message}</p>`
        }
      ]
    };
    // Send the email
    const response = await mailjet.post('send', { version: 'v3.1' }).request(emailData);
    // If the email is sent successfully, respond to the original HTTP request
    res.status(201).send({
      message: 'Brand signup and expression of interest submitted successfully',
      emailMessage: 'Notification email sent to admin',
      user: newUser,
      expressionOfInterest: savedExpression
    });

  } catch (error) {
    console.error('Full error:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      // Handle the MongoDB duplicate key error
      return res.status(409).send({ message: 'Email already exists' });
    }
    // Handle other errors
    console.error('Error:', error);
    return res.status(500).send({ message: 'An error occurred', error: error.message });
  }
});



userRouter.post('/signup', expressAsyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    res.status(409).send({ message: 'Email already connected to an account' });
    return;
  }

  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password),
  });
  const user = await newUser.save();
  res.send({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user),
  });
}));






export default userRouter;