import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faEnvelope } from '@fortawesome/free-solid-svg-icons';


const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        users: action.payload.users, 
        pages: action.payload.pages, 
        loading: false,
      };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
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
export default function UserListScreen() {
  const navigate = useNavigate();
  const [{ loading, error, users, pages, loadingDelete, successDelete, page, ordersPerPage }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    users: [],
    pages: 0,
    page: 1,
    ordersPerPage: 10, // Define how many users you want per page
  });



  const { state } = useContext(Store);
  const { userInfo } = state;

  const [brandFilter, setBrandFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const clearFilters = () => {
  setBrandFilter('');
  setApprovalFilter('');
};


  // Filter users whenever the users list or filters change
  useEffect(() => {
    if (users) {
      setFilteredUsers(users.filter(user => {
        return (
          (brandFilter === '' || (brandFilter === 'YES' && user.isBrand) || (brandFilter === 'NO' && !user.isBrand)) &&
          (approvalFilter === '' || (approvalFilter === 'YES' && user.isBrandApproved) || (approvalFilter === 'NO' && !user.isBrandApproved))
        );
      }));
    }
  }, [users, brandFilter, approvalFilter]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/users?page=${page}&limit=${ordersPerPage}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    if (successDelete) {
      dispatch({ type: 'DELETE_RESET' });
    } else {
      fetchData();
    }
  }, [userInfo, successDelete, page]);


  // Delete handler
  const deleteHandler = async (user) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        dispatch({ type: 'DELETE_REQUEST' });
        await axios.delete(`/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('User deleted successfully');
        dispatch({ type: 'DELETE_SUCCESS' });
      } catch (error) {
        toast.error(getError(error));
        dispatch({ type: 'DELETE_FAIL' });
      }
    }
  };

  const handleSendSubscriptionLink = async (user) => {
  try {
    // Call your backend endpoint to send the email
    await axios.post('/api/users/send-subscription-link', {
      userId: user._id,
      userEmail: user.email,
      userName:user.name
    });
    // Optionally, show a success message
    toast.success('Subscription link sent successfully');
  } catch (error) {
    // Handle errors
    toast.error('Error sending subscription link');
  }
};


  return (
    <div>
      <Helmet>
        <title>Users</title>
      </Helmet>
      <h1 className="admin-headers">Users</h1>
      {/* Filters */}
      <div className="filters">
        <select className="filter-item" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">All</option>
          <option value="YES">Brand</option>
          <option value="NO">Not Brand</option>
        </select>
        <select className="filter-item" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
          <option value="">All</option>
          <option value="YES">Approved</option>
          <option value="NO">Not Approved</option>
        </select>
        <Button variant="secondary" onClick={clearFilters} className="filter-button">Clear All Filters</Button>
      </div>
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
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ADMIN</th>
                <th>BRAND</th>
                <th>BRAND APPROVED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.isAdmin ? 'YES' : 'NO'}</td>
                  <td>{user.isBrand ? 'YES' : 'NO'}</td>
                  <td>{user.isBrandApproved ? 'YES' : 'NO'}</td>
                  <td>
                    <Button
                      type="button"
                      className='table-btn'
                      variant="light"
                      onClick={() => navigate(`/admin/user/${user._id}`)}
                    >
                      <FontAwesomeIcon icon={faEdit} /> {/* Icon for Edit */}
                    </Button>
                    &nbsp;
                    <Button
                      type="button"
                      className='table-btn'
                      variant="light"
                      onClick={() => deleteHandler(user)}
                    >
                      <FontAwesomeIcon icon={faTrash} /> {/* Icon for Delete */}
                    </Button>
                {/* Existing buttons */}
                  {user.isBrand && (
                    <Button
                      className='table-btn'
                      type="button"
                      variant="light"
                      onClick={() => handleSendSubscriptionLink(user)}
                    >
                      <FontAwesomeIcon icon={faEnvelope} /> {/* Only Email Icon */}
                    </Button>
                  )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-container">
            {[...Array(pages).keys()].map(x => (
              <Button 
                key={x + 1} 
                className={`pagination-link ${x + 1 === page ? 'active' : ''}`} // Changed to 'pagination-link'
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