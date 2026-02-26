import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// 1. Auth & Supabase Importe
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import logo from "../../pages/images/CineMatch.png";

export default function HeaderFinder() {
  const [menu, setMenu] = useState(false);
  const { user } = useAuth(); // Login-Status abrufen
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenu(false);
    navigate("/");
  };

  // Styles für bessere Wiederverwendbarkeit
  const desktopLinkStyle = "rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-300 transition text-center";
  const mobileLinkStyle = "p-2 font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition";

  return (
    <div className="w-full mx-auto flex justify-between items-center px-4 py-4 relative">
      <Link to="/">
        <img
          className="w-24 mix-blend-multiply cursor-pointer" 
          src={logo}
          alt="CineMatch Logo"
        />
      </Link>
      
      {/* DESKTOP NAVIGATION */}
      <div className="hidden md:flex space-x-4">
        <Link className={desktopLinkStyle} to="/">
          Home
        </Link>

        {/* Diese Links erscheinen nur, wenn der User eingeloggt ist */}
        {user && (
          <>
            <Link className={desktopLinkStyle} to="/watchlist">
              Watchlist
            </Link>
            <Link className={desktopLinkStyle} to="/matching">
              CineMatch
            </Link>
          </>
        )}

        {/* Dynamischer Login/Logout Button */}
        {!user ? (
          <Link className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-300 transition" to="/login">
            Login
          </Link>
        ) : (
          <button 
            onClick={handleLogout}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-slate-600 transition"
          >
            Logout
          </button>
        )}
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden text-3xl"
        onClick={() => setMenu(!menu)}
        aria-label="Menu"
      >
        {menu ? "✕" : "☰"}
      </button>

      {/* MOBILE DROPDOWN */}
      {menu && (
        <div className="absolute top-full right-4 mt-2 w-56 bg-white shadow-xl border border-slate-100 rounded-xl flex flex-col space-y-2 p-4 md:hidden z-50 animate-in fade-in zoom-in-95">
          <Link className={mobileLinkStyle} to="/" onClick={() => setMenu(false)}>Home</Link>
          
          {user ? (
            <>
              <Link className={`${mobileLinkStyle} border-t pt-4`} to="/watchlist" onClick={() => setMenu(false)}>Watchlist</Link>
              <Link className={mobileLinkStyle} to="/matching" onClick={() => setMenu(false)}>CineMatch</Link>
              <button 
                onClick={handleLogout}
                className="mt-2 w-full bg-indigo-500 text-white p-2 rounded-lg font-bold shadow-md active:scale-95 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              className="mt-2 w-full bg-indigo-500 text-white p-2 rounded-lg font-bold text-center shadow-md active:scale-95 transition" 
              to="/login" 
              onClick={() => setMenu(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}