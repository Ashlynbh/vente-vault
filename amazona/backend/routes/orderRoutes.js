import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import Invoice from '../models/invoiceModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';
import moment from 'moment';
import 'moment-business-days';
import 'moment-timezone';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));



import PdfPrinter from 'pdfmake';
import { isAuth, isAdmin, sendEmail, payOrderEmailTemplate, isAdminOrBrand, sendDeliveryEmail, initializeMailjet, createEmailContentForDeliveredItems } from '../utils.js';


const orderRouter = express.Router();

orderRouter.get(
  '/',
  isAuth,
  isAdminOrBrand,
  expressAsyncHandler(async (req, res) => {
    let orders;
    if (req.user.isBrand && !req.user.isAdmin) {
      // Get orders that contain products created by this brand
      const productIds = await Product.find({ createdBy: req.user._id }, '_id');
      const productIdsArray = productIds.map(product => product._id);
      orders = await Order.find({ 'orderItems.product': { $in: productIdsArray } }).populate('user', 'name');
      
      // Filter out the items not created by the brand
      orders = orders.map(order => ({
        ...order._doc,
        orderItems: order.orderItems.filter(item => 
          productIdsArray.includes(item.product.toString())
        )
      }));
    } else {
      // Admin gets all orders
      orders = await Order.find().populate('user', 'name');
    }
    res.send(orders);
  })
);




orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const finalTotalPrice = req.body.discountAmount
      ? req.body.totalPrice - req.body.discountAmount
      : req.body.totalPrice;

    const brandDeliveriesMap = {};

    // Populate brandDeliveriesMap with each product's brand user ID
    req.body.orderItems.forEach((item) => {
      if (item.createdBy) {
        brandDeliveriesMap[item.createdBy] = {
          brand: item.createdBy,
          isDelivered: false,
          deliveredAt: null,
          trackingNumber: "",
          brandName: item.brand
        };
      }
    });
    const brandDeliveries = Object.values(brandDeliveriesMap);

    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({
        ...x,
        product: x._id,
        price: x.reducedPrice ? x.reducedPrice : x.price // Update the price field
      })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: finalTotalPrice,
      discountAmount: req.body.discountAmount || 0,
      discountCodeApplied: req.body.discountCode || '',
      user: req.user._id,
      brandDeliveries  // Add this array to the order
    });

    const order = await newOrder.save();
    console.log(brandDeliveries)
    res.status(201).send({ message: 'New Order Created', order });
  })
);


orderRouter.get('/summary', isAuth, isAdminOrBrand, expressAsyncHandler(async (req, res) => {
  let orderMatchStage = {};
  let productMatchStage = {};
  const brandUserIdStr = req.user.isBrand && !req.user.isAdmin ? req.user._id.toString() : null;


  if (req.user.isBrand && !req.user.isAdmin) {


    orderMatchStage = {
      $expr: {
        $eq: [{ $toString: "$orderItems.createdBy" }, brandUserIdStr]
      }
    };

    productMatchStage = {
      $expr: {
        $eq: [{ $toString: "$createdBy" }, brandUserIdStr]
      }
    };
  }

  const ordersSummary = await Order.aggregate([
    { $unwind: "$orderItems" },
    { $match: orderMatchStage },
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalSales: { $sum: "$orderItems.price" },
      },
    },
  ]);
  

  const usersSummary = await Order.aggregate([
    { $unwind: "$orderItems" },
    { $match: orderMatchStage },
    {
      $group: {
        _id: "$user", // Group by user ID
        numOrders: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        uniqueUsers: { $sum: 1 } // Count unique users
      }
    }
  ]);

  console.log(usersSummary)


  const dailyOrdersSummary = await Order.aggregate([
    { $unwind: "$orderItems" },
    { $match: orderMatchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: "$createdAt" } },
        orders: { $sum: 1 },
        sales: { $sum: "$orderItems.price" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

 const categoryMatchStage = req.user.isAdmin ? {} : { 'productDetails.createdBy': new mongoose.Types.ObjectId(brandUserIdStr) };

  const productCategoriesSummary = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productDetails'
      },
    },
    { $unwind: '$productDetails' },
    // Apply the match stage conditionally
    ...(Object.keys(categoryMatchStage).length ? [{ $match: categoryMatchStage }] : []),
    {
      $group: {
        _id: '$productDetails.category',
        count: { $sum: 1 },
        totalSales: { $sum: '$orderItems.price' }
      },
    },
    { $sort: { _id: 1 } },
  ]);


  const dispatchTimeAggregation = [
        { $unwind: "$brandDeliveries" },
        { $match: { "brandDeliveries.isDelivered": true } },
        {
            $project: {
                brand: "$brandDeliveries.brand",
                paidAt: "$paidAt",
                deliveredAt: "$brandDeliveries.deliveredAt"
            }
        },
    ];

    // Execute the aggregation pipeline
    const brandDispatchData = req.user.isAdmin || req.user.isBrand ? 
        await Order.aggregate(dispatchTimeAggregation) : [];

