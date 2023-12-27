
import data from "../data";
import axios from 'axios';
import { useEffect, useState, useReducer } from "react";
import logger from 'use-reducer-logger'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Product, { SimplifiedProduct } from "../components/product";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import Carousel from 'react-bootstrap/Carousel';
import JoinUs from "../components/JoinUs";
import InstagramFeed from "../components/Instagram";
import MyCarousel from "../components/Carousel";
import InformationBoxes from "../components/InformationBoxes";





const reducer = (state, action) => {
    switch(action.type) {
        case 'FETCH_REQUEST':
            return{...state, loading:true};
        case 'FETCH_SUCCESS':
            return {...state, products:action.payload,loading: false};
        case 'FETCH_FAIL':
            return {...state, loading:false, error:action.payload};
        default:
            return state;
    }
};



function HomeScreen() {
    const [{loading, error, products}, dispatch] = useReducer(logger(reducer),
        { loading:true, 
            error:'',
            products:[]
});


    // const [products,setProducts] = useState([]);
    useEffect(()=>{
        const fetchData = async () =>{
            dispatch({type:'FETCH_REQUEST'});
            try {
                const result = await axios.get('/api/products/featured');
                dispatch({type:'FETCH_SUCCESS',payload: result.data});
            }
            catch(err){
                dispatch({type:'FETCH_FAIL', payload:err.message});
            }
            
        };
        fetchData();     
    },[]);


    return (
        <div>
            <Helmet>
                <title>Vente Vault</title>
            </Helmet>
             {/* Image Carousel */}
            <MyCarousel></MyCarousel>
                 <div>
                  <InformationBoxes/>
            </div>
            <h1 className="featured-header">Must Haves</h1>
            <div className="products">
                {loading ? (
                    <LoadingBox></LoadingBox>
                ) : error ? (
                    <MessageBox variant="danger">{error}</MessageBox>
                ) : (
                    <Row>
                        {products.map((product) => (
                            <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                                <SimplifiedProduct product={product} />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <div>
                  <JoinUs />
            </div>
            <div>
            <InstagramFeed />
        </div>


        </div>
    );
}

export default HomeScreen;