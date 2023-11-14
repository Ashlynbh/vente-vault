

import express from 'express';
import Product from '../models/productModel.js';
import InstagramPost from '../models/InstagramModel.js';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin,isAdminOrBrand} from '../utils.js';

const productRouter = express.Router();


productRouter.get('/', isAuth, async (req, res) => {
  let query = { isDeleted: false }; 
  if (req.user.isAdmin && req.query.all === 'true') {
    query = {}; // Admin can see all products, including deleted ones if needed
  } else {
    query = { isPublished: true, isDeleted: false };
  }

  console.log('Query used to fetch products:', query);

  try {
    const products = await Product.find(query);
    console.log('Fetched products:', products);
    res.send(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
  }
});




// POST route for creating a new product
productRouter.post(
  '/',
  isAuth,
  isAdminOrBrand,
  expressAsyncHandler(async (req, res) => {
    // Creating a new product with default sample values and new properties
    const newProduct = new Product({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/p1.jpg',
      images: [],
      brand: 'sample brand',
      category: 'sample category',
      sub_category: 'sample subcategory',
      description: 'sample description',
      price: 0,
      rating: 0,
      numReviews: 0,
      // weight: 0, // Default weight
      instagramPostIds: [], // Initialize as empty array
      featured: req.user.isAdmin ? req.body.featured || false : false,
      isPublished: false,
      isDeleted: false,
      variations: [],
      createdBy: req.user._id,
      fabricMaterial: 'sample fabric/material',
      occasion: 'sample occasion',
      
      measurements: {
        chest: 0,
        waist: 0,
        hips: 0,
      },
      modelBodyMeasurements: {
        chest: 0,
        waist: 0,
        hips: 0,
      },
      sizeOfModelsGarment: 'sample size',
      garmentLength: 0,
      heightRise: 0,
      
    });
    const product = await newProduct.save();
    res.send({ message: 'Product Created', product });
  })
);

// PUT route for updating an existing product
productRouter.put(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (product) {
      product.name = req.body.name || product.name;
      product.slug = req.body.slug || product.slug;
      product.price = req.body.price || product.price;
      product.image = req.body.image || product.image;
      product.images = req.body.images || product.images;
      product.category = req.body.category || product.category;
      product.sub_category = req.body.sub_category || product.sub_category;
      product.brand = req.body.brand || product.brand;
      product.description = req.body.description || product.description;
      product.featured = req.body.featured || product.featured;
      product.createdBy = req.body.createdBy || product.createdBy;
      product.isPublished = req.body.isPublished || product.isPublished;
      product.isDeleted = req.body.isDeleted || product.isDeleted;
      product.variations = req.body.variations || product.variations;
      product.fabricMaterial = req.body.fabricMaterial || product.fabricMaterial;
      product.occasion = req.body.occasion || product.occasion;
      product.measurements = req.body.measurements || product.measurements;
      product.modelBodyMeasurements = req.body.modelBodyMeasurements || product.modelBodyMeasurements;
      product.sizeOfModelsGarment = req.body.sizeOfModelsGarment || product.sizeOfModelsGarment;
      product.garmentLength = req.body.garmentLength || product.garmentLength;
      product.heightRise = req.body.heightRise || product.heightRise;
      // product.weight = req.body.weight !== undefined ? req.body.weight : product.weight;
      product.instagramPostIds = req.body.instagramPostIds !== undefined ? req.body.instagramPostIds : product.instagramPostIds;

      await product.save();
      res.send({ message: 'Product Updated', product });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);



productRouter.delete(
  '/:id',
  isAuth,
  isAdminOrBrand,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isDeleted = true;
      await product.save();
      res.send({ message: 'Product Deleted' }); // This message can be changed to 'Product Hidden' or similar
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;
      const updatedProduct = await product.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


const PAGE_SIZE = 3;


productRouter.get(
  '/admin',
  isAuth,
  isAdminOrBrand,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    // Extend the userFilter to include the isDeleted flag
    let filters = { isDeleted: { $ne: true } }; // $ne selects the documents where the field does not exist or does not equal true

    // If the user is a brand and not an admin, further filter by createdBy
    if (req.user.isBrand && !req.user.isAdmin) {
      filters.createdBy = req.user._id;
    }

    const products = await Product.find(filters)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments(filters);

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);




productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = 36;
    const page = query.page || 1;
    const category = query.category || '';
    const sub_category = query.sub_category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';
    const brand = query.brand || '';
    const isPublishedFilter = { isPublished: true, isDeleted: false };



    // Updated query filter to include both product name and brand
    const queryFilter = searchQuery && searchQuery !== 'all'
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } }
          ],
        }
      : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};
    const subcategoryFilter = sub_category && sub_category !== 'all' ? { sub_category } : {};
    const brandFilter = brand && brand !== 'all' ? { brand } : {};

    const ratingFilter = rating && rating !== 'all'
      ? {
          rating: {
            $gte: Number(rating),
          },
        }
      : {};

    const priceFilter = price && price !== 'all'
      ? {
          // Example: "1-50"
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {};

    const sortOrder = order === 'featured'
      ? { featured: -1 }
      : order === 'lowest'
      ? { price: 1 }
      : order === 'highest'
      ? { price: -1 }
      : order === 'toprated'
      ? { rating: -1 }
      : order === 'newest'
      ? { createdAt: -1 }
      : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...subcategoryFilter,
      ...brandFilter,
      ...priceFilter,
      ...ratingFilter,
      ...isPublishedFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...subcategoryFilter,
      ...brandFilter,
      ...priceFilter,
      ...ratingFilter,
      ...isPublishedFilter,
    });

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get('/categories', expressAsyncHandler(async (req, res) => {
  const categories = await Product.find({ isPublished: true, isDeleted: false }).distinct('category');
  res.send(categories);
}));

