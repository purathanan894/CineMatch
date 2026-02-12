import Header from "@/components/ui/header";
import Main from "@/components/ui/main";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-[#FF0800] p-4 sm:p-6 relative">

      <Header/>
           
      <Main/>
    </div>
  );
  const { user } = useAuth();
console.log("Current user:", user);
} 

//cd /Users/itersatz/Documents/rathugehtsteil/vite-react-starter
//npm run dev
