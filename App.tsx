import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Capabilities from './pages/Capabilities';
import Examples from './pages/Examples';
import Waitlist from './pages/Waitlist';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/capabilities" element={<Capabilities />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/waitlist" element={<Waitlist />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;