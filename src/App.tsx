import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetails from "./pages/ProductDetails";
import WishlistPage from "./pages/WishlistPage";
import ContactPage from "./pages/ContactPage";
import { CartProvider, useCart } from "./contexts/CartContext";
import { WishlistProvider, useWishlist } from "./contexts/WishlistContext";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const EXTERNAL_LOGIN_URL = "https://users-frontend-users-frontend.2.rahtiapp.fi/login";

type HomeProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  code?: string;
};

const FALLBACK_PRODUCTS: HomeProduct[] = [
  { id: "P001", name: "Monstera", price: 25, image: "https://placehold.co/500x500?text=Monstera", description: "A classic statement plant." },
  { id: "P002", name: "Alocasia", price: 59, image: "https://placehold.co/500x500?text=Alocasia", description: "Bold leaves and tropical vibes." },
  { id: "P003", name: "Strelitzia", price: 139, image: "https://placehold.co/500x500?text=Strelitzia", description: "Tall and dramatic for bright rooms." },
  { id: "P004", name: "Snake Plant", price: 24.99, image: "https://placehold.co/500x500?text=Snake+Plant", description: "Low-maintenance and beginner friendly." },
];

const FEATURED_COUNT = 9;
const HOME_PRODUCTS_CACHE_KEY = "home_products_cache_v1";

