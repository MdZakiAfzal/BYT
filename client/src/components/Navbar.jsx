import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, LayoutDashboard, ArrowRight, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">B</div>
          <span>BYT</span>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-white">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium text-gray-300">{user.email}</span>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-white" title="Sign out">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition">Log in</Link>
              <Link to="/signup" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-200 transition">
                Start for Free <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-b border-zinc-800 bg-zinc-950 md:hidden p-4 space-y-4">
          {user ? (
            <>
              <Link to="/dashboard" className="block text-sm font-medium text-white">Dashboard</Link>
              <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400">
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm font-medium text-gray-400">Log in</Link>
              <Link to="/signup" className="block text-sm font-bold text-white">Start for Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;