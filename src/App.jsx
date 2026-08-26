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
import Flatmates from "./pages/marketplace/Flatmates";
import Tiffins from "./pages/marketplace/Tiffins";
import ViewTiffin from "./pages/marketplace/ViewTiffin";

// User Pages
import Profile from "./pages/user/Profile";
import Favorites from "./pages/user/Favorites";
import PublicAccommodationView from "./pages/public/PublicAccommodationView";
import LocationSearch from "./pages/marketplace/LocationSearch";
import ListYourProperty from "./pages/public/ListYourProperty";
import Events from "./pages/marketplace/Events";
import Trips from "./pages/marketplace/Trips";
import Scan from "./pages/public/Scan";
import EventTripView from "./pages/public/EventTripView";
import InstituteView from "./pages/public/InstituteView";

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
            <Route path="/flatmates" element={<Flatmates />} />
            <Route path="/tiffins" element={<Tiffins />} />
            <Route path="/tiffins/view/:id" element={<ViewTiffin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route
              path="/accommodations/view/:id"
              element={<PublicAccommodationView />}
            />
            <Route path="/list-property" element={<ListYourProperty />} />
            <Route path="/location-search" element={<LocationSearch />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/events" element={<Events />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/events/view/:id" element={<EventTripView />} />
            <Route path="/institutes/view/:id" element={<InstituteView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
