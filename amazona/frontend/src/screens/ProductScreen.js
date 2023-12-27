import axios from "axios";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import Rating from "../components/Rating";
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/esm/Button";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";
import LoadingBox from "../components/LoadingBox";
import { getError } from "../utils";
import { Store } from "../Store";
import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import Modal from 'react-bootstrap/Modal';




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
    const [hasScrolled, setHasScrolled] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    const toggleSizeGuideModal = () => {
      setShowSizeGuide(!showSizeGuide);
    };



    function SampleNextArrow(props) {
    const { className, style, onClick, currentSlide, slideCount } = props;
    const isLastSlide = currentSlide >= slideCount - 7; // Adjust this based on slidesToShow

    return (
      !isLastSlide && (
        <div
          className={`${className} custom-slick-next`}
          style={{ ...style, display: "block" }}
          onClick={onClick}
        >
          <i className="fa fa-chevron-down"></i>
        </div>
      )
    );
  }


  function SamplePrevArrow(props) {
    const { className, style, onClick, currentSlide } = props;
    return (
      <div
        className={`${className} custom-slick-prev`}
        style={{ ...style, display: "block" }}
        onClick={() => {
          if (currentSlide > 0) {
            onClick();
          }
        }}
      >
        <i className="fa fa-chevron-up"></i>
      </div>
    );
  }

  function SampleNextArrowHorizontal(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} custom-slick-next-horizontal`}
      style={{ ...style, display: "block" }}
      onClick={onClick}
    >
      <i className="fa fa-chevron-right"></i> {/* Right arrow */}
    </div>
  );
}

function SamplePrevArrowHorizontal(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} custom-slick-prev-horizontal`}
      style={{ ...style, display: "block" }}
      onClick={onClick}
    >
      <i className="fa fa-chevron-left"></i> {/* Left arrow */}
    </div>
  );
}

    // State to track the current slide
  const [currentSlide, setCurrentSlide] = useState(0);

  const [{ loading, error, product, loadingCreateReview }, dispatch] = useReducer(reducer, {
  product: { images: [], variations: [] }, // Default values
  loading: true,
  error: '',
});

  const allImages = product && Array.isArray(product.images) && Array.isArray(product.variations)
  ? [
      product.image, 
      ...product.images, 
      ...product.variations.map(v => v.colorImage)
    ].filter(Boolean)
  : [product.image];

  // Calculate the total number of slides
  const slideCount = allImages.length;



  const sliderSettings = {
  // Your default settings here...
  infinite: false,
  arrows: true,
  vertical: true,
  verticalSwiping: true,
  slidesToScroll: 1,
  slidesToShow: 1, // Default to show 1 slide at a time, adjust as needed
  nextArrow: <SampleNextArrow />,
  prevArrow: <SamplePrevArrow />,
  responsive: [
    {
      breakpoint: 768, // Adjust as needed for mobile breakpoint
      settings: {
        vertical: false, // Disable vertical mode for mobile
        verticalSwiping: false,
        slidesToShow: 4, // Show 3 images at a time on mobile
        slidesToScroll: 1, // Scroll 1 image at a time
        nextArrow: <SampleNextArrowHorizontal />,
        prevArrow: <SamplePrevArrowHorizontal />,
      }
    }
    
  ]
};






    const params = useParams();
    const {slug} = params;
    const navigate = useNavigate();

    const [learnMoreVisible, setLearnMoreVisible] = useState(false);

 



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
  console.log(allImages); // Check the array contents


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
       <Col xs={12} md={1} lg={1} className="order-2 order-md-1 mt-md-3 mt-lg-0">
        
        <div className="mt-3 thumbnails">
             {allImages.length > 6 ? (
              <Slider {...sliderSettings}>
                {allImages.map((x, index) => (
                  <div key={index}>
                    <img
                      className="product-thumbnail"
                      src={x}
                      alt="product"
                      onClick={() => setSelectedImage(x)}
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              allImages.map((x, index) => (
                <Button
                  className="thumbnail"
                  key={index}
                  variant="light"
                  onClick={() => setSelectedImage(x)}
                >
                  <img className="product-thumbnail" src={x} alt="product" />
                </Button>
              ))
            )}
        </div>

        </Col>
            <Col xs={12} md={6} lg={6} className="order-1 order-md-2">
            <img
              className="img-large"
              src={selectedImage || product.image}
              alt={product.name}
            ></img>
          </Col>
          <Col xs={12} md={4} lg={4} className="order-3">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Helmet>
                  <title>{product.name}</title>
                </Helmet>
                <h2 className="product-brand">{product.brand.toUpperCase()}</h2>
                <h1 className="product-title">{product.name}</h1>
                {product.reducedPrice ? (
                <div>
                  <span className="product-price original-price" style={{ textDecoration: 'line-through' }}>
                    ${product.price}
                  </span>
                  <span className="product-price reduced-price">
                    ${product.reducedPrice}
                  </span>
                </div>
              ) : (
                <h2 className="product-price">${product.price}</h2>
              )}

            
              </ListGroup.Item>
              <ListGroup.Item>
                {/* <Rating
                  rating={product.rating}
                  numReviews={product.numReviews}
                ></Rating> */}
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
                     {/* Size Guide Button */}
                    <button className="size-guide-btn" onClick={toggleSizeGuideModal}>
                      Size Guide
                    </button>
                    <Modal show={showSizeGuide} onHide={toggleSizeGuideModal}>
                      <Modal.Header closeButton>
                      </Modal.Header>
                      <Modal.Body>
                        <img src={product.sizeguide} alt="Size Guide" style={{ width: '100%' }} />
                      </Modal.Body>
                    </Modal>

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
            {learnMoreVisible && (
  <ListGroup.Item>
    <div className="product-extra-info">
      <h4>Model's Details</h4>
      <p>Our model is wearing a size {product.sizeOfModelsGarment}</p>
      <p>Measurements: Chest: {product.modelBodyMeasurements.chest}", Waist: {product.modelBodyMeasurements.waist}", Hips: {product.modelBodyMeasurements.hips}", Height: {product.modelBodyMeasurements.height}cm</p>

      <h4>Material</h4>
      {product.fabricMaterial.map((material, index) => (
        <p key={index}>{material.percentage}% {material.material}</p>
      ))}

      {product.measurements && (
        (product.measurements.chest || product.measurements.waist || product.measurements.hips) && (
          <div>
            <h4>Clothing Measurements</h4>
            {product.measurements.chest && <p>Chest: {product.measurements.chest}"</p>}
            {product.measurements.waist && <p>Waist: {product.measurements.waist}"</p>}
            {product.measurements.hips && <p>Hips: {product.measurements.hips}"</p>}
            <p>Garment Length: {product.garmentLength}</p>
          </div>
        )
      )}

      <h4>Delivery</h4>
      <p>This item is sent directly from our partner and will arrive separately if ordered with other items.</p>
    </div>
  </ListGroup.Item>
)}

            </ListGroup>
          </Col>
          
      </Row>
{/* <div className="my-3 product-reviews">

  
  <ListGroup.Item>
  <div className="review-summary">
    <Rating rating={product.rating} />
    {typeof product.numReviews === 'number' ? (
      <span>{`${product.numReviews} review${product.numReviews !== 1 ? 's' : ''}`}</span>
    ) : (
      
      <span>No reviews available</span>
    )}

  </div>
    </ListGroup.Item>
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
                  <form className="review-form"onSubmit={submitHandler}>
                    <h2>Write a review</h2>
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

      </div> */}
    </div>
  );
}
export default ProductScreen;
   