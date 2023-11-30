import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

export default function BrandGuideScreen() {
  // Placeholder function for handling button clicks
  const handleButtonClick = (section) => {
    console.log(`Open pop-up for ${section}`);
    // Implement pop-up logic here
  };

  return (
    <Container className="brand-guide-container">
      <Row className="my-3">
        <Col>
          <Button className="brand-guide-button" variant="outline-primary" onClick={() => handleButtonClick('Products')}>Products</Button>
        </Col>
        <Col>
          <Button className="brand-guide-button" variant="outline-secondary" onClick={() => handleButtonClick('Orders')}>Orders</Button>
        </Col>
        <Col>
          <Button className="brand-guide-button" variant="outline-success" onClick={() => handleButtonClick('Finance')}>Finance</Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button className="brand-guide-button" variant="outline-danger" onClick={() => handleButtonClick('Returns')}>Returns</Button>
        </Col>
        <Col>
          <Button className="brand-guide-button" variant="outline-warning" onClick={() => handleButtonClick('Reporting')}>Reporting</Button>
        </Col>
        <Col>
          <Button className="brand-guide-button" variant="outline-info" onClick={() => handleButtonClick('Videos')}>Videos</Button>
        </Col>
      </Row>
    </Container>
  );
}
