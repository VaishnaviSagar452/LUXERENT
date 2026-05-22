import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ProviderDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProviderDresses = async () => {
    if (!token || user?.role !== "provider") {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/dresses");
      const allDresses = response.data.dresses || [];
      // Filter dresses owned by this provider
      const myDresses = allDresses.filter(
        (d) => d.owner && (d.owner._id === user._id || d.owner === user._id)
      );
      setDresses(myDresses);
    } catch (err) {
      console.error("Error fetching provider dresses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderDresses();
  }, [token]);

  const handleToggleAvailability = async (dressId, currentStatus) => {
    try {
      setActionLoading(true);
      await api.patch(`/dresses/${dressId}`, {
        availability: !currentStatus,
      });
      await fetchProviderDresses();
    } catch (err) {
      console.error("Error toggling availability:", err);
      alert("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDress = async (dressId) => {
    if (!window.confirm("Are you sure you want to delete this listing permanently? This action cannot be undone.")) return;
    
    try {
      setActionLoading(true);
      await api.delete(`/dresses/${dressId}`);
      await fetchProviderDresses();
    } catch (err) {
      console.error("Error deleting dress:", err);
      alert("Failed to delete the dress.");
    } finally {
      setActionLoading(false);
    }
  };

  // Analytics
  const stats = useMemo(() => {
    const total = dresses.length;
    const active = dresses.filter((d) => d.availability).length;
    const rented = total - active;
    // Calculate mock lifetime revenue based on rented dresses (e.g. rentPrice * 8 days mock)
    const mockRevenue = dresses.reduce((acc, d) => acc + (d.rentPrice * (d.availability ? 0 : 5)), 0);

    return { total, active, rented, mockRevenue };
  }, [dresses]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-4">Unlocking Vendor Vault...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="bg-white border border-gray-100 p-6 rounded-md shadow-xs mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-gray-800">Designer Workspace</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Hello, {user?.fullname} &bull; Managing {user?.brand || "LuxeRent Designer Portfolio"}</p>
          </div>
          <Link
            to="/add-dress"
            className="text-xs font-black bg-pink-600 text-white hover:bg-pink-700 rounded px-5 py-3 uppercase tracking-widest shadow transition cursor-pointer"
          >
            + Upload New Dress
          </Link>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1 */}
          <div className="bg-white border border-gray-100 p-5 rounded shadow-xs relative overflow-hidden">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Total Closet Size</span>
            <span className="text-2xl font-black text-gray-800 block mt-2">{stats.total}</span>
            <span className="text-[9px] text-gray-400 font-bold block mt-1">Listed outfits</span>
            <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-100 p-5 rounded shadow-xs relative overflow-hidden">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Active Listings</span>
            <span className="text-2xl font-black text-emerald-600 block mt-2">{stats.active}</span>
            <span className="text-[9px] text-gray-400 font-bold block mt-1">Available to rent</span>
            <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-100 p-5 rounded shadow-xs relative overflow-hidden">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Rented Out</span>
            <span className="text-2xl font-black text-pink-600 block mt-2">{stats.rented}</span>
            <span className="text-[9px] text-gray-400 font-bold block mt-1">Active customer leases</span>
            <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-100 p-5 rounded shadow-xs relative overflow-hidden">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Estimated Income</span>
            <span className="text-2xl font-black text-gray-800 block mt-2">₹{stats.mockRevenue}</span>
            <span className="text-[9px] text-gray-400 font-bold block mt-1">Rent cycle revenue</span>
            <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

        </div>

        {/* Inventory List Table */}
        <div className="bg-white border border-gray-100 rounded-md overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">My Uploaded Closets ({dresses.length})</h2>
          </div>

          {dresses.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-400 font-bold uppercase">
              <p>You haven't listed any designer dresses yet.</p>
              <Link to="/add-dress" className="text-pink-600 hover:underline mt-2 inline-block">Upload your first wear now</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium text-gray-500">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="py-3.5 px-6">Dress Details</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Size / Color</th>
                    <th className="py-3.5 px-6">Rent Fee / Deposit</th>
                    <th className="py-3.5 px-6">Booking Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dresses.map((dress) => {
                    const mockMRP = dress.rentPrice * 10;
                    return (
                      <tr key={dress._id} className="hover:bg-gray-50/50 transition">
                        
                        {/* Dress Cell */}
                        <td className="py-4 px-6 flex items-center gap-4">
                          <div className="w-12 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                            <img src={dress.images?.[0]} alt={dress.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-black text-gray-800 uppercase block">{dress.brand || "DESIGNER"}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 block max-w-[200px] truncate">{dress.title}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6 uppercase font-bold text-gray-600">
                          {dress.category}
                        </td>

                        {/* Size / Color */}
                        <td className="py-4 px-6 font-semibold uppercase">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 mr-2">{dress.size}</span>
                          <span className="text-gray-400">{dress.color}</span>
                        </td>

                        {/* Price Details */}
                        <td className="py-4 px-6">
                          <div className="font-black text-gray-800">₹{dress.rentPrice}/day</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Deposit: ₹{dress.securityDeposit}</div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleAvailability(dress._id, dress.availability)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition ${
                              dress.availability
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            {dress.availability ? "● Available" : "● Rented Out"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-3">
                          <button
                            onClick={() => navigate(`/dress/${dress._id}`)}
                            className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-wide cursor-pointer transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteDress(dress._id)}
                            disabled={actionLoading}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-wide cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProviderDashboard;