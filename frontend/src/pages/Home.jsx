import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../services/api";
import DressCard from "../components/DressCard";

const BANNER_SLIDES = [
  {
    id: 1,
    title: "GRAND WEDDING SELECTION",
    subtitle: "Rent designer Lehengas & Sherwanis at 10% of retail price",
    cta: "Explore Ethnic",
    tag: "ethnic",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c0519 100%)",
    textColor: "text-amber-100"
  },
  {
    id: 2,
    title: "RED CARPET GOWNS",
    subtitle: "Dazzle in couture floor-length dresses, styled for your special night",
    cta: "Explore Gowns",
    tag: "gowns",
    bg: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
    textColor: "text-rose-100"
  },
  {
    id: 3,
    title: "SARTORIAL SUITS & TUXEDOS",
    subtitle: "Crisp fabrics, perfect fits. Command the boardroom or gala",
    cta: "Explore Tuxedos",
    tag: "suits",
    bg: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    textColor: "text-emerald-100"
  }
];

const BUBBLE_CATEGORIES = [
  { name: "Lehenga", label: "Lehengas", img: "https://images.cbazaar.com/images/blue-chinon-printed-designer-lehenga-choli-ghsak4286102-u.jpg" },
  { name: "Sherwani", label: "Sherwanis", img: "https://tse1.mm.bing.net/th/id/OIP.hv1IaWDnNiFiniGYxBIR6QHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Gown", label: "Designer Gowns", img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=150&auto=format&fit=crop&q=60" },
  { name: "Suit", label: "Suits & Tux", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=150&auto=format&fit=crop&q=60" },
  { name: "Saree", label: "Sarees", img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=150&auto=format&fit=crop&q=60" }
];

function Home() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all"); // all | men | women
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | price-low | price-high

  // Get search param from URL
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchQuery = queryParams.get("search") || "";

  // Set default category and gender from URL if needed
  useEffect(() => {
    const catParam = queryParams.get("category");
    if (catParam) {
      setSelectedCategory(catParam);
    } else {
      setSelectedCategory("all");
    }

    const genderParam = queryParams.get("gender");
    if (genderParam) {
      setSelectedGender(genderParam.toLowerCase());
    } else {
      setSelectedGender("all");
    }
  }, [queryParams]);

  const fetchDresses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dresses");
      setDresses(response.data.dresses || []);
    } catch (error) {
      console.error("Failed to load dresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDresses();
  }, []);

  // Slide loop timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Apply filters and sorting
  const processedDresses = useMemo(() => {
    let result = [...dresses];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((d) => {
        const title = (d.title || "").toLowerCase();
        const brand = (d.brand || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const color = (d.color || "").toLowerCase();
        const cat = (d.category || "").toLowerCase();
        return title.includes(q) || brand.includes(q) || desc.includes(q) || color.includes(q) || cat.includes(q);
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((d) => (d.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // Gender filter
    if (selectedGender !== "all") {
      if (selectedGender === "men") {
        result = result.filter((d) => {
          const cat = (d.category || "").toLowerCase();
          return cat === "sherwani" || cat === "suit";
        });
      } else if (selectedGender === "women") {
        result = result.filter((d) => {
          const cat = (d.category || "").toLowerCase();
          return cat === "lehenga" || cat === "gown" || cat === "saree";
        });
      }
    }

    // Size filter
    if (selectedSize !== "all") {
      result = result.filter((d) => (d.size || "").toLowerCase() === selectedSize.toLowerCase());
    }

    // Price filter
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "under-1000") {
        result = result.filter((d) => d.rentPrice < 1000);
      } else if (selectedPriceRange === "1000-3000") {
        result = result.filter((d) => d.rentPrice >= 1000 && d.rentPrice <= 3000);
      } else if (selectedPriceRange === "over-3000") {
        result = result.filter((d) => d.rentPrice > 3000);
      }
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.rentPrice - b.rentPrice);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.rentPrice - a.rentPrice);
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [dresses, searchQuery, selectedCategory, selectedGender, selectedSize, selectedPriceRange, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedGender("all");
    setSelectedSize("all");
    setSelectedPriceRange("all");
    setSortBy("newest");
  };

  return (
    <div className="bg-white min-h-screen text-gray-800">
      {/* Provider Banner Helper */}
      {user?.role === "provider" && (
        <div className="bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 flex justify-center items-center gap-2">
          <span>You are logged in as a Dress Provider. Manage your listings here:</span>
          <Link to="/provider" className="underline hover:text-amber-100">Go to Provider Dashboard &rarr;</Link>
        </div>
      )}

      {/* Hero Banner Carousel Section */}
      <section className="relative overflow-hidden w-full h-[320px] md:h-[400px] transition duration-700">
        {BANNER_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            style={{
              background: slide.bg,
              opacity: idx === currentSlide ? 1 : 0,
              visibility: idx === currentSlide ? "visible" : "hidden"
            }}
            className="absolute inset-0 w-full h-full flex flex-col justify-center px-12 md:px-24 transition-opacity duration-1000 ease-in-out"
          >
            <div className="max-w-2xl text-white">
              <span className="text-[10px] md:text-xs font-black tracking-widest text-pink-500 bg-pink-950/40 px-3 py-1 rounded-full uppercase border border-pink-700/30">
                Luxe Rental Specials
              </span>
              <h1 className="text-3xl md:text-5xl font-black mt-4 tracking-tight leading-tight uppercase">
                {slide.title}
              </h1>
              <p className={`text-xs md:text-base font-medium mt-3 opacity-90 ${slide.textColor}`}>
                {slide.subtitle}
              </p>
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setSelectedCategory(slide.tag)}
                  className="bg-white text-black font-extrabold text-xs md:text-sm px-6 py-3 rounded-sm shadow-lg hover:bg-gray-100 transition tracking-wider uppercase cursor-pointer"
                >
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel indicators */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2">
          {BANNER_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-6 bg-white" : "w-2.5 bg-white/40"}`}
            />
          ))}
        </div>
      </section>

      {/* Curated Quick categories Bubbles */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-extrabold tracking-widest text-gray-400 uppercase mb-8">
          Browse Curated Collections
        </h2>
        <div className="flex justify-center items-center gap-6 md:gap-12 flex-wrap">
          {BUBBLE_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className="flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 p-0.5 transition duration-300 ${selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "border-pink-600 shadow-md" : "border-gray-200 group-hover:border-pink-400"}`}>
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover rounded-full" />
              </div>
              <span className={`text-[10px] md:text-xs font-extrabold mt-3 tracking-wider uppercase ${selectedCategory.toLowerCase() === cat.name.toLowerCase() ? "text-pink-600" : "text-gray-600 group-hover:text-pink-500"}`}>
                {cat.label}
              </span>
            </button>
          ))}
          <button
            onClick={() => setSelectedCategory("all")}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 p-0.5 flex items-center justify-center bg-gray-50 transition duration-300 ${selectedCategory === "all" ? "border-pink-600 shadow-md" : "border-gray-200 group-hover:border-pink-400"}`}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className={`text-[10px] md:text-xs font-extrabold mt-3 tracking-wider uppercase ${selectedCategory === "all" ? "text-pink-600" : "text-gray-600 group-hover:text-pink-500"}`}>
              View All
            </span>
          </button>
        </div>
      </section>

      {/* Main Browse Section */}
      <section className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-8 border-t border-gray-100">
        
        {/* Left Side Filter Panel */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-gray-800">Filters</h3>
            {(selectedCategory !== "all" || selectedGender !== "all" || selectedSize !== "all" || selectedPriceRange !== "all") && (
              <button onClick={resetFilters} className="text-[10px] text-pink-600 font-extrabold uppercase hover:underline">
                Clear All
              </button>
            )}
          </div>

          {/* Search Query Details */}
          {searchQuery && (
            <div className="bg-pink-50 text-pink-800 text-xs p-3 rounded border border-pink-100 flex justify-between items-center">
              <span className="truncate">Searching: "{searchQuery}"</span>
              <Link to={user?.role === "customer" ? "/customer" : "/"} className="text-pink-600 font-bold ml-2 hover:underline">Clear</Link>
            </div>
          )}

          {/* Categories Selector */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">Category</h4>
            <div className="space-y-2">
              {["all", "Lehenga", "Sherwani", "Gown", "Suit", "Saree"].map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer capitalize">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory.toLowerCase() === cat.toLowerCase()}
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-pink-600 h-4 w-4"
                  />
                  <span>{cat === "all" ? "All Categories" : cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender Selector */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">Gender</h4>
            <div className="space-y-2">
              {[
                { val: "all", label: "All Wear" },
                { val: "women", label: "Women's Collection" },
                { val: "men", label: "Men's Collection" }
              ].map((gen) => (
                <label key={gen.val} className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === gen.val}
                    onChange={() => {
                      setSelectedGender(gen.val);
                      // Clear category selection if it is incompatible with selected gender to prevent empty states
                      if (gen.val === "men" && ["lehenga", "gown", "saree"].includes(selectedCategory.toLowerCase())) {
                        setSelectedCategory("all");
                      }
                      if (gen.val === "women" && ["sherwani", "suit"].includes(selectedCategory.toLowerCase())) {
                        setSelectedCategory("all");
                      }
                    }}
                    className="accent-pink-600 h-4 w-4"
                  />
                  <span>{gen.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sizes Selector */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">Size</h4>
            <div className="flex flex-wrap gap-2">
              {["all", "S", "M", "L", "XL", "XXL"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`text-xs font-bold px-3 py-1.5 rounded border transition duration-200 cursor-pointer ${selectedSize.toLowerCase() === sz.toLowerCase() ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                >
                  {sz === "all" ? "All" : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Rent Price Ranges */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">Rent Price (Per Day)</h4>
            <div className="space-y-2">
              {[
                { val: "all", label: "All Prices" },
                { val: "under-1000", label: "Under ₹1,000" },
                { val: "1000-3000", label: "₹1,000 - ₹3,000" },
                { val: "over-3000", label: "Over ₹3,000" }
              ].map((range) => (
                <label key={range.val} className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPriceRange === range.val}
                    onChange={() => setSelectedPriceRange(range.val)}
                    className="accent-pink-600 h-4 w-4"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side Catalog Feed */}
        <main className="lg:col-span-4 space-y-6">
          
          {/* Top Bar Sort and Results count */}
          <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-gray-100">
            <div className="text-xs font-extrabold uppercase tracking-wide text-gray-400">
              Showing <span className="text-gray-900">{processedDresses.length}</span> dresses
            </div>
            
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-pink-500 bg-white"
              >
                <option value="newest">Newest Additions</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div className="h-[40vh] flex flex-col justify-center items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Premium Collection...</span>
            </div>
          ) : processedDresses.length === 0 ? (
            <div className="h-[40vh] flex flex-col justify-center items-center text-center bg-gray-50 rounded-lg p-10 border border-gray-100">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-extrabold text-sm text-gray-700 uppercase tracking-wider">No matching dresses found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Try loosening your search terms or filters to browse other designer wear.</p>
              <button onClick={resetFilters} className="mt-4 text-xs font-black bg-black text-white px-5 py-2.5 uppercase tracking-wider rounded shadow hover:bg-gray-800 transition">
                Show All Dresses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {processedDresses.map((dress) => (
                <DressCard key={dress._id} dress={dress} />
              ))}
            </div>
          )}
        </main>
      </section>

      {/* Footer Branding Info */}
      <footer className="bg-gray-900 text-gray-400 text-xs py-12 px-6 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-extrabold tracking-widest text-white text-sm mb-4 uppercase">LUXERENT PLATFORM</h3>
            <p className="text-[11px] leading-relaxed max-w-xs">
              LuxeRent is a premium fashion utility helping you access luxury wardrobe styles for weddings, galas, and boardroom dominance, at a fraction of standard cost.
            </p>
          </div>
          <div>
            <h3 className="font-extrabold tracking-widest text-white text-sm mb-4 uppercase">RENTAL POLICIES</h3>
            <ul className="space-y-2 text-[11px]">
              <li>Dry Cleaning included in every rent</li>
              <li>Free home delivery & scheduled pickup</li>
              <li>Minor adjustments & damage waiver covered</li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold tracking-widest text-white text-sm mb-4 uppercase">GET IN TOUCH</h3>
            <p className="text-[11px] mb-2">Questions? We are online 24/7 to assist with sizing & booking advice.</p>
            <span className="text-pink-500 font-extrabold">support@luxerent.in</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center border-t border-gray-800 mt-10 pt-6 text-[10px] text-gray-600">
          &copy; {new Date().getFullYear()} LuxeRent. Designed with passion for premium luxury. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;