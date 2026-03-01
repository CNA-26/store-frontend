import { Link } from "react-router-dom";
import { useWishlist } from "../contexts/WishlistContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, moveToCart, loading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleMoveToCart = async (item: { id: string; name: string; price: number }) => {
    // Always add to cart immediately for a responsive UX
    addToCart({ id: item.id, name: item.name, price: item.price });
    // API move-to-cart removes the item server-side and updates local wishlist state
    const moved = await moveToCart(item.id, 1);
    // If API did not handle the removal, remove locally as fallback
    if (!moved) {
      removeFromWishlist(item.id);
    }
  };

  return (
    <div className="min-h-screen bg-monstera-light">
      <header className="bg-monstera-dark shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-lemonfunky text-5xl md:text-6xl text-monstera-lime text-center">
            Monstera
          </h1>
          <p className="mt-3 text-center text-monstera-light text-lg">
            Your Wishlist
          </p>
          <div className="mt-4 text-center space-x-2">
            <Link to="/">
              <button className="bg-monstera-lime hover:bg-monstera-brown text-monstera-dark font-bold py-2 px-4 rounded-full">
                Back to homepage
              </button>
            </Link>
            <Link to="/products">
              <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full">
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {!user && (
          <div className="mb-6 bg-monstera-lime border-2 border-monstera-green rounded-xl p-4 text-center text-monstera-dark">
            <p className="font-semibold">
              <Link to="/login" className="underline font-bold">Log in</Link> to save your wishlist across devices.
            </p>
          </div>
        )}

        <h2 className="text-3xl font-bold text-monstera-dark mb-8">
          My Wishlist ({wishlist.length} {wishlist.length === 1 ? "item" : "items"})
        </h2>

        {loading ? (
          <div className="text-center text-monstera-dark py-12 text-lg font-semibold">Loading wishlist…</div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-4 border-monstera-green p-12 text-center">
            <svg
              className="w-24 h-24 text-monstera-brown mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-monstera-dark mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-monstera-brown mb-6">
              Start adding plants you love to your wishlist!
            </p>
            <Link to="/products">
              <button className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-3 px-8 rounded-full transition duration-300">
                Browse Plants
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl shadow-xl border-4 border-monstera-green p-5 flex flex-col transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <Link to={`/products/${item.id}`} className="h-40 rounded-xl bg-monstera-light flex items-center justify-center mb-4 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-xl transition duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-monstera-brown text-sm">Image placeholder</span>
                  )}
                </Link>

                <h3 className="font-bold text-xl text-monstera-dark">
                  <Link to={`/products/${item.id}`} className="hover:underline group-hover:text-monstera-green transition duration-300">
                    {item.name}
                  </Link>
                </h3>

                <p className="mt-1 font-bold text-monstera-green">
                  {eur(item.price)}
                </p>

                <div className="mt-auto space-y-2">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item)}
                    className="w-full bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full transition duration-300"
                  >
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function eur(n: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}
