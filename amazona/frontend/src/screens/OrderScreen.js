import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe("pk_test_51OD2MKK7HyE7gRHbPvOinltMTNDPjaFmuo3nI4c6a5j6cXaFPnrHZes1dmhvOIEntHxFdtv9MSrvu7mbcpCqBiSe00S8lupeip");




function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, order: action.payload, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'PAY_REQUEST':
      return { ...state, loadingPay: true };
    case 'PAY_SUCCESS':
      return { ...state, loadingPay: false, successPay: true };
    case 'PAY_FAIL':
      return { ...state, loadingPay: false };
    case 'PAY_RESET':
      return { ...state, loadingPay: false, successPay: false };
    case 'SET_DISCOUNT_CODE':
      return { ...state, discountCodeApplied: action.payload };
        case 'DELIVER_REQUEST':
      return { ...state, loadingDeliver: true };
    case 'DELIVER_SUCCESS':
      return { ...state, loadingDeliver: false, successDeliver: true };
    case 'DELIVER_FAIL':
      return { ...state, loadingDeliver: false };
    case 'DELIVER_RESET':
      return {
        ...state,
        loadingDeliver: false,
        successDeliver: false,
      };

    default:
      return state;
  }
}


export default function OrderScreen() {


  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();

  const [
    {
      loading,
      error,
      order,
      successPay,
      loadingPay,
      loadingDeliver,
      successDeliver,
      discountCodeApplied,
      
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    order: {},
    error: '',
    successPay: false,
    loadingPay: false,
    discountCodeApplied:'',
  });

  const [clientSecret, setClientSecret] = useState("");

 

const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
const handlePaymentMethodChange = (method) => {
  setSelectedPaymentMethod(method);
};


const [elementsKey, setElementsKey] = useState(0); 

useEffect(() => {
  const fetchClientSecret = async () => {
    try {
      console.log("Preparing to fetch client secret");
      const items = order.orderItems.map(item => ({
        id: item._id,
        price: item.price, 
        quantity: item.quantity,
        paymentMethodType: selectedPaymentMethod
      }));


      console.log('Items sent to backend:', items);

      const response = await fetch("/api/orders/create-payment-intent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ 
          items: order.orderItems.map(item => ({
            id: item._id,
            price: item.price * 100, // Assuming prices are in dollars and need to be converted to cents
            quantity: item.quantity
          })),
          paymentMethodType: selectedPaymentMethod // This assumes 'selectedPaymentMethod' is defined and set elsewhere in your component
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setElementsKey(prevKey => prevKey + 1);
      } else {
        console.error('Error response from server:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching client secret:', error);
    }
  };

  if (order && order.orderItems && order.orderItems.length > 0) {
    fetchClientSecret();
  }
}, [order, userInfo.token]);




  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };



const onSuccessfulPayment = async (paymentIntent) => {
  try {
    dispatch({ type: 'PAY_REQUEST' });

    // Extract information from paymentIntent
    const paymentData = {
      paymentMethodId: paymentIntent.payment_method, // ID of the payment method used
      paymentmethod: paymentIntent.payment_method_types[0], // Type of payment method used (e.g., 'card')
      updatetime: new Date(paymentIntent.created * 1000).toISOString(), // Convert Stripe timestamp to ISO format
      // Include any other details you need
    };

    // Make the API call to your backend with the payment data
    const paymentResult = await axios.put(
      `/api/orders/${order._id}/stripe-pay`,
      paymentData,
      { headers: { authorization: `Bearer ${userInfo.token}` } }
    );

    dispatch({ type: 'PAY_SUCCESS', payload: paymentResult.data });
    toast.success('Order is paid');
    // Additional logic as needed
  } catch (err) {
    dispatch({ type: 'PAY_FAIL', payload: getError(err) });
    toast.error(getError(err));
  }
};




  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();
  const [googleApiKey, setGoogleApiKey] = useState('');







  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { value: order.totalPrice },
          },
        ],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onApprove(data, actions) {
  return actions.order.capture().then(async function (details) {
    try {
      dispatch({ type: 'PAY_REQUEST' });
      const paymentResult = await axios.put(
        `/api/orders/${order._id}/pay`,
        details,
        {
          headers: { authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: 'PAY_SUCCESS', payload: paymentResult.data });
      toast.success('Order is paid');

      // Use the discount code from the order object
      const discountCodeUsed = order.discountCodeApplied;
      console.log('Discount code applied to this order:', discountCodeUsed);

      if (discountCodeUsed) {
        // Attempt to mark the discount code as used
        const discountResult = await axios.post('/api/users/use-discount', { discountCode: discountCodeUsed }, {
          headers: { authorization: `Bearer ${userInfo.token}` }
        });

        console.log('Discount result from server:', discountResult.data);
      }
    } catch (err) {
      dispatch({ type: 'PAY_FAIL', payload: getError(err) });
      toast.error(getError(err));

      console.error('Error when trying to use discount code:', err);
    }
  });
}


function onError(err) {
  toast.error(getError(err));
}


  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
        // Optionally set the discount code in the state
        dispatch({ type: 'SET_DISCOUNT_CODE', payload: data.discountCodeApplied });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    if (!userInfo) {
      return navigate('/login');
       }

    if (
      !order._id ||
      successPay ||
      successDeliver ||
      (order._id && order._id !== orderId)
    ) {
      fetchOrder();
    if (successPay) {
        dispatch({ type: 'PAY_RESET' });
      }
    if (successDeliver) {
        dispatch({ type: 'DELIVER_RESET' });
      }
    } else {
      const loadPaypalScript = async () => {
        const { data: clientId } = await axios.get('/api/keys/paypal', {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: 'resetOptions',
          value: {
            'client-id': clientId,
            currency: 'AUD',
          },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
      };
      loadPaypalScript();
    }

    }, [
    order,
    userInfo,
    orderId,
    navigate,
    paypalDispatch,
    successPay,
    successDeliver,
  ]);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data } = await axios.get('/api/keys/google', {
          headers: { Authorization: `BEARER ${userInfo.token}` },
        });
        setGoogleApiKey(data.key);
      } catch (error) {
        console.error('Error fetching Google API key:', error);
        // Handle error appropriately
      }
    };

    if (userInfo) {
      fetchApiKey();
    }
  }, [userInfo]);


