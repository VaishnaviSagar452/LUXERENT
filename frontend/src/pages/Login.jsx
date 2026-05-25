import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // SAVE TOKEN & USER info
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      const role = response.data.user.role;

      // Dispatch event to refresh nav profile menu / counters
      window.dispatchEvent(new Event("auth-changed"));

      // ROLE-BASED REDIRECT
      if (role === "customer" || role === "user") {
        navigate("/customer");
      } else if (role === "provider") {
        navigate("/provider");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      if (error.message === "Network Error") {
        setErrorMessage("Server is unreachable. Please make sure the backend is running on port 8000.");
      } else {
        setErrorMessage(error.response?.data?.message || error.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT COLUMN: BRAND SPLASH */}
        <div className="relative hidden md:block bg-gray-900 text-white min-h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=60"
            alt="Luxury Dress Renting"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-10 left-8 right-8 space-y-3 z-10">
            <span className="text-[10px] font-black uppercase tracking-widest bg-pink-600 text-white px-2.5 py-1 w-fit rounded-sm">LuxeRent Portal</span>
            <h2 className="text-2xl font-black uppercase tracking-wide leading-tight">Rent the Runway.<br/>Own the Spotlight.</h2>
            <p className="text-xs text-gray-300 leading-relaxed font-semibold">Unlock thousands of designer outfits at 10% of retail price. Complete dry cleaning and easy logistics handled by us.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-gray-800">Welcome Back</h1>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Login to your rental dashboard</p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded border border-rose-100 font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                required
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-700 focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-700 focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-800 py-3.5 rounded text-xs font-black uppercase tracking-widest transition shadow-md active:scale-[0.99] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "SECURE LOGIN"}
            </button>
          </form>

          <div className="pt-6 border-t border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase">New to LuxeRent? </span>
            <Link to="/register" className="text-[10px] text-pink-600 font-black uppercase tracking-wider hover:underline">
              Create Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;