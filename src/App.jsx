import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LandingPage from './components/LandingPage'; // Add this
import GSAPWrapper from './components/GSAPWrapper'; // Add this
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PasswordGenerator from './components/Generator/PasswordGenerator';
import PasswordManager from './components/Passmanage'; // Your actual password manager
import Navbar from './components/Common/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            {/* <GSAPWrapper> */}

            <Route path="/" element={<LandingPage />} /> {/* Add this line */}
            {/* </GSAPWrapper> */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes - These require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/passwords" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <PasswordManager />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/generator" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <PasswordGenerator />
                </>
              </ProtectedRoute>
            } />
            
            {/* Redirect all other routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;