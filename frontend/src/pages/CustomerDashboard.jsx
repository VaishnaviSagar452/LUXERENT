import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import DressCard from "../components/DressCard";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Authentication check
  useEffect(() => {
    if (!token || (user?.role !== "customer" && user?.role !== "user")) {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // Read active tab from URL query params. Default to 'home'
  const activeTab = searchParams.get("tab") || "home";
  const searchQuery = searchParams.get("search") || "";
  const genderQuery = searchParams.get("gender") || "all";

  const [allDresses, setAllDresses] = useState([]);
  const [dressesLoading, setDressesLoading] = useState(true);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync state with URL parameter changes
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const fetchDresses = async () => {
    setDressesLoading(true);
    try {
      const response = await api.get("/dresses");
      setAllDresses(response.data.dresses || []);
    } catch (e) {
      console.error("Error loading dashboard dresses:", e);
    } finally {
      setDressesLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!token) return;
    setWishlistLoading(true);
    try {
      const response = await api.get("/wishlist");
      setWishlistItems(response.data.dresses || []);
    } catch (e) {
      console.error("Error loading wishlist:", e);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!token) return;
    setCartLoading(true);
    try {
      const response = await api.get("/cart");
      setCartItems(response.data.items || []);
    } catch (e) {
      console.error("Error loading bag:", e);
    } finally {
      setCartLoading(false);
    }
  };

  // Run on mounts
  useEffect(() => {
    fetchDresses();
  }, []);

  // Fetch contextual tab content
  useEffect(() => {
    if (activeTab === "liked") fetchWishlist();
    if (activeTab === "bag") fetchCart();
  }, [activeTab, token]);

  const onRemoveFromWishlist = async (dressId) => {
    try {
      await api.post(`/wishlist/toggle/${dressId}`);
      await fetchWishlist();
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (e) {
      console.error("Error wishlisting:", e);
    }
  };

  const onRemoveFromBag = async (dressId) => {
    try {
      setActionLoading(true);
      await api.delete(`/cart/remove/${dressId}`);
      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Error removing from bag:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const onMoveToBag = async (dressId) => {
    try {
      setActionLoading(true);
      // Remove from wishlist
      await api.post(`/wishlist/toggle/${dressId}`);
      // Add to bag
      await api.post(`/cart/add/${dressId}`);
      
      // Update data and counters
      await fetchWishlist();
      window.dispatchEvent(new Event("wishlist-updated"));
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Error moving to bag:", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter local shop elements based on category, search, or gender
  const filteredDresses = useMemo(() => {
    let list = [...allDresses];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const title = (d.title || "").toLowerCase();
        const brand = (d.brand || "").toLowerCase();
        const cat = (d.category || "").toLowerCase();
        return title.includes(q) || brand.includes(q) || cat.includes(q);
      });
    }

    if (genderQuery !== "all") {
      if (genderQuery === "men") {
        list = list.filter((d) => {
          const cat = (d.category || "").toLowerCase();
          return cat === "sherwani" || cat === "suit";
        });
      } else if (genderQuery === "women") {
        list = list.filter((d) => {
          const cat = (d.category || "").toLowerCase();
          return cat === "lehenga" || cat === "gown" || cat === "saree";
        });
      }
    }
    return list;
  }, [allDresses, searchQuery, genderQuery]);

  // Calculations for Shopping Bag
  const bagSummary = useMemo(() => {
    let rentTotal = 0;
    let depositTotal = 0;
    
    cartItems.forEach((it) => {
      if (it.dress) {
        rentTotal += it.dress.rentPrice * (it.qty || 1);
        depositTotal += (it.dress.securityDeposit || 0) * (it.qty || 1);
      }
    });

    const deliveryFee = rentTotal > 1500 ? 0 : 150;
    const finalTotal = rentTotal + depositTotal + deliveryFee;

    return { rentTotal, depositTotal, deliveryFee, finalTotal };
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6 max-w-7xl mx-auto mt-4 rounded-md shadow-xs">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black tracking-wide text-gray-800 uppercase">My Account Dashboard</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Hello, {user?.fullname} &bull; {user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/my-bookings" className="text-xs font-bold border border-gray-200 hover:border-black rounded px-4 py-2 bg-white transition uppercase">
              My Bookings
            </Link>
            <Link to="/" className="text-xs font-bold bg-black text-white hover:bg-gray-800 rounded px-4 py-2 transition uppercase">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-6 mt-8 border-b border-gray-100 text-xs font-extrabold tracking-wider uppercase text-gray-400">
          <button
            onClick={() => setActiveTab("home")}
            className={`pb-2 border-b-2 transition duration-200 cursor-pointer ${activeTab === "home" ? "border-pink-600 text-pink-600" : "border-transparent hover:text-gray-700"}`}
          >
            My Recommendations
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`pb-2 border-b-2 transition duration-200 cursor-pointer ${activeTab === "liked" ? "border-pink-600 text-pink-600" : "border-transparent hover:text-gray-700"}`}
          >
            My Wishlist ({wishlistItems.length})
          </button>
          <button
            onClick={() => setActiveTab("bag")}
            className={`pb-2 border-b-2 transition duration-200 cursor-pointer ${activeTab === "bag" ? "border-pink-600 text-pink-600" : "border-transparent hover:text-gray-700"}`}
          >
            My Bag ({cartItems.length})
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* SHOP / HOME TAB */}
        {activeTab === "home" && (
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-6">Specially Curated For You</h2>
            {dressesLoading ? (
              <div className="h-48 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching Closet...</span>
              </div>
            ) : filteredDresses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">No dresses are currently uploaded on the platform.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDresses.slice(0, 8).map((dress) => (
                  <DressCard key={dress._id} dress={dress} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST / LIKED TAB */}
        {activeTab === "liked" && (
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-6">Wishlist Items ({wishlistItems.length})</h2>
            {wishlistLoading ? (
              <div className="h-48 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Wishlist...</span>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-md border border-gray-100 max-w-lg mx-auto">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Your wishlist is empty</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Save items that catch your eye. Keep tabs on rental availability here.</p>
                <Link to="/" className="mt-6 inline-block text-xs font-black bg-pink-600 text-white px-6 py-3 uppercase tracking-wider rounded-sm shadow hover:bg-pink-700 transition">
                  Find Designer Wear
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistItems.map((dress) => (
                  <div key={dress._id} className="relative group">
                    <DressCard dress={dress} onToggleWishlistSuccess={fetchWishlist} />
                    
                    {/* Add to Bag quick CTA overlay */}
                    <div className="absolute top-14 right-3.5 z-10">
                      <button
                        onClick={() => onMoveToBag(dress._id)}
                        disabled={actionLoading}
                        className="p-2 bg-white rounded-full shadow-md text-emerald-600 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
                        title="Move to Bag"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOPPING BAG TAB */}
        {activeTab === "bag" && (
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-6">Shopping Bag ({cartItems.length} Items)</h2>
            {cartLoading ? (
              <div className="h-48 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Opening Bag...</span>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-md border border-gray-100 max-w-lg mx-auto">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Your Bag is empty</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">There are no rental dresses saved in your bag right now.</p>
                <Link to="/" className="mt-6 inline-block text-xs font-black bg-black text-white px-6 py-3 uppercase tracking-wider rounded-sm shadow hover:bg-gray-800 transition">
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                
                {/* Left side list of items */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Delivery eligibility callout */}
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded border border-emerald-100 font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {bagSummary.rentTotal > 1500 ? "Yay! Free Home Delivery applies on your order." : "Add ₹" + (1500 - bagSummary.rentTotal) + " more rent value to qualify for Free Return Shipping."}
                  </div>

                  {cartItems.map((item) => {
                    const dress = item.dress;
                    if (!dress) return null;
                    const originalMRP = dress.rentPrice * 10;
                    return (
                      <div key={item._id} className="bg-white border border-gray-100 rounded p-4 flex gap-5 relative hover:shadow-xs transition duration-200">
                        {/* Image */}
                        <div className="w-24 h-32 flex-shrink-0 bg-gray-50 overflow-hidden rounded">
                          <img src={dress.images?.[0]} alt={dress.title} className="w-full h-full object-cover" />
                        </div>

                        {/* Specs */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black uppercase text-gray-800 tracking-wide">{dress.brand || "DESIGNER"}</span>
                              <button
                                onClick={() => onRemoveFromBag(dress._id)}
                                disabled={actionLoading}
                                className="text-gray-400 hover:text-rose-600 transition"
                                title="Remove dress"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <h3 className="text-xs text-gray-500 font-medium mt-0.5">{dress.title}</h3>
                            <div className="flex gap-4 mt-2.5 text-[10px] text-gray-400 font-bold uppercase">
                              <span>Size: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{dress.size}</span></span>
                              <span>Color: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{dress.color}</span></span>
                            </div>
                          </div>

                          {/* Pricing details */}
                          <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-black text-gray-800">₹{dress.rentPrice}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{originalMRP}</span>
                              <span className="text-[10px] text-pink-600 font-bold">(90% OFF)</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">Security Deposit: ₹{dress.securityDeposit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right side Price details breakdown */}
                <div className="lg:col-span-1 bg-white border border-gray-100 rounded p-6 space-y-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 pb-3 border-b border-gray-100">Price Details ({cartItems.length} Items)</h3>
                  
                  <div className="space-y-3.5 text-xs text-gray-600 font-medium">
                    <div className="flex justify-between">
                      <span>Total Rent Fee</span>
                      <span className="text-gray-800 font-bold">₹{bagSummary.rentTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Refundable Deposit</span>
                      <span className="text-gray-800 font-bold">₹{bagSummary.depositTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className={bagSummary.deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-gray-800 font-bold"}>
                        {bagSummary.deliveryFee === 0 ? "FREE" : "₹" + bagSummary.deliveryFee}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex justify-between text-sm font-black text-gray-800">
                    <span>Total Amount Payable</span>
                    <span>₹{bagSummary.finalTotal}</span>
                  </div>

                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed bg-gray-50 p-3 rounded">
                    * The security deposit is fully refundable within 48 hours of return logistics verification. Dry cleaning is included.
                  </p>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full bg-pink-600 text-white py-3.5 rounded text-xs font-extrabold uppercase tracking-widest hover:bg-pink-700 active:translate-y-px transition shadow-md"
                  >
                    Proceed To Rent Checkout &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default CustomerDashboard;


