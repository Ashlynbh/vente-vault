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
  const [submissionStatus, setSubmissionStatus] = useState('');

  const pageStyles = {
    margin: 0,
    padding: 0,
    height: '100vh',
    backgroundColor: 'whitesmoke',
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmissionStatus(''); // Reset the status message
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
      setSubmissionStatus('Thank you! We will be in touch.');
      // Here, you can also reset the form or navigate the user to another page
    } catch (error) {
      toast.error('There was an error with your submission.');
      setSubmissionStatus('There was an error with your details, please try again.');
      // Handle other types of errors, such as displaying a specific message
    }
  };


  return (
      <div className="coming-soon-overlay">
    <div style={pageStyles} className="coming-soon-container">
     <div className="central-content">
      <div className="comingsoon-image-container">
        <img className="comingsoon-image" src="../images/brand-pic.png" alt="Brand Collaboration" />
      </div>

      <div className="brand-signup-form-container">
        <h1 className="comingsoon-title">COMING SOON</h1>
        <h2 className="comingsoon-subtitle">BRAND SIGN UP</h2>
        <p className="comingsoon-description">
      Welcome to our marketplace! 
      We're excited that you're interested in selling your products with us. 
      By signing up as a brand, you'll have the opportunity to showcase and sell your clothing to a wide audience.
      Please fill out the form below to get started. Note that all brand sign-ups are subject to approval 
      by our team. 
      We look forward to partnering with you!
    </p>
      <Form className="comingsoon-form" onSubmit={submitHandler}>
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
 {submissionStatus && <div className="submission-status-message">{submissionStatus}</div>}
        <Button className="sign-in-button" variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
    </div>
        
    </div>
    </div>
  );
};

export default BrandExpressionOfInterestScreen;
