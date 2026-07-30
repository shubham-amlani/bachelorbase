import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-cardBorder pt-12 md:pt-16 pb-6 mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Responsive Grid: 2 columns on mobile, 12 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10 md:gap-10 lg:gap-16 mb-12">
          {/* Brand Info - Spans full width (2 cols) on mobile, 4 cols on desktop */}
          <div className="col-span-2 md:col-span-4 pr-0 md:pr-4">
            <Link to="/" className="flex items-center gap-1 mb-5">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-[#5B4EE4]">
                Bachelor
              </span>
              <span className="text-2xl md:text-3xl font-black tracking-tight text-primaryText">
                Base
              </span>
            </Link>
            <p className="text-secondaryText text-sm leading-relaxed mb-6 max-w-sm">
              The most reliable, spam-free ecosystem for finding premium stays,
              verified flatmates, and daily meals.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-mainBg border border-cardBorder flex items-center justify-center text-secondaryText hover:text-accentBlue hover:border-accentBlue transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="#"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-mainBg border border-cardBorder flex items-center justify-center text-secondaryText hover:text-emerald-500 hover:border-emerald-500 transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column 1 - Spans 1 col on mobile, 2 cols on desktop */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-primaryText mb-4 text-xs md:text-sm uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-3 text-sm font-medium text-secondaryText">
              <li>
                <Link
                  to="/accommodations"
                  className="hover:text-accentBlue transition-colors"
                >
                  Find PGs & Flats
                </Link>
              </li>
              <li>
                <Link
                  to="/flatmates"
                  className="hover:text-accentBlue transition-colors"
                >
                  Find Flatmates
                </Link>
              </li>
              <li>
                <Link
                  to="/tiffins"
                  className="hover:text-accentBlue transition-colors"
                >
                  Tiffin Services
                </Link>
              </li>
              <li>
                <Link
                  to="/accommodations"
                  className="hover:text-accentBlue transition-colors"
                >
                  Premium Listings
                </Link>
              </li>
              <li>
                <Link
                  to="/accommodations"
                  className="hover:text-accentBlue transition-colors"
                >
                  Near Campus Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 - Spans 1 col on mobile, 2 cols on desktop */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-primaryText mb-4 text-xs md:text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3 text-sm font-medium text-secondaryText">
              <li>
                <Link
                  to="/about"
                  className="hover:text-accentBlue transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-accentBlue transition-colors"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-accentBlue transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="hover:text-accentBlue transition-colors"
                >
                  Our Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/partner"
                  className="hover:text-accentBlue transition-colors"
                >
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 - Spans 1 col on mobile, 2 cols on desktop */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-primaryText mb-4 text-xs md:text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3 text-sm font-medium text-secondaryText">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-accentBlue transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-accentBlue transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="hover:text-accentBlue transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="hover:text-accentBlue transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/sitemap"
                  className="hover:text-accentBlue transition-colors"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 4 (Contact Info) - Spans 1 col on mobile, 2 cols on desktop */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-primaryText mb-4 text-xs md:text-sm uppercase tracking-wider">
              Reach Us
            </h4>
            <ul className="space-y-3 text-sm font-medium text-secondaryText">
              <li>
                <a
                  href="mailto:support@bachelorbase.in"
                  className="hover:text-accentBlue transition-colors break-words"
                >
                  support@bachelorbase.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+919876543210"
                  className="hover:text-accentBlue transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="pt-1 text-xs text-tertiaryText leading-relaxed">
                Operated from Jetpur, Gujarat, India.
                <br />
                Mon-Fri, 9am - 6pm.
              </li>
            </ul>
          </div>
        </div>

        {/* Centered Copyright Bar */}
        <div className="border-t border-cardBorder pt-6 flex justify-center">
          <p className="text-xs font-semibold text-tertiaryText text-center">
            &copy; {new Date().getFullYear()} BachelorBase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
