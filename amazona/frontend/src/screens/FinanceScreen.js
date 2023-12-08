import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Store } from '../Store';

const FinanceScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { state } = useContext(Store);
  const { userInfo } = state;

  // Function to fetch all invoices
  const fetchAllInvoices = async () => {
    try {
      setLoading(true);
      const allInvoicesData = await axios.get('/api/orders/all-invoices', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setInvoices(Array.isArray(allInvoicesData.data) ? allInvoicesData.data : [allInvoicesData.data]);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching all invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all invoices for display
  useEffect(() => {
    if (userInfo) {
      fetchAllInvoices();
    }
  }, [userInfo]);

  // Separate useEffect for creating monthly invoices
  useEffect(() => {
    const createMonthlyInvoices = async () => {
      try {
        await axios.get('/api/orders/invoices', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        // Optionally, refresh the invoices list after creation
        fetchAllInvoices();
      } catch (err) {
        console.error("Error creating monthly invoices:", err);
      }
    };

    // This should run only when component mounts or userInfo changes
    if (userInfo) {
      createMonthlyInvoices();
    }
  }, [userInfo]); // Removed 'fetchAllInvoices' from dependency array

  const renderPaidStatus = (isPaid) => {
    const statusColor = isPaid ? 'green' : 'red';
    return <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: statusColor }}></div>;
  };

  const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (invoice && invoice.pdfPath) {
      const fullInvoicePath = process.env.NODE_ENV === 'production' 
        ? `${invoice.pdfPath}`
        : `http://localhost:5000${invoice.pdfPath}`;
      
      window.open(fullInvoicePath, '_blank', 'noopener,noreferrer');
    } else {
      alert('Invoice PDF not available.');
    }
  };

  if (!userInfo) return <div>Please login to view this page.</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  const handleTogglePaidStatus = async (invoiceId) => {
  try {
    const response = await axios.put(`/api/orders/invoice/${invoiceId}/pay`, {}, {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    });
    if (response.data) {
      alert('Invoice status updated successfully');
      fetchAllInvoices(); // Refresh the invoices list
    }
  } catch (err) {
    console.error("Error toggling invoice status:", err);
    alert('Error updating invoice status');
  }
};


  return (
    <div className="table-container">
      <table className="table table-striped" style={{ marginTop: '6%' }}>
        <thead>
          <tr>
            <th>INVOICE ID</th>
            <th>INVOICE DATE</th>
            <th>PAYOUT</th>
            <th>PAID</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td>{invoice._id}</td>
              <td>{invoice.invoiceDate.substring(0, 10)}</td>
              <td>${invoice.totalAmount.toFixed(2)}</td>
              <td>{renderPaidStatus(invoice.isPaid)}</td>
              <td>
                <button
                       type="button"
            className="table-btn btn btn-light"
            variant="light"
                  onClick={() => handleViewInvoice(invoice._id)}
                >
                  View
                </button>
                {userInfo.isAdmin && (
                  <button
                         type="button"
            className="table-btn btn btn-light"
                    onClick={() => handleTogglePaidStatus(invoice._id)}
                  >
                    Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceScreen;

