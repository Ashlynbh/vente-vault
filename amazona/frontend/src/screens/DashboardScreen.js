import React, { useContext, useEffect, useReducer } from 'react';
import Chart from 'react-google-charts';
import axios from 'axios';
import { Store } from '../Store';
import { getError } from '../utils';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function DashboardScreen() {
  const [{ loading, summary, error }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
  });
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/orders/summary', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
          
        });
        console.log(data);
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userInfo]);

const formatDispatchTime = (minutes) => {
  if (isNaN(minutes)) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};


return (
    <div className="dashboard-container">
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
        <div className="getting-started-link">
          <Link to="/admin/guide" style={{ textDecoration: 'underline' }}>Getting Started Guide</Link>
        </div>
        {/* First Row of Cards */}
        <Row className="dashboard-row">
          {[
               { 
              title: 'Outstanding Orders', 
              amount: summary.paidNotDeliveredOrdersCount ? summary.paidNotDeliveredOrdersCount : 0, 
              icon: 'fas fa-exclamation-triangle',
              description: 'Count of orders that have been paid and have not been dispatched'
            },
           { title: 'Users', amount: summary.users ? summary.users.uniqueUsers : 0, icon: 'fas fa-users',
          description: 'Count of unique users who have purchased orders' },

            { title: 'Orders', amount: summary.orders ? summary.orders.numOrders : 0, icon: 'fas fa-shopping-cart',
           description: 'Count of total orders'  },
            { title: 'Sales', amount: `$${summary.orders ? summary.orders.totalSales.toFixed(2) : 0}`, icon: 'fas fa-dollar-sign',
          description: 'Sum of total sales'  },

           {
  title: 'Dispatch Time',
amount: userInfo.isAdmin ? (
  typeof summary.brandDispatchSummary === 'object' ?
    formatDispatchTime(
      parseFloat(
        (Object.values(summary.brandDispatchSummary).reduce((acc, cur) => acc + cur, 0) /
        Object.keys(summary.brandDispatchSummary).length).toFixed(2)
      )
    ) :
    'N/A' // Fallback if not an object
  ) : (
    typeof summary.brandDispatchSummary === 'object' ?
      formatDispatchTime(
        parseFloat(
          (summary.brandDispatchSummary[userInfo._id] || 0).toFixed(2)
        )
      ) :
      'N/A' // Fallback if not an object or undefined
  ),
  icon: 'fas fa-truck',
  description: 'Average time between payment and shipment'
}
          ].map((card, index) => (
                 <Col xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
                  <Card className="dashboard-card" title={card.description}> {/* Add title here */}
                    <Card.Body className="card-body-flex">
                      <i className={`${card.icon} dashboard-card-icon`}></i>
                      <div>
                        <Card.Text className="dashboard-card-text">
                          {card.title}
                        </Card.Text>
                        <Card.Title className="dashboard-card-title">
                          {card.amount}
                        </Card.Title>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
        </Row>


          {/* Second Row with Sales Chart and Categories Chart */}
          <Row>
             <Col md={6} className="dashboard-chart my-3 mx-2">
              <h2 className="dashboard-chart-title">Sales</h2>
              {summary.dailyOrders.length === 0 ? (
                <MessageBox>No Sale</MessageBox>
              ) : (
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ['Date', 'Sales'],
                    ...summary.dailyOrders.map((x) => [x._id, x.sales]),
                  ]}
                  options={{
                    colors: ['#C24D2A'],
                    hAxis: {
                      title: 'Date',
                    },
                    vAxis: {
                      title: 'Sales',
                      minValue: 0, // Start at 0

                    },
                    legend: { position: 'bottom' },
                    // Additional chart styling options
                    chartArea: { width: '80%', height: '70%' },
                    pointSize: 5,
                    lineWidth: 2,
                    // Add more customizations as needed
                  }}
                  // options for the chart

              
                />
              )}
            </Col>
             <Col md={5} className="category-chart my-3 mx-2">
              <h2 className="dashboard-chart-title">Categories</h2>
              {summary.productCategories.length === 0 ? (
                <MessageBox>No Category</MessageBox>
              ) : (
                <Chart
                  width="100%"
                  height="400px"
                  chartType="PieChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ['Category', 'Products'],
                    ...summary.productCategories.map((x) => [x._id, x.count]),
                  ]}
                  options={{
                  // Custom colors for pie chart slices
                  colors: ['#12294c', '#2E5B41', '#C24D2A', '#E6D3BF', '#AB47BC', '#00ACC1'],
                  legend: { position: 'bottom' },
                  // Additional styling options
                  chartArea: { width: '90%', height: '80%' },
                }}
         
                />
              )}
            </Col>
          </Row>

          {/* Third Row with Placeholder Cards */}
          <Row>
            {summary.topProducts && summary.topProducts.map((product, index) => (
              <Col md={2} key={index}>
                <Card className="dashboard-card top-product-card">
                  <Card.Body className="card-body-flex2">
                    <Card.Title className="dashboard-card-title">{product.name}</Card.Title>
                    <Card.Text> ${product.totalSales.toFixed(2)} <i className="fas fa-arrow-up text-success icon-spacing"></i></Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {summary.bottomProducts && summary.bottomProducts.map((product, index) => (
              <Col md={2} key={index}>
                <Card className="dashboard-card bottom-product-card">
                  <Card.Body className="card-body-flex2">
                    <Card.Title className="dashboard-card-title">{product.name}</Card.Title>
                    
                    <Card.Text>${product.totalSales.toFixed(2)}
                    <i className="fas fa-arrow-down text-danger icon-spacing"></i></Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
}