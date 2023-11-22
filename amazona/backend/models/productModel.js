import mongoose from 'mongoose';


const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);



const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true,enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  countInStock: { type: Number, required: true, default: 0 },
});

const colorSizeSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorImage: { type: String, required: true }, // Image for the specific color
  sizes: [sizeSchema],
  colourhex: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, required: true }, 
  sizeguide: { type: String, required: true }, 
  images: [{ type: String }],
  brand: { type: String, required: true },
  category: { type: String, required: true },
  sub_category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  reducedPrice: { type: Number,required:true },
  rating: { type: Number, required: true },
  numReviews: { type: Number, required: true },
  reviews: [reviewSchema],
  featured: { type: Boolean, required: true, default: false },
  isPublished: { type: Boolean, required: true, default: false },
  variations: [colorSizeSchema], // Color and size variations
  fabricMaterial: [{
  percentage: { type: Number, required: true },
  material: { type: String, required: true }
}],
  product_tags: { type: String },
  isDeleted: { type: Boolean, required: true, default: false },
  // weight: { type: Number, required: true }, 
  instagramPostIds: [{ type: String }], 
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  measurements: {
    chest: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
  },
  modelBodyMeasurements: {
    chest: { type: Number, required:true },
    waist: { type: Number, required:true },
    hips: { type: Number, required:true },
    height: { type: Number, required:true }
  },
  sizeOfModelsGarment: { type: String, required:true },
  garmentLength: { type: Number, required:true },

}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
