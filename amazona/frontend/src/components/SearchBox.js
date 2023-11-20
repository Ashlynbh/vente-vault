import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(query ? `/search/?query=${query}` : '/search');
    setQuery(''); // Clear the search bar after submitting
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleBlur = () => {
    setShowInput(false);
    setQuery(''); // Clear the search bar on blur
  };

  return (
    <div>
      {!showInput && (
        <i 
          className="fas fa-search icon-search" 
          onClick={() => setShowInput(true)}
          style={{ cursor: 'pointer' }}
        ></i>
      )}
      {showInput && (
        <div className="search-popup">
          <i className="fas fa-times icon-close" onClick={() => setShowInput(false)}></i>
          <Form className="d-flex me-auto" onSubmit={handleSubmit}>
            <FormControl
              type="text"
              name="q"
              id="q"
              value={query}
              onChange={handleChange}
              placeholder="Search..."
              aria-label="Search Products"
              autoFocus
              onBlur={handleBlur}
              className="search-form"
            />
          </Form>
        </div>
      )}
    </div>
  );
}
