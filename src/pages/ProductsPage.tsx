// no local react hooks needed
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

const products: Product[] = [
  { id: "1", name: "Monstera Deliciosa", price: 29.99 },
  { id: "2", name: "Succulent Mix", price: 19.99 },
  { id: "3", name: "Fiddle Leaf Fig", price: 39.99 },
  { id: "4", name: "Snake Plant", price: 24.99 },
];

export default function ProductPage() {
  const { addToCart, cartCount } = useCart();
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
          <h2 className="text-3xl font-bold text-monstera-dark">
            Our plants
          </h2>
          <div className="text-monstera-dark font-bold">
            Cart: {cartCount}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => addToCart({ id: product.id, name: product.name, price: product.price })}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border-4 border-monstera-green p-5 flex flex-col">
      <div className="h-40 rounded-xl bg-monstera-light flex items-center justify-center mb-4">
        <span className="text-monstera-brown text-sm">
          Image placeholder
        </span>
      </div>

      <h3 className="font-bold text-xl text-monstera-dark">
        {product.name}
      </h3>

      <p className="mt-1 font-bold text-monstera-green">
        {eur(product.price)}
      </p>

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
