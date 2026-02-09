import React, { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";
import ProductsPage from "./pages/ProductsPage";

import { Link } from "react-router-dom";
function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
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
                    <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
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
                    <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
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
                    <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300">
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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
    </Routes>
  );
}

export default App
