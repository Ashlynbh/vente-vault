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
    <div className="container mt-3">
      <h1>Brand Sign Up</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="brandName">
          <Form.Label>Brand Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter brand name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="contactName">
          <Form.Label>Contact Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter contact name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
         <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="website">
          <Form.Label>Website (optional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="message">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
};

export default BrandExpressionOfInterestScreen;
