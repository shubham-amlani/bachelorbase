import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import {
  Moon,
  Sun,
  LogIn,
  UserPlus,
  Heart,
  User,
  LogOut,
  Plus,
} from "lucide-react";

export default function Navbar() {
  const { isDarkMode, toggleMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRefs = useRef([]);

  // Updated PC Top Nav Links
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Institutes", path: "/institutes" },
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

  // --- Animation Pill Logic (Desktop) ---
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
    navigate("/login");
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

            {/* List Property Button (Desktop Only now) */}
            <Link
              to="/list-property"
              className="flex items-center gap-1.5 text-xs xl:text-sm font-bold text-white px-3 min-[1200px]:px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:from-amber-400 hover:to-orange-400 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} className="shrink-0" />
              <span className="hidden min-[1200px]:inline">List Property</span>
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
                  className="flex items-center gap-1.5 px-4 py-2 text-xs xl:text-sm font-bold text-secondaryText hover:text-white bg-mainBg hover:bg-red-500 border border-cardBorder hover:border-red-500 shadow-xs rounded-full transition-all hover:scale-105 active:scale-95"
                  aria-label="Sign Out"
                >
                  <LogOut size={15} /> Logout
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
              className="text-secondaryText bg-mainBg p-2.5 rounded-full border border-cardBorder shadow-xs active:scale-95 transition-transform"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Saved Heart moved here for Mobile */}
            <Link
              to="/favorites"
              className="p-2.5 bg-mainBg border border-cardBorder shadow-xs rounded-full transition-all active:scale-95"
              aria-label="Favorites"
            >
              <Heart size={18} fill="#FF2E51" color="#FF2E51" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
