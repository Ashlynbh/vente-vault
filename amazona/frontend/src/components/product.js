import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from "react-router-dom";
import Rating from './Rating'
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';


function Product(props) {
    const {product} = props;
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const {
        cart: { cartItems },
    } = state;

    const addToCartHandler = async (item) => {
        const existItem = cartItems.find((x) => x._id === product._id);
        const quantity = existItem ? existItem.quantity + 1 : 1;
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

    return (
         <Card className="product-card">
            <Link to={`/product/${product.slug}`}>
                <img src={product.image} className="card-img-top" alt={product.name} />
            </Link>
            <Card.Body className="product-detail">
                <Link to={`/product/${product.slug}`}>
                <Card.Title>{product.name}</Card.Title>
                </Link>
                {/* Display price or reduced price */}
                {product.reducedPrice ? (
                <div>
                    <span className="product-price-small original-price" style={{ textDecoration: 'line-through' }}>
                    ${product.price}
                    </span>
                    <span className="product-price-small reduced-price">
                    ${product.reducedPrice}
                    </span>
                </div>
                ) : (
                <Card.Text className="product-price">${product.price}</Card.Text>
                )}

                {/* Stock availability */}
                {product.countInStock === 0 && (
                <Button variant="light" disabled>
                    Out of stock
                </Button>
                )}
            </Card.Body>
            </Card>

    );
}



export function SimplifiedProduct(props) {
  const { product } = props;
  return (
    <Card className="product-cards">
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
        <Card.Img src={product.image} alt={product.name} />
        <Card.Body className="product-detail">
          <Card.Title>{product.name}</Card.Title>
          {product.reducedPrice ? (
            <div>
              <span className="product-price-small original-price" style={{ textDecoration: 'line-through' }}>
                ${product.price}
              </span>
              <span className="product-price-small reduced-price">
                ${product.reducedPrice}
              </span>
            </div>
          ) : (
            <Card.Text className="product-price">${product.price}</Card.Text>
          )}
        </Card.Body>
      </Link>
    </Card>
  );
}


export default Product;