// Helper function to format the ISO date string
const formatDateAndTime = (isoString) => {
  const date = new Date(isoString);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
};

 
  return loading ? (
  <LoadingBox></LoadingBox>
) : error ? (
  <MessageBox variant="danger">{error}</MessageBox>
) : (
        <div className="order-screen-container">
          <Helmet>
            <title>Order {orderId}</title>
          </Helmet>
          <h1 className="custom-heading">Order {orderId}</h1>
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Shipping</Card.Title>
                  <Card.Text>
                    <strong>Name:</strong> {order.shippingAddress.fullName} <br />
                    <strong>Address: </strong> {order.shippingAddress.address},
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode},
                    {order.shippingAddress.country}
                    {order.shippingAddress.location && order.shippingAddress.location.lat && (
                      <div>
                        <img
                         src={`https://maps.googleapis.com/maps/api/staticmap?center=${order.shippingAddress.location.lat},${order.shippingAddress.location.lng}&zoom=13&size=600x300&maptype=roadmap&markers=color:red%7Clabel:S%7C${order.shippingAddress.location.lat},${order.shippingAddress.location.lng}&key=${googleApiKey}`}
                         alt="Shipping Location"
                        />
                      </div>
                    )}
                  </Card.Text>

                  {order.brandDeliveries && order.brandDeliveries.length > 0 && (
  <div>
    <h4>Shipping Status:</h4>
    {order.brandDeliveries.map((brandDelivery, index) => (
      <div key={index}>
        <strong>Brand: {brandDelivery.brandName}</strong>
        {brandDelivery.isDelivered ? (
          <MessageBox variant="success">
            Shipped on {new Date(brandDelivery.deliveredAt).toLocaleDateString()}
          </MessageBox>
        ) : (
          <MessageBox variant="warning">Not Shipped</MessageBox>
        )}
      </div>
    ))}
  </div>
)}

                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Payment</Card.Title>
                  <Card.Text>
                    <strong>Method:</strong> {order.paymentMethod}
                  </Card.Text>
                  {order.isPaid ? (
                    <MessageBox variant="success">
                       Paid at {formatDateAndTime(order.paidAt)}
                    </MessageBox>
                  ) : (
                    <MessageBox variant="danger">Not Paid</MessageBox>
                  )}
                </Card.Body>
              </Card>

              <Card className="mb-3">
                  <Card.Body>
                      <Card.Title>Items</Card.Title>
                      <ListGroup variant="flush">
                          {order.orderItems.map((item) => (
                              <ListGroup.Item key={item._id}>
                                  <Row className="align-items-center">
                                      {/* Image and Name with more space */}
                                      <Col xs={8} sm={6} md={6}>
                                          <img
                                              src={item.image}
                                              alt={item.name}
                                              className="img-fluid rounded img-thumbnail"
                                              style={{ maxWidth: '75px', marginRight: '10px' }}
                                          />
                                          <Link to={`/product/${item.slug}`}>
                                              <span className="item-name">{item.name}</span>
                                              <span className="item-size">{item.size}</span>
                                              <span className="item-color">{item.color}</span>
                                          </Link>
                                      </Col>

                                      {/* Quantity */}
                                      <Col xs={2} sm={3} md={3}>
                                          <span>{item.quantity}</span>
                                      </Col>

                                      {/* Price */}
                                      <Col xs={2} sm={3} md={3}>
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
                  </Card.Body>
              </Card>



            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Order Summary</Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Row>
                        <Col>Items</Col>
                        <Col>${order.itemsPrice.toFixed(2)}</Col>
                      </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <Row>
                        <Col>Shipping</Col>
                        <Col>${order.shippingPrice.toFixed(2)}</Col>
                      </Row>
                    </ListGroup.Item>
   
                    {order.discountAmount > 0 && (
                      <ListGroup.Item>
                        <Row>
                          <Col>Discount</Col>
                          <Col>-${order.discountAmount.toFixed(2)}</Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item>
                      <Row>
                        <Col>
                          <strong>Order Total</strong>
                        </Col>
                        <Col>
                          <strong>${(order.totalPrice - order.discountAmount).toFixed(2)}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                    {!order.isPaid && (
                    <>
                      {/* PayPal Payment Button */}
                      <ListGroup.Item>
                        {isPending ? (
                          <LoadingBox />
                        ) : (
                          <div>
                            <PayPalButtons
                              createOrder={createOrder}
                              onApprove={onApprove}
                              onError={onError}
                            ></PayPalButtons>
                          </div>
                        )}
                        {loadingPay && <LoadingBox />}
                      </ListGroup.Item>

                      {/* Stripe and Afterpay Payment Forms */}
                     {clientSecret && (
                    <ListGroup.Item>
                      {/* Using the key to remount the component */}
                      <Elements key={elementsKey} options={options} stripe={stripePromise}>
                        <CheckoutForm onSuccessfulPayment={onSuccessfulPayment}/>
                      </Elements>
                        </ListGroup.Item>
                      )}
                    </>
                  )}
              </ListGroup>

                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      );
}
