import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Query parameters for direct rental
  const qDressId = searchParams.get("dressId");
  const qStartDate = searchParams.get("startDate");
  const qEndDate = searchParams.get("endDate");

  // Checkout funnel state: 'address' | 'review' | 'payment' | 'success'
  const [step, setStep] = useState("address");
  
  // Selected dress to rent
  const [selectedDress, setSelectedDress] = useState(null);
  const [startDate, setStartDate] = useState(qStartDate || "");
  const [endDate, setEndDate] = useState(qEndDate || "");
  const [duration, setDuration] = useState(3);
  
  // Address fields
  const [addressForm, setAddressForm] = useState({
    fullname: user?.fullname || "",
    phone: "",
    pincode: "",
    addressLine: "",
    locality: "",
    city: "",
    state: "",
  });

  // Mock Card fields
  const [cardForm, setCardForm] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Cart list if no dressId specified
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [loadingDress, setLoadingDress] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load contextual data
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (qDressId) {
      // Direct dress flow
      const fetchSingleDress = async () => {
        setLoadingDress(true);
        try {
          const response = await api.get(`/dresses/${qDressId}`);
          setSelectedDress(response.data.dress);
          if (qStartDate && qEndDate) {
            const start = new Date(qStartDate);
            const end = new Date(qEndDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            setDuration(days > 0 ? days : 3);
          }
        } catch (err) {
          console.error("Error loading checkout dress:", err);
          setErrorMessage("Failed to load product details.");
        } finally {
          setLoadingDress(false);
        }
      };
      fetchSingleDress();
    } else {
      // Bag flow
      const fetchCartItems = async () => {
        setCartLoading(true);
        try {
          const response = await api.get("/cart");
          const items = response.data.items || [];
          setCartItems(items);
          if (items.length > 0) {
            // Default to first item
            setSelectedDress(items[0].dress);
            
            // Set default dates starting tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];
            setStartDate(tomorrowStr);
            setDuration(3);
          }
        } catch (err) {
          console.error("Error loading cart items:", err);
          setErrorMessage("Failed to load items from your shopping bag.");
        } finally {
          setCartLoading(false);
        }
      };
      fetchCartItems();
    }
  }, [qDressId, qStartDate, qEndDate, token]);

  // Adjust dates when start date or duration changes (for bag flow)
  useEffect(() => {
    if (!qDressId && startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + duration - 1);
      
      const yyyy = end.getFullYear();
      const mm = String(end.getMonth() + 1).padStart(2, "0");
      const dd = String(end.getDate()).padStart(2, "0");
      setEndDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [startDate, duration, qDressId]);

  // Handle address submit
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    // Validate
    const { fullname, phone, pincode, addressLine, city, state } = addressForm;
    if (!fullname || !phone || !pincode || !addressLine || !city || !state) {
      setErrorMessage("Please fill in all shipping fields.");
      return;
    }
    if (phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (pincode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit pin code.");
      return;
    }
    setErrorMessage("");
    setStep("review");
  };

  // Pricing calculations
  const priceSummary = () => {
    if (!selectedDress) return { rentFee: 0, deposit: 0, delivery: 0, total: 0 };
    const rentFee = selectedDress.rentPrice * duration;
    const deposit = selectedDress.securityDeposit || 0;
    const delivery = rentFee > 1500 ? 0 : 150;
    const total = rentFee + deposit + delivery;
    return { rentFee, deposit, delivery, total };
  };

  const { rentFee, deposit, delivery, total } = priceSummary();

  // Create booking helper
  const createBookingInDatabase = async () => {
    try {
      const response = await api.post("/bookings/create", {
        dressId: selectedDress._id,
        startDate,
        endDate,
      });
      return response.data.booking;
    } catch (err) {
      const msg = err.response?.data?.message || "Dress already booked for selected dates. Try a different date range.";
      throw new Error(msg);
    }
  };

  // Remove dress from cart if checked out
  const removeDressFromCart = async () => {
    try {
      await api.delete(`/cart/remove/${selectedDress._id}`);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.warn("Failed to remove item from cart after checkout:", e);
    }
  };

  // Secure payment handler via Razorpay
  const handleRazorpayPayment = async () => {
    setPaymentLoading(true);
    setErrorMessage("");
    try {
      // 1. Create local booking
      const booking = await createBookingInDatabase();
      
      // 2. Create Razorpay order
      let orderRes;
      try {
        orderRes = await api.post("/payments/create-order", {
          bookingId: booking._id,
        });
      } catch (err) {
        throw new Error("Razorpay Order generation failed. Please use the Mock Payment option.");
      }

      const orderData = orderRes.data.order;

      // 3. Configure Razorpay SDK
      const options = {
        key: "rzp_test_Sq6gT8Llm6B3gx", // Configured key
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LuxeRent",
        description: `Rent ${selectedDress.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });
            
            // Clean cart & move to success
            await removeDressFromCart();
            setCreatedBooking(verifyRes.data.booking);
            setStep("success");
          } catch (err) {
            setErrorMessage("Payment verification failed. Please contact support.");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user?.fullname || "",
          email: user?.email || "",
          contact: addressForm.phone,
        },
        theme: {
          color: "#db2777", // Pink 600
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      // 4. Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setErrorMessage(err.message);
      setPaymentLoading(false);
    }
  };

  // Mock Credit Card Payment Handler
  const handleMockPaymentSubmit = async (e) => {
    e.preventDefault();
    const { number, name, expiry, cvv } = cardForm;
    if (!number || !name || !expiry || !cvv) {
      setErrorMessage("Please complete all card details.");
      return;
    }
    if (number.replace(/\s/g, "").length < 16) {
      setErrorMessage("Invalid Card Number.");
      return;
    }
    if (cvv.length < 3) {
      setErrorMessage("Invalid CVV.");
      return;
    }

    setPaymentLoading(true);
    setErrorMessage("");

    try {
      // 1. Create booking in db
      const booking = await createBookingInDatabase();

      // 2. Call mock payment verification endpoint (with our custom mock signature bypass!)
      const verifyRes = await api.post("/payments/verify", {
        razorpay_order_id: "order_mock_" + Math.random().toString(36).substring(7),
        razorpay_payment_id: "pay_mock123456", // Matches bypass in controller
        razorpay_signature: "mock_signature_123456",
        bookingId: booking._id,
      });

      // 3. Clear cart & move to success
      await removeDressFromCart();
      setCreatedBooking(verifyRes.data.booking);
      setStep("success");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loadingDress || cartLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-4">Preparing Checkout...</p>
      </div>
    );
  }

  // If no dress or cart is empty
  if (!selectedDress) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider mb-1">Your Checkout is empty</h3>
        <p className="text-xs text-gray-400 max-w-sm text-center mb-6">Rent high-fashion designer dresses at 10% of retail price.</p>
        <Link to="/" className="text-xs font-black bg-black text-white px-6 py-3 uppercase tracking-wider rounded-sm shadow hover:bg-gray-800 transition">
          Find Designer Wear
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 pb-24">
      
      {/* Funnel Progress Steps */}
      {step !== "success" && (
        <div className="bg-white border-b border-gray-100 py-6 mb-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 text-xs font-black uppercase tracking-widest text-gray-400">
            <div className={`flex items-center gap-2 ${step === "address" ? "text-pink-600 font-extrabold" : "text-emerald-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step === "address" ? "bg-pink-600" : "bg-emerald-600"}`}>1</span>
              <span>Delivery</span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-gray-100"></div>
            <div className={`flex items-center gap-2 ${step === "review" ? "text-pink-600 font-extrabold" : step === "payment" ? "text-emerald-600" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step === "review" ? "bg-pink-600" : step === "payment" ? "bg-emerald-600" : "bg-gray-200"}`}>2</span>
              <span>Summary</span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-gray-100"></div>
            <div className={`flex items-center gap-2 ${step === "payment" ? "text-pink-600 font-extrabold" : "text-gray-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step === "payment" ? "bg-pink-600" : "bg-gray-200"}`}>3</span>
              <span>Payment</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Form layouts */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {errorMessage && (
          <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded border border-rose-100 font-bold mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: DELIVERY ADDRESS FORM */}
        {step === "address" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Address inputs */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-md p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 mb-6 border-b border-gray-100 pb-3">Contact & Shipping Address</h2>
              
              <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs font-bold text-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="fullname">Contact Person Name *</label>
                    <input
                      type="text"
                      id="fullname"
                      required
                      placeholder="e.g. John Doe"
                      value={addressForm.fullname}
                      onChange={(e) => setAddressForm({ ...addressForm, fullname: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="phone">10-Digit Mobile Number *</label>
                    <input
                      type="text"
                      id="phone"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, "") })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="pincode">6-Digit Pin Code *</label>
                    <input
                      type="text"
                      id="pincode"
                      required
                      maxLength={6}
                      placeholder="e.g. 400001"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="addressLine">Flat, House No., Building, Street *</label>
                    <input
                      type="text"
                      id="addressLine"
                      required
                      placeholder="e.g. Flat 402, Sunset Towers, MG Road"
                      value={addressForm.addressLine}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="locality">Locality / Town *</label>
                    <input
                      type="text"
                      id="locality"
                      required
                      placeholder="e.g. Bandra West"
                      value={addressForm.locality}
                      onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      required
                      placeholder="e.g. Mumbai"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      required
                      placeholder="e.g. Maharashtra"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-pink-600 text-white hover:bg-pink-700 py-3 px-8 rounded text-xs font-black uppercase tracking-widest shadow-md transition active:scale-[0.99] cursor-pointer"
                  >
                    Save & Review Summary
                  </button>
                </div>
              </form>
            </div>

            {/* Sticky summary sidebar */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-md p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Selected Item</h3>
              
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                  <img src={selectedDress.images?.[0]} alt={selectedDress.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-gray-800 uppercase block truncate">{selectedDress.brand || "DESIGNER"}</span>
                  <h4 className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{selectedDress.title}</h4>
                  <div className="flex gap-2.5 mt-1.5 text-[9px] text-gray-400 font-bold uppercase">
                    <span>Size: <span className="text-gray-800">{selectedDress.size}</span></span>
                    <span>Color: <span className="text-gray-800">{selectedDress.color}</span></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: ORDER REVIEW */}
        {step === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-5">
              
              {/* Product Review Card */}
              <div className="bg-white border border-gray-100 rounded p-6 shadow-sm">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 mb-5 border-b border-gray-100 pb-3">Review Rental Items</h2>
                
                <div className="flex gap-5">
                  <div className="w-24 h-32 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={selectedDress.images?.[0]} alt={selectedDress.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-gray-800 tracking-wide">{selectedDress.brand || "DESIGNER"}</span>
                      <h3 className="text-xs text-gray-400 font-medium mt-0.5">{selectedDress.title}</h3>
                      <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-bold uppercase">
                        <span>Size: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{selectedDress.size}</span></span>
                        <span>Color: <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{selectedDress.color}</span></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-3 border-t border-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                      <div>
                        <span>Rent Starts: </span>
                        <span className="text-gray-800">{new Date(startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div>
                        <span>Return Pickup: </span>
                        <span className="text-gray-800">{new Date(endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div>
                        <span>Period: </span>
                        <span className="text-pink-600">{duration} Days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option to change dates for bag checkout flow */}
                {!qDressId && (
                  <div className="mt-6 bg-gray-50 border border-gray-100 rounded p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Change Rent Start Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded p-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-black cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Change Rental Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded p-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value={3}>3 Days (Standard)</option>
                        <option value={7}>7 Days (Weekly)</option>
                        <option value={14}>14 Days (Fortnight)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address Summary Card */}
              <div className="bg-white border border-gray-100 rounded p-6 shadow-sm flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-3.5">Shipping Destination</h3>
                  <div className="text-xs font-medium text-gray-500 leading-relaxed">
                    <p className="font-bold text-gray-800">{addressForm.fullname}</p>
                    <p className="mt-1">{addressForm.addressLine}, {addressForm.locality}</p>
                    <p>{addressForm.city}, {addressForm.state} - <span className="font-bold">{addressForm.pincode}</span></p>
                    <p className="mt-2 text-gray-400 font-bold">Mobile: {addressForm.phone}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setStep("address")}
                  className="text-[10px] font-black border border-gray-200 hover:border-black rounded px-3 py-1.5 transition uppercase tracking-wide cursor-pointer bg-white"
                >
                  Change Address
                </button>
              </div>

            </div>

            {/* Price detail calculations */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 pb-3 border-b border-gray-100">Price Details</h3>
              
              <div className="space-y-3.5 text-xs text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span>Rent Fee ({duration} Days)</span>
                  <span className="text-gray-800 font-bold">₹{rentFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Security Deposit</span>
                  <span className="text-gray-800 font-bold">₹{deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className={delivery === 0 ? "text-emerald-600 font-bold" : "text-gray-800 font-bold"}>
                    {delivery === 0 ? "FREE" : "₹" + delivery}
                  </span>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between text-sm font-black text-gray-800">
                <span>Total Amount Payable</span>
                <span>₹{total}</span>
              </div>

              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed bg-gray-50 p-3 rounded">
                * By proceeding, you agree to return the dress in its original condition. Pickup is scheduled on your selected return date.
              </p>

              <button
                onClick={() => setStep("payment")}
                className="w-full bg-pink-600 text-white py-3.5 rounded text-xs font-extrabold uppercase tracking-widest hover:bg-pink-700 active:translate-y-px transition shadow-md cursor-pointer"
              >
                Proceed To Secure Payment
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: PAYMENT CHOICE (RAZORPAY OR MOCK CARD) */}
        {step === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Payment forms details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payment Methods Choice Card */}
              <div className="bg-white border border-gray-100 rounded-md p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">Secure Payment Portal</h2>

                {/* Razorpay Express Button */}
                <div className="bg-pink-50/20 border border-pink-100 rounded p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-pink-600">Option 1: Razorpay Instant Payment</h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium max-w-md">Pay instantly using UPI, NetBanking, Card, or Wallet via Razorpay's checkout system.</p>
                  </div>
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={paymentLoading}
                    className="w-full md:w-auto bg-pink-600 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded shadow hover:bg-pink-700 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? "processing..." : "Razorpay Checkout"}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Or Use Card Mockup</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                {/* Interactive Card Form */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-gray-800">Option 2: Mock Credit / Debit Card Gateway</h3>

                  {/* VIRTUAL CREDIT CARD GRAPHIC */}
                  <div className="max-w-sm mx-auto w-full aspect-[1.58/1] rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-950 to-pink-950 text-white shadow-xl transition-transform duration-500 transform font-mono">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]"></div>
                    
                    {!isCardFlipped ? (
                      // Front of Card
                      <div className="h-full flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-start">
                          {/* Card chip */}
                          <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 to-amber-500 opacity-90"></div>
                          <span className="text-xs font-bold uppercase tracking-widest italic bg-white/10 px-2 py-0.5 rounded text-[9px]">LuxeRent Premium</span>
                        </div>

                        {/* Card Number */}
                        <div className="text-lg tracking-widest font-black my-4 text-center">
                          {cardForm.number || "•••• •••• •••• ••••"}
                        </div>

                        <div className="flex justify-between items-end text-[10px]">
                          <div>
                            <span className="text-[8px] text-gray-400 uppercase block font-sans">Cardholder</span>
                            <span className="font-bold tracking-wide uppercase truncate block max-w-[160px]">
                              {cardForm.name || "YOUR NAME HERE"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-gray-400 uppercase block font-sans">Expires</span>
                            <span className="font-bold tracking-wide">{cardForm.expiry || "MM/YY"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Back of Card (CVV)
                      <div className="h-full flex flex-col justify-between py-2 relative z-10">
                        {/* Magnetic strip */}
                        <div className="h-9 bg-black -mx-5 mt-2"></div>
                        
                        {/* Signature + CVV box */}
                        <div className="flex justify-end items-center gap-3 mt-4">
                          <div className="w-3/4 h-7 bg-white/20 rounded"></div>
                          <div className="bg-white text-gray-900 font-bold px-3 py-1 text-xs rounded">
                            {cardForm.cvv || "•••"}
                          </div>
                        </div>
                        
                        <div className="text-[7px] text-gray-400 text-center uppercase tracking-widest mt-4">
                          * Card details are processed locally for demonstration purposes only.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Form fields */}
                  <form onSubmit={handleMockPaymentSubmit} className="space-y-4 text-xs font-bold text-gray-700">
                    <div>
                      <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="card-number">Card Number</label>
                      <input
                        type="text"
                        id="card-number"
                        maxLength={19}
                        required
                        placeholder="4111 2222 3333 4444"
                        value={cardForm.number}
                        onFocus={() => setIsCardFlipped(false)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          // Add spaces every 4 digits
                          const formatted = val.match(/.{1,4}/g)?.join(" ") || "";
                          setCardForm({ ...cardForm, number: formatted });
                        }}
                        className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="card-name">Cardholder Name</label>
                      <input
                        type="text"
                        id="card-name"
                        required
                        placeholder="John Doe"
                        value={cardForm.name}
                        onFocus={() => setIsCardFlipped(false)}
                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="card-expiry">Expiry Date</label>
                        <input
                          type="text"
                          id="card-expiry"
                          maxLength={5}
                          required
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onFocus={() => setIsCardFlipped(false)}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 2) {
                              val = val.substring(0, 2) + "/" + val.substring(2);
                            }
                            setCardForm({ ...cardForm, expiry: val });
                          }}
                          className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="card-cvv">CVV</label>
                        <input
                          type="password"
                          id="card-cvv"
                          maxLength={3}
                          required
                          placeholder="123"
                          value={cardForm.cvv}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => setIsCardFlipped(false)}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })}
                          className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setStep("review")}
                        className="border border-gray-200 hover:border-black px-6 py-3 rounded text-xs font-black uppercase bg-white transition cursor-pointer"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="submit"
                        disabled={paymentLoading}
                        className="bg-black text-white hover:bg-gray-800 py-3.5 px-8 rounded text-xs font-black uppercase tracking-widest shadow-md transition active:scale-[0.99] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {paymentLoading ? "Simulating Payment..." : `Pay ₹${total} Now`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

            {/* Price Calculations */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Payable</h3>
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-500">Rent + Deposit</span>
                <span className="text-lg font-black text-gray-800">₹{total}</span>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: SUCCESS PAGE */}
        {step === "success" && createdBooking && (
          <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-lg p-8 shadow-md text-center space-y-6 my-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 text-emerald-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-wider text-gray-800">Rental Booked Successfully!</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Order ID: #{createdBooking._id?.substring(12).toUpperCase()}</p>
            </div>

            <div className="bg-gray-50 rounded border border-gray-100 p-4 text-left text-xs font-medium text-gray-500 space-y-2.5">
              <div className="flex justify-between">
                <span>Rented Garment:</span>
                <span className="text-gray-800 font-bold uppercase">{selectedDress.brand} - {selectedDress.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Period:</span>
                <span className="text-gray-800 font-bold">{duration} Days</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Dates:</span>
                <span className="text-gray-800 font-bold">
                  {new Date(startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} to {new Date(endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-600 font-black">₹{total}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-[10px] font-bold uppercase text-gray-400">
                <span>Shipping Address:</span>
                <span className="text-gray-800 text-right max-w-[220px] truncate">{addressForm.addressLine}, {addressForm.city}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/my-bookings" className="flex-1 bg-black text-white hover:bg-gray-800 py-3.5 rounded text-xs font-black uppercase tracking-widest shadow transition text-center">
                Track My Bookings
              </Link>
              <Link to="/" className="flex-1 border border-gray-200 hover:border-black py-3.5 rounded text-xs font-black uppercase tracking-widest transition text-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Checkout;
