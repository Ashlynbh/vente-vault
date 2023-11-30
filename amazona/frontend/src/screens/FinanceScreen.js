import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Store } from '../Store'; // Update the path according to your project structure

const FinanceScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/orders/invoices', {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });

        setInvoices(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchInvoices();
    }
  }, [userInfo]);

  const renderPaidStatus = (isPaid) => {
    const statusColor = isPaid ? 'green' : 'red';
    return <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: statusColor }}></div>;
  };

    const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    if (invoice && invoice.pdfPath) {
        const fullInvoicePath = process.env.NODE_ENV === 'production' 
        ? `ventevault.com${invoice.pdfPath}`
        : `http://localhost:5000${invoice.pdfPath}`;
        
        window.open(fullInvoicePath, '_blank', 'noopener,noreferrer');
    } else {
        alert('Invoice PDF not available.');
    }
    };



  if (!userInfo) return <div>Please login to view this page.</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (

     <div className="table-container" >
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
                  className="table-btn"
                  onClick={() => handleViewInvoice(invoice._id)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default FinanceScreen;
