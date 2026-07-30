import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import {
  Moon,
  Sun,
  Menu,
  X,
  LogIn,
  UserPlus,
  Heart,
  User,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { isDarkMode, toggleMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRefs = useRef([]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find PGs/Flats", path: "/accommodations" },
    { name: "Find Flatmates", path: "/flatmates" },
    { name: "Tiffins", path: "/tiffins" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const activeIndex = navLinks.findIndex((link) =>
    link.path === "/"
      ? location.pathname === "/"
      : location.pathname.includes(link.path)
  );

  // --- Track Active Session ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Animation Pill Logic ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (activeIndex !== -1 && navRefs.current[activeIndex]) {
        const element = navRefs.current[activeIndex];
        setPillStyle({
          left: element.offsetLeft,
          width: element.offsetWidth,
          opacity: 1,
        });
      } else {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [activeIndex, location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    navigate("/login"); // Redirect to login instantly
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-surface/90 dark:bg-mainBg/90 backdrop-blur-md border-b border-cardBorder shadow-sm py-3 transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <span className="text-2xl md:text-3xl font-black tracking-tight text-[#5B4EE4]">
              Bachelor
            </span>
            <span className="text-2xl md:text-3xl font-black tracking-tight text-primaryText">
              Base
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex relative items-center justify-center bg-mainBg border border-cardBorder rounded-full p-1 shadow-sm">
            <div
              className="absolute h-[calc(100%-8px)] bg-accentBlue rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm"
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity,
              }}
            />

            {navLinks.map((link, index) => {
              const isActive = index === activeIndex;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  ref={(el) => (navRefs.current[index] = el)}
                  className={`relative z-10 px-3.5 xl:px-5 py-2 text-xs xl:text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-secondaryText hover:text-primaryText hover:bg-cardBorder/40"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Side Tools */}
          <div className="hidden lg:flex items-center justify-end gap-2.5 shrink-0">
            <button
              onClick={toggleMode}
              className="p-2.5 text-secondaryText hover:text-accentBlue bg-mainBg border border-cardBorder shadow-xs rounded-full transition-all hover:scale-105 active:scale-95"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Premium Pink Filled Favorites Icon */}
            <Link
              to="/favorites"
              className="p-2.5 bg-mainBg border border-cardBorder shadow-xs rounded-full transition-all hover:scale-105 hover:border-pink-200 active:scale-95"
              aria-label="Favorites"
            >
              <Heart size={18} fill="#FF2E51" color="#FF2E51" />
            </Link>

            {/* Dynamic Auth Buttons */}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-primaryText px-4 py-2 rounded-full border border-cardBorder bg-mainBg shadow-xs hover:border-[#5B4EE4] hover:text-[#5B4EE4] transition-all hover:scale-105 active:scale-95"
                >
                  <User size={15} /> Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-secondaryText hover:text-white bg-mainBg hover:bg-red-500 border border-cardBorder hover:border-red-500 shadow-xs rounded-full transition-all hover:scale-105 active:scale-95"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-primaryText px-4 py-2 rounded-full border border-cardBorder bg-mainBg shadow-xs hover:border-tertiaryText transition-all hover:scale-105 active:scale-95"
                >
                  <LogIn size={15} /> Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-white px-4 py-2 rounded-full bg-accentBlue shadow-md shadow-accentBlue/25 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                >
                  <UserPlus size={15} /> Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Side Tools */}
          <div className="lg:hidden flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleMode}
              className="text-secondaryText bg-mainBg p-2.5 rounded-full border border-cardBorder shadow-xs"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Premium Pink Filled Favorites Icon */}
            <Link
              to="/favorites"
              className="bg-mainBg p-2.5 rounded-full border border-cardBorder shadow-xs"
            >
              <Heart size={18} fill="#FF2E51" color="#FF2E51" />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primaryText p-1"
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-surface border-b border-cardBorder shadow-xl flex flex-col px-6 py-6 space-y-2 z-50">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.includes(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-bold px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-accentBlue text-white"
                    : "text-secondaryText hover:bg-mainBg"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="flex flex-col gap-3 pt-4 border-t border-cardBorder mt-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accentBlue text-white rounded-xl font-bold text-sm shadow-md"
                >
                  <User size={16} /> My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-cardBorder hover:border-red-500 hover:text-red-500 bg-mainBg rounded-xl text-primaryText font-bold text-sm transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-cardBorder bg-mainBg rounded-xl text-primaryText font-bold text-sm"
                >
                  <LogIn size={16} /> Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accentBlue text-white rounded-xl font-bold text-sm shadow-md"
                >
                  <UserPlus size={16} /> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