function readCachedHomeProducts(): HomeProduct[] {
  try {
    const raw = sessionStorage.getItem(HOME_PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HomeProduct[];
  } catch {
    return [];
  }
}

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [products, setProducts] = useState<HomeProduct[]>(readCachedHomeProducts);
  const [productsLoading, setProductsLoading] = useState(() => readCachedHomeProducts().length === 0);
  const { addToCart } = useCart();
  const { wishlistStats, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const PRODUCT_API = (import.meta.env.VITE_API_BASE as string) || "https://product-service-products-service.2.rahtiapp.fi";

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      if (products.length === 0) {
        setProductsLoading(true);
      }
      try {
        const res = await fetch(`${PRODUCT_API.replace(/\/$/, "")}/products`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid products payload");
        const mapped: HomeProduct[] = (data as any[]).map((p) => {
          let image: string | undefined;
          try {
            if (Array.isArray(p?.image_urls) && p.image_urls.length > 0) {
              const firstImage = String(p.image_urls[0]);
              image = /^https?:\/\//.test(firstImage)
                ? firstImage
                : firstImage.startsWith("/")
                ? `${new URL(PRODUCT_API).origin}${firstImage}`
                : `${new URL(PRODUCT_API).origin}/images/${firstImage}`;
            } else if (p?.img) {
              image = /^https?:\/\//.test(String(p.img))
                ? String(p.img)
                : `${new URL(PRODUCT_API).origin}/images/${String(p.img)}`;
            } else if (p?.image) {
              image = /^https?:\/\//.test(String(p.image))
                ? String(p.image)
                : `${new URL(PRODUCT_API).origin}/images/${String(p.image)}`;
            }
          } catch {
            image = undefined;
          }

          const code = String(p?.product_code ?? p?.id ?? "");
          return {
            id: code || `p-${Math.random().toString(36).slice(2, 7)}`,
            code: code || undefined,
            name: String(p?.product_name ?? p?.name ?? "Unnamed"),
            price: Number(p?.price ?? 0),
            image,
            description: p?.description_text ?? p?.description,
          };
        });

        if (mounted && mapped.length > 0) {
          setProducts(mapped);
          try {
            sessionStorage.setItem(HOME_PRODUCTS_CACHE_KEY, JSON.stringify(mapped));
          } catch {
            // Ignore cache write errors
          }
        }
      } catch {
        if (mounted && products.length === 0) {
          setProducts(FALLBACK_PRODUCTS);
        }
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };

    void fetchProducts();
    return () => {
      mounted = false;
    };
  }, [PRODUCT_API]);

  const productByCode = useMemo(() => {
    return products.reduce<Record<string, HomeProduct>>((acc, product) => {
      const key = product.code ?? product.id;
      if (key) acc[key] = product;
      return acc;
    }, {});
  }, [products]);

  const popularProducts = useMemo(() => {
    const rankedCodes = Object.entries(wishlistStats)
      .sort((a, b) => b[1] - a[1])
      .map(([code]) => code);

    const rankedProducts = rankedCodes
      .map((code) => productByCode[code])
      .filter((product): product is HomeProduct => Boolean(product));

    const rankedIds = new Set(rankedProducts.map((p) => p.id));
    const fallbackProducts = products.filter((p) => !rankedIds.has(p.id));

    return [...rankedProducts, ...fallbackProducts].slice(0, 3);
  }, [wishlistStats, productByCode, products]);

  const featuredProducts = useMemo(() => {
    const popularIds = new Set(popularProducts.map((p) => p.id));
    const candidates = products.filter((p) => !popularIds.has(p.id));
    const sortedCandidates = [...candidates].sort((a, b) =>
      (a.name || a.id).localeCompare(b.name || b.id)
    );

    if (sortedCandidates.length >= FEATURED_COUNT) {
      return sortedCandidates.slice(0, FEATURED_COUNT);
    }

    const rest = products
      .filter((p) => !sortedCandidates.some((selected) => selected.id === p.id))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    return [...sortedCandidates, ...rest].slice(0, FEATURED_COUNT);
  }, [products, popularProducts]);

  const getProductDetailId = (product: HomeProduct) => product.code ?? product.id;

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((product) => {
        const name = product.name.toLowerCase();
        const description = (product.description ?? "").toLowerCase();
        const code = (product.code ?? product.id).toLowerCase();
        return name.includes(query) || description.includes(query) || code.includes(query);
      })
      .slice(0, 6);
  }, [products, searchQuery]);

  const handleSelectSearchSuggestion = (product: HomeProduct) => {
    setSearchQuery(product.name);
    setSearchError("");
    navigate(`/products/${getProductDetailId(product)}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchError("");
      return;
    }

    const match = searchSuggestions[0];

    if (!match) {
      setSearchError("No matching plant found.");
      return;
    }

    setSearchError("");
    navigate(`/products/${getProductDetailId(match)}`);
  };

  const handleToggleWishlist = (product: HomeProduct) => {
    const wishlistId = getProductDetailId(product);
    if (isInWishlist(wishlistId)) {
      removeFromWishlist(wishlistId);
      return;
    }
    addToWishlist({
      id: wishlistId,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen bg-monstera-light">
      <header className="bg-monstera-dark shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-lemonfunky text-5xl md:text-6xl text-monstera-lime text-center mb-6">
            Monstera
          </h1>
          <div className="max-w-2xl mx-auto">
            <form className="relative" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError("");
                }}
                placeholder="Search for plants..."
                className="w-full px-6 py-3 pl-12 rounded-full border-2 border-monstera-lime focus:outline-none focus:border-monstera-green text-monstera-dark text-lg"
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-monstera-light transition"
                aria-label="Search products"
              >
                <svg
                  className="w-6 h-6 text-monstera-brown"
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
              </button>

              {searchSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl border-2 border-monstera-lime shadow-xl overflow-hidden">
                  {searchSuggestions.map((product) => (
                    <button
                      key={`search-${product.id}`}
                      type="button"
                      onClick={() => handleSelectSearchSuggestion(product)}
                      className="w-full px-4 py-3 text-left hover:bg-monstera-light transition border-b border-monstera-light last:border-b-0"
                    >
                      <span className="text-monstera-dark font-semibold truncate">{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
            <p className="text-monstera-lime text-sm mt-2 min-h-[1.25rem] text-center">{searchError}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 border-4 border-monstera-green">
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

          <div className="mt-20 space-y-12">
            <section className="bg-white rounded-3xl border-4 border-monstera-green shadow-xl p-6 md:p-8">
              <h2 className="text-3xl md:text-4xl font-bold text-monstera-dark text-center">
                Popular
              </h2>
              <p className="text-monstera-brown text-center mt-2 mb-8">Most wishlisted plants right now.</p>
              <div className="grid md:grid-cols-3 gap-8">
                {productsLoading && products.length === 0
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`popular-skeleton-${index}`}
                        className="h-[360px] rounded-2xl bg-monstera-light border-4 border-monstera-green animate-pulse"
                      />
                    ))
                  : popularProducts.map((product) => (
                      <HomeProductCard
                        key={`popular-${product.id}`}
                        product={product}
                        onAdd={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                        onToggleWishlist={() => handleToggleWishlist(product)}
                        isInWishlist={isInWishlist(getProductDetailId(product))}
                        detailPath={`/products/${getProductDetailId(product)}`}
                        badge={`${wishlistStats[product.code ?? product.id] ?? 0} wishlists`}
                      />
                    ))}
              </div>
            </section>

            <section className="bg-monstera-lime rounded-3xl border-4 border-monstera-brown shadow-xl p-6 md:p-8">
              <h2 className="text-3xl md:text-4xl font-bold text-monstera-dark text-center">
                Featured
              </h2>
              <p className="text-monstera-dark text-center mt-2 mb-8">Random picks to discover something new.</p>
              <div className="grid md:grid-cols-3 gap-8">
                {productsLoading && products.length === 0
                  ? Array.from({ length: 9 }).map((_, index) => (
                      <div
                        key={`featured-skeleton-${index}`}
                        className="h-[360px] rounded-2xl bg-white/60 border-4 border-monstera-brown animate-pulse"
                      />
                    ))
                  : featuredProducts.map((product) => (
                      <HomeProductCard
                        key={`featured-${product.id}`}
                        product={product}
                        onAdd={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                        onToggleWishlist={() => handleToggleWishlist(product)}
                        isInWishlist={isInWishlist(getProductDetailId(product))}
                        detailPath={`/products/${getProductDetailId(product)}`}
                      />
                    ))}
              </div>
            </section>
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

function HomeProductCard({
  product,
  onAdd,
  onToggleWishlist,
  isInWishlist,
  detailPath,
  badge,
}: {
  product: HomeProduct;
  onAdd: () => void;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
  detailPath: string;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-monstera-green hover:shadow-2xl transition duration-300 transform hover:scale-105 h-full flex flex-col relative">
      <button
        type="button"
        onClick={onToggleWishlist}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white hover:bg-monstera-light transition duration-300 shadow-md"
        aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      >
        <svg
          className={`w-6 h-6 ${isInWishlist ? "fill-red-500 text-red-500" : "text-monstera-brown"}`}
          fill={isInWishlist ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link to={detailPath} className="h-48 w-full bg-monstera-light border-b-2 border-monstera-green flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-monstera-brown text-sm font-semibold">Image placeholder</span>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl font-bold text-monstera-dark mb-2">
          <Link to={detailPath} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="text-monstera-brown mb-4 min-h-[3rem] line-clamp-2">{product.description ?? "A healthy plant for your indoor jungle."}</p>
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-bold text-monstera-green whitespace-nowrap">{eur(product.price)}</span>
            <button
              onClick={onAdd}
              className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition duration-300 whitespace-nowrap min-w-[8rem]"
            >
              Add to Cart
            </button>
          </div>
          <p className="text-sm text-monstera-brown mt-1 min-h-[1.25rem] text-center">{badge ?? ""}</p>
        </div>
      </div>
    </div>
  );
}

function eur(n: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function ExternalLoginRedirect() {
  useEffect(() => {
    window.location.replace(EXTERNAL_LOGIN_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <p>
        Redirecting to login…{" "}
        <a href={EXTERNAL_LOGIN_URL} className="text-monstera-green font-semibold hover:underline">
          Click here if it does not open automatically
        </a>
      </p>
    </div>
  );
}


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <FloatingActions />
          <CartNotification />
          <WishlistLoginToast />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/login" element={<ExternalLoginRedirect />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function FloatingActions() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (() => {
    if (!user) return "";
    const name = user.name || user.fullName || user.firstName || "";
    return name
      .split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  })();

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-4">
      <Link
        to="/checkout"
        className="relative flex items-center gap-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light px-4 py-2 transition"
      >
        <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        <span className="hidden sm:inline text-monstera-dark font-semibold">Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-monstera-lime text-monstera-dark rounded-full text-xs font-bold px-2 py-0.5">{cartCount}</span>
        )}
      </Link>

      <Link
        to="/wishlist"
        className="relative flex items-center gap-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light px-4 py-2 transition"
      >
        <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="hidden sm:inline text-monstera-dark font-semibold">Wishlist</span>
        {wishlistCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs font-bold px-2 py-0.5">{wishlistCount}</span>
        )}
      </Link>

      {user ? (
        <div className="relative">
          <Link
            to="/profile"
            className="flex items-center gap-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light px-4 py-2 transition"
          >
            <div className="w-8 h-8 rounded-full bg-monstera-lime text-monstera-dark flex items-center justify-center font-bold">{initials || 'ME'}</div>
            <span className="hidden sm:inline text-monstera-dark font-semibold">Profile</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="absolute -right-24 top-1/2 -translate-y-1/2 bg-red-500 text-white text-sm px-3 py-1 rounded-full shadow-md hidden sm:inline"
            title="Log out"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="flex items-center gap-3 bg-white rounded-full shadow-lg border-2 border-monstera-green hover:bg-monstera-light px-4 py-2 transition"
        >
          <svg className="w-6 h-6 text-monstera-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline text-monstera-dark font-semibold">Log in</span>
        </Link>
      )}
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
      className={`fixed bottom-6 right-6 z-40 cursor-pointer transition-all duration-300 transform ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
    >
      <div className="bg-monstera-green text-white rounded-xl shadow-2xl p-6 min-w-[360px] border-2 border-monstera-dark hover:bg-monstera-dark transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-white rounded-full p-3 flex-shrink-0">
            <svg className="w-7 h-7 text-monstera-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg mb-1.5 leading-tight">
              {notification.count > 1
                ? `${notification.count}x ${notification.productName}`
                : notification.productName}
            </p>
            <p className="text-base text-monstera-light">
              Added to cart • Click to view cart
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WishlistLoginToast() {
  const { loginToast, clearLoginToast } = useWishlist();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (loginToast) {
      setIsVisible(true);
      setIsExiting(false);

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          clearLoginToast();
        }, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loginToast, clearLoginToast]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      clearLoginToast();
      navigate('/login');
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClick}
      className={`fixed bottom-32 right-6 z-40 cursor-pointer transition-all duration-300 transform ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <div className="bg-monstera-brown text-white rounded-xl shadow-2xl p-6 min-w-[360px] border-2 border-monstera-dark hover:bg-monstera-dark transition-colors">
        <div className="flex items-start gap-4">
          <div className="bg-white rounded-full p-3 flex-shrink-0">
            <svg className="w-7 h-7 text-monstera-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg mb-1.5 leading-tight">Log in to use wishlist</p>
            <p className="text-base text-monstera-light">Click here to log in and save products to your wishlist.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
