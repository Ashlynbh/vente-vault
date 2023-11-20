import { useContext } from 'react';
import { Store } from '../Store';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MessageBox from '../components/MessageBox';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import ListGroupItem from 'react-bootstrap/esm/ListGroupItem';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;

  const updateCartHandler = async (item, quantity) => {
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
  };
  const removeItemHandler = (item) => {
    ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const { userInfo } = state;

  const checkoutHandler = () => {
    if (userInfo) {
    navigate('/shipping');
  } else {
    // If not logged in, redirect to sign in and then to shipping after signing in
    navigate('/signin?redirect=/shipping');
  }
};



  return (
    <div className="cart-container">  
      <Helmet>
        <title>Shopping Cart</title>
      </Helmet>
      <Row>
        <Col md={8}>
          {cartItems.length === 0 ? (
            <MessageBox>
              Cart is empty. <Link to="/">Go Shopping</Link>
            </MessageBox>
          ) : (
            <ListGroup>
              {cartItems.map((item) => (
                <ListGroup.Item key={item._id}>
 <Row className="align-items-start"> {/* Align items at the start */}
    {/* Column for Image */}
    <Col xs={6} md={6} lg={4}>
        <img
            src={item.image}
            alt={item.name}
            className="img-fluid rounded img-thumbnail"
            style={{ maxWidth: '100%' }}
        />
            </Col>
            {/* Column for Details */}
            <Col md={6} lg={8}>
                <div className="mt-0"> {/* Ensure no top margin */}
                    <div className="item-brand">{item.brand.toUpperCase()}</div> {/* Product Brand in capitals */}
                    <Link to={`/product/${item.slug}`} className="text-decoration-none"> {/* Remove text underline */}
                        <div className="item-name">{item.name}</div> {/* Product Name */}
                        {item.reducedPrice ? (
                          <div>
                            <span className="item-price-small original-price" style={{ textDecoration: 'line-through' }}>
                              ${item.price}
                            </span>
                            <span className="item-price-small reduced-price">
                              ${item.reducedPrice}
                            </span>
                          </div>
                        ) : (
                          <div className="item-price">${item.price}</div>
                        )}
                        <div className="item-size">Size: {item.size}</div> {/* Product Size */}
                        <div className="item-color">Color: {item.color}</div> {/* Product Color */}
                    </Link>

                    {/* Quantity Adjustment */}
                    <div className="my-2">
                        <Button
                        onClick={() =>
                          updateCartHandler(item, item.quantity -= 1)
                        }
                        variant="light"
                        disabled={item.quantity === 1}
                      >
                        <i className="fas fa-minus-circle"></i>
                      </Button>{' '}
                      <span>{item.quantity}</span>{' '}
                      <Button
                        variant="light"
                        onClick={() =>
                          updateCartHandler(item, item.quantity += 1)
                        }
                        disabled={item.quantity === item.countInStock}
                      >
                        <i className="fas fa-plus-circle"></i>
                      </Button>
                    </div>

                    {/* Remove Item Button */}
                    <div>
                        <Button
                            onClick={() => removeItemHandler(item)}
                            variant="light"
                        >
                            <i className="fas fa-trash"></i>
                        </Button>
                    </div>
                </div>
            </Col>
        </Row>


                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h3>
                  Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)} items) : $
                  {cartItems.reduce((a, c) => {
                    // Use reducedPrice if it exists, otherwise use the regular price
                    const price = c.reducedPrice ? c.reducedPrice : c.price;
                    return a + price * c.quantity;
                  }, 0).toFixed(2)} {/* Added toFixed(2) for proper formatting */}
                </h3>

                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-grid">
                    <Button
                    className="proceed-btn"
                    type="button"
                    variant="primary"
                    disabled={cartItems.length === 0}
                    onClick={checkoutHandler} // <-- Add this line
                  >
                    Proceed to Checkout
                  </Button>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

 