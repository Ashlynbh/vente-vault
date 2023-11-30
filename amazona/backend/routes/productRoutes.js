

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
    const requiredFields = ['name', 'image', 'brand', 'category', 'sub_category', 'description', 'price', 'reducedPrice', 'sizeOfModelsGarment', 'garmentLength','modelBodyMeasurements', 'sizeguide' ,'image','variations'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ name: req.body.name });
    if (existingProduct) {
      return res.status(400).send({ message: 'Product with this name already exists' });
    }

        // Validate additional images - ensure there are at least 3 and at most 10
    if (!req.body.images || req.body.images.length < 3 || req.body.images.length > 10) {
      return res.status(400).send({ message: 'There must be at least 3 and at most 10 additional images' });
    }

        // Validate fabricMaterials - ensure it's provided, and has 1 to 3 entries
    if (!req.body.fabricMaterial || req.body.fabricMaterial.length === 0 || req.body.fabricMaterial.length > 3) {
      return res.status(400).send({ message: 'Fabric materials must have at least 1 entry' });
    }

    // Validate each fabric material entry to include both percentage and material
    if (req.body.fabricMaterial.some(mat => mat.percentage === undefined || !mat.material)) {
      return res.status(400).send({ message: 'Each fabric material entry must include both percentage and material' });
    }

    // Validate reducedPrice to be at least 30% lower than the price
    if (req.body.reducedPrice && req.body.reducedPrice >= req.body.price * 0.70) {
      return res.status(400).send({ message: 'Reduced price must be at least 30% lower than the original price' });
    }


    if (missingFields.length > 0) {
      return res.status(400).send({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Generate a slug from the product name
    const generateSlug = name => {
      return name.toLowerCase().replace(/[\s\W-]+/g, '-') + '-' + Date.now();
    };

    const product = new Product({
      name: req.body.name,
      slug: generateSlug(req.body.name),
      image: req.body.image,
      images: req.body.images || [],
      brand: req.body.brand,
      category: req.body.category,
      sub_category: req.body.sub_category,
      description: req.body.description,
      price: req.body.price,
      reducedPrice: req.body.reducedPrice,
      sizeguide: req.body.sizeguide,
      // Default values for rating and reviews as they are typically not set on creation
      rating: 0,
      numReviews: 0,
      instagramPostIds: req.body.instagramPostIds || [], 
      featured: req.user.isAdmin ? req.body.featured : false,
      isPublished: req.body.isPublished,
      isDeleted: false,
      variations: req.body.variations || [],
      createdBy: req.user._id,
      fabricMaterial: req.body.fabricMaterial,
      product_tags: req.body.product_tags  || [],
      measurements: req.body.measurements || { chest: 0, waist: 0, hips: 0 },
      modelBodyMeasurements: req.body.modelBodyMeasurements || { chest: 0, waist: 0, hips: 0, height:0 },
      sizeOfModelsGarment: req.body.sizeOfModelsGarment,
      garmentLength: req.body.garmentLength || 0,
      // include other fields as required
    });
    const createdProduct = await product.save();
    res.send({ message: 'Product Created', product: createdProduct });
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
      // Validate if price and reducedPrice are provided and not zero
      if (req.body.price === undefined || req.body.reducedPrice === undefined || req.body.price === 0 || req.body.reducedPrice === 0) {
        return res.status(400).send({ message: 'Both price and reduced price must be provided' });
      }

      

      // Validate reducedPrice to be at least 30% lower than the price
      if (req.body.reducedPrice >= req.body.price * 0.70) {
        return res.status(400).send({ message: 'Reduced price must be at least 30% lower than the original price' });
      }
      // Update price and reducedPrice
      product.price = req.body.price;
      product.reducedPrice = req.body.reducedPrice;
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
      product.product_tags = req.body.product_tags || [];
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
    const product_tags = query.product_tags || '';



    // Updated query filter to include both product name and brand
    const queryFilter = searchQuery && searchQuery !== 'all'
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } },
            { product_tags: { $regex: searchQuery, $options: 'i' } }
          ],
        }
      : {};

    const categoryFilter = category && category !== 'all' ? { category } : {};
    const subcategoryFilter = sub_category && sub_category !== 'all' ? { sub_category } : {};
    const brandFilter = brand && brand !== 'all' ? { brand } : {};
    const tagsFilter = product_tags && product_tags !== 'all'


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
      ...tagsFilter,
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
      ...tagsFilter,

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

productRouter.get('/instagram/:instagramPostId', async (req, res) => {
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
