import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getError } from '../utils';

const BrandExpressionOfInterestScreen = () => {
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');

  const submitHandler = async (event) => {
    event.preventDefault();
    try {
      // POST request to your API endpoint
      const { data } = await axios.post('/api/users/expression-of-interest', {
        brandName,
        contactName,
        email,
        password,
        website,
        message,
      });
    toast.success(data.message);
    // Reset the form or navigate the user to another page
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Handle the duplicate key error specifically
      toast.error('Email already exists');
    } else {
      // Handle other types of errors
      toast.error(getError(error));
    }
  }
};

  return (
    <div className="brand-signup-flex-container mt-3">
      {/* Image Container */}
      <div className="brand-signup-image-container">
        <img src="../images/brand-pic.png" alt="Brand Collaboration" />
      </div>

      <div className="brand-signup-form-container">
        <h1 className="brand-title">BRAND SIGN IN</h1>
        <p className="brand-signup-description">
      Welcome to our marketplace! We're excited that you're interested in selling your products with us. 
      By signing up as a brand, you'll have the opportunity to showcase and sell your clothing to a wide audience.
      Please fill out the form below to get started. Note that all brand sign-ups are subject to approval 
      by our team, and we aim to complete this process within 48 hours. We look forward to partnering with you!
    </p>
      <Form className="brand-form" onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="brandName">
          <Form.Control
            type="text"
            className="brand-form-control"
            placeholder="ENTER BRAND NAME"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="contactName">
          <Form.Control
            type="text"
            className="brand-form-control"
            placeholder="CONTACT NAME"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Control
            type="email"
            className="brand-form-control"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
         <Form.Group className="mb-3" controlId="password">
          <Form.Control
            type="password"
            className="brand-form-control"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="website">
          <Form.Control
            type="text"
            className="brand-form-control"
            placeholder="WEBSITE (OPTIONAL)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="message">
          <Form.Control
            className="brand-form-control"
            as="textarea"
            rows={3}
            placeholder="MESSAGE"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </Form.Group>

        <Button className="sign-in-button" variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
        
    </div>
  );
};

export default BrandExpressionOfInterestScreen;
