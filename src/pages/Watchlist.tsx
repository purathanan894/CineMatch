import { useTranslation } from "react-i18next";
import Header from "@/components/ui/header";
import MainWatchlist from "@/components/ui/mainWatchlist";


export default function Login() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FF0800] p-4 sm:p-6 relative">

      <Header/>
           
      <MainWatchlist/>
    </div>
  );
}
