import axios from "axios";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import Rating from "../components/Rating";
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card'
import ListGroupItem from "react-bootstrap/esm/ListGroupItem";
import Button from "react-bootstrap/esm/Button";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";
import LoadingBox from "../components/LoadingBox";
import { getError } from "../utils";
import { Store } from "../Store";
import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { toast } from 'react-toastify';



const reducer = (state, action) => {
    switch(action.type) {
        case 'REFRESH_PRODUCT':
            return { ...state, product: action.payload };
        case 'CREATE_REQUEST':
            return { ...state, loadingCreateReview: true };
        case 'CREATE_SUCCESS':
            return { ...state, loadingCreateReview: false };
        case 'CREATE_FAIL':
            return { ...state, loadingCreateReview: false };
        case 'FETCH_REQUEST':
            return{...state, loading:true};
        case 'FETCH_SUCCESS':
            return {...state, product:action.payload,loading: false};
        case 'FETCH_FAIL': 
            return {...state, loading:false, error:action.payload};
        default:
            return state;
    }
};
function ProductScreen(){
    let reviewsRef = useRef();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedColorHex, setSelectedColorHex] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [availableSizes, setAvailableSizes] = useState({});
    const [isProductOutOfStock, setIsProductOutOfStock] = useState(false);


    const params = useParams();
    const {slug} = params;
    const navigate = useNavigate();

    const [learnMoreVisible, setLearnMoreVisible] = useState(false);

 

    const [{ loading, error, product, loadingCreateReview }, dispatch] =
        useReducer(reducer, {
        product: [],
        loading: true,
        error: '',
        });

 useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get(`/api/products/slug/${slug}`);
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });

        if (result.data && result.data.variations && result.data.variations.length > 0) {
          setIsProductOutOfStock(
            result.data.variations.every(variation => 
              variation.sizes.every(size => size.countInStock === 0))
          );

          const firstAvailableColor = result.data.variations.find(variation => 
            variation.sizes.some(size => size.countInStock > 0)
          );

          if (firstAvailableColor) {
            setSelectedColor(firstAvailableColor.color);
            setSelectedColorHex(firstAvailableColor.colourhex);
            setSelectedImage(firstAvailableColor.colorImage);
            setAvailableSizes(firstAvailableColor.sizes.reduce((acc, curr) => {
              acc[curr.size] = curr.countInStock > 0;
              return acc;
            }, {}));
          }
        }
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };
    fetchData();
  }, [slug]);


    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;


    const addToCartHandler = async () => {
        const existItem = cart.cartItems.find((x) => x._id === product._id);
        const quantity = existItem ? existItem.quantity += 1 : 1;
        const { data } = await axios.get(`/api/products/${product._id}`);
        if (!selectedColor || !selectedSize) {
        window.alert('Please select color and size.');
        return;
    }

        if (data.countInStock < quantity) {
            window.alert('Sorry. Product is out of stock');
            return;
        }
            ctxDispatch({
                type: 'CART_ADD_ITEM',
                payload: { ...product, quantity, color: selectedColor,
            size: selectedSize, },
            });
            navigate('/cart');
        };
    
   const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

useEffect(() => {
  if (product && product.variations && selectedColor) {
    const sizesForColor = product.variations
      .find((variation) => variation.color === selectedColor)
      ?.sizes.reduce((acc, curr) => {
        acc[curr.size] = curr.countInStock > 0;
        return acc;
      }, {});

    setAvailableSizes(sizesForColor);
  } else {
    setAvailableSizes({});
  }
}, [product, selectedColor]);


