import React, { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';


export default function MyCarousel() {
  const imageSources = ["/images/test.webp", "/images/test4.webp", "/images/test5.png"];
  const [currentImage, setCurrentImage] = useState(imageSources[0]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % imageSources.length;
      setCurrentImage(imageSources[nextIndex]);
      setCurrentIndex(nextIndex);
    }, 6000); // Change image every 3000 milliseconds (3 seconds)

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [currentIndex, imageSources]);

  return (
     <Carousel controls={false} indicators={false}>
      <Carousel.Item>
        <img
          className="d-block w-100"
          src={currentImage}
          alt="Slide"
        />
        <Carousel.Caption>
          <h3 className="custom-carousel-heading">Exclusive Discounts</h3>
          <p className="custom-carousel-text">Up to 80% off</p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}
