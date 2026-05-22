import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function MyBookings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/bookings/my-bookings");
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Error loading user bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this dress rental?")) return;
    
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/cancel/${bookingId}`);
      // Refresh list
      await fetchBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  // Helper to determine step index for the progress bar
  const getBookingProgress = (booking) => {
    if (booking.bookingStatus === "cancelled") return { step: -1, text: "Cancelled" };
    if (booking.paymentStatus === "pending") return { step: 0, text: "Awaiting Payment" };
    
    const today = new Date();
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);

    // Normalize dates
    today.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (booking.bookingStatus === "completed") {
      return { step: 4, text: "Returned & Deposit Refunded" };
    }

    if (today < start) {
      // Ordered, shipping next
      return { step: 1, text: "Booking Confirmed - Preparing Delivery" };
    } else if (today >= start && today <= end) {
      // Rental period active
      return { step: 2.5, text: "Out for Delivery - Rental Active" };
    } else {
      // After end date
      return { step: 3.5, text: "Rental Complete - Reverse Pickup Scheduled" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-4">Unlocking Bookings Closet...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-gray-800">My Rental Bookings</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Track dry cleaning, shipping progress, and security deposits refunds.</p>
          </div>
          <Link to="/" className="text-xs font-bold border border-gray-200 bg-white hover:border-black rounded px-4 py-2 uppercase tracking-wide transition">
            Rent Another Wear
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded border border-gray-100 shadow-sm max-w-lg mx-auto">
            <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">No Bookings Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">You haven't scheduled any dress rentals yet.</p>
            <Link to="/" className="mt-6 inline-block text-xs font-black bg-pink-600 text-white px-6 py-3 uppercase tracking-wider rounded-sm shadow hover:bg-pink-700 transition">
              Find Designer Outfits
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const dress = booking.dress;
              if (!dress) return null;
              
              const progress = getBookingProgress(booking);
              const isCancellable = booking.bookingStatus !== "cancelled" && new Date(booking.startDate) > new Date();

              return (
                <div key={booking._id} className="bg-white border border-gray-100 rounded-md p-6 shadow-xs flex flex-col gap-6">
                  
                  {/* Top info row */}
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-gray-50 pb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Booking ID</span>
                      <span className="text-xs font-black uppercase text-gray-800">#{booking._id.substring(12).toUpperCase()}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase block text-right">Payment Status</span>
                        <span className={`text-xs font-extrabold uppercase block text-right ${booking.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-500"}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase block text-right">Refund Status</span>
                        <span className="text-xs font-extrabold uppercase text-gray-400 block text-right">
                          {booking.bookingStatus === "completed" ? "Refunded" : booking.bookingStatus === "cancelled" ? "Cancelled" : "Pending Return"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dress info block */}
                  <div className="flex gap-5">
                    <div className="w-20 h-26 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={dress.images?.[0]} alt={dress.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <span className="text-xs font-black uppercase text-gray-800 tracking-wide block">{dress.brand || "DESIGNER"}</span>
                        <h3 className="text-xs text-gray-400 font-medium mt-0.5">{dress.title}</h3>
                        <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-bold uppercase">
                          <span>Size: <span className="text-gray-800">{dress.size}</span></span>
                          <span>Color: <span className="text-gray-800">{dress.color}</span></span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-[10px] text-gray-500 font-bold uppercase space-y-1">
                        <div>
                          <span>Starts: </span>
                          <span className="text-gray-800">{new Date(booking.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div>
                          <span>Ends: </span>
                          <span className="text-gray-800">{new Date(booking.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-black text-gray-900">Paid Amount: ₹{booking.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress tracker bar */}
                  {booking.bookingStatus !== "cancelled" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-pink-600 bg-pink-50/50 p-2.5 rounded border border-pink-100/50">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status: {progress.text}
                        </span>
                        {booking.paymentStatus === "paid" && (
                          <span className="text-emerald-600">Security Deposit Insured</span>
                        )}
                      </div>

                      {/* Progress Steps Graphic */}
                      <div className="relative pt-4 pb-2">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 transform -translate-y-1/2 rounded-full"></div>
                        
                        {/* Dynamic progress bar fill */}
                        <div 
                          className="absolute top-1/2 left-0 h-1 bg-pink-600 transform -translate-y-1/2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(0, (progress.step / 4) * 100)}%` }}
                        ></div>

                        {/* Nodes */}
                        <div className="relative flex justify-between">
                          {[
                            { label: "Ordered", stepNum: 0 },
                            { label: "Shipped", stepNum: 1 },
                            { label: "Delivered", stepNum: 2 },
                            { label: "Rented", stepNum: 3 },
                            { label: "Returned", stepNum: 4 }
                          ].map((node) => {
                            const isPassed = progress.step >= node.stepNum;
                            return (
                              <div key={node.label} className="flex flex-col items-center">
                                <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center text-[8px] font-black z-10 transition duration-300 ${
                                  isPassed 
                                    ? "bg-pink-600 border-white text-white shadow-sm" 
                                    : "bg-white border-gray-100 text-gray-300"
                                }`}>
                                  {isPassed && "✓"}
                                </div>
                                <span className={`text-[8px] font-extrabold uppercase mt-2 tracking-wider ${
                                  isPassed ? "text-pink-600" : "text-gray-400"
                                }`}>
                                  {node.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancel button if applicable */}
                  {booking.bookingStatus === "cancelled" && (
                    <div className="bg-rose-50 text-rose-800 text-[10px] p-2.5 rounded border border-rose-100 font-bold flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Booking Cancelled. The refund has been initiated to your source payment account.</span>
                    </div>
                  )}

                  {isCancellable && (
                    <div className="flex justify-end pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="text-[10px] font-black border border-rose-200 text-rose-600 hover:bg-rose-50 rounded px-4 py-2 uppercase tracking-widest transition cursor-pointer"
                      >
                        {cancellingId === booking._id ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default MyBookings;