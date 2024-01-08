import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getError } from '../utils';
import { Modal } from 'react-bootstrap';
import { FaLongArrowAltRight } from 'react-icons/fa';







const BrandExpressionOfInterestScreen = () => {
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  // At the beginning of your component
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [emailExistsErrorTopForm, setEmailExistsErrorTopForm] = useState(false);
  const [emailExistsErrorBottomForm, setEmailExistsErrorBottomForm] = useState(false);




  const pageStyles = {
    margin: 0,
    padding: 0,
    height: '100vh',
    backgroundColor: 'whitesmoke',
  };

const handleSubscriptionSubmit = async (event) => {
  event.preventDefault();
  setEmailExistsErrorTopForm(false); // Reset the error state
  try {
    const response = await fetch('/api/users/mailjet/add-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: subscriberEmail })
    });
    const data = await response.json();

    if (response.status === 400 && data.message.includes('already exists')) {
      toast.error("This email is already subscribed.");
      setEmailExistsErrorTopForm(true);
    } else if (data.success) {
      toast.success('Thank you for subscribing!');
      setSubscriberEmail('');
      setIsSubscribed(true);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    console.error("There was an error adding the email.", error);
    toast.error('Oops! Something went wrong.');
  }
};




const submitHandler = async (event) => {
  event.preventDefault();
  setSubmissionStatus(''); // Reset the status message
  setEmailExistsErrorBottomForm(false); // Reset the error state
  try {
    const response = await axios.post('/api/users/expression-of-interest', {
      brandName,
      contactName,
      email,
      password,
      website,
      message,
    });

    if (response.data && response.data.success) {
      toast.success(response.data.message);
      setIsSignedUp(true);
    } else if (response.data && !response.data.success && response.data.message.includes('already exists')) {
      toast.error("This email is already signed up.");
      setEmailExistsErrorBottomForm(true);
    } else {
      toast.error(response.data.message);
    }
  } catch (error) {
    console.error('There was an error with your submission.', error);
    toast.error('Oops! Something went wrong.');
    if (error.response && error.response.data && error.response.data.message.includes('already exists')) {
      setEmailExistsErrorBottomForm(true);
    } else {
      setSubmissionStatus('There was an error with your details, please try again.');
    }
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
        <h2 className="sub-title">Customers</h2>
      <p className="comingsoon-description">
        Get Ready for Exclusive Fashion Deals! 🌟 Sign up now to stay in the loop about our launch and be the first to shop all things fashion at discount prices.
      </p>
      {isSubscribed && (
        <p className="comingsoon-description">
          Thank you for subscribing!
        </p>
      )}
    {emailExistsErrorTopForm && (
      <p className="error-message">
        This email already exists.
      </p>
    )}

    <Form onSubmit={handleSubscriptionSubmit} className="subscribe-form">
          <div className="d-flex align-items-center">
            <Form.Group controlId="subscriberEmail" className="flex-grow-1 mr-2">
              <Form.Control
                type="email"
                placeholder="EMAIL"
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                required
                style={{ width: '100%' }} // or any specific width
              />
            </Form.Group>
        <Button className="coming-soon-btn" variant="primary" type="submit">
          Notify me
        </Button>
          </div>
        </Form>
        {/* Horizontal Line to separate the two sections */}
      <hr className="section-divider" />
      <h2 className="sub-title">Brands</h2>
      <p className="comingsoon-description">
        Join the Fashion Revolution! 🚀 Are you a fashion brand with surplus stock? Express your interest now and sign up for our information pack. By signing up as a brand you will have the opportunity to showcase your brand to a wide audience that celebrates style.
      </p>
      {isSignedUp && (
        <p className="comingsoon-description">
          Thank you for signing up for Vente Vault! We will send you an information pack prior to launch.
        </p>
      )}
      {emailExistsErrorBottomForm && (
        <p className="comingsoon-description">
          This email already exists.
        </p>
      )}


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
 {submissionStatus && <div className="submission-status-message">{submissionStatus}</div>}
        <Button className="coming-soon-btn" variant="primary" type="submit">
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
