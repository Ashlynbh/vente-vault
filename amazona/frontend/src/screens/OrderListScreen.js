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



const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        orders: action.payload,
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
    default:
      return state;
  }
};
export default function OrderListScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, orders, loadingDelete, successDelete }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: '',
    });

useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });

      // Fetch orders
      const { data: ordersData } = await axios.get(`/api/orders`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      console.log('Fetched Orders:', ordersData); // Log the orders data

      // Fetch dispatch times
      const { data: dispatchTimes } = await axios.get(`/api/orders/dispatch-times`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      console.log('Fetched Dispatch Times:', dispatchTimes); // Log the dispatch times data

      // Merging orders with dispatch times
      const ordersWithDispatchTimes = ordersData.map(order => ({
        ...order,
        dispatchTime: dispatchTimes[order._id]
      }));

      console.log('Orders with dispatch times:', ordersWithDispatchTimes); // Log the merged data

      dispatch({ type: 'FETCH_SUCCESS', payload: ordersWithDispatchTimes });
    } catch (err) {
      console.error('Error fetching data:', err); // Log any errors
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  if (successDelete) {
    dispatch({ type: 'DELETE_RESET' });
  } else {
    fetchData();
  }
}, [userInfo, successDelete]);


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
        <table className="table table-striped"> {/* Striped table for alternating row colors */}
          <thead>
            <tr>
              <th>ID</th>
              <th>USER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>PAID</th>
              <th>DELIVERED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.user ? order.user.name : 'DELETED USER'}</td>
                <td>{order.createdAt.substring(0, 10)}</td>
                <td>{order.totalPrice.toFixed(2)}</td>
                <td>{order.isPaid ? order.paidAt.substring(0, 10) : 'No'}</td>
                <td>
                {getDeliveryStatusForUser(order)}
                  {/* Check if dispatchTime exceeds 24 hours (1440 minutes) and display a warning icon with minutes */}
                  {order.dispatchTime > 1440 && (
                    <span className="warning-icon">⚠️ ({order.dispatchTime} mins)</span>
                  )}
                </td>
                <td>
                  <Button
                    type="button"
                    className="table-btn"
                    variant="light"
                    onClick={() => navigate(`/order/admin/${order._id}`)}
                  >
                    Details
                  </Button>
                  &nbsp;
                    {userInfo.isAdmin && (
                      <Button
                        type="button"
                        className="table-btn"
                        variant="light"
                        onClick={() => deleteHandler(order)}
                      >
                        Delete
                      </Button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button className="csv-button" variant="primary" onClick={downloadCSV}>Export as CSV</Button>
      </div>
      

      )}
    </div>
  );
}