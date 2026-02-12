import { useTranslation } from "react-i18next";
import Header from "@/components/ui/header";
import MainFinder from "@/components/ui/mainFinder";
import HeaderFinder from "@/components/ui/headerFinder";

export default function Finder() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FF0800] p-4 sm:p-6 relative">

      <HeaderFinder/>
           
      <MainFinder/>
    
    </div>
  );
}
