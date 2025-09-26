import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import GetCash from './pages/GetCash';
import Invoices from './pages/Invoices';
import SaaS from './pages/SaaS';
import Creators from './pages/Creators';
import Rentals from './pages/Rentals';
import Luxury from './pages/Luxury';
import Invest from './pages/Invest';
import BasketDetails from './pages/BasketDetails';
import Dashboard from './pages/Dashboard';
import AIOracle from './pages/AIOracle';
import Reputation from './pages/Reputation';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/get-cash" element={<GetCash />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/saas" element={<SaaS />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/luxury" element={<Luxury />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/baskets/:id" element={<BasketDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-oracle" element={<AIOracle />} />
          <Route path="/reputation" element={<Reputation />} />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'nb-toast nb-border rounded-nb',
          duration: 4000,
        }}
      />
    </Router>
  );
}

export default App;
