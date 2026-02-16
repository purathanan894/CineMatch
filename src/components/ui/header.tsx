import { useState } from "react";
// 1. Link importieren
import { Link } from "react-router-dom"; 

import logo from "../../pages/images/CineMatch.png";

export default function Header() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="w-full mx-auto flex justify-between items-center px-4 py-4 relative">
      {/* Link statt window.location.href nutzen */}
      <Link to="/">
        <img
          className="w-25 mix-blend-multiply cursor-pointer" 
          src={logo}
          alt="CineMatch Logo"
          onClick={() => window.location.href = '/'}
        />
      </Link>
      
      <div className="hidden md:flex space-x-4">
        {/* Link-Komponente statt <a> verwenden */}
        <Link className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" to="/">
          Home
        </Link>
        <Link className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" to="/login">
          Login
        </Link>
        <Link className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" to="/watchlist" >
          Watchlist
        </Link>
        <Link className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" to="/finder">
          Stöbern
        </Link>
        <Link className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" to="/matching">
          CineMatch
        </Link>
      </div>

      <button className="md:hidden text-3xl" onClick={() => setMenu(!menu)} aria-label="Menu">
        ☰
      </button>

      {menu && (
        <div className="absolute top-full right-4 mt-2 w-56 bg-white shadow-lg rounded-lg flex flex-col space-y-2 p-4 md:hidden z-50">
          <Link className="..." to="/" onClick={() => setMenu(false)}>Home</Link>
          <Link className="..." to="/login" onClick={() => setMenu(false)}>Login</Link>
          <Link className="..." to="/watchlist" onClick={() => setMenu(false)}>Watchlist</Link>
          <Link className="..." to="/finder" onClick={() => setMenu(false)}>Stöbern</Link>
               <Link className="..." to="/matching" onClick={() => setMenu(false)}>CineMatch</Link>
        </div>
      )}
    </div>
  );
}