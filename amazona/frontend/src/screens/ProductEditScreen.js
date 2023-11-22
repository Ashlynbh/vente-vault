import React, { useContext, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Store } from '../Store';
import { getError } from '../utils';
import Container from 'react-bootstrap/Container';
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

function extractFileName(url) {
  if (!url) {
    return ''; // or return some default value like 'No file selected'
  }
  return url.split('/').pop();
}



export default function ProductEditScreen() {
  const navigate = useNavigate();
  const params = useParams(); // /product/:id
  const { id: productId } = params;

  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, loadingUpdate, loadingUpload }, dispatch] =
  useReducer(reducer, {
    loading: true,
    error: '',
    });


  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [sub_category, setSubcategory] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [variations, setVariations] = useState([]);
  const [fabricMaterial, setFabricMaterial] = useState('');
  const [occasion, setOccasion] = useState('');
  const [measurements, setMeasurements] = useState({ chest: 0, waist: 0, hips: 0 });
  const [modelBodyMeasurements, setModelBodyMeasurements] = useState({ chest: 0, waist: 0, hips: 0 });
  const [sizeOfModelsGarment, setSizeOfModelsGarment] = useState('');
  const [garmentLength, setGarmentLength] = useState(0);
  const [heightRise, setHeightRise] = useState(0);
  const [createdBy, setCreatedBy] = useState('');
  const [showInstagramLinkForm, setShowInstagramLinkForm] = useState(false);
  const [instagramPostIds, setInstagramPostIds] = useState([]);
  const [currentInstagramPostId, setCurrentInstagramPostId] = useState('');
  const [reducedPrice, setReducedPrice] = useState('');

  // const [weight, setWeight] = useState(0);



