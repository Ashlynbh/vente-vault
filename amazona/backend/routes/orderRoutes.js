import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/OrderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';
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
  

const usersSummary = await User.aggregate([
  {
    $group: {
      _id: null,
      numUsers: { $sum: 1 },
    },
  },
]);


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

    // Dispatch Time Aggregation Stage
  const dispatchTimeAggregation = [
    { $unwind: "$brandDeliveries" },
    { $match: { "brandDeliveries.isDelivered": true } },
    {
      $project: {
        brand: "$brandDeliveries.brand",
        dispatchTimeDays: {
          $divide: [
            { $subtract: ["$brandDeliveries.deliveredAt", "$paidAt"] },
            1000 * 60 * 60 * 24 // Convert milliseconds to days
          ]
        }
      }
    },
    { $group: {
      _id: "$brand",
      averageDispatchTime: { $avg: "$dispatchTimeDays" }
    }}
  ];

  const brandDispatchSummary = req.user.isAdmin || req.user.isBrand ? await Order.aggregate(dispatchTimeAggregation) : [];



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

  const averageRatingMatchStage = req.user.isAdmin ? { rating: { $gt: 0 } } : { createdBy: new mongoose.Types.ObjectId(brandUserIdStr), rating: { $gt: 0 } };

  // Aggregate for average rating (only including products that have been rated)
  const averageRating = await Product.aggregate([
    { $match: averageRatingMatchStage },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' }
      }
    }
  ]);


// Console log the result for debugging
console.log("Average Rating:", averageRating);

  res.send({
    orders: ordersSummary.length > 0 ? ordersSummary[0] : { numOrders: 0, totalSales: 0 },
    users: usersSummary.length > 0 ? usersSummary[0] : { numUsers: 0 },
    dailyOrders: dailyOrdersSummary,
    productCategories: productCategoriesSummary,
    topProducts,
    bottomProducts,
    brandDispatchSummary,
    averageRating: averageRating.length > 0 ? averageRating[0].averageRating : null
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
    const order = await Order.findById(req.params.id).populate(
      'user',
      'email name'
    );
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
          const variation = product.variations.find(v => v.color === item.color);
          if (variation) {
            const sizeIndex = variation.sizes.findIndex(s => s.size === item.size);
            if (sizeIndex !== -1) {
              variation.sizes[sizeIndex].countInStock -= item.quantity;
            }
          }
        }
        await product.save();
      }

      const updatedOrder = await order.save();

      // Send email using Mailjet
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