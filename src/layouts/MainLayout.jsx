import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Navbar from "../components/global/Navbar";
import Footer from "../components/global/Footer";
import { Home, Library, QrCode, User, Plus } from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Institutes", path: "/institutes", icon: Library },
    { label: "List", path: "/list-property", icon: Plus, isFab: true },
    { label: "Scan", path: "/scan", icon: QrCode },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const activeIndex = navItems.findIndex((item) =>
    item.path === "/" ? path === "/" : path.startsWith(item.path)
  );

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full z-[100] bg-surface/95 backdrop-blur-xl border-t border-cardBorder shadow-[0_-10px_30px_rgba(0,0,0,0.08)] pb-[max(0rem,env(safe-area-inset-bottom))]">
      <div className="relative flex items-center w-full h-[64px] z-10">
        {/* FIX: Bounded Pill Wrapper. Fixed height (44px) perfectly centered vertically */}
        <div
          className="absolute top-[10px] left-0 h-[44px] w-1/5 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
          style={{
            transform: `translateX(${
              activeIndex === -1 ? 0 : activeIndex * 100
            }%)`,
            opacity: activeIndex === -1 || navItems[activeIndex].isFab ? 0 : 1,
          }}
        >
          {/* FIX: width 80% with max-width keeps it as a nice uniform horizontal pill, not an oval */}
          <div className="w-[80%] max-w-[56px] h-full bg-[#5B4EE4]/15 dark:bg-[#5B4EE4]/25 rounded-2xl" />
        </div>

        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <div
                key="fab"
                className="flex-1 flex justify-center items-center relative h-full"
              >
                <div className="absolute -top-[28px] w-[68px] h-[68px] bg-mainBg rounded-full z-10 border-t border-cardBorder shadow-[0_-5px_10px_rgba(0,0,0,0.02)]"></div>
                <Link
                  to={item.path}
                  className="absolute -top-[20px] w-14 h-14 bg-gradient-to-tr from-[#5B4EE4] to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-[#5B4EE4]/40 text-white transform transition-transform active:scale-90 hover:scale-105 z-20"
                >
                  <Icon size={28} strokeWidth={2.5} />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center relative z-10 transition-transform active:scale-95 h-full pt-1"
            >
              <div className="flex items-center justify-center mb-1">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-300 ${
                    isActive ? "text-[#5B4EE4]" : "text-secondaryText"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] leading-none tracking-wide transition-colors duration-300 ${
                  isActive
                    ? "font-bold text-[#5B4EE4]"
                    : "font-medium text-secondaryText"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-mainBg text-primaryText transition-colors duration-200 relative">
      <Navbar />
      <main className="grow w-full pb-28 lg:pb-12">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
