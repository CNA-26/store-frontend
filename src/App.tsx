import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";
import ProductsPage from "./pages/ProductsPage";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import { CartProvider, useCart } from "./contexts/CartContext";
import { WishlistProvider, useWishlist } from "./contexts/WishlistContext";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { addToCart } = useCart();
  return (
    <div className="min-h-screen bg-monstera-light">
      <header className="bg-monstera-dark shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-lemonfunky text-5xl md:text-6xl text-monstera-lime text-center mb-6">
            Monstera
          </h1>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for plants..."
                className="w-full px-6 py-3 pl-12 rounded-full border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark text-lg"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-monstera-brown"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-4 border-monstera-green">
            <h2 className="text-4xl md:text-5xl font-bold text-monstera-dark mb-6">
              Your Green Paradise
            </h2>
            <p className="text-xl text-monstera-brown mb-8 leading-relaxed">
              Discover beautiful houseplants and everything you need to create your perfect indoor jungle.
              From rare monsteras to easy-care succulents.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/products">
                <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105">
                  Shop Plants
                </button>
              </Link>
              <button className="bg-monstera-lime hover:bg-monstera-brown text-monstera-dark hover:text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105">
                View Collection
              </button>
              <Link to="/contact">
                <button className="bg-monstera-dark hover:bg-monstera-green text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-monstera-green rounded-xl p-6 shadow-lg hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Fresh & Healthy</h3>
              <p className="text-monstera-light">
                All our plants are carefully selected and delivered fresh from our greenhouse
              </p>
            </div>
            <div className="bg-monstera-brown rounded-xl p-6 shadow-lg hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Fast Delivery</h3>
              <p className="text-monstera-light">
                Free shipping on orders over €50. Your plants arrive safely packaged
              </p>
            </div>
            <div className="bg-monstera-lime rounded-xl p-6 shadow-lg hover:shadow-2xl transition duration-300">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-xl font-bold text-monstera-dark mb-2">Plant Care Guide</h3>
              <p className="text-monstera-dark">
                Every plant comes with detailed care instructions for success
              </p>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-monstera-dark mb-8 text-center">
              Popular Plants
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105">
                <img
                  src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&h=400&fit=crop"
                  alt="Monstera Deliciosa"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-monstera-dark mb-2">Monstera Deliciosa</h3>
                  <p className="text-monstera-brown mb-4">The classic Swiss Cheese Plant</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-monstera-green">€29.99</span>
                    <button onClick={() => addToCart({ id: '1', name: 'Monstera Deliciosa', price: 29.99 })} className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105">
                <img
                  src="https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=800&h=400&fit=crop"
                  alt="Succulent Mix"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-monstera-dark mb-2">Succulent Mix</h3>
                  <p className="text-monstera-brown mb-4">Easy-care collection of 3 succulents</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-monstera-green">€19.99</span>
                    <button onClick={() => addToCart({ id: '2', name: 'Succulent Mix', price: 19.99 })} className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105">
                <img
                  src="https://images.unsplash.com/photo-1593482892290-f54927ae1bb8?w=800&h=400&fit=crop"
                  alt="Pothos Marble"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-monstera-dark mb-2">Pothos Marble</h3>
                  <p className="text-monstera-brown mb-4">Beautiful trailing plant for beginners</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-monstera-green">€24.99</span>
                    <button onClick={() => addToCart({ id: '3', name: 'Pothos Marble', price: 24.99 })} className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-monstera-dark text-monstera-light py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg">
            &copy; 2026 Monstera Plant Shop. Grow your indoor jungle with us!
          </p>
        </div>
      </footer>
    </div>
  )
}


function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <CartIcon />
        <WishlistIcon />
        <LoginIcon />
        <CartNotification />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </WishlistProvider>
    </CartProvider>
  );
}

function CartIcon() {
  const { cartCount } = useCart();
  return (
    <div className="fixed right-4 top-4 z-50">
      <Link to="/checkout" className="relative inline-flex items-center p-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light">
        <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-monstera-lime text-monstera-dark rounded-full text-xs font-bold px-2 py-0.5">{cartCount}</span>
        )}
      </Link>
    </div>
  );
}

function WishlistIcon() {
  const { wishlistCount } = useWishlist();
  return (
    <div className="fixed right-4 top-20 z-50">
      <Link to="/wishlist" className="relative inline-flex items-center p-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light">
        <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {wishlistCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs font-bold px-2 py-0.5">{wishlistCount}</span>
        )}
      </Link>
    </div>
  );
}

function LoginIcon() {
  return (
    <div className="fixed right-4 top-36 z-50">
      <Link
        to="/login"
        className="relative inline-flex items-center p-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light transition"
      >
        <svg
          className="w-6 h-6 text-monstera-dark"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {/* Avatar icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A9 9 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>
    </div>
  );
}

function CartNotification() {
  const { notification, clearNotification } = useCart();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          clearNotification();
        }, 300); // Match animation duration
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      clearNotification();
      navigate('/checkout');
    }, 200);
  };

  if (!isVisible || !notification) return null;

  return (
    <div
      onClick={handleClick}
      className={`fixed top-36 right-4 z-40 cursor-pointer transition-all duration-300 transform ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
    >
      <div className="bg-monstera-green text-white rounded-xl shadow-2xl p-5 min-w-[320px] border-2 border-monstera-dark hover:bg-monstera-dark transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-white rounded-full p-2.5 flex-shrink-0">
            <svg className="w-6 h-6 text-monstera-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-base mb-1.5">
              {notification.count > 1
                ? `${notification.count}x ${notification.productName}`
                : notification.productName}
            </p>
            <p className="text-sm text-monstera-light">
              Added to cart • Click to view cart
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
