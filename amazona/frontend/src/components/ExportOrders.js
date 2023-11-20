import React, { useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Button } from 'react-bootstrap';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Helmet } from 'react-helmet-async';
import { Store } from '../Store';
import { getError } from '../utils';

const OrderExport = () => {
    const { state } = useContext(Store);
    const { userInfo } = state;

    // Reducer for handling states
    const reducer = (state, action) => {
        switch (action.type) {
            // ... existing cases ...
            default:
                return state;
        }
    };

    const [{ loading, error, orders }, dispatch] = useReducer(reducer, {
        loading: true,
        error: '',
        orders: [],
    });

    // Fetch orders
    useEffect(() => {
        const fetchData = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const { data } = await axios.get('/api/orders', {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchData();
    }, [userInfo]);

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

    return (
        <div>
            <Helmet>
                <title>Orders</title>
            </Helmet>
            {loading ? (
                <LoadingBox></LoadingBox>
            ) : error ? (
                <MessageBox variant="danger">{error}</MessageBox>
            ) : (
                <div>
                    <Button variant="primary" onClick={downloadCSV}>Export as CSV</Button>

                </div>
            )}
        </div>
    );
};

export default OrderExport;