const calculateDispatchHours = (start, end) => {
    let startMoment = moment(start);
    let endMoment = moment(end);
    let totalMinutes = 0;

    console.log(`Calculating dispatch time from ${start} to ${end}`);

    // Check if the order starts and ends on the same day
    if (startMoment.isSame(endMoment, 'day')) {
        totalMinutes = endMoment.diff(startMoment, 'minutes');
        console.log(`Same day dispatch: ${totalMinutes} minutes`);
    } else {
        // Handle multi-day dispatch
        while (startMoment.isBefore(endMoment, 'day')) {
            if (startMoment.isoWeekday() <= 5) { // Check if it's a weekday
                // If start day, calculate minutes from start time to end of day
                if (startMoment.isSame(moment(start), 'day')) {
                    let dayMinutes = startMoment.clone().endOf('day').diff(startMoment, 'minutes');
                    console.log(`Start day minutes (${startMoment.format()}): ${dayMinutes}`);
                    totalMinutes += dayMinutes;
                }
                // If end day, calculate minutes from start of day to end time
                else if (startMoment.isSame(endMoment, 'day')) {
                    let dayMinutes = endMoment.diff(startMoment.clone().startOf('day'), 'minutes');
                    console.log(`End day minutes (${startMoment.format()}): ${dayMinutes}`);
                    totalMinutes += dayMinutes;
                }
                // For full weekdays in between, add 24 hours in minutes
                else {
                    console.log(`Full day (${startMoment.format()}): 1440 minutes`);
                    totalMinutes += 24 * 60;
                }
            } else {
                console.log(`Skipping weekend (${startMoment.format()})`);
            }
            startMoment.add(1, 'day').startOf('day');
        }
    }

    console.log(`Total dispatch time: ${totalMinutes} minutes`);
    return totalMinutes;
};



    // Map over brandDispatchData to calculate dispatch times
    const brandDispatchSummary = brandDispatchData.map(data => {
        const dispatchTimeHours = calculateDispatchHours(data.paidAt, data.deliveredAt);
        return {
            brand: data.brand,
            dispatchTimeHours
        };
    });

    // Calculate the average dispatch time per brand
    const averageDispatchTimePerBrand = brandDispatchSummary.reduce((acc, val) => {
        if (!acc[val.brand]) {
            acc[val.brand] = { totalminutes: 0, count: 0 };
        }
        acc[val.brand].totalminutes += val.dispatchTimeHours;
        acc[val.brand].count += 1;
        return acc;
    }, {});

    // Calculate the average for each brand
    Object.keys(averageDispatchTimePerBrand).forEach(brand => {
        averageDispatchTimePerBrand[brand].average = 
            averageDispatchTimePerBrand[brand].totalminutes / averageDispatchTimePerBrand[brand].count;
    });

    console.log(averageDispatchTimePerBrand)

  const commonAggregationStages = [
    { $unwind: '$orderItems' },
    { $match: orderMatchStage },
    { $group: {
      _id: '$orderItems.product',
      totalSales: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] }},
      name: { $first: '$orderItems.name' }
    }}
  ];

  // Aggregate top selling products
  const topProducts = await Order.aggregate([
    ...commonAggregationStages,
    { $sort: { totalSales: -1 }},
    { $limit: 3 }
  ]);

  // Aggregate bottom selling products
  const bottomProducts = await Order.aggregate([
    ...commonAggregationStages,
    { $sort: { totalSales: 1 }},
    { $limit: 3 }
  ]);

    let paidNotDeliveredOrdersCount;

  if (req.user.isAdmin) {
    // Admin aggregation
    const paidNotDeliveredOrdersAdmin = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$brandDeliveries" },
      { $match: { "brandDeliveries.isDelivered": false } },
      {
        $group: {
          _id: "$_id",
          brandDeliveries: { $push: "$brandDeliveries" }
        }
      },
      { $match: { "brandDeliveries": { $ne: [] } } },
      {
        $group: {
          _id: null,
          paidNotDeliveredCount: { $sum: 1 }
        }
      }
    ]);

    paidNotDeliveredOrdersCount = paidNotDeliveredOrdersAdmin.length > 0 
      ? paidNotDeliveredOrdersAdmin[0].paidNotDeliveredCount 
      : 0;
  } else if (req.user.isBrand) {
    // Brand aggregation
    const brandUserIdStr = req.user._id.toString();
    const paidNotDeliveredOrdersBrand = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$brandDeliveries" },
      { $match: { 
          "brandDeliveries.brand": new mongoose.Types.ObjectId(brandUserIdStr),
          "brandDeliveries.isDelivered": false
        }
      },
      {
        $group: {
          _id: null,
          paidNotDeliveredCount: { $sum: 1 }
        }
      }
    ]);

    paidNotDeliveredOrdersCount = paidNotDeliveredOrdersBrand.length > 0 
      ? paidNotDeliveredOrdersBrand[0].paidNotDeliveredCount 
      : 0;
  }

  // Console log the result for debugging
  console.log("Paid Not Delivered Orders Count:", paidNotDeliveredOrdersCount);



  res.send({
    orders: ordersSummary.length > 0 ? ordersSummary[0] : { numOrders: 0, totalSales: 0 },
    users: usersSummary.length > 0 ? usersSummary[0] : { numUsers: 0 },
    dailyOrders: dailyOrdersSummary,
    productCategories: productCategoriesSummary,
    topProducts,
    bottomProducts,
    brandDispatchSummary: averageDispatchTimePerBrand,
    paidNotDeliveredOrdersCount
  });
}));


