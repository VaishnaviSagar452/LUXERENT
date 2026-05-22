import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function DressCard({ dress, onToggleWishlistSuccess }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Check if this card is wishlisted by fetching or matching state
  // We can let the parent handle the liked state, or we can check on mount
  useEffect(() => {
    const checkLikeState = async () => {
      if (!token || !user) return;
      try {
        const response = await api.get("/wishlist");
        const list = response.data.dresses || [];
        setIsLiked(list.some((d) => d._id === dress._id));
      } catch (err) {
        console.error("Error checking wishlist state", err);
      }
    };
    checkLikeState();
  }, [dress._id, token]);

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      setIsLiking(true);
      await api.post(`/wishlist/toggle/${dress._id}`);
      setIsLiked(!isLiked);
      
      // Dispatch global event to sync navbar counter
      window.dispatchEvent(new Event("wishlist-updated"));
      
      if (onToggleWishlistSuccess) {
        onToggleWishlistSuccess();
      }
    } catch (err) {
      console.error("Error toggling wishlist", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Mock MRP as 10x the rent price to demonstrate huge savings
  const mockMRP = dress.rentPrice * 10;
  const savingsPct = 90;

  return (
    <div className="group relative bg-white rounded-md overflow-hidden border border-gray-100 hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)] transition duration-300 flex flex-col h-full">
      {/* Wishlist Button Overlay */}
      {(!user || user.role === "customer") && (
        <button
          onClick={handleLikeToggle}
          disabled={isLiking}
          className="absolute top-3.5 right-3.5 z-10 p-2 bg-white rounded-full shadow-md text-gray-400 hover:text-pink-600 hover:scale-110 active:scale-95 transition duration-200 cursor-pointer"
        >
          <svg
            className={`w-5 h-5 ${isLiked ? "fill-pink-600 text-pink-600" : "currentColor"}`}
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      )}

      <Link to={`/dress/${dress._id}`} className="flex flex-col h-full">
        {/* Product Image Panel */}
        <div className="relative w-full pt-[135%] bg-gray-50 overflow-hidden">
          <img
            src={dress.images?.[0] || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60"}
            alt={dress.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          
          {/* Availability badge */}
          {!dress.availability && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-widest uppercase border-2 border-white px-2.5 py-1">Rented Out</span>
            </div>
          )}

          {/* Size Overlay on Hover */}
          {dress.size && (
            <div className="absolute bottom-0 inset-x-0 bg-white/95 px-3 py-2 text-center transform translate-y-full group-hover:translate-y-0 transition duration-300 hidden sm:block border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available Size</p>
              <div className="flex gap-1.5 justify-center mt-1">
                <span className="text-[10px] font-extrabold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{dress.size}</span>
              </div>
            </div>
          )}
        </div>

        {/* Product Details Panel */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Brand/Owner */}
          <div className="flex justify-between items-start mb-0.5">
            <span className="text-xs font-black text-gray-800 tracking-wider uppercase truncate max-w-[70%]">
              {dress.brand || "DESIGNER WEAR"}
            </span>
            {dress.color && (
              <span className="text-[9px] font-bold text-gray-400 border border-gray-200 rounded px-1.5 capitalize">
                {dress.color}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs text-gray-500 font-medium truncate mb-2">{dress.title}</h3>

          {/* Price Breakdown */}
          <div className="mt-auto pt-2 border-t border-gray-50">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-gray-900">₹{dress.rentPrice}</span>
              <span className="text-[10px] text-gray-400 line-through">₹{mockMRP}</span>
              <span className="text-[10px] text-pink-600 font-bold">({savingsPct}% OFF)</span>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Rent only</span>
              {dress.securityDeposit > 0 && (
                <span className="text-[9px] text-gray-400 font-medium">Deposit: ₹{dress.securityDeposit}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default DressCard;