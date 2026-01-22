import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaKey, FaHome } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2 text-xl font-bold">
              <FaKey />
              <span>PassOP</span>
            </Link>
            
            <div className="hidden md:flex space-x-4 ml-8">
              <Link to="/dashboard" className="flex items-center space-x-1 hover:text-green-200">
                <FaHome />
                <span>Dashboard</span>
              </Link>
              <Link to="/generator" className="flex items-center space-x-1 hover:text-green-200">
                <FaKey />
                <span>Generator</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaUser />
              <span className="hidden md:inline">{user?.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md transition-colors"
            >
              <FaSignOutAlt />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;