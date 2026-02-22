import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  code?: string;
};

// Product IDs match the wishlist API product codes so wishlisting syncs correctly
const staticProducts: Product[] = [
  { id: "P001", name: "Monstera", price: 25, image: "https://placehold.co/500x500?text=Monstera" },
  { id: "P002", name: "Alocasia", price: 59, image: "https://placehold.co/500x500?text=Alocasia" },
  { id: "P003", name: "Strelitzia", price: 139, image: "https://placehold.co/500x500?text=Strelitzia" },
  { id: "4", name: "Snake Plant", price: 24.99 },
];

export default function ProductPage() {
  const { addToCart, cartCount } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "https://product-service-products-service.2.rahtiapp.fi";

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE.replace(/\/$/, "")}/products`;
        console.log("Fetching:", url);
                const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status} ${res.statusText}`);
        const data = await res.json();
        const list: Product[] = Array.isArray(data)
          ? data.map((p: any) => {
              let image: string | undefined;
              try {
                if (p.img) {
                  if (/^https?:\/\//.test(p.img)) {
                    image = p.img;
                  } else {
                    image = `${new URL(API_BASE).origin}/images/${p.img}`;
                  }
                }
              } catch {
                image = undefined;
              }
              return {
                id: String(p.id ?? p.product_code ?? `p-${Math.random().toString(36).slice(2, 7)}`),
                name: p.product_name ?? p.name ?? String(p.id ?? "Unnamed"),
                price: Number(p.price ?? 0),
                image,
                description: p.description_text ?? p.description,
                code: p.product_code ?? undefined,
              } as Product;
            })
          : [];
        if (mounted) setProducts(list.length ? list : staticProducts);
      } catch (e: any) {
        console.error("Products fetch failed:", e);
        if (mounted) {
          setError(`Failed to load products — ${e?.message ?? "unknown error"}`);
          setProducts(staticProducts);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  const handleToggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.image });
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
            Browse plants
          </p>
          <div className="mt-4 text-center">
            <Link to="/">
              <button className="bg-monstera-lime hover:bg-monstera-brown text-monstera-dark font-bold py-2 px-4 rounded-full">
                Back to homepage
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-monstera-dark">Our plants</h2>
          <div className="text-monstera-dark font-bold">Cart: {cartCount}</div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading products…</div>
        ) : (
          <>
            {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                  onToggleWishlist={() => handleToggleWishlist(product)}
                  isInWishlist={isInWishlist(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  onToggleWishlist,
  isInWishlist,
}: {
  product: Product;
  onAdd: () => void;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border-4 border-monstera-green p-5 flex flex-col relative">
      <button
        type="button"
        onClick={onToggleWishlist}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white hover:bg-monstera-light transition duration-300 shadow-md"
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

      <div className="h-40 rounded-xl bg-monstera-light flex items-center justify-center mb-4 overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-xl" />
        ) : (
          <span className="text-monstera-brown text-sm">Image placeholder</span>
        )}
      </div>

      <h3 className="font-bold text-xl text-monstera-dark">{product.name}</h3>

      <p className="mt-1 font-bold text-monstera-green">{eur(product.price)}</p>

      <p className="text-monstera-brown text-sm mt-2 line-clamp-2">{product.description}</p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-auto bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full transition duration-300"
      >
        Add to cart
      </button>
    </div>
  );
}

function eur(n: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}