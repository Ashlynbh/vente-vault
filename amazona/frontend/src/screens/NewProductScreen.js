import React, { useContext, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Store } from '../Store';
import { getError } from '../utils';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import ListGroup from 'react-bootstrap/ListGroup';
import Col from 'react-bootstrap/esm/Col';
import Row from 'react-bootstrap/esm/Row';


const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'CREATE_REQUEST':
      return { ...state, loadingCreate: true };
    
    case 'CREATE_SUCCESS':
      return {
        ...state,
        loadingCreate: false,
      };
    case 'CREATE_FAIL':
      return { ...state, loadingCreate: false };
    
    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true };
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false };
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false };
        case 'UPLOAD_REQUEST':
      return { ...state, loadingUpload: true, errorUpload: '' };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        loadingUpload: false,
        errorUpload: '',
      };
    case 'UPLOAD_FAIL':
      return { ...state, loadingUpload: false, errorUpload: action.payload };
    default:
      return state;
  }
};



export default function NewProductScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Adjust initial loading state to false
  const [{ loading, error }, dispatch] = useReducer(reducer, {
    loading: false,
    error: '',
  });

  // State hooks for product fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [sub_category, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [reducedPrice, setReducedPrice] = useState('');
  const [images, setImages] = useState([]);
  const [countInStock, setCountInStock] = useState('');
  const initialFabricMaterial = [{ percentage: '', material: '' }];
  const [fabricMaterial, setFabricMaterials] = useState(initialFabricMaterial);
  const [product_tags, setProduct_tags] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [modelBodyMeasurements, setModelBodyMeasurements] = useState({ });
  const [sizeOfModelsGarment, setSizeOfModelsGarment] = useState('');
  const [garmentLength, setGarmentLength] = useState({});
  const [createdBy, setCreatedBy] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sizeguide, setSizeGuide] = useState(false);

    const initialVariation = {
    color: '',
    colourhex: '',
    sizes: [{ size: '', countInStock: 0 }]
    };

    const [variations, setVariations] = useState([initialVariation]);

  

  const handleFabricMaterialChange = (index, field, value) => {
  const updatedMaterials = fabricMaterial.map((item, i) => {
    if (i === index) {
      return { ...item, [field]: value };
    }
    return item;
  });
  setFabricMaterials(updatedMaterials);
};

const validateFabricMaterials = () => {
  // Ensure at least the first entry is complete
  const firstMaterial = fabricMaterial[0];
  return firstMaterial && firstMaterial.percentage && firstMaterial.material;
};

const [colorSizes, setColorSizes] = useState([
{
    color: '',
    colorImage: '',
    colourhex: '',
    sizes: [{ size: '', countInStock: 0 }],
},
// Add more objects if needed
]);


const submitHandler = async (publishStatus) => {
  setIsPublished(publishStatus);

 if (!validateFabricMaterials()) {
    toast.error('Please provide at least one complete fabric material entry.');
    return;
  }

  try {
    dispatch({ type: 'CREATE_REQUEST' });
    const response = await axios.post(
      '/api/products',
      {
        name,
        price,
        reducedPrice, 
        image,
        images,
        category,
        sub_category,
        brand,
        countInStock,
        isPublished: publishStatus,
        description,
        featured,
        variations, 
        fabricMaterial, // Include the fabric materials in the request body
        product_tags,
        measurements,
        modelBodyMeasurements,
        sizeOfModelsGarment,
        garmentLength,
        createdBy,
        sizeguide,
      },
      {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      }
    );
    dispatch({ type: 'CREATE_SUCCESS' });
    toast.success('Product created successfully');
    navigate('/admin/products'); // Navigate to products page after successful creation
  } catch (err) {
    dispatch({
      type: 'CREATE_FAIL',
      payload: err.response ? err.response.data.message : err.message,
    });
    toast.error(err.response ? err.response.data.message : err.message);
  }
};


