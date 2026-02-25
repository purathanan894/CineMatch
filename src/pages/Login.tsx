import Header from "@/components/ui/header";
import SupabaseLogin from "@/components/ui/supabaseLogin";

export default function Login() {

  return (
    <div className="min-h-screen bg-linear-to-b from-white to bg-indigo-500 p-4 sm:p-6 relative">

      <Header/>

      <SupabaseLogin/>     
      
    </div>
  );
}
