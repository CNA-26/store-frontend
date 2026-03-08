import { useEffect } from "react";

const EXTERNAL_LOGIN_URL = "https://users-frontend-users-frontend.2.rahtiapp.fi/login";

export default function Login() {
  useEffect(() => {
    window.location.assign(EXTERNAL_LOGIN_URL);
  }, []);

  return (
    <div className="min-h-screen bg-monstera-light flex items-center justify-center px-4">
      <div className="bg-white border-4 border-monstera-lime rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-monstera-dark">Redirecting to login...</h1>
        <p className="text-monstera-brown mt-3">If you are not redirected automatically, use the button below.</p>
        <a
          href={EXTERNAL_LOGIN_URL}
          className="mt-6 inline-block bg-monstera-dark hover:bg-monstera-green text-white font-bold py-3 px-6 rounded-full transition duration-300"
        >
          Continue to login
        </a>
      </div>
    </div>
  );
}
