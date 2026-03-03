import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useEffect, useMemo, useState } from "react";

type ProductCategory = "plants" | "flowers" | "other";
type CategoryFilter = "all" | ProductCategory;

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  code?: string;
  category: ProductCategory | null;
};

// Product IDs match the wishlist API product codes so wishlisting syncs correctly
const staticProducts: Product[] = [
  { id: "P001", name: "Monstera", price: 25, image: "https://placehold.co/500x500?text=Monstera", category: "plants" },
  { id: "P002", name: "Alocasia", price: 59, image: "https://placehold.co/500x500?text=Alocasia", category: "plants" },
  { id: "P003", name: "Strelitzia", price: 139, image: "https://placehold.co/500x500?text=Strelitzia", category: "plants" },
  { id: "4", name: "Snake Plant", price: 24.99, category: "plants" },
];

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "plants", label: "Plants" },
  { value: "flowers", label: "Cut flowers" },
  { value: "other", label: "Other" },
];

function normalizeCategory(input: unknown): ProductCategory | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  if (value === "plants" || value === "plantor") return "plants";
  if (value === "flowers" || value === "snittblommor") return "flowers";
  if (value === "other" || value === "övrigt" || value === "ovrigt") return "other";
  return null;
}

export default function ProductPage() {
  const { cartCount } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
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

      if (Array.isArray(p.image_urls) && p.image_urls.length > 0) {
        image = p.image_urls[0];
      }

      return {
        id: String(p.product_code ?? p.id ?? `p-${Math.random().toString(36).slice(2, 7)}`),
        name: p.product_name ?? p.name ?? String(p.id ?? "Unnamed"),
        price: Number(p.price ?? 0),
        image,
        description: p.description_text ?? p.description,
        code: p.product_code ?? undefined,
        category: normalizeCategory(p.category),
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
    const wishlistId = product.code ?? product.id;
    if (isInWishlist(wishlistId)) {
      removeFromWishlist(wishlistId);
    } else {
      addToWishlist({ id: wishlistId, name: product.name, price: product.price, image: product.image });
    }
  };

  const categoryFilteredProducts = useMemo(() => {
    if (categoryFilter === "all") return products;
    return products.filter((product) => product.category === categoryFilter);
  }, [products, categoryFilter]);

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

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = categoryFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategoryFilter(tab.value)}
                className={`px-4 py-2 rounded-full font-bold border-2 transition duration-300 ${
                  isActive
                    ? "bg-monstera-green text-white border-monstera-green"
                    : "bg-white text-monstera-dark border-monstera-green hover:bg-monstera-light"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20">Loading products…</div>
        ) : (
          <>
            {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryFilteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleWishlist={() => handleToggleWishlist(product)}
                  isInWishlist={isInWishlist(product.code ?? product.id)}
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
  onToggleWishlist,
  isInWishlist,
}: {
  product: Product;
  onToggleWishlist: () => void;
  isInWishlist: boolean;
}) {
  const navigate = useNavigate();
  const detailPath = `/products/${product.code ?? product.id}`;

  return (
    <div
      className="group bg-white rounded-2xl shadow-xl border-4 border-monstera-green p-5 flex flex-col relative cursor-pointer transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
      onClick={() => navigate(detailPath)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(detailPath);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${product.name}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist();
        }}
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
          <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-xl transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="text-monstera-brown text-sm">Image placeholder</span>
        )}
      </div>

    <h3 className="font-bold text-xl text-monstera-dark">
        <Link
            to={`/products/${product.id}`}
            className="font-bold text-xl text-monstera-dark hover:underline group-hover:text-monstera-green transition duration-300"
            >
            {product.name}
        </Link>
    </h3>

      <p className="mt-1 font-bold text-monstera-green">{eur(product.price)}</p>

      <p className="text-monstera-brown text-sm mt-2 line-clamp-2">{product.description}</p>

      <Link
        to={detailPath}
        onClick={(e) => e.stopPropagation()}
        className="mt-auto bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-4 rounded-full transition duration-300 text-center"
      >
        Add to cart
      </Link>
    </div>
  );
}

function eur(n: number) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}