const handlePublish = () => {
  submitHandler(true);
};

const handleSaveDraft = () => {
  submitHandler(false);
};



function extractFileName(url) {
  if (!url) {
    return ''; // or return some default value like 'No file selected'
  }
  return url.split('/').pop();
}

const dimensionTolerance = 0.1; // 10% tolerance
const idealWidth = 1000;
const idealHeight = 1333;

const isWithinTolerance = (actual, ideal) => {
  const lowerBound = ideal * (1 - dimensionTolerance);
  const upperBound = ideal * (1 + dimensionTolerance);
  return actual >= lowerBound && actual <= upperBound;
};

const uploadFileHandler = async (e, forImages) => {
  const file = e.target.files[0];

  // File size check
  if (file.size > 5242880) { // 5 MB in bytes
    toast.error("File size should be less than 5MB");
    return;
  }

  // Resolution check
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = async () => {
    if (!isWithinTolerance(image.width, idealWidth) || !isWithinTolerance(image.height, idealHeight)) {
      toast.error(`Image dimensions should be close to ${idealWidth} x ${idealHeight} pixels.`);
      return;
    }
    // Continue with upload after validation
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    try {
      dispatch({ type: 'UPLOAD_REQUEST' });
      const { data } = await axios.post('/api/upload', bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: 'UPLOAD_SUCCESS' });

      if (forImages) {
        setImages([...images, data.secure_url]);
      } else {
        setImage(data.secure_url);
      }
      toast.success('Image uploaded successfully.');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
    }
  };
  image.onerror = () => {
    toast.error('Error loading image. Please try a different file.');
  };
};



const handleColorImageUpload = async (variationIndex, e) => {
  const file = e.target.files[0];

  // File size check
  if (file.size > 5242880) { // 5 MB in bytes
    toast.error("File size should be less than 5MB");
    return;
  }

  // Resolution check
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = async () => {
    if (!isWithinTolerance(image.width, idealWidth) || !isWithinTolerance(image.height, idealHeight)) {
      toast.error(`Image dimensions should be close to ${idealWidth} x ${idealHeight} pixels.`);
      return;
    }

    // Continue with upload after validation
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    try {
      dispatch({ type: 'UPLOAD_REQUEST' });
      const { data } = await axios.post('/api/upload', bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: 'UPLOAD_SUCCESS' });

      const updatedVariations = [...variations];
      updatedVariations[variationIndex].colorImage = data.secure_url; // Change 'image' to 'colorImage'
      setVariations(updatedVariations);
      toast.success('Colour image uploaded successfully');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
    }
  };
};

const uploadSizeGuideHandler = async (e) => {
  const file = e.target.files[0];

  // Basic file size check (adjust the size limit as needed)
  if (file.size > 10485760) { // 10 MB in bytes
    toast.error("File size should be less than 10MB");
    return;
  }

  // Create FormData and append the file
  const bodyFormData = new FormData();
  bodyFormData.append('file', file);

  try {
    dispatch({ type: 'UPLOAD_REQUEST' });
    const { data } = await axios.post('/api/upload', bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        authorization: `Bearer ${userInfo.token}`,
      },
    });
    dispatch({ type: 'UPLOAD_SUCCESS' });

    // Assuming you have a state setter like setSizeGuideUrl to store the URL of the uploaded size guide image
    setSizeGuide(data.secure_url);
    toast.success('Size guide image uploaded successfully.');
  } catch (err) {
    toast.error(getError(err));
    dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
  }
};



