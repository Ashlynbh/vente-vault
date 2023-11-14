
import {BrowserRouter,Link,Route, Routes} from 'react-router-dom'
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import Navbar from 'react-bootstrap/Navbar';
import Badge from 'react-bootstrap/Badge';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Navbar';
import {LinkContainer} from 'react-router-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { Store } from './Store';
import CartScreen from './screens/CartScreen';
import SigninScreen from './screens/SigninScreen';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavDropdown from 'react-bootstrap/NavDropdown';
import ShippingAddressScreen from './screens/ShippingAddressScreen';
import SignupScreen from './screens/SignupScreen';
import PaymentMethodScreen from './screens/PaymentMethodScreen';
import PlaceOrderScreen from './screens/PlaceOrderScreen';
import OrderScreen from './screens/OrderScreen';
import OrderHistoryScreen from './screens/OrderHistory';
import ProfileScreen from './screens/ProfileScreen';
import Button from 'react-bootstrap/Button';
import { getError } from './utils';
import axios from 'axios';
import SearchBox from './components/SearchBox';
import SearchScreen from './screens/SearchScreen';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardScreen from './screens/DashboardScreen';
import ProductListScreen from './screens/ProductListScreen';
import AdminRoute from './components/AdminRoute';
import ProductEditScreen from './screens/ProductEditScreen';
import OrderListScreen from './screens/OrderListScreen';
import UserListScreen from './screens/UserListScreen';
import UserEditScreen from './screens/UserEditScreen';
import MapScreen from './screens/MapScreen';
import ForgetPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AdminOrderScreen from './screens/AdminOrderScreen';
import AdminInstagramScreen from './screens/AdminInstagramScreen';
import BrandExpressionOfInterestScreen from './screens/BrandExpressionofinterestScreen';
import BrandAdmin from './components/BrandAdminRoute';
import DiscountBar from './components/DiscountBar';
import Footer from './components/Footer';
import ContactScreen from './screens/ContactScreen';
 
function App() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { fullBox, cart, userInfo } = state;

  const signoutHandler = () => {
    ctxDispatch({ type: 'USER_SIGNOUT' });
    localStorage.removeItem('userInfo');
    localStorage.removeItem('shippingAddress');
    localStorage.removeItem('paymentMethod');
    window.location.href = '/signin';
  };
const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
const [categories, setCategories] = useState([]);
const [subCategories, setSubCategories] = useState({}); 
const [brands, setBrands] = useState([]);
const [selectedBrand, setSelectedBrand] = useState('');


