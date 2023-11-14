
import Axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { useContext, useEffect, useState } from 'react';
import { Store } from '../Store';
import { toast } from 'react-toastify';
import { getError } from '../utils';


export default function BrandSigninScreen() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get('redirect');
  const redirect = redirectInUrl ? redirectInUrl : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state; // Assume you have a state for brandInfo similar to userInfo

  const submitHandler = async (e) => {
  e.preventDefault();
  try {
    const { data } = await Axios.post('/api/users/brand/signin', {
      email,
      password,
    });
    ctxDispatch({ type: 'USER_SIGNIN', payload: data }); // Use the USER_SIGNIN action for brands as well
    localStorage.setItem('userInfo', JSON.stringify(data)); // Save as 'userInfo' in localStorage
    navigate(redirect || '/');
  } catch (err) {
    toast.error(getError(err));
  }
};

useEffect(() => {
  if (userInfo && (userInfo.isBrand || userInfo.isAdmin)) { // Redirect if it's a brand or admin
    navigate(redirect);
  }
}, [navigate, redirect, userInfo]);


  return (
    <Container className="sign-in-container">
      <Helmet>
        <title>Brand Sign In</title>
      </Helmet>
      <h1 className="my-3">Brand Sign In</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <div className="mb-3">
          <Button type="submit">Brand Sign In</Button>
        </div>
        <div className="mb-3">
          Forget Password? <Link to={`/forget-password`}>Reset Password</Link>
        </div>
        {/* Link to express interest in becoming a brand */}
        <div className="mb-3">
          Want to sell with us? <Link to={`/brand/expression-of-interest`}>Apply here</Link>

        </div>
      </Form>
    </Container>
  );
}