function extractFileName(url) {
  return url.split('/').pop();
}

 useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get(`/api/products/${productId}`);
      setName(data.name);
      setSlug(data.slug);
      setPrice(data.price);
      setImage(data.image);
      setImages(data.images || []);
      setCategory(data.category);
      setSubcategory(data.sub_category);
      setBrand(data.brand);
      setDescription(data.description);
      setFeatured(data.featured);
      setIsPublished(data.isPublished);
      setVariations(data.variations || []);
      // New fields
      setFabricMaterial(data.fabricMaterial || '');
      setOccasion(data.occasion || '');
      setMeasurements(data.measurements);
      setModelBodyMeasurements(data.modelBodyMeasurements);
      setSizeOfModelsGarment(data.sizeOfModelsGarment || '');
      setGarmentLength(data.garmentLength || 0);
      setReducedPrice(data.reducedPrice || '');
      setHeightRise(data.heightRise || 0);
      setCreatedBy(data.createdBy);
      setCurrentInstagramPostId('');
      setShowInstagramLinkForm(false);
      setInstagramPostIds(data.instagramPostIds || []);
      
      dispatch({ type: 'FETCH_SUCCESS' });
    } catch (err) {
      dispatch({
        type: 'FETCH_FAIL',
        payload: getError(err),
      });
    }
  };
  fetchData();
}, [productId, dispatch]); // Add dispatch to the dependency array if you use it in the useEffect




    const submitHandler = async (e) => {
  e.preventDefault();

  // Validation: Check if there's at least one variation with a size and stock count
  const hasValidVariation = variations.some(variation =>
    variation.sizes.some(size => size.size && size.countInStock > 0)
  );

  if (!hasValidVariation) {
    toast.error('Please add at least one color, size, and stock count');
    return;
  }

  // Continue with the update request if validation passes
  try {
    dispatch({ type: 'UPDATE_REQUEST' });
    await axios.put(
      `/api/products/${productId}`,
      {
        _id: productId,
        name,
        slug,
        price,
        reducedPrice: reducedPrice !== '' ? reducedPrice : null, 
        image,
        images,
        category,
        sub_category,
        brand,
        countInStock,
        description,
        featured,
        isPublished,
        variations, 
        fabricMaterial,
        occasion,
        measurements,
        modelBodyMeasurements,
        sizeOfModelsGarment,
        garmentLength,
        heightRise,
        createdBy,
        // weight,
      },
      {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      }
    );
    dispatch({
      type: 'UPDATE_SUCCESS',
    });
    toast.success('Product updated successfully');
      navigate('/admin/products');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'UPDATE_FAIL' });
    }
  };



   const uploadFileHandler = async (e, forImages) => {
    const file = e.target.files[0];
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
      toast.success('Image uploaded successfully. click Update to apply it');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
    }
  };

  const handleColorImageUpload = async (variationIndex, e) => {
  const file = e.target.files[0];
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
    toast.success('Color image uploaded successfully');
  } catch (err) {
    toast.error(getError(err));
    dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
  }
};


    // Add a new variation
  const addVariation = () => {
    const newVariation = {
      color: '',
      image: '',
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

  // Add a new size to a variation
  const addSize = (variationIndex) => {
    const newSize = { size: '', countInStock: 0 };
    const updatedVariations = [...variations];
    updatedVariations[variationIndex].sizes.push(newSize);
    setVariations(updatedVariations);
  };

  // Remove a size from a variation
  const removeSize = (variationIndex, sizeIndex) => {
    const updatedVariations = [...variations];
    updatedVariations[variationIndex].sizes = updatedVariations[variationIndex].sizes.filter((_, i) => i !== sizeIndex);
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



  // Handle change in size fields
  const handleSizeChange = (variationIndex, sizeIndex, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[variationIndex].sizes[sizeIndex] = { ...updatedVariations[variationIndex].sizes[sizeIndex], [field]: value };
    setVariations(updatedVariations);
  };

   const deleteFileHandler = async (fileName, f) => {
    console.log(fileName, f);
    console.log(images);
    console.log(images.filter((x) => x !== fileName));
    setImages(images.filter((x) => x !== fileName));
    toast.success('Image removed successfully. click Update to apply it');
  };

 const addInstagramPostId = (e) => {
    e.preventDefault();
    setInstagramPostIds([...instagramPostIds, currentInstagramPostId]);
    setCurrentInstagramPostId('');
  };

const submitInstagramIdsHandler = async () => {
  try {
    const response = await axios.put(`/api/products/${productId}/instagram`, {
      instagramPostIds,
    }, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    });
    // Handle response
    console.log(response.data);
    setShowInstagramLinkForm(false);
  } catch (error) {
    // Handle errors
    console.error('Error updating Instagram Post IDs:', error);
  }
};



    return (
      <Container className="small-container">
    <Helmet>
      <title>Edit Product {productId}</title>
    </Helmet>
    <h1 className="edit-title">Edit Product {productId}</h1>
{/* Instagram Link Section */}
{userInfo.isAdmin && (
  <>
    <div className="link-to-instagram" onClick={() => setShowInstagramLinkForm(!showInstagramLinkForm)}>
      Link to Instagram
    </div>

    {showInstagramLinkForm && (
      <div className="instagram-form-container">
        <Form onSubmit={addInstagramPostId}>
          <Form.Group className="mb-3" controlId="instagramPostId">
            <Form.Label>Instagram Post ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Instagram Post ID"
              value={currentInstagramPostId}
              onChange={(e) => setCurrentInstagramPostId(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" className="instagram-add-button">
            Add
          </Button>
        </Form>

        {/* Displaying current Instagram Post IDs */}
        {instagramPostIds.length > 0 && (
          <div className="instagram-ids-display">
            <h3 className="active-id">Active IDs</h3>
            <ul>
              {instagramPostIds.map((id, index) => (
                <li key={index}>{id}
                  <Button 
                    className="instagram-remove-button"
                    onClick={() => {
                      const updatedIds = instagramPostIds.filter((_, idx) => idx !== index);
                      setInstagramPostIds(updatedIds);
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={submitInstagramIdsHandler} className="instagram-update-button">
          Update
        </Button>
      </div>
    )}
  </>
)}

    {loading ? (
      <LoadingBox></LoadingBox>
    ) : error ? (
      <MessageBox variant="danger">{error}</MessageBox>
    ) : (
      <Form onSubmit={submitHandler}>
        <Row>
          {/* First Column */}
          <Col md={12} className="form-column">
            {/* Name */}
            <Form.Group className="mb-3" controlId="name">
              <Form.Label className="form-title" >Name</Form.Label>
              <Form.Control className="product--edit-form" value={name} onChange={(e) => setName(e.target.value)} required />
            </Form.Group>

            {/* Slug */}
            <Form.Group className="mb-3" controlId="slug">
              <Form.Label className="form-title">Slug</Form.Label>
              <Form.Control className="product--edit-form" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </Form.Group>

            {/* Brand */}
            <Form.Group className="mb-3" controlId="brand">
              <Form.Label className="form-title">Brand</Form.Label>
              <Form.Control className="product--edit-form" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3" controlId="description">
              <Form.Label className="form-title">Description</Form.Label>
              <Form.Control className="product--edit-form" as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Form.Group>

            {/* Price */}
            <Form.Group className="mb-3" controlId="price">
              <Form.Label className="form-title">Price</Form.Label>
              <Form.Control className="product--edit-form" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="reduced-price">
              <Form.Label className="form-title"> Reduced Price</Form.Label>
              <Form.Control className="product--edit-form" type="number" value={reducedPrice} onChange={(e) => setReducedPrice(e.target.value)}/>
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

           <Form.Group className="mb-3" controlId="imageFile">
            <Form.Label className="form-title">Primary Image</Form.Label>
            <Form.Control className="product--edit-form" type="file" onChange={uploadFileHandler} />
            {/* Display image preview if `image` has a value */}
            {image && (
              <div className="image-preview">
                <img src={image} alt="Primary" className="edit-thumbnail" />
              </div>
            )}
            {loadingUpload && <LoadingBox></LoadingBox>}
          </Form.Group>


           <Form.Group className="mb-3" controlId="additionalImageFile">
            <Form.Label className="form-title">Additional Images</Form.Label>
            <Form.Control className="product--edit-form" type="file" onChange={(e) => uploadFileHandler(e, true)} />
            {loadingUpload && <LoadingBox></LoadingBox>}
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

          
            {/* Fabric/Material */}
            <Form.Group className="mb-3" controlId="fabricMaterial">
              <Form.Label className="form-title">Fabric/Material</Form.Label>
              <Form.Control
              className="product--edit-form"
                type="text"
                value={fabricMaterial}
                onChange={(e) => setFabricMaterial(e.target.value)}
                required
              />
            </Form.Group>
            {/* <Form.Group className="mb-3" controlId="weight">
              <Form.Label className="form-title"> Item Weight (in kg)</Form.Label>
              <Form.Control 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                required 
              />
            </Form.Group> */}
            {/* Occasion */}
            <Form.Group className="mb-3" controlId="occasion">
              <Form.Label className="form-title">Occasion</Form.Label>
              <Form.Control
              className="product--edit-form"
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                required
              />
            </Form.Group>

            {/* Measurements Header */}
              <h3 className="form-title">Measurements</h3>

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
                value={modelBodyMeasurements.hips}
                onChange={(e) => handleModelMeasurementsChange(e, 'hips')}
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

            <Form.Group className="mb-3" controlId="heightRise">
              <Form.Label className="form-title">Height Rise</Form.Label>
              <Form.Control
              className="product--edit-form"
                type="number"
                value={heightRise}
                onChange={(e) => setHeightRise(e.target.value)}
                required
              />
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

            {/* Published */}
            <Form.Group className="mb-3" controlId="isPublished">
              <Form.Label className="form-title">Published</Form.Label>
              <Form.Check type="checkbox" label="Is Published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            </Form.Group>

          </Col>
        </Row>
      <Row>
          {/* Second Column */}
          <Col md={12} className="form-column">
            {variations.map((variation, index) => (
              <div key={index}>
                <Form.Group className="mb-3" controlId={`color-${index}`}>
                  <Form.Label className="form-title" >Color</Form.Label>
                  <Form.Control className="product--edit-form"  type="text" value={variation.color} onChange={(e) => handleVariationChange(index, 'color', e.target.value)} required />
                </Form.Group>
                {/* Colour Hex input */}
                <Form.Group className="mb-3" controlId={`colourhex-${index}`}>
                  <Form.Label className="form-title" >Colour Hex</Form.Label>
                  <Form.Control 
                    className="product--edit-form"
                    type="text" 
                    placeholder="#ffffff" 
                    value={variation.colourhex} 
                    onChange={(e) => handleVariationChange(index, 'colourhex', e.target.value)} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId={`colorImageFile-${index}`}>
                  <Form.Label className="form-title">Upload Color Image</Form.Label>
                  <Form.Control  className="product--edit-form" type="file" onChange={(e) => handleColorImageUpload(index, e)} />
                  {/* Display image from the database if it exists */}
                  {variation.colorImage && (
                    <div className="image-preview">
                      <img src={variation.colorImage} alt={`Color: ${variation.color}`} className="edit-thumbnail" />
                    </div>
                  )}
                </Form.Group>
                {variation.sizes.map((size, sizeIndex) => (
                  <div key={`size-${sizeIndex}`}>
                    <Form.Group className="mb-3" controlId={`size-${index}-${sizeIndex}`}>
                      <Form.Label className="form-title">Size</Form.Label>
                      <Form.Select
                        aria-label="Size"
                        value={size.size}
                        onChange={(e) => handleSizeChange(index, sizeIndex, 'size', e.target.value)}
                        required
                        className="small-font-dropdown" 
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
                    <Form.Group className="mb-3" controlId={`countInStock-${index}-${sizeIndex}`}>
                          <Form.Label className="form-title">Count In Stock</Form.Label>
                          <Form.Control className="product--edit-form"  type="number" value={size.countInStock} onChange={(e) => handleSizeChange(index, sizeIndex, 'countInStock', e.target.value)} required />
                     </Form.Group>
                    <Button variant="danger"className="remove-btn"  size="sm" onClick={() => removeSize(index, sizeIndex)}>
                      Remove Size
                    </Button>
                  <Button variant="danger" className="remove-btn" size="sm" onClick={() => removeVariation(index)}>
                Remove Color
              </Button>
                </div>
              ))}
              <Button size="sm"  className="add-btn" onClick={() => addSize(index)}>Add Size</Button>

            </div>
          ))}
          
          <Button className="add-btn"  size="sm" onClick={addVariation}>Add Colour</Button>
          
        </Col>

     </Row>
     <Row>
          <div className="mb-3">
            <Button type="submit" className="upload-button" disabled={loadingUpdate}>
              Update
            </Button>
            {loadingUpdate && <LoadingBox></LoadingBox>}
          </div>
     </Row>
      </Form>
    )}
  </Container>
)}; 
