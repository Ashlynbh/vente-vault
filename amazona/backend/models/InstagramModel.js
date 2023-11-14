import mongoose from 'mongoose';

const instagramPostSchema = new mongoose.Schema({
  postId: String,
  imageUrl: String,
  caption: String,
  showOnHomepage: { type: Boolean, default: false } 
});

const InstagramPost = mongoose.model('InstagramPost', instagramPostSchema);

export default InstagramPost;
