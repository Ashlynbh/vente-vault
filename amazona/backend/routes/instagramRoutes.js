import InstagramPost from '../models/InstagramModel.js';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin,isAdminOrBrand} from '../utils.js';
import axios from 'axios';

const instagramRouter = express.Router();


instagramRouter.get('/instagram-posts', isAuth, isAdmin, async (req, res) => {
  try {
    const posts = await InstagramPost.find({});
    res.json(posts);
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    res.status(500).send({ message: 'Error fetching Instagram posts', error: error.message });
  }
});

instagramRouter.get('/homepage-posts', async (req, res) => {
  try {
    const posts = await InstagramPost.find({ showOnHomepage: true });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching homepage Instagram posts:', error);
    res.status(500).send({ message: 'Error fetching posts', error: error.message });
  }
});

instagramRouter.put('/instagram-post/homepage/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const post = await InstagramPost.findById(req.params.id);
    if (post) {
      post.showOnHomepage = !post.showOnHomepage; // Toggle the flag
      await post.save();
      res.send({ message: 'Post updated', post });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error updating post', error: error.message });
  }
});



instagramRouter.post('/instagram-post', isAuth, isAdmin, async (req, res) => {
  try {
    const { postId, imageUrl, caption } = req.body;
    const newPost = new InstagramPost({
      postId,
      imageUrl,
      caption,
      showOnHomepage: false 
    });
    const savedPost = await newPost.save();
    res.status(201).send({ message: 'New Instagram Post Added', post: savedPost });
  } catch (error) {
    res.status(500).send({ message: 'Error adding Instagram post', error: error.message });
  }
});



instagramRouter.delete('/instagram-post/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const deletedPost = await InstagramPost.findByIdAndDelete(req.params.id);
    if (deletedPost) {
      res.send({ message: 'Instagram Post Deleted', post: deletedPost });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error deleting Instagram post', error: error.message });
  }
});

// Route to update an Instagram post
instagramRouter.put('/instagram-post/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const { postId, imageUrl, caption } = req.body;
    const post = await InstagramPost.findById(req.params.id);
    if (post) {
      post.postId = postId;
      post.imageUrl = imageUrl;
      post.caption = caption;
      if (typeof showOnHomepage !== 'undefined') { // Check if showOnHomepage is provided
        post.showOnHomepage = showOnHomepage;
      }
      
      // Update other fields if necessary

      const updatedPost = await post.save();
      res.send({ message: 'Instagram Post Updated', post: updatedPost });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error updating Instagram post', error: error.message });
  }
});

instagramRouter.get('/fetch-instagram-posts', isAuth, isAdmin, async (req, res) => {

    const accessToken = 'IGQWRON1hnN2tJQTZA3d1NWZAGpzSGdPaC13NEpKNW94bm1ndWY5STY1djhfdjhLOXJOZAGp0cUJwdm5sN1p0M2VoNWl6SDBJb1FEaHhub3NEZAmlBYnhCVFBPUUcweHB3QkIxQ3M4T1I3Tnc0RjliM0FveUdhRXBBNGMZD'; // Replace with your actual access token
    const fields = 'id,caption,media_type,media_url,permalink';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${accessToken}`;

    try {
        const response = await axios.get(url);
        const instagramData = response.data.data;

        for (const post of instagramData) {
            const existingPost = await InstagramPost.findOne({ postId: post.id });
            if (!existingPost) {
                const newPost = new InstagramPost({
                    postId: post.id,
                    imageUrl: post.media_url,
                    caption: post.caption,
                });
                await newPost.save();
            }
        }

        res.status(200).send({ message: 'Instagram posts fetched and saved successfully' });
    } catch (error) {
        console.error('Error fetching and saving Instagram posts:', error);
        res.status(500).send({ message: 'Error in fetching and saving Instagram posts', error: error.message });
    }
});


export default instagramRouter;
