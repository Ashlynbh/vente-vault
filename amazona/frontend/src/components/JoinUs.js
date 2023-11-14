import React, { useState } from 'react';
import { toast } from 'react-toastify';

const JoinUs = () => {
    const [email, setEmail] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        try {
            toast.success('Thank you for subscribing!');
        } catch (error) {
            toast.error('Oops! Something went wrong.');
        }
    };

    return (
        <section className="join-us-section">
            <h2>Join us to receive 10% off your first order</h2>
            <form onSubmit={handleEmailSubmit}>
                <input 
                    type="email" 
                    placeholder="Enter your email..." 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">→</button>
            </form>
        </section>
    );
};

export default JoinUs;
