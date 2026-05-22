import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function AddDress() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Validate if provider
  if (!token || user?.role !== "provider") {
    navigate("/login");
  }

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Lehenga", // Default preset
    size: "M", // Default preset
    color: "",
    brand: user?.brand || "",
    rentPrice: "",
    securityDeposit: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectSize = (selectedSize) => {
    setFormData({ ...formData, size: selectedSize });
  };

  const handleSelectCategory = (selectedCat) => {
    setFormData({ ...formData, category: selectedCat });
  };

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setErrorMessage("");
    } else {
      setErrorMessage("Please drop/select a valid image file.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, category, size, color, rentPrice, securityDeposit } = formData;
    
    if (!title || !description || !category || !size || !color || !rentPrice || !securityDeposit) {
      setErrorMessage("All fields are mandatory.");
      return;
    }
    if (!image) {
      setErrorMessage("Please upload a dress image.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("image", image);

      await api.post("/dresses/add", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Dress listed successfully in your closet!");
      navigate("/provider");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "Failed to upload dress listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Back and title bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-gray-800">Add New Closet Listing</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Upload high-resolution images and set daily rent costs.</p>
          </div>
          <Link to="/provider" className="text-xs font-bold border border-gray-200 bg-white hover:border-black rounded px-4 py-2 uppercase tracking-wide transition">
            &larr; Workspace Dashboard
          </Link>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded border border-rose-100 font-bold mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: DRAG AND DROP FILE UPLOAD ZONE */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`aspect-[3/4] rounded-md border-2 border-dashed flex flex-col items-center justify-center p-6 relative overflow-hidden transition ${
                preview 
                  ? "border-gray-200" 
                  : dragActive 
                  ? "border-pink-500 bg-pink-50/20" 
                  : "border-gray-300 hover:border-pink-400 bg-white"
              }`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Change overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-wider">Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center space-y-3.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto border border-pink-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-800 tracking-wider">Drag & Drop Image</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Accepts PNG, JPG, or JPEG formats</p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-pink-600 text-white px-4 py-2 rounded-sm shadow-sm cursor-pointer pointer-events-auto relative">
                      Browse File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-pink-50/30 border border-pink-100/50 rounded p-4 text-[10px] text-gray-500 font-medium leading-relaxed">
              <span className="font-extrabold text-pink-700 uppercase block mb-1">Image Quality Guidelines</span>
              Use clean vertical shots (3:4 ratio) with white/plain backgrounds. Clear studio lightning attracts 3x more premium rentals.
            </div>
          </div>

          {/* RIGHT PANEL: DETAILS INPUTS */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-md p-6 shadow-sm space-y-6 text-xs font-bold text-gray-700">
            
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">Garment Parameters</h2>
            
            {/* Title & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="title">Dress Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Silk Bridal Zari Lehenga"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="brand">Designer Brand *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  required
                  placeholder="e.g. Sabyasachi, Manyavar"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="description">Product Description *</label>
              <textarea
                id="description"
                name="description"
                required
                placeholder="Include fabric details, dry clean parameters, embroidery styles..."
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold h-24"
              />
            </div>

            {/* Presets Grid: Category & Sizes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Category selector */}
              <div>
                <label className="block mb-2 uppercase tracking-wider text-gray-400 text-[10px]">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Lehenga", "Sherwani", "Suit", "Gown", "Tuxedo", "Saree"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`py-2 px-1 border rounded text-[10px] font-black uppercase transition cursor-pointer ${
                        formData.category === cat
                          ? "border-pink-600 bg-pink-50 text-pink-600"
                          : "border-gray-200 bg-white hover:border-black text-gray-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <label className="block mb-2 uppercase tracking-wider text-gray-400 text-[10px]">Size *</label>
                <div className="flex gap-2">
                  {["S", "M", "L", "XL", "XXL"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSelectSize(sz)}
                      className={`w-9 h-9 border rounded-full text-[10px] font-black flex items-center justify-center transition cursor-pointer ${
                        formData.size === sz
                          ? "border-pink-600 bg-pink-600 text-white"
                          : "border-gray-200 bg-white hover:border-black text-gray-700"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Pricing details and Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="color">Garment Color *</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  required
                  placeholder="e.g. Royal Blue"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="rentPrice">Daily Rent Price (₹) *</label>
                <input
                  type="number"
                  id="rentPrice"
                  name="rentPrice"
                  required
                  placeholder="e.g. 899"
                  value={formData.rentPrice}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-gray-400 text-[10px]" htmlFor="securityDeposit">Security Deposit (₹) *</label>
                <input
                  type="number"
                  id="securityDeposit"
                  name="securityDeposit"
                  required
                  placeholder="e.g. 2000"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-700 focus:outline-none focus:border-black font-semibold"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
              <Link
                to="/provider"
                className="border border-gray-200 hover:border-black px-6 py-3 rounded text-xs font-black uppercase bg-white transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white hover:bg-gray-800 py-3 px-8 rounded text-xs font-black uppercase tracking-widest shadow-md transition active:scale-[0.99] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Uploading to Closet..." : "Publish Dress Listing"}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

export default AddDress;