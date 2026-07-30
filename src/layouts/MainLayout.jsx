import { Outlet } from "react-router-dom";
import Navbar from "../components/global/Navbar";
import Footer from "../components/global/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-mainBg text-primaryText transition-colors duration-200">
      <Navbar />
      <main className="grow w-full pb-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
