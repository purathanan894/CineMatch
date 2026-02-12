import { useState } from "react"


export default function HeaderFinder() {
  const [menu , setMenu] = useState(false)

  return (
    <div className="w-full mx-auto flex justify-between items-center px-4 py-4 relative">
    <img
  className="w-25 mix-blend-multiply" 
  src="src/pages/images/CineMatch.png"
  alt="Logo"
  onClick={() => window.location.href = '/'}
/>
      
      <div className="hidden md:flex space-x-4">
        <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/">
          Home
        </a>
              <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/login" >
          Login
          </a>
        <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/watchlist" >
         Watchlist</a>
          <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/matching">
        CineMatch
          </a>
      </div>

    
      <button
        className="md:hidden text-3xl"
        onClick={() => setMenu(!menu)}
        aria-label="Menu"
      >
        ☰
      </button>

     
      {menu && (
        <div className="absolute top-full right-4 mt-2 w-56 bg-white shadow-lg rounded-lg flex flex-col space-y-2 p-4 md:hidden">
          <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/">
          Home
          </a>
           <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/login" >
          Login
          </a>
            <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/watchlist" >
            Watchlist
         </a>
        <a className="rounded-lg bg-[#FF0800] px-4 py-2 text-white font-medium hover:bg-[#C80815] transition" href="/matching">
        CineMatch
          </a>
     
          
        </div>
      )}
    </div>
  )
}
