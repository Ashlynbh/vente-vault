import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { Store } from '../Store';
import CheckoutSteps from '../components/CheckoutSteps';
import Axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { toast } from 'react-toastify';
import { getError } from '../utils';
import LoadingBox from '../components/LoadingBox';

const reducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_REQUEST':
      return { ...state, loading: true };
    case 'CREATE_SUCCESS':
      return { ...state, loading: false };
    case 'CREATE_FAIL':
      return { ...state, loading: false };
    case 'SET_DISCOUNT_CODE':
      return { ...state, discountCode: action.payload };
    case 'SET_DISCOUNT_AMOUNT':
      return { ...state, discountAmount: action.payload };
    case 'SET_DISCOUNT_MESSAGE':
      return { ...state, discountMessage: action.payload };

    default:
      return state;
  }
};



export default function PlaceOrderScreen() {
  const navigate = useNavigate();

  const [{ loading, discountCode, discountAmount }, dispatch] = useReducer(reducer, {
  loading: false,
  discountCode: '',
  discountAmount: 0,
  discountMessage: '',
});



  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;
  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100; // 123.2345 => 123.23
  cart.itemsPrice = round2(
  cart.cartItems.reduce((a, c) => {
    // Use reducedPrice if it exists, otherwise use the regular price
    const price = c.reducedPrice ? c.reducedPrice : c.price;
    return a + c.quantity * price;
  }, 0)
);



  // Set shipping and tax prices to zero
  cart.shippingPrice = 0;
  cart.taxPrice = 0;

  // Total price is just the items price since shipping and tax are zero
  cart.totalPrice = cart.itemsPrice;

  useEffect(() => {
    // Check if the payment method is not set and then set it to PayPal
    if (!cart.paymentMethod) {
      ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: 'PayPal' });
      // You might also need to update the cart object directly, but it's better to do it through a proper dispatch or state update function
    }
  }, [cart, ctxDispatch]); //


  const placeOrderHandler = async () => {
    try {
      dispatch({ type: 'CREATE_REQUEST' });

        // Map through cart items and use reducedPrice if available
      const orderItems = cart.cartItems.map(item => ({
        ...item,
        price: item.reducedPrice ? item.reducedPrice : item.price,
      }));


      const { data } = await Axios.post(
        '/api/orders',
        {
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
          discountAmount: discountAmount,
          discountCode: discountCode,
        },
        {
          headers: {
            authorization: `Bearer ${userInfo.token}`,
          },
        }
      );
      console.log({
        // The data being sent to the backend
        orderItems: cart.cartItems.map((x) => ({ ...x, product: x.product })),
        // ... other fields
        discountAmount: discountAmount,
        discountCode: discountCode,
      });

      ctxDispatch({ type: 'CART_CLEAR' });
      dispatch({ type: 'CREATE_SUCCESS' });
      localStorage.removeItem('cartItems');
      navigate(`/order/${data.order._id}`);
    } catch (err) {
      dispatch({ type: 'CREATE_FAIL' });
      toast.error(getError(err));
    }
  };

const validateDiscountCode = async () => {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    };

    const response = await Axios.post('/api/users/validate-discount', { discountCode }, config);

    if (response.data.success) {
      dispatch({ type: 'SET_DISCOUNT_AMOUNT', payload: response.data.discountAmount });
      // Update UI to show success message or update the price
      // ...
    }
  } catch (error) {
    let message = "Error applying discount code.";
    if (error.response && error.response.data && error.response.data.message) {
      // Use server's response message if available
      message = error.response.data.message;
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
      message = "No response from server when applying discount code.";
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    dispatch({ type: 'SET_DISCOUNT_MESSAGE', payload: message });
    toast.error(message);
  }
};


const discountedTotal = cart.totalPrice - discountAmount;

  return (
      <div className="custom-padding-container">
        <CheckoutSteps step1 step2 step3 step4></CheckoutSteps>
        <Helmet>
          <title>Preview Order</title>
        </Helmet>
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Shipping</Card.Title>
                <Card.Text>
                  <strong>Name:</strong> {cart.shippingAddress.fullName} <br />
                  <strong>Address: </strong> {cart.shippingAddress.address},
                  {cart.shippingAddress.city}, {cart.shippingAddress.postalCode},
                  {cart.shippingAddress.country}
                </Card.Text>
                <Link to="/shipping">Edit</Link>
              </Card.Body>
            </Card>

        <Card className="mb-3">
          <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                  {cart.cartItems.map((item) => (
                      <ListGroup.Item key={item._id}>
                          <Row className="align-items-center">
                              {/* Image and Name with more space */}
                              <Col xs={6} sm={4} md={6}>
                                  <img
                                      src={item.image}
                                      alt={item.name}
                                      className="img-fluid rounded img-thumbnail"
                                      style={{ maxWidth: '75px', marginRight: '10px' }} // Increased maxWidth for the image
                                  />
                                  <Link to={`/product/${item.slug}`} className="custom-link">{item.name}</Link>
                              </Col>

                              {/* Quantity */}
                              <Col xs={3} sm={4} md={3}>
                                  <span>{item.quantity}</span>
                              </Col>

                              {/* Price */}
                              <Col xs={3} sm={4} md={3}>
                                  {item.reducedPrice ? (
                                    <div>
                                      <span style={{ textDecoration: 'line-through' }}>${item.price}</span>
                                      <span> ${item.reducedPrice}</span>
                                      
                                    </div>
                                  ) : (
                                    <span>${item.price}</span>
                                  )}
                              </Col>
                          </Row>
                      </ListGroup.Item>
                  ))}
              </ListGroup>
              <Link to="/cart">Edit</Link>
          </Card.Body>
      </Card>

          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Order Summary</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Row>
                      <Col>Items</Col>
                      <Col>${cart.itemsPrice.toFixed(2)}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Shipping</Col>
                      <Col>${cart.shippingPrice.toFixed(2)}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    {/* <Row>
                      <Col>Tax</Col>
                      <Col>${cart.taxPrice.toFixed(2)}</Col>
                    </Row> */}
                  </ListGroup.Item>
                  <ListGroup.Item>
                      <Row>
                          <Col>Discount</Col>
                          <Col>${discountAmount.toFixed(2)}</Col>
                      </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>
                          <strong> Order Total</strong>
                      </Col>
                      <Col>
                          <strong>${discountedTotal.toFixed(2)}</strong>
                      </Col>
                  </Row>
                  </ListGroup.Item>

                  <div className="mb-3">
                    <label htmlFor="discountCode" className="custom-label">Discount Code</label>
                    <input
                      type="text"
                      id="discountCode"
                      className="custom-input"
                      value={discountCode}
                      onChange={(e) => dispatch({ type: 'SET_DISCOUNT_CODE', payload: e.target.value })}
                      placeholder="Enter discount code"
                    />
                    <button type="button" className="custom-button" onClick={validateDiscountCode}>Apply</button>
                  </div>
                  <ListGroup.Item>
                    <div className="d-grid">
                      <Button
                        type="button"
                        onClick={placeOrderHandler}
                        className="place-order-btn"
                        disabled={cart.cartItems.length === 0}
                      >
                        Place Order
                      </Button>
                    </div>
                    {loading && <LoadingBox></LoadingBox>}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
 }