useEffect(() => {
  if (product && product.variations && product.variations.length > 0) {
    // Set the initial selected color to the first color in the variations array
    setSelectedColor(product.variations[0].color);
    setSelectedColorHex(product.variations[0].colourhex); // Assuming you have a state for this
  }
}, [product]);


    const submitHandler = async (e) => {
      e.preventDefault();
      if (!comment || !rating) {
        toast.error('Please enter comment and rating');
        return;
      }
      try {
        const { data } = await axios.post(
          `/api/products/${product._id}/reviews`,
          { rating, comment, name: userInfo.name },
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );

      dispatch({
        type: 'CREATE_SUCCESS',
      });
      toast.success('Review submitted successfully');
      product.reviews.unshift(data.review);
      product.numReviews = data.numReviews;
      product.rating = data.rating;
      dispatch({ type: 'REFRESH_PRODUCT', payload: product });
      window.scrollTo({
        behavior: 'smooth',
        top: reviewsRef.current.offsetTop,
      });
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: 'CREATE_FAIL' });
    }
  };

   // Function to toggle the visibility
    const toggleLearnMore = () => {
      setLearnMoreVisible(!learnMoreVisible);
    };
  return loading ? (
    <LoadingBox />
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
      <Row>
      <Col md={1}>
        
        <div className="mt-3 thumbnails">
          {[product.image, ...product.images].map((x) => (
            <Button
              className="thumbnail"
              key={x}
              variant="light"
              onClick={() => setSelectedImage(x)}
            >
              <img className="img-thumbnail" src={x} alt="product" />
            </Button>
          ))}
              {/* Color Images */}
            {product.variations.map((variation) => (
              variation.colorImage && (
                <Button
                  className="thumbnail"
                  key={variation.color}
                  variant="light"
                  onClick={() => setSelectedImage(variation.colorImage)}
                >
                  <img className="img-thumbnail" src={variation.colorImage} alt={variation.color} />
                </Button>
              )
            ))}
        </div>

        </Col>
          <Col md={6}>
            <img
              className="img-large"
              src={selectedImage || product.image}
              alt={product.name}
            ></img>
          </Col>
          <Col className="product-section2" md={4}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Helmet>
                  <title>{product.name}</title>
                </Helmet>
                <h2 className="product-brand">{product.brand.toUpperCase()}</h2>
                <h1 className="product-title">{product.name}</h1>
                <h2 className="product-price">${product.price}</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Rating
                  rating={product.rating}
                  numReviews={product.numReviews}
                ></Rating>
              </ListGroup.Item>
              {/* Color Selection */}
              <ListGroup.Item>
                <div className="color-selection">
                  <div className="color-swatch-container">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.color}
                        className={`color-swatch ${selectedColor === variation.color ? 'selected' : ''}`}
                        style={{ backgroundColor: variation.colourhex }}
                        onClick={() => {
                          setSelectedColor(variation.color);
                          setSelectedColorHex(variation.colourhex);
                          setSelectedImage(variation.colorImage); // Set the main image to the color-specific image
                        }}
                        title={variation.color}
                      >
                        {/* You can put some text or an icon here if needed */}
                      </button>
                    ))}
                  </div>
                </div>
              </ListGroup.Item>

              {/* Size Selection based on selectedColor */}
          
                {product && selectedColor && (
                  <ListGroup.Item>
                    <div className="size-selection">
                      {allSizes.map((size) => {
                        const isSizeAvailable = availableSizes[size];
                        const isSelected = selectedSize === size;
                        const className = `size-option${isSelected ? ' selected' : ''}${isSizeAvailable ? '' : ' disabled'}`;

                        return (
                          <button
                            key={size}
                            className={className}
                            onClick={() => isSizeAvailable && setSelectedSize(size)}
                            disabled={!isSizeAvailable}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </ListGroup.Item>
                )}            
             <ListGroup.Item>
                {isProductOutOfStock ? (
                  <div className="out-of-stock-label">
                    Out of Stock
                  </div>
                ) : (
                  <Button className="add-to-cart" onClick={addToCartHandler} variant="primary">
                    Add to Cart
                  </Button>
                )}
              </ListGroup.Item>
      
              <ListGroup.Item className="product-description">
                <p>{product.description}</p>
                <Button variant="link" className="learn-more-btn" onClick={toggleLearnMore}>
                  {learnMoreVisible ? 'Learn Less' : 'Learn More'}
                </Button>
              </ListGroup.Item>
              {learnMoreVisible && ( // Conditional rendering based on the state
            <ListGroup.Item>
              <div className="product-extra-info">
                <h4>Model's Details</h4>
                <p> Our model is wearing a size {product.sizeOfModelsGarment}</p>
                <h4>Measurements</h4>
                <p>Chest: {product.modelBodyMeasurements.chest}, Waist: {product.modelBodyMeasurements.waist}, Hips: {product.modelBodyMeasurements.hips}</p>
                <h4>Material</h4>
                <p>{product.fabricMaterial}</p>
                <h4>Clothing Measurements</h4>
                <p>Chest: {product.measurements.chest}, Waist: {product.measurements.waist}, Hips: {product.measurements.hips}</p>
                <h4>Delivery</h4>
                <p>This item is sent directly from our partner and will arrive separately if ordered with other items.</p>
              </div>
            </ListGroup.Item>
          )}
            </ListGroup>
          </Col>
          
      </Row>
<div className="my-3 product-reviews">

  
  {/* Always display the rating and number of reviews */}
  <ListGroup.Item>
  <div className="review-summary">
    <Rating rating={product.rating} />
    {typeof product.numReviews === 'number' ? (
      <span>{`${product.numReviews} review${product.numReviews !== 1 ? 's' : ''}`}</span>
    ) : (
      // Temporarily render a different text to see if this is the place causing the issue.
      <span>No reviews available</span>
    )}

  </div>
    </ListGroup.Item>
      {/* Display each review in the list */}
      {product.reviews.map((review) => (
        <ListGroup.Item key={review._id}>
          <strong>{review.name}</strong>
          <Rating rating={review.rating} caption=" " />
          <p>{review.createdAt.substring(0, 10)}</p>
          <p>{review.comment}</p>
        </ListGroup.Item>
      ))}
          <div className="my-3">
            {userInfo ? (
              <>
               <div className="write-review-container">
                  <Button 
                    variant="primary" 
                    onClick={() => setShowReviewForm(true)} 
                    className="mb-3 write-review"
                  >
                    Write a review
                  </Button>
                </div>
                {showReviewForm && (
                  <form onSubmit={submitHandler}>
                    <h2>Write areview</h2>
                    <Form.Group className="mb-3" controlId="rating">
                      <Form.Label>Rating</Form.Label>
                      <Form.Select
                        aria-label="Rating"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="1">1- Poor</option>
                        <option value="2">2- Fair</option>
                        <option value="3">3- Good</option>
                        <option value="4">4- Very good</option>
                        <option value="5">5- Excellent</option>
                      </Form.Select>
                    </Form.Group>
                    <FloatingLabel
                      controlId="floatingTextarea"
                      label="Comments"
                      className="mb-3"
                    >
                      <Form.Control
                        as="textarea"
                        placeholder="Leave a comment here"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </FloatingLabel>
                    <div className="mb-3">
                      <Button className="product-submit" disabled={loadingCreateReview} type="submit">
                        Submit
                      </Button>
                      {loadingCreateReview && <LoadingBox></LoadingBox>}
                    </div>
                  </form>
                )}
              </>
            ) : (
              <MessageBox>
                Please{' '}
                <Link to={`/signin?redirect=/product/${product.slug}`}>
                  Sign In
                </Link>{' '}
                to write a review
              </MessageBox>
            )}
          </div>

      </div>
    </div>
  );
}
export default ProductScreen;
   