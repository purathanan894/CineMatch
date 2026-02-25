import MainFinder from "@/components/ui/mainFinder";
import HeaderFinder from "@/components/ui/headerFinder";

export default function Finder() {
 
  return (
    <div className="min-h-screen bg-linear-to-b from-white to bg-indigo-500 p-4 sm:p-6 relative">

      <HeaderFinder/>
           
      <MainFinder/>
    
    </div>
  );
}
