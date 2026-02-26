import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { useAuth } from "@/context/AuthContext"; // Pfad ggf. anpassen
import { supabase } from "@/lib/supabase";
import logo from "../../pages/images/CineMatch.png";

export default function Header() {
  const [menu, setMenu] = useState(false);
  const { user } = useAuth(); // Hier holen wir den Login-Status
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenu(false);
    navigate("/"); // Nach Logout zur Startseite
  };

  // Gemeinsame Styles für die Links, um den Code sauber zu halten
  const linkStyle = "rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-300 transition text-center";

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
        <Link className={linkStyle} to="/">Home</Link>

        {/* Diese Links erscheinen NUR, wenn eingeloggt */}
        {user && (
          <>
            <Link className={linkStyle} to="/watchlist">Watchlist</Link>
            <Link className={linkStyle} to="/finder">Stöbern</Link>
            <Link className={linkStyle} to="/matching">CineMatch</Link>
          </>
        )}

        {/* Login oder Logout Button */}
        {!user ? (
          <Link className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-300 transition" to="/login">
            Login
          </Link>
        ) : (
          <button onClick={handleLogout} className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-300 transition">
            Logout
          </button>
        )}
      </div>

      {/* MOBILE MENU BUTTON */}
      <button className="md:hidden text-3xl" onClick={() => setMenu(!menu)} aria-label="Menu">
        {menu ? "✕" : "☰"}
      </button>

      {/* MOBILE DROPDOWN */}
      {menu && (
        <div className="absolute top-full right-4 mt-2 w-56 bg-white shadow-xl border border-slate-100 rounded-2xl flex flex-col space-y-2 p-4 md:hidden z-50 animate-in fade-in zoom-in-95">
          <Link className="p-2 font-bold text-slate-700" to="/" onClick={() => setMenu(false)}>Home</Link>
          
          {user ? (
            <>
              <Link className="p-2 font-bold text-slate-700 border-t" to="/watchlist" onClick={() => setMenu(false)}>Watchlist</Link>
              <Link className="p-2 font-bold text-slate-700" to="/finder" onClick={() => setMenu(false)}>Stöbern</Link>
              <Link className="p-2 font-bold text-slate-700" to="/matching" onClick={() => setMenu(false)}>CineMatch</Link>
              <button onClick={handleLogout} className="mt-2 w-full bg-slate-800 text-white p-2 rounded-xl font-bold">Logout</button>
            </>
          ) : (
            <Link className="mt-2 w-full bg-indigo-500 text-white p-2 rounded-xl font-bold text-center" to="/login" onClick={() => setMenu(false)}>Login</Link>
          )}
        </div>
      )}
    </div>
  );
}