const addVariation = () => {
  const newVariation = {
    color: '',
    colorImage: '',  // Changed from 'image' to 'colorImage'
    colourhex: '',   // Added this field
    sizes: [{ size: '', countInStock: 0 }]
  };
  setVariations([...variations, newVariation]);
};


  

  // Remove a variation
  const removeVariation = (index) => {
    const newVariations = variations.filter((_, i) => i !== index);
    setVariations(newVariations);
  };

  

  // Handle change in variation fields (color or image URL)
  const handleVariationChange = (variationIndex, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[variationIndex] = { ...updatedVariations[variationIndex], [field]: value };
    setVariations(updatedVariations);
  };

  const addSize = (variationIndex) => {
  const updatedVariations = [...variations];
  updatedVariations[variationIndex].sizes.push({ size: '', countInStock: 0 });
  setVariations(updatedVariations);
};


  const handleMeasurementsChange = (event, measurementKey) => {
    const updatedMeasurements = {
      ...measurements,
      [measurementKey]: event.target.value,
    };
    setMeasurements(updatedMeasurements);
  };

  const handleModelMeasurementsChange = (event, measurementKey) => {
  const updatedModelMeasurements = {
    ...modelBodyMeasurements,
    [measurementKey]: event.target.value,
  };
  setModelBodyMeasurements(updatedModelMeasurements);
};


  // Function to handle changes in color properties
  const handleColorChange = (index, field, value) => {
    const updatedColorSizes = [...colorSizes];
    updatedColorSizes[index] = { ...updatedColorSizes[index], [field]: value };
    setColorSizes(updatedColorSizes);
  };

const handleSizeChange = (variationIndex, sizeIndex, field, value) => {
  // First, check if the variation and size at given indices exist
  if (variations[variationIndex] && variations[variationIndex].sizes[sizeIndex]) {
    const updatedVariations = [...variations];
    updatedVariations[variationIndex].sizes[sizeIndex] = { 
      ...updatedVariations[variationIndex].sizes[sizeIndex], 
      [field]: value 
    };
    setVariations(updatedVariations);
  } else {
    console.error("Variation or size not found");
  }
};

const removeSize = (variationIndex, sizeIndex) => {
  const updatedVariations = variations.map((variation, index) => {
    if (index === variationIndex) {
      // Remove the size at sizeIndex
      return {
        ...variation,
        sizes: variation.sizes.filter((_, sIndex) => sIndex !== sizeIndex)
      };
    }
    return variation;
  });

  setVariations(updatedVariations);
};




   const deleteFileHandler = async (fileName, f) => {
    console.log(fileName, f);
    console.log(images);
    console.log(images.filter((x) => x !== fileName));
    setImages(images.filter((x) => x !== fileName));
    toast.success('Image removed successfully. click Update to apply it');
  };

const addFabricMaterial = () => {
if (fabricMaterial.length < 3) {
    setFabricMaterials([...fabricMaterial, { percentage: '', material: '' }]);
}
};

