import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Setup from "./pages/Setup";
import Home from "./pages/Home";
import Games from "./pages/Games";
import CreatePelada from "./pages/CreatePelada";
import PeladaDetails from "./pages/PeladaDetails";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import JoinPelada from "./pages/JoinPelada";
import TeamDraw from "./pages/TeamDraw";
import ForgotPassword from "./pages/ForgotPassword";
import Calibration from "./pages/Calibration";
import MatchParticipants from "./pages/MatchParticipants";
import MatchLive from "./pages/MatchLive";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/home" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/create-pelada" element={<CreatePelada />} />
          <Route path="/pelada/:id" element={<PeladaDetails />} />
          <Route path="/join-pelada/:id" element={<JoinPelada />} />
          <Route path="/team-draw/:matchId" element={<TeamDraw />} />
          <Route path="/match/:matchId/participants" element={<MatchParticipants />} />
          <Route path="/match/:matchId/live" element={<MatchLive />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          {/* Legacy routes - redirect to new structure */}
          <Route path="/game/:id" element={<Navigate to="/games" replace />} />
          <Route path="/create-game" element={<Navigate to="/create-pelada" replace />} />
          <Route path="/join/:id" element={<Navigate to="/games" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
