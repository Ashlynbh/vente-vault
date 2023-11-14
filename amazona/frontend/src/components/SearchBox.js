import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { useNavigate } from 'react-router-dom';

export default function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleChange = (e) => {
    setQuery(e.target.value);
    navigate(e.target.value ? `/search/?query=${e.target.value}` : '/search');
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
        <Form className="d-flex me-auto" onSubmit={(e) => e.preventDefault()}>
          <FormControl
            type="text"
            name="q"
            id="q"
            value={query}
            onChange={handleChange}
            placeholder="Search..."
            aria-label="Search Products"
            autoFocus
            onBlur={() => setShowInput(false)}
            className="search-form"  // Applying the custom class
          />
        </Form>
      )}
    </div>
  );
}