useEffect(() => {
    const fetchCategoriesAndSubCategories = async () => {
      try {
        const { data: categoriesData } = await axios.get(`/api/products/categories`);
        setCategories(categoriesData);
        
        const subCategoriesData = {};
        for (const category of categoriesData) {
          try {
            const { data: subCategoryData } = await axios.get(`/api/products/sub_categories`, {
              params: { category }
            });
            subCategoriesData[category] = subCategoryData;
          } catch (err) {
            console.error(`Error fetching sub-categories for category ${category}:`, getError(err));
          }
        }
        setSubCategories(subCategoriesData);
        
      } catch (err) {
        console.error(getError(err));
      }
    };

    fetchCategoriesAndSubCategories();
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get('/api/products/brands'); // Endpoint to get unique brands
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', getError(error));
      }
    };

    fetchBrands();
  }, []);

  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const showAdminDropdownMenu = () => {
      setShowAdminDropdown(true);
  };

  const hideAdminDropdownMenu = () => {
      setShowAdminDropdown(false);
  };

  const showBrandDropdownMenu = () => {
      setShowBrandDropdown(true);
  };

  const hideBrandDropdownMenu = () => {
      setShowBrandDropdown(false);
  };



  return (

    <BrowserRouter>
      <div>     
        <ToastContainer  limit={1}
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover />
        <header>
      <DiscountBar />
          <Navbar expand="lg">
            <Container>
                  {categories.map((category) => (
                <NavDropdown renderMenuOnMount={true} className="nav-dropdown" title={category} id={`category-nav-dropdown-${category}`} key={category}>
                  {/* Subcategories within each category */}
                  {subCategories[category] && subCategories[category].map((subCategory) => (
                    <LinkContainer
                      to={{ pathname: '/search', search: `category=${category}&sub_category=${subCategory}` }}
                      key={subCategory}
                    >
                      <NavDropdown.Item>{subCategory}</NavDropdown.Item>
                    </LinkContainer>
                  ))}
                  
                </NavDropdown>
              ))}
              <NavDropdown
                title="Brands"
                className="nav-dropdown"
                id="brand-nav-dropdown"
                show={showBrandDropdown}
               onMouseEnter={showBrandDropdownMenu}
               onMouseLeave={hideBrandDropdownMenu}
              >
                {brands.map((brand) => (
                  <LinkContainer
                    to={{ pathname: '/search', search: `brand=${brand}` }}
                    key={brand}
                  >
                    <NavDropdown.Item>{brand}</NavDropdown.Item>
                  </LinkContainer>
                ))}
              </NavDropdown>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mx-auto navbar-title"> 
                  <LinkContainer to="/">
                    <Navbar.Brand>Vente Vault</Navbar.Brand>
                  </LinkContainer>
                </Nav>
                
                <Nav className="right-navbar"> 
                  <SearchBox /> 
                  <Link to="/cart" className="nav-link">
                    Cart
                    {cart.cartItems.length > 0 && (
                      <Badge pill bg="danger">
                        {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
                      </Badge>
                    )}
                  </Link>
                  {userInfo ? (
                    <NavDropdown renderMenuOnMount={true} className="nav-dropdown" title="Account" id="basic-nav-dropdown">
                      <LinkContainer to="/profile">
                        <NavDropdown.Item>User Profile</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/orderhistory">
                        <NavDropdown.Item>Order History</NavDropdown.Item>
                      </LinkContainer>
                      <NavDropdown.Divider />
                      <Link
                        className="dropdown-item"
                        to="#signout"
                        onClick={signoutHandler}
                      >
                        Sign Out
                      </Link>
                    </NavDropdown>
                  ) : (
                    <Link className="nav-link" to="/signin">
                      Sign In
                    </Link>
                  )}
                  {
                  userInfo && (userInfo.isAdmin || (userInfo.isBrand && userInfo.isBrandApproved)) && (
                    <NavDropdown 
                    renderMenuOnMount={true}
                    className="admin-nav-dropdown"
                    title="Admin"
                    id="admin-nav-dropdown"
                    show={showAdminDropdown}
                    onMouseEnter={showAdminDropdownMenu}
                    onMouseLeave={hideAdminDropdownMenu}
                    >
                      <LinkContainer to="/admin/dashboard">
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/products">
                        <NavDropdown.Item>Products</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/orders">
                        <NavDropdown.Item>Orders</NavDropdown.Item>
                      </LinkContainer>
                      {userInfo.isAdmin && (
                        <LinkContainer to="/admin/users">
                          <NavDropdown.Item>Users</NavDropdown.Item>
                        </LinkContainer>
                        
                      )}
                      {userInfo.isAdmin && (
                        <LinkContainer to="/admin/socials">
                          <NavDropdown.Item>Socials</NavDropdown.Item>
                        </LinkContainer>
                        
                      )}
                    </NavDropdown>
                  )
                }
               </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

        </header>
        <main>
          <div>
            <Routes>
              <Route path="/product/:slug" element={<ProductScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/signin" element={<SigninScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route
                path="/forget-password"
                element={<ForgetPasswordScreen />}
              />
              <Route
                path="/reset-password/:token"
                element={<ResetPasswordScreen />}
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="/placeorder" element={<PlaceOrderScreen />} />
              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderScreen />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/orderhistory"
                element={
                  <ProtectedRoute>
                    <OrderHistoryScreen />
                  </ProtectedRoute>
                }
              ></Route>
              <Route
                path="/shipping"
                element={<ShippingAddressScreen />}
              ></Route>
              <Route path="/payment" element={<PaymentMethodScreen />}></Route>
              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <BrandAdmin>
                    <DashboardScreen />
                  </BrandAdmin>
                }
              ></Route>
              <Route
                path="/admin/orders"
                element={
                  <BrandAdmin>
                    <OrderListScreen />
                  </BrandAdmin>
                }
              ></Route>
               <Route
                path="/admin/socials"
                element={
                  <AdminRoute>
                    <AdminInstagramScreen />
                  </AdminRoute>
                }
              ></Route>
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserListScreen />
                  </AdminRoute>
                }
              ></Route>
              <Route
                path="/admin/products"
                element={
                  <BrandAdmin>
                    <ProductListScreen />
                  </BrandAdmin>
                }
              ></Route>
              <Route
                path="/order/admin/:id"
                element={
                  <BrandAdmin>
                    <AdminOrderScreen />
                  </BrandAdmin>
                }
              ></Route>
              <Route
                path="/admin/product/:id"
                element={
                  <BrandAdmin>
                    <ProductEditScreen />
                  </BrandAdmin>
                }
              ></Route>
              <Route
                path="/admin/user/:id"
                element={
                  <AdminRoute>
                    <UserEditScreen />
                  </AdminRoute>
                }
              ></Route>
              <Route path="/brand/expression-of-interest" 
              element={<BrandExpressionOfInterestScreen />} />
              <Route path="/" element={<HomeScreen />} />
              <Route path="/contact" element={<ContactScreen />} />
            </Routes>
          </div>
        </main>
        <footer>
          <Footer /> 
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;