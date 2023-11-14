import React, { useState, useEffect,useContext } from 'react';
import axios from 'axios';
import { Store } from '../Store';

function InstagramPostModal({ show, handleClose, post, linkedProducts }) {
    return (
        <div className={`modal ${show ? 'show' : ''}`} onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close" onClick={handleClose}>&times;</span>
                <div className="modal-body">
                    <div className="instagram-image-container">
                        <img src={post.imageUrl} alt={post.caption} />
                    </div>
                    <div className="linked-products-container">
                        {linkedProducts.slice(0, 3).map(product => (
                            <div key={product.id} className="product">
                                <img src={product.image} alt={product.name} className="product-image"/>
                                <button onClick={() => window.location.href = `/product/${product.slug}`}>
                                    Shop Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function InstagramFeed() {
    const [posts, setPosts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [linkedProducts, setLinkedProducts] = useState([]);
    const { state } = useContext(Store); // Assuming your user info is stored in a context called Store
    const { userInfo } = state; // userInfo should have a property to indicate if the user is an admin

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('/api/instagram/homepage-posts');
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching Instagram posts', error);
            }
        };

        fetchPosts();
    }, []);

    const handlePostClick = async (post) => {
        setSelectedPost(post);
        setShowModal(true);
        // Fetch linked products for the clicked post
        const products = await fetchLinkedProducts(post.postId);
        setLinkedProducts(products);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPost(null);
        setLinkedProducts([]);
    };

    const fetchLinkedProducts = async (postId) => {
        try {
            const response = await axios.get(`/api/products/instagram/${postId}`, {
                headers: {
                     Authorization: `Bearer ${userInfo.token}`, // If authentication is require
                }
            });
            return response.data; // Array of products linked to the Instagram post
        } catch (error) {
            console.error('Error fetching linked products:', error);
            return [];
        }
    };

return (
            <div className="instagram-feed-container">
                <div className="instagram-feed-heading">
                    <h2>SHOP INSTAGRAM</h2>
                    <p>Tag @ventevault for a chance to be featured.</p>
                </div>

                <div className="instagram-feed">
                    {posts.map(post => (
                        <div key={post._id} className="instagram-post" onClick={() => handlePostClick(post)}>
                            <img src={post.imageUrl} alt={post.caption} />
                            <div className="instagram-post-details">
                                {/* Additional details */}
                            </div>
                        </div>
                    ))}
                    {selectedPost && (
                        <InstagramPostModal 
                            show={showModal} 
                            handleClose={handleCloseModal} 
                            post={selectedPost} 
                            linkedProducts={linkedProducts}
                        />
                    )}
                </div>
            </div>
        );

}