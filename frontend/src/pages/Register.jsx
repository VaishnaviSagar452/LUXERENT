import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "customer", // Default role
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectRole = (role) => {
    setFormData({
      ...formData,
      role: role,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullname, email, password, role } = formData;
    if (!fullname || !email || !password || !role) {
      setErrorMessage("Please fill in all registration fields.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      await api.post("/auth/register", formData);
      alert("Registration Successful! Please login to continue.");
      navigate("/login", { state: { email } });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409 || error.response?.data?.message === "User already exists") {
        setErrorMessage("This email is already registered. Please login instead.");
      } else {
        setErrorMessage(error.response?.data?.message || "Registration failed. Try a different email.");
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
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=60"
            alt="Luxury Dresses Catalog"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-10 left-8 right-8 space-y-3 z-10">
            <span className="text-[10px] font-black uppercase tracking-widest bg-pink-600 text-white px-2.5 py-1 w-fit rounded-sm">LuxeRent Portfolio</span>
            <h2 className="text-2xl font-black uppercase tracking-wide leading-tight">Elevate Your Closet.<br/>Insure Your Style.</h2>
            <p className="text-xs text-gray-300 leading-relaxed font-semibold">Join a premium circle of dress renters and providers. Catalog your dresses to earn revenue or rent bridalwear, suits, and gowns.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: REGISTER FORM */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-gray-800">Create Account</h1>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Join the premier rent-closet platform</p>
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
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="fullname">Full Name</label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                required
                placeholder="e.g. Jane Doe"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-700 focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="e.g. name@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-700 focus:outline-none focus:border-black font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded p-3 text-gray-700 focus:outline-none focus:border-black font-semibold"
              />
            </div>

            {/* Select Role Button Toggles */}
            <div>
              <label className="block mb-2 uppercase tracking-wider text-gray-400 text-[10px]">Select Your Account Role</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectRole("customer")}
                  className={`flex-1 py-3 px-3 border rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                    formData.role === "customer"
                      ? "border-pink-600 bg-pink-50 text-pink-600 shadow-sm"
                      : "border-gray-200 bg-white hover:border-black text-gray-500"
                  }`}
                >
                  I Want To Rent
                  <span className="block text-[8px] font-medium text-gray-400 mt-0.5 uppercase">Browse & Book Outfits</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSelectRole("provider")}
                  className={`flex-1 py-3 px-3 border rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                    formData.role === "provider"
                      ? "border-pink-600 bg-pink-50 text-pink-600 shadow-sm"
                      : "border-gray-200 bg-white hover:border-black text-gray-500"
                  }`}
                >
                  I Own Designer Outfits
                  <span className="block text-[8px] font-medium text-gray-400 mt-0.5 uppercase">List Dresses & Earn Income</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-800 py-3.5 rounded text-xs font-black uppercase tracking-widest transition shadow-md active:scale-[0.99] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Registering account..." : "CREATE SECURE ACCOUNT"}
            </button>
          </form>

          <div className="pt-6 border-t border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Already registered? </span>
            <Link to="/login" className="text-[10px] text-pink-600 font-black uppercase tracking-wider hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;