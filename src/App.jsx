import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Public Pages
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// Marketplace Pages
import Accommodations from "./pages/marketplace/Accommodations";
import PropertyDetails from "./pages/marketplace/PropertyDetails";
import Flatmates from "./pages/marketplace/Flatmates";
import Tiffins from "./pages/marketplace/Tiffins";

// User Pages
import Profile from "./pages/user/Profile";
import Favorites from "./pages/user/Favorites";
import Handshakes from "./pages/user/Handshakes";
import PublicAccommodationView from "./pages/public/PublicAccommodationView";
import LocationSearch from "./pages/marketplace/LocationSearch";
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* MAIN LAYOUT (Public & Standard Users) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/accommodations" element={<Accommodations />} />
            <Route path="/accommodations/:slug" element={<PropertyDetails />} />
            <Route path="/flatmates" element={<Flatmates />} />
            <Route path="/tiffins" element={<Tiffins />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/handshakes" element={<Handshakes />} />
            <Route path="/accommodations/view/:id" element={<PublicAccommodationView />} />
            <Route path="/location-search" element={<LocationSearch />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
