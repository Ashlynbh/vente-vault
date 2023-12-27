import React, { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';


const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        orders: action.payload.orders, 
        pages: action.payload.pages, 
        loading: false,
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function OrderHistoryScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();

  const [{ loading, error, orders, page, pages }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    orders: [],
    page: 1, 
    pages: 0, 
  });

useEffect(() => {
  const fetchData = async () => {
    dispatch({ type: 'FETCH_REQUEST' });
    try {
      const { data } = await axios.get(`/api/orders/mine?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(error) });
    }
  };

  fetchData();
}, [userInfo, page]); // Include 'page' in dependencies

  return (
    <div>
      <Helmet>
        <title>Order History</title>
      </Helmet>

      <h1 className="admin-headers">Order History</h1>
      {loading ? (
        <LoadingBox></LoadingBox>
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <div className="table-container"> {/* Container for the table with padding */}
          <table className="table"> {/* Striped table for alternating row colors */}
            <thead>
              <tr>
                <th>ID</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>PAID</th>
                {/* <th>SHIPPED</th> */}
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.createdAt.substring(0, 10)}</td>
                  <td>{order.totalPrice.toFixed(2)}</td>
                  <td>{order.isPaid ? order.paidAt.substring(0, 10) : 'No'}</td>
                  {/* <td>
                    {order.isDelivered ? order.deliveredAt.substring(0, 10) : 'No'}
                  </td> */}
                  <td>
                  <Button
                    className="table-btn"
                    type="button"
                    variant="light"
                    onClick={() => navigate(`/order/${order._id}`)}
                  >
                    <FontAwesomeIcon icon={faInfoCircle} /> {/* Details Icon */}
                  </Button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        <div className="pagination-container">
          {[...Array(pages).keys()].map(x => (
            <Button 
              key={x + 1} 
              variant={x + 1 === page ? 'primary' : 'light'}
              className={x + 1 === page ? 'active' : ''} // Apply 'active' class for the current page
              onClick={() => dispatch({ type: 'SET_PAGE', payload: x + 1 })}
            >
              {x + 1}
            </Button>
          ))}
        </div>


        </div>

      )}
    </div>
  );
}