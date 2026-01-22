import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PasswordGenerator from './components/Generator/PasswordGenerator';
import Navbar from './components/Common/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
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
            
            {/* Redirect to dashboard if authenticated, otherwise to login */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;