productRouter.get('/sub_categories', expressAsyncHandler(async (req, res) => {
  const categoryQuery = req.query.category;
  let filter = { isPublished: true, isDeleted: false };
  
  if (categoryQuery) {
    filter.category = categoryQuery;
  }

  try {
    const sub_categories = await Product.find(filter).distinct('sub_category');
    res.send(sub_categories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}));

productRouter.get('/featured', async (req, res) => {
  const featuredProducts = await Product.find({ featured: true, isPublished: true, isDeleted: false }).limit(4); // limit to 4 products
  res.send(featuredProducts);
});

productRouter.get('/brands', expressAsyncHandler(async (req, res) => {
  const brands = await Product.find({ isPublished: true, isDeleted: false }).distinct('brand');
  res.send(brands);
}));


productRouter.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: { $eq: req.params.slug } });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
productRouter.get('/:id', async (req, res) => {
 const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});




/////INSTAGRAM ROUTES////
productRouter.post(
  '/:id/instagram',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const productId = req.params.id;
      const instagramPostId = req.body.instagramPostId;

      if (!instagramPostId) {
        return res.status(400).send({ message: 'Instagram Post ID is required' });
      }

      // Debugging: Log the received IDs
      console.log(`Adding Instagram ID ${instagramPostId} to product ${productId}`);

      const product = await Product.findById(productId);

      // Additional debugging: Check if the product was found
      if (!product) {
        console.log(`Product not found: ${productId}`);
        return res.status(404).send({ message: 'Product Not Found' });
      }

      // Rest of your logic...
    } catch (error) {
      // Log the error
      console.error('Error in POST /:id/instagram:', error);
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  })
);



productRouter.delete(
  '/:id/instagram/:instagramPostId',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const instagramPostId = req.params.instagramPostId;

    const product = await Product.findById(productId);

    if (product) {
      product.instagramPostIds = product.instagramPostIds.filter(id => id !== instagramPostId);
      await product.save();
      res.send({ message: 'Instagram Post ID removed', product });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

productRouter.get('/instagram/:instagramPostId', isAuth, async (req, res) => {
    const instagramPostId = req.params.instagramPostId;
    try {
        // Find products that have the given Instagram post ID in their instagramPostIds array
        const products = await Product.find({ instagramPostIds: instagramPostId });
        res.json(products);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching products', error: error.message });
    }
});



productRouter.put(
  '/:id/instagram',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const instagramPostIds = req.body.instagramPostIds;

    if (!instagramPostIds || !Array.isArray(instagramPostIds)) {
      return res.status(400).send({ message: 'Instagram Post IDs must be an array' });
    }

    if (instagramPostIds.length > 3) {
      return res.status(400).send({ message: 'Maximum of 3 Instagram Post IDs allowed per product' });
    }

    const product = await Product.findById(productId);

    if (product) {
      product.instagramPostIds = instagramPostIds;
      await product.save();
      res.send({ message: 'Instagram Post IDs updated', product });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);


export default productRouter;
