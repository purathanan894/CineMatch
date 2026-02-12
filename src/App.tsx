import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "./pages/Login";
import WatchlistPage from "./pages/Watchlist";
import Home from "./pages/Home";
import Finder from "./pages/Finder";
import MatchPage from "./components/mainWatchlistMatch";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Lade...</div>;

  return (
    <Routes>
      
      <Route path="/" element={<Home />} />
      <Route path="/finder" element={<Finder />} />
      <Route path="/login" element={<LoginPage />} /> 
<Route path="/matching" element={<MatchPage/>}/>
      
      <Route
        path="/watchlist"
        element={user ? <WatchlistPage /> : <Navigate to="/login" />}
      />

      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
