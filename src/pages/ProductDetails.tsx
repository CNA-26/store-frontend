import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

type ApiProduct = {
  id?: number;
  product_name?: string;
  price?: number;
  description_text?: string;
  product_code?: string;
  image_urls?: string[];
  img?: string;
};

type InventoryItem = {
  sku: string;
  quantity: number;
};

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [stockStatus, setStockStatus] = useState<string>("Loading...");
  const [loadingStock, setLoadingStock] = useState<boolean>(true);

  const PRODUCT_BASE =
    (import.meta.env.VITE_API_BASE as string) ||
    "https://product-service-products-service.2.rahtiapp.fi";
  const INVENTORY_BASE =
    (import.meta.env.VITE_INVENTORY_BASE as string) ||
    "https://inventory-service-cna26-inventoryservice.2.rahtiapp.fi";

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${PRODUCT_BASE.replace(/\/$/, "")}/products`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: ApiProduct[] = await res.json();
        const found = data.find(
          (p) => String(p.product_code ?? p.id) === String(id)
        );
        if (mounted) setProduct(found ?? null);
      } catch (err) {
        console.error("Product fetch error:", err);
        if (mounted) setProduct(null);
      }
    };
    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [id, PRODUCT_BASE]);

  useEffect(() => {
    if (!product) return;
    let mounted = true;
    const fetchInventory = async () => {
      try {
        setLoadingStock(true);
        const res = await fetch(`${INVENTORY_BASE.replace(/\/$/, "")}/api/products`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const inventory: InventoryItem[] = await res.json();
        const inv = inventory.find((it) => it.sku === product.product_code);
        if (!mounted) return;
        if (!inv) {
          setStockStatus("Stock unavailable");
        } else if (inv.quantity === 0) {
          setStockStatus("Out of stock");
        } else if (inv.quantity < 10) {
          setStockStatus("Low stock");
        } else {
          setStockStatus("In stock");
        }
      } catch (err) {
        console.error("Inventory fetch error:", err);
        if (mounted) setStockStatus("Could not load stock");
      } finally {
        if (mounted) setLoadingStock(false);
      }
    };
    fetchInventory();
    return () => {
      mounted = false;
    };
  }, [product, INVENTORY_BASE]);

  if (!product) return <div className="p-10">Loading product...</div>;

  const image =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : product.img
      ? `${new URL(PRODUCT_BASE).origin}/images/${product.img}`
      : undefined;

        const itemId = String(product.product_code ?? product.id ?? "");

  const handleAddToCart = () => {
    addToCart({
      id: itemId,
      name: product.product_name ?? "Unnamed",
      price: Number(product.price ?? 0),
    });
  };

  const handleToggleWishlist = () => {
    if (isInWishlist(itemId)) {
      removeFromWishlist(itemId);
    } else {
      addToWishlist({
        id: itemId,
        name: product.product_name ?? "Unnamed",
        price: Number(product.price ?? 0),
        image: image,
      });
    }
  };
    return (
  <div className="bg-monstera-light min-h-screen">
    <header className="bg-monstera-dark shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          <Link to="/" className="flex flex-col items-center">
            <span className="font-lemonfunky text-5xl md:text-6xl text-monstera-lime text-center">
              Monstera
            </span>
          </Link>
        </div>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {image && (
          <div className="md:w-1/2 flex justify-center">
            <img
              src={image}
              alt={product.product_name}
              className="w-full max-w-md rounded-2xl shadow-xl object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="mb-4">
            <Link to="/products" className="text-sm text-monstera-dark underline">
              ← Back to products
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-monstera-dark mb-3">{product.product_name}</h1>

          <p className="text-2xl font-bold text-monstera-green mb-3">{eur(Number(product.price ?? 0))}</p>

          <p className={`font-semibold mb-4 ${
            stockStatus === "Out of stock" ? "text-red-600" :
            stockStatus === "Low stock" ? "text-yellow-600" :
            stockStatus === "In stock" ? "text-green-600" : "text-gray-500"
          }`}>
            {loadingStock ? "Loading stock…" : stockStatus}
          </p>

          <p className="text-monstera-brown mb-6">{product.description_text}</p>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={stockStatus === "Out of stock" || loadingStock}
              className={`px-6 py-2 rounded text-white ${
                stockStatus === "Out of stock" || loadingStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-monstera-green hover:bg-monstera-dark"
              }`}
            >
              Add to cart
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`px-4 py-2 rounded border ${
                isInWishlist(itemId)
                  ? "bg-red-100 border-red-300 text-red-700"
                  : "bg-white border-monstera-green text-monstera-dark"
              }`}
            >
              {isInWishlist(itemId) ? "Remove from wishlist" : "Add to wishlist"}
            </button>
          </div>
        </div>
      </div>
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