import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true };
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false };
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false };
    default:
      return state;
  }
};

export default function UserEditScreen() {
  const [{ loading, error, loadingUpdate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
  });

  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: userId } = params;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBrand, setIsBrand] = useState(false);
  const [isBrandApproved, setIsBrandApproved] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');



useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setName(data.name);
      setEmail(data.email);
      setIsAdmin(data.isAdmin);
      setIsBrand(data.isBrand);
      setIsBrandApproved(data.isBrandApproved);

      // Fetch brand-specific information if the user is a brand
      if (data.isBrand) {
        const brandData = await axios.get(`/api/users/brand-info/${userId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        // Assuming brandData contains fields like brandName, contactName, etc.
        setBrandName(brandData.data.brandName);
        setContactName(brandData.data.contactName);
        setWebsite(brandData.data.website);
        setMessage(brandData.data.message);
      }

      dispatch({ type: 'FETCH_SUCCESS' });
    } catch (err) {
      dispatch({
        type: 'FETCH_FAIL',
        payload: getError(err),
      });
    }
  };
  fetchData();
}, [userId, userInfo.token]);

  const submitHandler = async (e) => {
  e.preventDefault();
  try {
    dispatch({ type: 'UPDATE_REQUEST' });
    const { data } = await axios.put(
      `/api/users/${userId}`,
      { _id: userId, name, email, isAdmin, isBrand, isBrandApproved }, // Include new states
      {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      }
    );
    dispatch({
      type: 'UPDATE_SUCCESS',
    });
    toast.success('User updated successfully');
    navigate('/admin/users');
  } catch (error) {
    toast.error(getError(error));
    dispatch({ type: 'UPDATE_FAIL' });
  }
};

const handleUpdateClick = async (e) => {
  if (isBrandApproved) {
    // Call function to send email
    await sendBrandApprovalEmail2();
  }
  // Proceed to submit the form
  submitHandler(e); // Pass the event object to submitHandler
};

const sendBrandApprovalEmail2 = async () => {
  try {
    // Replace '/api/send-brand-approval-email' with your actual backend endpoint
    const response = await axios.post('/api/users/send-brand-approval-email', {
      userEmail: email, // Assuming 'email' is the state variable holding the user's email
      userName: name,  // Assuming 'name' is the state variable holding the user's name
    }, {
      headers: { Authorization: `Bearer ${userInfo.token}` }, // Include the auth token if needed
    });

    console.log('Email sent response:', response.data);
    // Optionally, show a success message to the admin
  } catch (error) {
    console.error('Error sending email:', error);
    // Optionally, show an error message to the admin
  }
};


 return (
  <Container className="sign-in-container">
    <Helmet>
      <title>Edit User {userId}</title>
    </Helmet>
    <h1>Edit User {userId}</h1>

    {loading ? (
      <LoadingBox></LoadingBox>
    ) : error ? (
      <MessageBox variant="danger">{error}</MessageBox>
    ) : (
      <Form onSubmit={submitHandler}>
        {isBrand ? (
          // Brand-specific form fields
          <>
            <Form.Group className="mb-3" controlId="brandName">
              <Form.Label>Brand Name</Form.Label>
              <Form.Control
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="contactName">
              <Form.Label>Contact Name</Form.Label>
              <Form.Control
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="website">
              <Form.Label>Website</Form.Label>
              <Form.Control
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="message">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Form.Group>
             <Form.Check
              className="mb-3"
              type="checkbox"
              id="isBrand"
              label="Brand"
              checked={isBrand}
              onChange={(e) => setIsBrand(e.target.checked)}
            />
            <Form.Check
              className="mb-3"
              type="checkbox"
              id="isBrandApproved"
              label="Brand Approved"
              checked={isBrandApproved}
              onChange={(e) => setIsBrandApproved(e.target.checked)}
            />
          </>
        ) : (
          // Regular user form fields
          <>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
          </>
        )}

        {/* Common fields for both user types */}
        <Form.Check
          className="mb-3"
          type="checkbox"
          id="isAdmin"
          label="Admin"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
        />

        {/* Submit Button */}
        <div className="mb-3">
          <Button onClick={handleUpdateClick} disabled={loadingUpdate} type="submit">
            Update
          </Button>
          {loadingUpdate && <LoadingBox></LoadingBox>}
        </div>
      </Form>
    )}
  </Container>
);
        }