const removeFabricMaterial = (index) => {
const updatedMaterials = fabricMaterial.filter((_, i) => i !== index);
setFabricMaterials(updatedMaterials);
};







    return (


        <Container className="small-container">
            {/* ...Helmet and Title... */}
            {loading ? (
                <LoadingBox></LoadingBox>
            ) : error ? (
                <MessageBox variant="danger">{error}</MessageBox>
            ) : (
                <Form onSubmit={submitHandler}>
                    {/* Product Details Section */}
                <Row>
                <Col md={6}>
                        <div className="section-header">
                            <span className="line product-details"></span>
                            <h2>Product Details</h2>
                            <span className="line product-details"></span>
                            
                        </div>
                        <p className="product-lrg">Enter the essential details of the product here, and your responses will be recorded to users on the product page. Examples have been provided for each section as a guide.</p>
                        <Form.Group className="mb-3" controlId="name">
                        <Form.Label className="form-title" >Name</Form.Label>
                        <Form.Control className="product--edit-form" placeholder="Leather Biker Jacket" value={name} onChange={(e) => setName(e.target.value)} required />
                        </Form.Group>

                        {/* Brand */}
                        <Form.Group className="mb-3" controlId="brand">
                        <Form.Label className="form-title">Brand</Form.Label>
                        <Form.Control className="product--edit-form" placeholder="Remi" value={brand} onChange={(e) => setBrand(e.target.value)} required />
                        </Form.Group>

                        {/* Description */}
                        <Form.Group className="mb-3" controlId="description">
                        <Form.Label className="form-title">Description</Form.Label>
                        <Form.Control className="product--edit-form" placeholder="Embrace timeless style with our Classic Leather Biker Jacket, a must-have for any fashion-forward wardrobe. Crafted from premium quality, 100% genuine leather, this jacket boasts a luxurious feel and a durable finish that only gets better with age." as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
                        </Form.Group>

                        {/* Category */}
                        <Form.Group className="mb-3" controlId="category">
                        <Form.Label className="form-title">Category</Form.Label>
                        <Form.Select  className="small-font-dropdown" value={category} onChange={(e) => setCategory(e.target.value)} required>
                            <option value="">Select a Category</option>
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                            <option value="Kids">Kids</option>
                            <option value="Accessories">Accessories</option>
                        </Form.Select>
                        </Form.Group>

                        {/* Sub-Category */}
                        <Form.Group className="mb-3" controlId="subCategory">
                        <Form.Label className="form-title">Sub-Category</Form.Label>
                        <Form.Control className="product--edit-form" value={sub_category} onChange={(e) => setSubcategory(e.target.value)} required />
                        </Form.Group>
                        {/* Occasion */}
                        <Form.Group className="mb-3" controlId="product_tags">
                        <Form.Label className="form-title">Product Tags</Form.Label>
                        <p className="product-small">Product tags will not directly be recorded on the product page, the intent is for users to use these as keyword searches for items.</p>
                        <Form.Control
                        className="product--edit-form"
                            type="text"
                            placeholder="Grunge"
                            value={product_tags}s
                            onChange={(e) => setProduct_tags(e.target.value)}
                            required
                        />
                        </Form.Group>

                    <Form.Group className="mb-3" controlId="fabricMaterial">
                    <Form.Label className="form-title">Fabric/Material</Form.Label>
                    <p className="product-small">Please ensure you record the material and the percentage for each fabric/material used.</p>
                    {fabricMaterial.map((material, index) => (
                        <div key={index} className="fabric-material-input-group">
                            <input 
                                type="number" 
                                placeholder="70" 
                                className="product--edit-form"
                                value={material.percentage} 
                                onChange={(e) => handleFabricMaterialChange(index, 'percentage', e.target.value)}
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Cotton" 
                                className="product--edit-form"
                                value={material.material} 
                                onChange={(e) => handleFabricMaterialChange(index, 'material', e.target.value)}
                                required 
                            />
                            {index > 0 && (
                                <button type="button" className="remove-material-btn" onClick={() => removeFabricMaterial(index)}>Remove</button>
                            )}
                        </div>
                    ))}
                    {fabricMaterial.length < 3 && (
                        <button type="button" className="add-material-btn" onClick={addFabricMaterial}>Add</button>
                    )}
                </Form.Group>


                        {/* Measurements Header */}
                        <h3 className="form-title"> Garment's Measurements</h3>
                        <p className="product-small">These measurements are an optional field, please leave this blank if you dont have these measurements.</p>

                        {/* Chest Measurement */}
                        <Form.Group className="mb-3" controlId="measurementChest">
                            <Form.Label className="measurement-header">Chest (inches)</Form.Label>
                            <Form.Control
                            className="product--edit-form"
                            type="number"
                            value={measurements.chest}
                            onChange={(e) => handleMeasurementsChange(e, 'chest')}
                            required
                            />
                        </Form.Group>

                        {/* Waist Measurement */}
                        <Form.Group className="mb-3" controlId="measurementWaist">
                            <Form.Label className="measurement-header">Waist (inches)</Form.Label>
                            <Form.Control
                            className="product--edit-form"
                            type="number"
                            value={measurements.waist}
                            onChange={(e) => handleMeasurementsChange(e, 'waist')}
                            required
                            />
                        </Form.Group>
                        {/* Hips Measurement */}
                        <Form.Group className="mb-3" controlId="measurementHips">
                            <Form.Label className="measurement-header">Hips (inches)</Form.Label>
                            <Form.Control
                            className="product--edit-form"
                            type="number"
                            value={measurements.hips}
                            onChange={(e) => handleMeasurementsChange(e, 'hips')}
                            required
                            />
                        </Form.Group>
                        {/* Model's Body Measurements */}
                        <h3 className="form-title">Models Measurements</h3>
                        <p className="product-small">These measurements are required, please record them or you will not be able to proceed.</p>
                        <Form.Group className="mb-3" controlId="modelChest">
                        <Form.Label className="measurement-header">Model's Chest (inches)</Form.Label>
                        <Form.Control
                        className="product--edit-form"
                            type="number"
                            value={modelBodyMeasurements.chest}
                            onChange={(e) => handleModelMeasurementsChange(e, 'chest')}
                            required
                        />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="modelWaist">
                        <Form.Label className="measurement-header">Model's Waist (inches)</Form.Label>
                        <Form.Control
                        className="product--edit-form"
                            type="number"
                            placeholder="25"
                            value={modelBodyMeasurements.waist}
                            onChange={(e) => handleModelMeasurementsChange(e, 'waist')}
                            required
                        />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="modelHips">
                        <Form.Label className="measurement-header">Model's Hips (inches)</Form.Label>
                        <Form.Control
                        className="product--edit-form"
                            type="number"
                            placeholder="32"
                            value={modelBodyMeasurements.hips}
                            onChange={(e) => handleModelMeasurementsChange(e, 'hips')}
                            required
                        />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="modelHeight">
                        <Form.Label className="measurement-header">Model's Height (cm)</Form.Label>
                        <Form.Control
                        className="product--edit-form"
                            type="number"
                            placeholder="173"
                            value={modelBodyMeasurements.height}
                            onChange={(e) => handleModelMeasurementsChange(e, 'height')}
                            required
                        />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="sizeOfModelsGarment">
                        <Form.Label className="form-title">Size of Model's Garment</Form.Label>
                        <Form.Select
                        
                            className="small-font-dropdown" 
                            aria-label="Size of Model's Garment"
                            value={sizeOfModelsGarment}
                            onChange={(e) => setSizeOfModelsGarment(e.target.value)}
                            required
                        >
                            <option value="">Select size</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                            <option value="XXXL">XXXL</option>
                        </Form.Select>
                        </Form.Group>


                        {/* Length/Height Rise */}
                        <Form.Group className="mb-3" controlId="garmentLength">
                        <Form.Label className="form-title">Garment Length</Form.Label>
                        <Form.Control
                        className="product--edit-form"
                            type="number"
                            value={garmentLength}
                            onChange={(e) => setGarmentLength(e.target.value)}
                            required
                        />
                        </Form.Group>
                </Col>

                {/* Pricing and Images Section */}
                <Col md={6}>
                        <div className="section-header">
                            <span className="line pricing"></span>
                            <h2>Pricing</h2>
                            <span className="line pricing"></span>
                        </div>
                         <p className="product-lrg">Please record the original price of the item and the reduced price, the reduced price will be the final price of the item which the customer will pay. The original price is only for display. Please ensure the reduced price is greater or equal to 30% otherwise you will not be able to proceed.</p>
                        <Form.Group className="mb-3" controlId="price">
                        <Form.Label className="form-title"> Original Price</Form.Label>
                        <Form.Control placeholder="180"className="product--edit-form" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="reduced-price">
                        <Form.Label className="form-title"> Reduced Price</Form.Label>
                        <Form.Control placeholder="110" className="product--edit-form" type="number" value={reducedPrice} onChange={(e) => setReducedPrice(e.target.value)}/>
                        </Form.Group>

                        

                        {/* Images */}
                   <div className="section-header images-header">
                            <span className="line images"></span>
                            <h2>Images</h2>
                            <span className="line images"></span>
                    </div>
                     <p className="product-small"> Please ensure all images are the correct resolution and dimensions, to ensure consistency on our site we have set the dimensions to 1000 x 1333. Your primary image will be the first image users view and associate with your product. Please keep in mind you will be adding further images in the variations section.</p>
                    <Form.Group className="mb-3" controlId="imageFile">
                        <Form.Label className="form-title">Primary Image</Form.Label>
                        <Form.Control className="product--edit-form" type="file" onChange={uploadFileHandler} />
                        {/* Display image preview if `image` has a value */}
                        {image && (
                        <div className="image-preview">
                            <img src={image} alt="Primary" className="edit-thumbnail" />
                        </div>
                        )}

                    </Form.Group>
                    <Form.Group className="mb-3" controlId="additionalImageFile">
                        <Form.Label className="form-title">Additional Images</Form.Label>
                         <p className="product-small">Please add additional images that are not the primary image and are not associated with a colour as these will be recorded in the variations section. A minimum of 3 images is required with a maximum of 10.</p>
                        <Form.Control className="product--edit-form" type="file" onChange={(e) => uploadFileHandler(e, true)} />

                        <div className="additional-images-preview">
                        {images.map((image, index) => (
                            <div key={index} className="additional-image-container">
                            <img src={image} alt={`additional ${index}`} className="edit-thumbnail" />
                            <Button variant="danger" onClick={() => deleteFileHandler(image)}>
                                <i className="fa fa-times-circle"></i>
                            </Button>
                            </div>
                        ))}
                        </div>
                    </Form.Group>   
                    <Form.Group className="mb-3" controlId="sizeGuideImageFile">
                         <p className="product-small">Please upload your size guide which will be displayed to users on the product page.</p>
                        <Form.Label className="form-title">Size Guide Image</Form.Label>
                        <Form.Control className="product--edit-form" type="file" onChange={uploadSizeGuideHandler} />

                        {/* Optionally display the uploaded size guide image */}
                        {sizeguide && (
                            <div className="size-guide-image-preview">
                            <img src={sizeguide} alt="Size Guide" className="edit-thumbnail" />
                            <Button variant="danger" onClick={() => setSizeGuide('')}>
                                <i className="fa fa-times-circle"></i> Remove
                            </Button>
                            </div>
                        )}
                        </Form.Group>
            

                        {/* Featured - Only show if the user is an admin */}
                    {userInfo.isAdmin && (
                        <Form.Group className="mb-3" controlId="featured">
                        <Form.Label className="form-title">Featured</Form.Label>
                        <Form.Check
                            type="checkbox"
                            label="Is Featured"
                            checked={featured}
                            onChange={(e) => setFeatured(e.target.checked)}
                        />
                        </Form.Group>
                    )}
                    
                </Col>
                </Row>

                {/* Quantity and Variations Section */}
                <Row>
                <Col md={12}>
                    <div className="section-header">
                        <span className="line quantity-variations"></span>
                        <h2>Quantity and Variations</h2>
                        <span className="line quantity-variations"></span>
                    </div>
                     <p className="product-lrg" > This is where you will record your quantity for specific colour and size variations, we recommend monitoring your stock as it will reduce with successful sales.</p>

              <Table striped bordered hover>
                <thead className="uppercase-headers">
                    <tr>
                    <th>Colour</th>
                    <th>Colour Hex</th>
                    <th>Colour Image</th>
                    <th>Size</th> {/* Added Size header */}
                    <th>Quantity</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {variations.map((variation, variationIndex) => (
                        variation.sizes.map((size, sizeIndex) => (
                        <React.Fragment key={`variation-${variationIndex}-size-${sizeIndex}`}>
                            <tr>
                            {/* Color - Shown only for the first size of each color */}
                            {sizeIndex === 0 && (
                                <td rowSpan={variation.sizes.length + 1}>
                                    <Form.Select
                                    value={variation.color}
                                    onChange={(e) => handleVariationChange(variationIndex, 'color', e.target.value)}
                                    required
                                    >
                                    <option value="">Select Color</option>
                                    <option value="Black">Black</option>
                                    <option value="White">White</option>
                                    <option value="Grey">Grey</option>
                                    <option value="Blue">Blue</option>
                                    <option value="Red">Red</option>
                                    <option value="Green">Green</option>
                                    <option value="Yellow">Yellow</option>
                                    <option value="Pink">Pink</option>
                                    <option value="Navy">Navy</option>
                                    <option value="Cream">Cream</option>
                                    <option value="Brown">Brown</option>
                                    <option value="Purple">Purple</option>
                                    <option value="Orange">Orange</option>
                                    <option value="Beige">Beige</option>
                                    <option value="Lime">Lime</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                    </Form.Select>
                                </td>
                                )}

                            {/* Color Hex - Shown only for the first size of each color */}
                            {sizeIndex === 0 && (
                                <td rowSpan={variation.sizes.length + 1}>
                                <Form.Control
                                    type="text"
                                    placeholder="#ffffff"
                                    value={variation.colourhex}
                                    onChange={(e) => handleVariationChange(variationIndex, 'colourhex', e.target.value)}
                                    required
                                />
                                </td>
                            )}

                            {/* Color Image - Shown only for the first size of each color */}
                            {sizeIndex === 0 && (
                                <td rowSpan={variation.sizes.length + 1}>
                                <Form.Group controlId={`colorImageFile-${variationIndex}`}>
                                    <Form.Control 
                                    className="product--edit-form" 
                                    type="file" 
                                    onChange={(e) => handleColorImageUpload(variationIndex, e)} 
                                    />
                                    {variation.colorImage && (
                                    <div className="image-preview">
                                        <img src={variation.colorImage} alt={`Color: ${variation.color}`} className="edit-thumbnail" />
                                    </div>
                                    )}
                                </Form.Group>
                                </td>
                            )}

                            {/* Size */}
                            <td>
                                <Form.Select
                                aria-label="Size"
                                value={size.size}
                                onChange={(e) => handleSizeChange(variationIndex, sizeIndex, 'size', e.target.value)}
                                required
                                >
                                <option value="">Select size</option>
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                                <option value="XXXL">XXXL</option>
                                </Form.Select>
                            </td>

                            {/* Quantity */}
                            <td>
                                <Form.Control
                                type="number"
                                value={size.countInStock}
                                onChange={(e) => handleSizeChange(variationIndex, sizeIndex, 'countInStock', e.target.value)}
                                required
                                />
                            </td>

                            {/* Actions - Include Remove Size button for each size */}
                            <td>
                                <Button variant="danger" size="sm" onClick={() => removeSize(variationIndex, sizeIndex)}>
                                Remove Size
                                </Button>
                            </td>
                            </tr>

                            {/* Row for adding new size - appears only once per color variation */}
                            {sizeIndex === variation.sizes.length - 1 && (
                            <tr>
                                <td colSpan="6">
                                <Button size="sm" className="add-btn" onClick={() => addSize(variationIndex)}>
                                    Add Size
                                </Button>
                                </td>
                            </tr>
                            )}
                        </React.Fragment>
                        ))
                    ))}
                    </tbody>

                </Table>

                    <Button className="add-btn" size="sm" onClick={addVariation}>Add Variation</Button>
               </Col>

            </Row>
            <button className="publish-button" type="button" onClick={handlePublish}>Publish</button>
            <button className="sign-in-button" type="button" onClick={handleSaveDraft}>Save as Draft</button>
        </Form>
        )}
</Container>
)}; // This is the closing parenthesis for the return statement.