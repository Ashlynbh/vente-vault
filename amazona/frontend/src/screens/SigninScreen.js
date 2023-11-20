
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

export default function SigninScreen() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get('redirect');
  const redirect = redirectInUrl ? redirectInUrl : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBrand, setIsBrand] = useState(false); 

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await Axios.post('/api/users/signin', {
        email,
        password,
      });
      ctxDispatch({ type: 'USER_SIGNIN', payload: data });
      localStorage.setItem('userInfo', JSON.stringify(data));
  // Redirect will be handled by useEffect based on the response
    } catch (err) {
      toast.error(getError(err));
    }
  };

   useEffect(() => {
    if (userInfo) {
      if (isBrand && userInfo.isBrand && userInfo.isBrandApproved) {
        navigate('/admin/dashboard');
      } else {
        navigate(redirect);
      }
    }
  }, [navigate, redirect, userInfo]);

  return (
    <Container className="sign-in-container">
      <Helmet>
        <title>Sign In</title>
      </Helmet>
      <h1 className="sign-in-title">SIGN IN</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Control
            type="email"
            required
            placeholder="EMAIL" 
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Control
            type="password"
            placeholder="PASSWORD" 
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="isBrandCheckbox">
          <Form.Check
          className="sign-in-text"
            type="checkbox"
            label="Sign in as a brand"
            checked={isBrand}
            onChange={(e) => setIsBrand(e.target.checked)}
          />
        </Form.Group>
        <div className="mb-3">
          <Button className= "sign-in-button"type="submit">Sign In</Button>
        </div>
        <div className="sign-in-text">
          New customer?{' '}
          <Link to={`/signup?redirect=${redirect}`}>Create your account</Link>
        </div>
        <div className="sign-in-text">
          Forget Password? <Link to={`/forget-password`}>Reset Password</Link>
        </div>
        <div className="sign-in-text">
          Interested in selling your products?{' '}
          <Link to={`/brand/expression-of-interest`}>Apply here</Link>
        </div>
      </Form>
    </Container>
  );
}