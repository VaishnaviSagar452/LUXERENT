import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function DressDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date configuration
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(3); // Default 3 days
  const [endDate, setEndDate] = useState("");
  
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isInBag, setIsInBag] = useState(false);
  const [addingToBag, setAddingToBag] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  // Zencode check state
  const [pincode, setPincode] = useState("");
  const [pinChecked, setPinChecked] = useState(false);
  const [pinMessage, setPinMessage] = useState("");

  // Accordion status
  const [activeAccordion, setActiveAccordion] = useState("fabric");

  // Load dress details
  useEffect(() => {
    const fetchDressDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/dresses/${id}`);
        const data = response.data.dress;
        setDress(data);
        if (data?.size) setSelectedSize(data.size);
      } catch (err) {
        console.error("Error fetching dress details:", err);
        setError("Failed to load dress. It might have been removed or doesn't exist.");
      } finally {
        setLoading(false);
      }
    };

    fetchDressDetails();
  }, [id]);

  // Check wishlist & cart status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!token) return;
      try {
        // Check wishlist
        const wishlistResponse = await api.get("/wishlist");
        const wishlist = wishlistResponse.data.dresses || [];
        setIsLiked(wishlist.some((d) => d._id === id));

        // Check cart
        const cartResponse = await api.get("/cart");
        const cart = cartResponse.data.items || [];
        setIsInBag(cart.some((it) => it.dress && it.dress._id === id));
      } catch (err) {
        console.error("Error checking wishlist/bag status:", err);
      }
    };

    checkUserStatus();
  }, [id, token]);

  // Set min date to today
  const getMinDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Automatically update end date when start date or duration changes
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      // Duration is 3, 7 or 14. We subtract 1 to make it inclusive (e.g. Monday to Wednesday is 3 days: Mon, Tue, Wed)
      end.setDate(start.getDate() + duration - 1);
      
      const yyyy = end.getFullYear();
      const mm = String(end.getMonth() + 1).padStart(2, "0");
      const dd = String(end.getDate()).padStart(2, "0");
      setEndDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEndDate("");
    }
  }, [startDate, duration]);

  // Wishlist toggle
  const handleLikeToggle = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setIsLiking(true);
      await api.post(`/wishlist/toggle/${id}`);
      setIsLiked(!isLiked);
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Add/remove from cart
  const handleAddToBag = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (isInBag) {
      navigate("/customer?tab=bag");
      return;
    }
    try {
      setAddingToBag(true);
      await api.post(`/cart/add/${id}`);
      setIsInBag(true);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Error adding to bag:", err);
    } finally {
      setAddingToBag(false);
    }
  };

  // Redirect to direct checkout
  const handleRentNow = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!startDate) {
      alert("Please select a Rental Start Date first!");
      return;
    }
    // Navigate with dressId, start date, and end date
    navigate(`/checkout?dressId=${id}&startDate=${startDate}&endDate=${endDate}`);
  };

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setPinChecked(true);
      setPinMessage("Please enter a valid 6-digit pin code.");
      return;
    }
    // Simulate check
    setPinChecked(true);
    setPinMessage("Hooray! Express rental delivery & reverse pickup is available in your area.");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-4">Unlocking The Vault...</p>
      </div>
    );
  }

  if (error || !dress) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider mb-1">Dress Not Found</h3>
        <p className="text-xs text-gray-400 max-w-sm text-center mb-6">{error || "The dress details could not be found."}</p>
        <button onClick={() => navigate("/")} className="text-xs font-black bg-black text-white px-6 py-3 uppercase tracking-wider rounded-sm shadow hover:bg-gray-800 transition">
          Back to Collection
        </button>
      </div>
    );
  }

  const mockMRP = dress.rentPrice * 10;
  const savingsAmount = mockMRP - dress.rentPrice;

  return (
    <div className="bg-white min-h-screen text-gray-800 pb-24">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <span className="hover:text-black cursor-pointer" onClick={() => navigate("/")}>Home</span>
        <span className="mx-2">&bull;</span>
        <span className="hover:text-black cursor-pointer" onClick={() => navigate(`/?category=${dress.category}`)}>{dress.category}</span>
        <span className="mx-2">&bull;</span>
        <span className="text-gray-800 font-bold">{dress.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: HIGH FIDELITY IMAGE VIEWER */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm group">
              <img
                src={dress.images?.[0] || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60"}
                alt={dress.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {!dress.availability && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-black tracking-widest uppercase border-2 border-white px-4 py-1.5 rounded-sm">Rented Out</span>
                </div>
              )}
            </div>

            {/* Thumbnail grid if multiple images (mocked for visual flair) */}
            <div className="grid grid-cols-4 gap-3.5">
              <div className="aspect-[3/4] rounded bg-gray-100 overflow-hidden border border-pink-500 cursor-pointer">
                <img src={dress.images?.[0] || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60"} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded bg-gray-100 overflow-hidden border border-gray-100 hover:border-pink-300 cursor-pointer opacity-70 hover:opacity-100 transition">
                <img src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60" alt="Thumbnail 2" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded bg-gray-100 overflow-hidden border border-gray-100 hover:border-pink-300 cursor-pointer opacity-70 hover:opacity-100 transition">
                <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=60" alt="Thumbnail 3" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[3/4] rounded bg-gray-100 overflow-hidden border border-gray-100 hover:border-pink-300 cursor-pointer opacity-70 hover:opacity-100 transition">
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=60" alt="Thumbnail 4" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SPECS, PRICING, RENTAL SETUP */}
          <div className="lg:col-span-5 space-y-6 lg:pb-12">
            
            {/* Header info */}
            <div>
              <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">{dress.brand || "Designer Wear"}</h1>
              <h2 className="text-sm font-medium text-gray-500 mt-1">{dress.title}</h2>
              
              {/* Reviews rating */}
              <div className="flex items-center gap-2.5 mt-3 py-1 px-2.5 bg-gray-50 rounded-sm w-fit border border-gray-100">
                <span className="text-xs font-black text-gray-800 flex items-center gap-1">
                  4.3 
                  <svg className="w-3.5 h-3.5 text-pink-600 fill-pink-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
                <span className="text-[10px] text-gray-400 font-bold border-l border-gray-200 pl-2">240 RATINGS</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Price Details */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-gray-900">₹{dress.rentPrice}</span>
                <span className="text-xs font-medium text-gray-400 uppercase">per day</span>
                <span className="text-sm text-gray-400 line-through pl-2">MRP ₹{mockMRP}</span>
                <span className="text-sm text-pink-600 font-extrabold">(90% OFF)</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold">You save ₹{savingsAmount} by renting this dress!</p>
              
              {dress.securityDeposit > 0 && (
                <div className="flex items-center gap-2 mt-2 bg-pink-50/50 p-2.5 rounded border border-pink-100/50 text-[10px] text-pink-800 font-semibold max-w-sm">
                  <svg className="w-4 h-4 text-pink-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Refundable Security Deposit: ₹{dress.securityDeposit} (returned within 48h after pickup)</span>
                </div>
              )}
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-gray-800">Select Size</span>
                <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider hover:underline cursor-pointer">Size Chart</span>
              </div>
              <div className="flex gap-2.5 mt-3">
                {["S", "M", "L", "XL", "XXL"].map((sz) => {
                  const isActual = sz === dress.size;
                  return (
                    <button
                      key={sz}
                      onClick={() => isActual && setSelectedSize(sz)}
                      disabled={!isActual}
                      className={`w-11 h-11 text-xs font-black rounded-full border flex items-center justify-center transition cursor-pointer ${
                        selectedSize === sz
                          ? "border-pink-600 bg-pink-600 text-white"
                          : isActual
                          ? "border-gray-200 hover:border-black text-gray-800"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">This is a unique designer product. Currently available in size <span className="font-extrabold text-gray-700">{dress.size}</span> only.</p>
            </div>

            {/* RENTAL SETUP PANEL (DATES & DURATIONS) */}
            <div className="bg-gray-50 border border-gray-100 rounded p-4 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Setup Rental Schedule</h3>
              
              {/* Duration button selectors */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">1. Rental Duration</span>
                <div className="flex gap-2">
                  {[3, 7, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-2 px-3 border text-xs font-black uppercase rounded transition cursor-pointer ${
                        duration === d
                          ? "border-pink-600 bg-pink-50 text-pink-600 shadow-sm"
                          : "border-gray-200 bg-white hover:border-black text-gray-700"
                      }`}
                    >
                      {d} Days
                      <span className="block text-[8px] font-bold text-gray-400 mt-0.5">
                        {d === 3 ? "Standard" : d === 7 ? "Week Pack" : "Fortnight"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date picker */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2" htmlFor="rental-start-date">2. Rental Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    id="rental-start-date"
                    min={getMinDateString()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-black cursor-pointer"
                  />
                </div>
              </div>

              {/* Calculated rental duration summaries */}
              {startDate && endDate && (
                <div className="bg-white border border-gray-100 rounded p-3 text-[11px] space-y-2 text-gray-500 font-medium">
                  <div className="flex justify-between">
                    <span>Rental Starts:</span>
                    <span className="text-gray-800 font-bold">{new Date(startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Date:</span>
                    <span className="text-gray-800 font-bold">{new Date(endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  
                  <hr className="border-gray-100" />
                  
                  <div className="flex justify-between text-xs font-extrabold text-gray-800 pt-1">
                    <span>Renting for:</span>
                    <span className="text-pink-600">{duration} Days</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToBag}
                disabled={addingToBag || !dress.availability}
                className={`flex-1 py-4 px-6 rounded text-xs font-black uppercase tracking-widest transition shadow-md flex justify-center items-center gap-2 cursor-pointer ${
                  !dress.availability
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : isInBag
                    ? "bg-white border border-gray-300 hover:border-black text-gray-800"
                    : "bg-pink-600 text-white hover:bg-pink-700 active:scale-[0.99]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {isInBag ? "GO TO BAG" : "ADD TO BAG"}
              </button>

              <button
                onClick={handleRentNow}
                disabled={!dress.availability}
                className="flex-1 bg-black text-white hover:bg-gray-800 py-4 px-6 rounded text-xs font-black uppercase tracking-widest transition shadow-md flex justify-center items-center gap-2 cursor-pointer active:scale-[0.99] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                RENT NOW
              </button>
            </div>

            {/* Wishlist quick action */}
            <button
              onClick={handleLikeToggle}
              disabled={isLiking}
              className={`w-full py-3 border text-xs font-black uppercase tracking-widest rounded flex justify-center items-center gap-2 transition cursor-pointer ${
                isLiked
                  ? "border-pink-500 bg-pink-50/30 text-pink-600"
                  : "border-gray-200 hover:border-black text-gray-800"
              }`}
            >
              <svg className={`w-4 h-4 ${isLiked ? "fill-pink-600 text-pink-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isLiked ? "WISHLISTED" : "WISHLIST"}
            </button>

            <hr className="border-gray-100" />

            {/* Pincode availability check */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-gray-800 block">Delivery Options & Services</span>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-white border border-gray-200 rounded px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-black"
                />
                <button type="submit" className="px-5 border border-pink-500 text-pink-600 rounded text-xs font-extrabold uppercase tracking-wide hover:bg-pink-50 transition cursor-pointer">
                  Check
                </button>
              </form>
              {pinChecked && (
                <p className={`text-[10px] font-bold ${pinMessage.includes("Hooray") ? "text-emerald-600" : "text-rose-600"}`}>
                  {pinMessage}
                </p>
              )}
            </div>

            {/* Accordion Specs */}
            <div className="border border-gray-100 rounded overflow-hidden mt-6">
              {/* Item 1 */}
              <div>
                <button
                  onClick={() => setActiveAccordion(activeAccordion === "fabric" ? "" : "fabric")}
                  className="w-full flex justify-between items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 border-b border-gray-100 transition text-left cursor-pointer"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">Fabric & Description</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${activeAccordion === "fabric" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === "fabric" && (
                  <div className="p-4 text-xs font-medium text-gray-500 leading-relaxed bg-white border-b border-gray-100 space-y-2">
                    <p>{dress.description || "Indulge in this exclusive designer piece, curated specifically for premium events, weddings, and formal gala nights. Designed to offer a flawless fit and a spectacular presence."}</p>
                    <p className="pt-2 font-bold text-gray-700 uppercase text-[10px]">Specifications:</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>Color: <span className="font-bold text-gray-800 capitalize">{dress.color || "Multi"}</span></div>
                      <div>Category: <span className="font-bold text-gray-800 capitalize">{dress.category}</span></div>
                      <div>Brand: <span className="font-bold text-gray-800 uppercase">{dress.brand || "Designer Wear"}</span></div>
                      <div>Size: <span className="font-bold text-gray-800">{dress.size}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Item 2 */}
              <div>
                <button
                  onClick={() => setActiveAccordion(activeAccordion === "rental" ? "" : "rental")}
                  className="w-full flex justify-between items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 border-b border-gray-100 transition text-left cursor-pointer"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">Rental & Refund Rules</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${activeAccordion === "rental" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === "rental" && (
                  <div className="p-4 text-xs font-medium text-gray-500 leading-relaxed bg-white border-b border-gray-100 space-y-2.5">
                    <div className="flex gap-2">
                      <span className="text-pink-600 font-black">&bull;</span>
                      <span><strong>Security Deposit</strong>: A refundable deposit is collected to prevent dress damages. 100% of the deposit is returned within 48 hours of return-pickup check.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-pink-600 font-black">&bull;</span>
                      <span><strong>Dry Cleaning</strong>: We dry clean all items using premium organic chemicals before and after rentals. You do not need to wash it before return.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-pink-600 font-black">&bull;</span>
                      <span><strong>Accidental Damage Policy</strong>: Small stitch open or tiny stains are covered. Major cuts, burns, or losses might result in complete or partial deposit deduction.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Item 3 */}
              <div>
                <button
                  onClick={() => setActiveAccordion(activeAccordion === "delivery" ? "" : "delivery")}
                  className="w-full flex justify-between items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 border-b border-gray-100 transition text-left cursor-pointer"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">Logistics & Return Process</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${activeAccordion === "delivery" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === "delivery" && (
                  <div className="p-4 text-xs font-medium text-gray-500 leading-relaxed bg-white border-b border-gray-100 space-y-2">
                    <p>Your rental starts on the date you select. The package is delivered at least 1 day before or on the morning of your rental start date.</p>
                    <p><strong>Returns are simple</strong>: On the last day of your rental period, our courier partner will arrive at your shipping address to pick up the garment bag. Please pack it back in the original reusable bag provided.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default DressDetails;
