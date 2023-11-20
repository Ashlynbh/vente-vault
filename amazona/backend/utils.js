import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Mailjet from 'node-mailjet';
import DiscountCode from './models/discountCodes.js';


dotenv.config();

export const baseUrl = () =>
  process.env.BASE_URL
    ? process.env.BASE_URL
    : process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3000'
    : 'https://yourdomain.com';



export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isBrand:user.isBrand,
      isBrandApproved:user.isBrandApproved
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};

export const isBrand = (req, res, next) => {
  if (req.user && req.user.isBrand && req.user.isBrandApproved) {
    next();
  } else {
    // If the user is a brand but not approved, you can send a specific message
    if (req.user && req.user.isBrand && !req.user.isBrandApproved) {
      res.status(403).send({ message: 'Brand account is not approved' });
    } else {
      // If the user is not a brand, you send a generic unauthorized message
      res.status(401).send({ message: 'Not authorized as an approved brand' });
    }
  }
};

export const isAdminOrBrand = (req, res, next) => {
  console.log(req.user); 
  if (req.user && (req.user.isAdmin || (req.user.isBrand && req.user.isBrandApproved))) {
    next();
  } else {
    res.status(401).send({ message: 'Not Admin or Approved Brand' });
  }
};

/////MAILJET////

let cachedMailjet;

export const initializeMailjet = async () => {
  if (!cachedMailjet) {
    const MailjetModule = await import('node-mailjet');
    
    if (MailjetModule.default && MailjetModule.default.Client && typeof MailjetModule.default.Client.apiConnect === "function") {
      cachedMailjet = MailjetModule.default.Client.apiConnect(
        process.env.MAILJET_API_KEY, 
        process.env.MAILJET_SECRET_KEY
      );
    } else {
      throw new Error("Unable to find Mailjet connect function");
    }
  }
  return cachedMailjet;
};

////ORDER RECEIVED EMAIL///

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const mail = await initializeMailjet();
    const response = await mail
      .post("send", { 'version': 'v3.1' })
      .request({
        "Messages": [{
          "From": {
            "Email": process.env.MAILJET_FROM_EMAIL,
            "Name": process.env.MAILJET_FROM_NAME
          },
          "To": [{
            "Email": toEmail
          }],
          "Subject": subject,
          "HTMLPart": htmlContent
        }]
      });
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;  // re-throwing the error if you need to handle it upstream
  }
};


export const payOrderEmailTemplate = (order) => {
  return `<h1>Thanks for shopping with us</h1>
  <p>
  Hi ${order.user.name},</p>
  <p>We have finished processing your order.</p>
  <h2>[Order ${order._id}] (${order.createdAt.toString().substring(0, 10)})</h2>
  <table>
  <thead>
  <tr>
  <td><strong>Product</strong></td>
  <td><strong>Quantity</strong></td>
  <td><strong align="right">Price</strong></td>
  </thead>
  <tbody>
  ${order.orderItems
    .map(
      (item) => `
    <tr>
    <td>${item.name}</td>
    <td align="center">${item.quantity}</td>
    <td align="right"> $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2">Items Price:</td>
  <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2">Shipping Price:</td>
  <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
  </tr>
  <tr>
  <td colspan="2"><strong>Total Price:</strong></td>
  <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Payment Method:</td>
  <td align="right">${order.paymentMethod}</td>
  </tr>
  </table>
  <h2>Shipping address</h2>
  <p>
  ${order.shippingAddress.fullName},<br/>
  ${order.shippingAddress.address},<br/>
  ${order.shippingAddress.city},<br/>
  ${order.shippingAddress.country},<br/>
  ${order.shippingAddress.postalCode}<br/>
  </p>
  <hr/>
  <p>
  Thanks for shopping with us.
  </p>
  `;
};


///////SHIPPED ORDER EMAIL//////

export const sendShipping = async (toEmail, subject, htmlContent) => {
  try {
    const mail = await initializeMailjet();
    const response = await mail
      .post("send", { 'version': 'v3.1' })
      .request({
        "Messages": [{
          "From": {
            "Email": process.env.MAILJET_FROM_EMAIL,
            "Name": process.env.MAILJET_FROM_NAME
          },
          "To": [{
            "Email": toEmail
          }],
          "Subject": subject,
          "HTMLPart": htmlContent
        }]
      });
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;  // re-throwing the error if you need to handle it upstream
  }
};

// Template for email with delivered items
 export const createEmailContentForDeliveredItems = (order, items, brandDelivery) => {
  return `
    <h1>Delivery Update for Your Order</h1>
    <p>Hi ${order.user.name},</p>
    <p>The following items from your order have been delivered:</p>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p>Delivered on: ${new Date(brandDelivery.deliveredAt).toLocaleDateString()}</p>
    <p>Tracking Number: ${brandDelivery.trackingNumber}</p>
    <hr/>
    <p>Thanks for shopping with us.</p>
  `;
};

// Function to send email when a brand marks items as delivered
export const sendDeliveryEmail = async (order) => {
  // Find the delivered brand entry
  const deliveredBrandEntry = order.brandDeliveries.find(entry => entry.isDelivered);

  if (deliveredBrandEntry) {
    // Filter the order items for this brand
    const deliveredItems = order.orderItems.filter(item => 
      item.createdBy.toString() === deliveredBrandEntry.brand.toString()
    );

    if (deliveredItems.length > 0) {
      // Create and send the email with these items
      const emailContent = createEmailContentForDeliveredItems(order, deliveredItems, deliveredBrandEntry);
      await sendEmail(order.user.email, "Part of Your Order Has Been Delivered", emailContent);
    }
  }
};


// Sample function to generate and save discount code

const generateAndSaveDiscountCode = async (value) => {
    const code = 'WELCOME' + Math.floor(100000 + Math.random() * 900000).toString();  // Example code format: DISC123456

    const discountCode = new DiscountCode({
        code: code,
        value: 10,  // Value of the discount
        type: 'percentage',  // Indicates that the discount is a percentage
        isActive: true,
    });

    await discountCode.save();
    return code;  // Return the generated code
};

export { generateAndSaveDiscountCode };