const calculateDispatchHours = (start, end) => {
    let startMoment = moment(start);
    let endMoment = moment(end);
    let totalMinutes = 0;

    console.log(`Calculating dispatch time from ${start} to ${end}`);

    // Check if the order starts and ends on the same day
    if (startMoment.isSame(endMoment, 'day')) {
        totalMinutes = endMoment.diff(startMoment, 'minutes');
        console.log(`Same day dispatch: ${totalMinutes} minutes`);
    } else {
        // Handle multi-day dispatch
        while (startMoment.isBefore(endMoment, 'day')) {
            if (startMoment.isoWeekday() <= 5) { // Check if it's a weekday
                // If start day, calculate minutes from start time to end of day
                if (startMoment.isSame(moment(start), 'day')) {
                    let dayMinutes = startMoment.clone().endOf('day').diff(startMoment, 'minutes');
                    console.log(`Start day minutes (${startMoment.format()}): ${dayMinutes}`);
                    totalMinutes += dayMinutes;
                }
                // If end day, calculate minutes from start of day to end time
                else if (startMoment.isSame(endMoment, 'day')) {
                    let dayMinutes = endMoment.diff(startMoment.clone().startOf('day'), 'minutes');
                    console.log(`End day minutes (${startMoment.format()}): ${dayMinutes}`);
                    totalMinutes += dayMinutes;
                }
                // For full weekdays in between, add 24 hours in minutes
                else {
                    console.log(`Full day (${startMoment.format()}): 1440 minutes`);
                    totalMinutes += 24 * 60;
                }
            } else {
                console.log(`Skipping weekend (${startMoment.format()})`);
            }
            startMoment.add(1, 'day').startOf('day');
        }
    }

    console.log(`Total dispatch time: ${totalMinutes} minutes`);
    return totalMinutes;
};
orderRouter.get('/dispatch-times', async (req, res) => {
    try {
        // Fetch orders that have been delivered
        const orders = await Order.find({"brandDeliveries.isDelivered": true});

        // Calculate dispatch times for each order
        const dispatchTimes = {};
        orders.forEach(order => {
            order.brandDeliveries.forEach(brandDelivery => {
                if (brandDelivery.isDelivered) {
                    const totalMinutes = calculateDispatchHours(order.paidAt, brandDelivery.deliveredAt);
                    dispatchTimes[order._id] = (dispatchTimes[order._id] || 0) + totalMinutes;
                }
            });
        });

        console.log('Dispatch Times:', dispatchTimes); // Log the dispatch times object

        // Send response
        res.json(dispatchTimes);
    } catch (error) {
        console.error('Error in /dispatch-times:', error); // Log any errors
        res.status(500).json({ message: error.message });
    }
});



orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);


orderRouter.get('/summary', isAuth, isAdminOrBrand, expressAsyncHandler(async (req, res) => {
  let orderMatchStage = {};
  let productMatchStage = {};

  if (req.user.isBrand && !req.user.isAdmin) {
    // Convert string ID to ObjectId for matching
    const brandUserId = new mongoose.Types.ObjectId(req.user._id);

    // Match orders that contain products created by this brand
    orderMatchStage = {
      'orderItems.createdBy': brandUserId,
    };
    // Match products that are created by this brand
    productMatchStage = {
      createdBy: brandUserId,
    };
  }

  // Aggregate for orders summary
  const ordersSummary = await Order.aggregate([
    { $unwind: "$orderItems" },
    { $match: orderMatchStage },
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalSales: { $sum: "$orderItems.price" },
      },
    },
  ]);

  // Aggregate for users summary (only for admin)
  const usersSummary = req.user.isAdmin ? await User.aggregate([
    {
      $group: {
        _id: null,
        numUsers: { $sum: 1 },
      },
    },
  ]) : [];

  // Aggregate for daily orders summary
  const dailyOrdersSummary = await Order.aggregate([
    { $unwind: "$orderItems" },
    { $match: orderMatchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: "$createdAt" } },
        orders: { $sum: 1 },
        sales: { $sum: "$orderItems.price" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Aggregate for product categories summary
  const productCategoriesSummary = await Product.aggregate([
    { $match: productMatchStage },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  res.send({
    orders: ordersSummary.length > 0 ? ordersSummary[0] : { numOrders: 0, totalSales: 0 },
    users: usersSummary.length > 0 ? usersSummary[0] : { numUsers: 0 },
    dailyOrders: dailyOrdersSummary,
    productCategories: productCategoriesSummary,
  });
}));


orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);


orderRouter.get(
  '/admin/:id',
  isAuth,
  isAdminOrBrand,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('orderItems.product');
    if (order) {
      let canViewFullOrder = req.user.isAdmin;
      let filteredOrderItems = order.orderItems;

      if (!req.user.isAdmin && req.user.isBrand) {
        filteredOrderItems = order.orderItems.filter(item =>
          item.product.createdBy.toString() === req.user._id.toString()
        );
        canViewFullOrder = filteredOrderItems.length > 0;
      }

      if (canViewFullOrder) {
        if (!req.user.isAdmin) {
          // Recalculate totals for brand user
          const itemsPrice = filteredOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          // Assuming tax and shipping are a percentage of items price, adjust these as necessary
          const taxPrice = itemsPrice * (order.taxRate || 0);
          const shippingPrice = itemsPrice * (order.shippingRate || 0);
          const totalPrice = itemsPrice + taxPrice + shippingPrice;

          res.send({
            ...order.toObject(),
            orderItems: filteredOrderItems,
            itemsPrice, // Updated price
            taxPrice, // Updated tax
            shippingPrice, // Updated shipping
            totalPrice, // Updated total
            
          });
        } else {
          // Admin view
          res.send(order);
        }
      } else {
        res.status(403).send({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);


orderRouter.get('/invoices', isAuth, isAdminOrBrand, expressAsyncHandler(async (req, res) => {
  let monthYear = req.query.monthYear;

  if (!monthYear) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    monthYear = `${year}-${month}`;
  }

  const year = parseInt(monthYear.split('-')[0], 10);
  const month = parseInt(monthYear.split('-')[1], 10);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);  // Last day of the month

  const invoicesData = await Order.aggregate([
    { $unwind: "$brandDeliveries" },
    { 
      $match: { 
        'brandDeliveries.isDelivered': true, 
        'brandDeliveries.deliveredAt': { $gte: startDate, $lt: endDate } 
      }
    },
    { 
      $group: {
        _id: '$brandDeliveries.brand',
        totalSales: { $sum: '$totalPrice' },
        commission: { $sum: { $multiply: ['$totalPrice', 0.30] } },
        orderIds: { $push: '$_id' }
      }
    }
  ]);

  const invoicePromises = invoicesData.map(async invoiceData => {
    const brandUser = await User.findById(invoiceData._id);
    if (!brandUser || !brandUser.isBrand) return;

    const invoiceIdentifier = `${invoiceData._id}-${year}-${month}`;
    let existingInvoice = await Invoice.findOne({ invoiceIdentifier: invoiceIdentifier });

    if (!existingInvoice) {
      const invoiceDate = endDate;  // Last day of the month
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 15); // Assuming a 15-day payment term

      const newInvoice = new Invoice({
        brandId: brandUser._id,
        brandName: brandUser.name,
        invoiceIdentifier: invoiceIdentifier,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        totalAmount: invoiceData.totalSales,
        fees: invoiceData.commission,
        gst: 0,
        returnedOrders: [],
        orders: invoiceData.orderIds,
        // Add any other necessary fields
      });

      return newInvoice.save();
    } else {
      return existingInvoice;
    }
  });

  
  try {
    const savedInvoices = await Promise.all(invoicePromises);

    // After saving invoices, generate and update PDFs
    for (const invoice of savedInvoices) {
      if (invoice) {
        await createInvoicePDF(invoice); // This function also updates the invoice with the PDF path
      }
    }

    res.send(savedInvoices);
  } catch (error) {
    console.error('Error in generating invoices:', error);
    res.status(500).send({ message: 'Error generating invoices' });
  }
}));


function createInvoicePDF(invoice) {
  const fonts = {
    Roboto: {
      normal: 'fonts/Roboto-Regular.ttf',
      bold: 'fonts/Roboto-Medium.ttf',
      italics: 'fonts/Roboto-Italic.ttf',
      bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
  };

   const printer = new PdfPrinter(fonts);

  // Ensure the invoices directory exists
  const invoicesDir = path.join(__dirname, 'invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const docDefinition = {
    content: [
      { text: 'Invoice', style: 'header' },
      { text: `Brand Name: ${invoice.brandName}`, margin: [0, 5, 0, 15] },
      {
        table: {
          widths: ['*', 'auto', 100, '*'],
          body: [
            ['Invoice ID', 'Invoice Date', 'Total Sales', 'Commission'],
[
        invoice.invoiceIdentifier || 'N/A', 
        invoice.invoiceDate ? invoice.invoiceDate.toISOString().substring(0, 10) : 'N/A', 
        invoice.totalAmount ? invoice.totalAmount.toFixed(2).toString() : '0.00', 
        invoice.fees ? invoice.fees.toFixed(2).toString() : '0.00'
      ]
            // Add more rows as necessary
          ]
        }
      },
      // ... Additional content as needed
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      }
      // ... Additional styles as needed
    }
  };
  // Save the PDF file in the invoices directory
  const pdfPath = path.join(invoicesDir, `Invoice-${invoice.invoiceIdentifier}.pdf`);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream(pdfPath));
  pdfDoc.end();

  // URL to access the PDF over HTTP
  const pdfUrl = `/invoices/Invoice-${invoice.invoiceIdentifier}.pdf`;


  // Update the invoice with the PDF URL
  return Invoice.findByIdAndUpdate(invoice._id, { pdfPath: pdfUrl }, { new: true });
}





orderRouter.put('/invoice/:id/pay', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await Invoice.findById(invoiceId); 

  if (invoice) {
    invoice.isPaid = !invoice.isPaid; 
    if (invoice.isPaid) {
      invoice.paidAt = new Date();
    }
    const updatedInvoice = await invoice.save();
    res.send({ message: 'Invoice updated', invoice: updatedInvoice });
  } else {
    res.status(404).send({ message: 'Invoice not found' });
  }
}));

