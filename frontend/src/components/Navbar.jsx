import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync search input with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchVal(params.get("search") || "");
  }, [location.search]);

  const fetchCounts = async () => {
    if (!token || !user) {
      setWishlistCount(0);
      setCartCount(0);
      return;
    }
    try {
      // Fetch wishlist
      const wishRes = await api.get("/wishlist");
      setWishlistCount(wishRes.data.dresses?.length || 0);

      // Fetch cart
      const cartRes = await api.get("/cart");
      setCartCount(cartRes.data.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 0);
    } catch (error) {
      console.error("Failed to fetch counts in Navbar:", error);
    }
  };

  // Sync counts whenever token or user updates
  useEffect(() => {
    fetchCounts();
  }, [token, user]);

  // Event listener for cart/wishlist changes
  useEffect(() => {
    window.addEventListener("cart-updated", fetchCounts);
    window.addEventListener("wishlist-updated", fetchCounts);

    return () => {
      window.removeEventListener("cart-updated", fetchCounts);
      window.removeEventListener("wishlist-updated", fetchCounts);
    };
  }, [token, user]);

  // Listen to auth events to update local React state dynamically
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("user-logged-in", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("user-logged-in", handleAuthChange);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanSearch = searchVal.trim();
    const dest = (user?.role === "customer" || user?.role === "user") ? "/customer" : "/";
    if (cleanSearch) {
      navigate(`${dest}?search=${encodeURIComponent(cleanSearch)}`);
    } else {
      navigate(dest);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    const dest = (user?.role === "customer" || user?.role === "user") ? "/customer" : "/";
    // Live update search params
    if (val.trim()) {
      navigate(`${dest}?search=${encodeURIComponent(val)}`, { replace: true });
    } else {
      navigate(dest, { replace: true });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 px-6 py-3.5 flex justify-between items-center gap-6">
      {/* Brand Logo */}
      <div className="flex items-center gap-8">
        <Link
          to={(user?.role === "customer" || user?.role === "user") ? "/customer" : "/"}
          className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-90 transition duration-300"
        >
          LUXERENT
        </Link>

        {/* Quick links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-700 tracking-wide uppercase">
          <Link to={(user?.role === "customer" || user?.role === "user") ? "/customer" : "/"} className="hover:text-pink-600 transition">
            Shop
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-gray-400 cursor-not-allowed">Women</span>
          <span className="text-gray-400 cursor-not-allowed">Men</span>
          <span className="text-gray-400 cursor-not-allowed">Designer</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative hidden sm:block">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Search for designer dresses, brands, styles..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-gray-100 border border-transparent rounded-md focus:bg-white focus:border-gray-200 focus:outline-none transition duration-200 text-gray-700 placeholder-gray-400 font-medium"
        />
      </form>

      {/* Action Utilities */}
      <div className="flex items-center gap-6">
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
            className="flex flex-col items-center justify-center text-gray-700 hover:text-pink-600 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">Profile</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-3 border border-gray-100 animate-fadeIn text-sm">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="font-bold text-gray-800 truncate">{user.fullname}</p>
                    <p className="text-xs text-gray-400 capitalize truncate mt-0.5">{user.role} Account</p>
                  </div>

                  {(user.role === "customer" || user.role === "user") && (
                    <>
                      <Link to="/customer" className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-medium">
                        Customer Dashboard
                      </Link>
                      <Link to="/my-bookings" className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-medium">
                        My Bookings
                      </Link>
                    </>
                  )}

                  {user.role === "provider" && (
                    <>
                      <Link to="/provider" className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-medium">
                        Provider Dashboard
                      </Link>
                      <Link to="/add-dress" className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-medium">
                        Upload New Dress
                      </Link>
                    </>
                  )}

                  {user.role === "admin" && (
                    <Link to="/admin" className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-medium">
                      Admin Panel
                    </Link>
                  )}

                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-1 text-xs text-gray-400 font-bold mb-2">Welcome to LuxeRent</div>
                  <div className="px-4 flex flex-col gap-2">
                    <Link to="/login" className="block w-full py-2 text-center bg-pink-600 text-white rounded font-bold hover:bg-pink-700 transition text-[10px] uppercase tracking-wider">
                      Login
                    </Link>
                    <Link to="/register" className="block w-full py-2 text-center border border-pink-600 text-pink-600 rounded font-bold hover:bg-pink-50 transition text-[10px] uppercase tracking-wider">
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Wishlist */}
        {(!user || user.role === "customer" || user.role === "user") && (
          <Link
            to={user ? "/customer?tab=liked" : "/login"}
            className="flex flex-col items-center justify-center text-gray-700 hover:text-pink-600 transition relative"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-pink-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">Wishlist</span>
          </Link>
        )}

        {/* Bag */}
        {(!user || user.role === "customer" || user.role === "user") && (
          <Link
            to={user ? "/customer?tab=bag" : "/login"}
            className="flex flex-col items-center justify-center text-gray-700 hover:text-pink-600 transition relative"
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-pink-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">Bag</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;