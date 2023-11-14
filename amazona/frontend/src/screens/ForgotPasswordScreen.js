import Axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import { getError } from '../utils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await Axios.post('/api/users/forgot-password', { email });
      toast.success(data.message);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <>
      <ToastContainer/>
      <Container className="small-container">
        <Helmet>
          <title>Forgot Password</title>
        </Helmet>
        <h1 className="my-3">Forgot Password</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
          <div className="mb-3">
            <Button type="submit">Submit</Button>
          </div>
        </Form>
      </Container>
    </>
  );
}