import React, { useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { Store } from '../Store';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { getError } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';


const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    
    // case 'CREATE_REQUEST':
    //   return { ...state, loadingCreate: true };
    
    // case 'CREATE_SUCCESS':
    //   return {
    //     ...state,
    //     loadingCreate: false,
    //   };
    // case 'CREATE_FAIL':
    //   return { ...state, loadingCreate: false };
    
    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true, successDelete: false };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false, successDelete: false };

    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false };

    default:
      return state;
  }
};

export default function ProductListScreen() {

  const [
    {
      loading,
      error,
      products,
      pages,
      loadingCreate,
      loadingDelete,
      successDelete,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: '',
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get('page') || 1;

  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(
      `/api/products/admin?page=${page}&pageSize=10&isDeleted=false`, // Add a query parameter to fetch only non-deleted products
      {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {}
    };
        if (successDelete) {
        dispatch({ type: 'DELETE_RESET' });
        } else {
        fetchData();
        }
    }, [page, userInfo, successDelete]);

    const createHandler = () => {
  navigate('/admin/product/new'); 
};


    // const createHandler = async () => {
    //   if (window.confirm('Are you sure to create?')) {
    //     try {
    //       dispatch({ type: 'CREATE_REQUEST' });
    //       const { data } = await axios.post(
    //         '/api/products',
    //         {},
    //         {
    //           headers: { Authorization: `Bearer ${userInfo.token}` },
    //         }
    //       );
    //       toast.success('product created successfully');
    //       dispatch({ type: 'CREATE_SUCCESS' });
    //       navigate(`/admin/product/${data.product._id}`);
    //     } catch (err) { // 'err' is used here
    //       toast.error(getError(err)); // Should also be 'err' here
    //       dispatch({
    //         type: 'CREATE_FAIL',
    //       });
    //     }
    //   }
    // };

  const deleteHandler = async (product) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        await axios.delete(`/api/products/${product._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('product deleted successfully');
        dispatch({ type: 'DELETE_SUCCESS' });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: 'DELETE_FAIL',
        });
      }
    }
  };

  return (
    <div>
      <Row className="product-list-row">
        <Col>
          <h1 className="admin-headers">Products</h1>
        </Col>
        <Col className="col text-end">
          <div>
            <Button type="button" className="create-product-button" onClick={createHandler}>
              Create Product
            </Button>
          </div>
        </Col>
      </Row>

      {loadingDelete && <LoadingBox></LoadingBox>}
      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <div className="table-container"> {/* Container for the table with padding */}
            <table className="table"> {/* Striped table for alternating row colors */}
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>PRICE</th>
                  <th>CATEGORY</th>
                  <th>BRAND</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product._id}</td>
                    <td>{product.name}</td>
                    <td>{product.reducedPrice}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>
                      <Button
                        type="button"
                        variant="light"
                        onClick={() => navigate(`/admin/product/${product._id}`)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      &nbsp;
                      <Button
                        type="button"
                        variant="light"
                        onClick={() => deleteHandler(product)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-container">
            {[...Array(pages).keys()].map((x) => (
              <Link
                className={`pagination-link ${x + 1 === Number(page) ? 'active' : ''}`}
                key={x + 1}
                to={`/admin/products?page=${x + 1}`}
              >
                {x + 1}
              </Link>
            ))}
          </div>
          </div>
          

        </>

      )}
    </div>
  );
}