import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Login         from '@/pages/Login';
import Dashboard     from '@/pages/Dashboard';
import Bookings      from '@/pages/Bookings';
import Providers     from '@/pages/Providers';
import ProviderDetail from '@/pages/ProviderDetail';
import Services      from '@/pages/Services';
import Payments      from '@/pages/Payments';
import Reviews       from '@/pages/Reviews';
import Users         from '@/pages/Users';
import Logs          from '@/pages/Logs';
import Subscriptions from '@/pages/Subscriptions';
import Announcements from '@/pages/Announcements';
import Analytics     from '@/pages/Analytics';
import MapView       from '@/pages/MapView';

import { VectrProvider, useVectr } from '@/context/VectrContext';
import { VectrBackground } from '@/components/VectrBackground';

/**
 * Switches the Vectr scene mode based on the current route.
 * Mounted inside BrowserRouter (so useLocation works) but does not render any UI.
 */
function VectrRouteSync() {
  const location = useLocation();
  const { setMode } = useVectr();
  useEffect(() => {
    if (location.pathname.startsWith('/login')) {
      setMode('login');
    } else {
      setMode('ambient');
    }
  }, [location.pathname, setMode]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"           element={<Login />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/bookings"        element={<Bookings />} />
        <Route path="/providers"       element={<Providers />} />
        <Route path="/providers/:id"   element={<ProviderDetail />} />
        <Route path="/services"        element={<Services />} />
        <Route path="/payments"        element={<Payments />} />
        <Route path="/reviews"         element={<Reviews />} />
        <Route path="/users"           element={<Users />} />
        <Route path="/logs"            element={<Logs />} />
        <Route path="/subscriptions"   element={<Subscriptions />} />
        <Route path="/announcements"   element={<Announcements />} />
        <Route path="/analytics"       element={<Analytics />} />
        <Route path="/map"             element={<MapView />} />
        <Route path="/"                element={<Navigate to="/dashboard" replace />} />
        <Route path="*"                element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <VectrProvider>
      {/* The Three.js scene lives ONCE here, behind every route. */}
      <VectrBackground />
      <BrowserRouter>
        <VectrRouteSync />
        <AnimatedRoutes />
      </BrowserRouter>
    </VectrProvider>
  );
}
