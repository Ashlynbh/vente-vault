import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Store } from '../Store'; // Adjust the import path as needed

export default function AdminInstagramPosts() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { state } = useContext(Store);
    const { userInfo } = state;

    useEffect(() => {
        fetchPostsFromDb();
    }, []);

    // Fetch posts from your database
    const fetchPostsFromDb = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get('/api/instagram/instagram-posts', {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            });
            setPosts(data);
            setError('');
        } catch (error) {
            console.error('Error fetching Instagram posts from DB:', error);
            setError('Error fetching posts from database');
        } finally {
            setIsLoading(false);
        }
    };

        // Fetch and save new posts from Instagram
    const handleFetchAndSave = async () => {
        try {
            setIsLoading(true);
            await axios.get('/api/instagram/fetch-instagram-posts', {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            });
            fetchPostsFromDb(); // Refetch posts from the database after updating
        } catch (error) {
            console.error('Error fetching and saving Instagram posts:', error);
            setError('Error fetching and saving new posts');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleShowOnHomepage = async (postId) => {
        try {
            setIsLoading(true);
            await axios.put(`/api/instagram/instagram-post/homepage/${postId}`, {}, {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            });
            fetchPostsFromDb(); // Refetch posts from the database after updating
        } catch (error) {
            console.error('Error toggling post visibility:', error);
            setError('Error toggling post visibility');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="instagram-container">
            <h1 className="instagram-title">Instagram Posts</h1>
            <button onClick={handleFetchAndSave} disabled={isLoading} className="fetch-button">
                {isLoading ? 'Processing...' : 'Fetch and Save New Instagram Posts'}
            </button>
            {error ? <p className="error-message">{error}</p> : null}
            <div className="instagram-grid">
                {posts.slice(0, 12).map(post => ( // Display only the first 12 posts for pagination
                    <div key={post._id} className="instagram-card">
                        <img src={post.imageUrl} alt={post.caption} className="instagram-image" />
                        <div className="post-info">
                            <p className="post-id">ID: {post.postId}</p>
                            <p className="post-caption">{post.caption}</p>
                            <button onClick={() => toggleShowOnHomepage(post._id)} className="homepage-toggle">
                                {post.showOnHomepage ? 'Remove from Homepage' : 'Add to Homepage'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Pagination buttons or component */}
        </div>
    );

}
