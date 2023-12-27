import React, { useState } from 'react';
import { toast } from 'react-toastify';

const JoinUs = () => {
  
    const [email, setEmail] = useState('');

const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/api/users/mailjet/add-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (data.success) {
            toast.success('Thank you for subscribing!');
            setEmail(''); 
        } else {
            toast.error(data.message); // Display the error message from the backend
        }
    } catch (error) {
        console.error("There was an error adding the email.", error);
        toast.error('Oops! Something went wrong.');
    }
};


    return (
        <section className="join-us-section">
            <h2>Join us to receive information on exclusive deals</h2>
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
