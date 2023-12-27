import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';



const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        orders: action.payload.orders, // Extract orders array from payload
        pages: action.payload.pages, // Extract total pages count from payload
        loading: false,
      };

    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true, successDelete: false };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false };
    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false };
      case 'SET_PAGE':
  return { ...state, page: action.payload };

    default:
      return state;
  }
};
export default function OrderListScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const ordersPerPage = 10; 
  const { userInfo } = state;
  const [{ loading, error, orders, loadingDelete, successDelete, page, pages }, dispatch] = 
  useReducer(reducer, {
    loading: true,
    error: '',
    orders: [],
    page: 1,
    pages: 1,
    ordersPerPage: 10,
  });


useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get(`/api/orders?page=${page}&limit=${ordersPerPage}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({
        type: 'FETCH_FAIL',
        payload: getError(err),
      });
    }
  };

  fetchData();
}, [userInfo, successDelete, page]); // Include 'page' in the dependency array


  // Convert to CSV
    const convertToCSV = (orders) => {
        const headers = "ID,USER,DATE,TOTAL,PAID,DELIVERED\n";
        const rows = orders.map(order =>
            `${order._id},${order.user ? order.user.name : 'DELETED USER'},${order.createdAt.substring(0, 10)},${order.totalPrice.toFixed(2)},${order.isPaid ? order.paidAt.substring(0, 10) : 'No'},${order.isDelivered ? order.deliveredAt.substring(0, 10) : 'No'}`
        ).join('\n');
        return headers + rows;
    };

    // Download CSV
    const downloadCSV = () => {
        const csvString = convertToCSV(orders);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "orders.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  const deleteHandler = async (order) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        dispatch({ type: 'DELETE_REQUEST' });
        await axios.delete(`/api/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('order deleted successfully');
        dispatch({ type: 'DELETE_SUCCESS' });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: 'DELETE_FAIL',
        });
      }
    }
  };

  const getDeliveryStatusForUser = (order) => {
  if (userInfo.isAdmin) {
    // Admin sees 'Yes' only if all items are delivered
    return order.isDelivered ? order.deliveredAt.substring(0, 10) : 'No';
  } else {
    // For a brand user, check if any of their items are delivered
    const brandDelivery = order.brandDeliveries.find(
      bd => bd.brand.toString() === userInfo._id
    );
    return brandDelivery && brandDelivery.isDelivered
      ? `Yes (on ${new Date(brandDelivery.deliveredAt).toLocaleDateString()})`
      : 'No';
  }
};

const isDeliveryDelayed = (brandDeliveries) => {
  return brandDeliveries.some(brandDelivery => {
    const dispatchTimeInHours = brandDelivery.dispatchTime / 60;
    return dispatchTimeInHours > 24;
  });
};

const getDeliveryStatusForAdmin = (order) => {
  const totalBrands = order.brandDeliveries.length;
  const shippedBrands = order.brandDeliveries.filter(bd => bd.isDelivered).length;

  if (shippedBrands === 0) {
    return 'No'; // None of the brands have shipped
  } else if (shippedBrands < totalBrands) {
    return 'Pending'; // Some, but not all, of the brands have shipped
  } else {
    return 'Yes'; // All brands have shipped
  }
};



  return (
    <div>
      <Helmet>
        <title>Orders</title>
      </Helmet>
      <h1 className="admin-headers">Orders</h1>
      {loadingDelete && <LoadingBox></LoadingBox>}
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
              <th>USER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>PAID</th>
              <th>SHIPPED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
  {orders.map((order) => {
    const isDelayed = isDeliveryDelayed(order.brandDeliveries);
    const canViewWarning = userInfo.isAdmin || userInfo.isBrand

    return (
      <tr key={order._id}>
        <td>{order._id}</td>
        <td>{order.user ? order.user.name : 'DELETED USER'}</td>
        <td>{order.createdAt.substring(0, 10)}</td>
        <td>{order.totalPrice.toFixed(2)}</td>
        
        <td>{order.isPaid ? order.paidAt.substring(0, 10) : 'No'}</td>
        <td>
            {userInfo.isAdmin ? getDeliveryStatusForAdmin(order) : getDeliveryStatusForUser(order)}
       
          {isDelayed && canViewWarning && (
            <span style={{ color: 'red', marginLeft: '10px' }}>
              ⚠️ {/* or any other warning icon you prefer */}
            </span>
          )}
        </td>
        <td>
          <Button
            type="button"
            className="table-btn"
            variant="light"
            onClick={() => navigate(`/order/admin/${order._id}`)}
          >
            <FontAwesomeIcon icon={faInfoCircle} /> {/* Icon for Details */}
          </Button>
          &nbsp;
          {userInfo.isAdmin && (
            <Button
              type="button"
              className="table-btn"
              variant="light"
              onClick={() => deleteHandler(order)}
            >
              <FontAwesomeIcon icon={faTrash} /> {/* Icon for Delete */}
            </Button>
          )}
        </td>
      </tr>
    );
  })}
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

        <Button className="csv-button" variant="primary" onClick={downloadCSV}>Export as CSV</Button>
      </div>
      

      )}
    </div>
  );
}