orderRouter.put('/invoice/:id/pay', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await Invoice.findById(invoiceId); // Assuming you have an Invoice model

  if (invoice) {
    invoice.isPaid = !invoice.isPaid; // Toggle the payment status
    // Optionally, record the payment date
    if (invoice.isPaid) {
      invoice.paidAt = new Date();
    }
    const updatedInvoice = await invoice.save();
    res.send({ message: 'Invoice updated', invoice: updatedInvoice });
  } else {
    res.status(404).send({ message: 'Invoice not found' });
  }
}));





orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const trackingNumber = req.body.trackingNumber;
    const brandUserId = req.user._id; // Assuming the logged-in user is the brand representative

    const order = await Order.findById(orderId).populate('user', 'email name');
    if (order) {
      const brandDeliveryIndex = order.brandDeliveries.findIndex(
        (bd) => bd.brand.toString() === brandUserId
      );

      if (brandDeliveryIndex !== -1) {
        order.brandDeliveries[brandDeliveryIndex].isDelivered = true;
        order.brandDeliveries[brandDeliveryIndex].deliveredAt = Date.now();
        order.brandDeliveries[brandDeliveryIndex].trackingNumber = trackingNumber;
        await order.save();

        // Send email to user
        const deliveredItems = order.orderItems.filter(
          (item) => item.createdBy.toString() === brandUserId
        );

        if (deliveredItems.length > 0) {
          const emailContent = createEmailContentForDeliveredItems(order, deliveredItems, order.brandDeliveries[brandDeliveryIndex]);
          sendEmail(
            order.user.email,
            "Your Order Has Been Delivered",
            emailContent
          )
          .then(response => {
            console.log('Email sent:', response.body);
          })
          .catch(err => {
            console.error('Error sending email:', err.statusCode);
          });
        }

        res.send({ message: 'Delivery Updated' });
      } else {
        res.status(404).send({ message: 'Brand Delivery Not Found' });
      }
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);


orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'email name');
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      // Update product stock based on the order items
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product && product.variations) {
          const variationIndex = product.variations.findIndex(v => v.color === item.color);
          if (variationIndex !== -1) {
            const sizeIndex = product.variations[variationIndex].sizes.findIndex(s => s.size === item.size);
            if (sizeIndex !== -1) {
              const stockKey = `variations.${variationIndex}.sizes.${sizeIndex}.countInStock`;
              await Product.updateOne(
                { _id: product._id, [`variations.${variationIndex}.color`]: item.color },
                { $inc: { [stockKey]: -item.quantity } }
              );
            }
          }
        }
      }

      const updatedOrder = await order.save();

      // Send email using Mailjet or your chosen email service
      sendEmail(
        `${order.user.email}`,
        `Order Confirmation ${order._id}`,
        payOrderEmailTemplate(order)
      )
      .then(response => {
        console.log('Email sent:', response.body);
      })
      .catch(err => {
        console.error('Error sending email:', err.statusCode);
      });

      res.send({ message: 'Order Paid', order: updatedOrder });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);






orderRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
            res.send({ message: 'Order Deleted' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);



export default orderRouter;