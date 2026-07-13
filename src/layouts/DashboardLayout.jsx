import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu } from 'lucide-react';

export const DashboardLayout = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [username, setUsername] = useState('المدير العام');
    const [initial, setInitial] = useState('A');

    useEffect(() => {
        try {
            const token = localStorage.getItem('adminLoggedIn');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.username) {
                    setUsername(payload.username);
                    setInitial(payload.username.charAt(0).toUpperCase());
                }
            }
        } catch (e) {
            console.error("Could not parse token");
        }
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className="layout-wrapper">
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
            <main className="main-content">
                {/* Mobile Menu Toggle - Floating on small screens */}
                <button 
                    className="mobile-menu-toggle-floating"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu size={24} />
                </button>

                <div className="page-content animate-fade-in">
                    <Outlet />
                </div>
            </main>

            <style jsx>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-right: 280px; /* Sidebar width for RTL */
          display: flex;
          flex-direction: column;
        }

        .mobile-menu-toggle-floating {
          display: none;
          position: fixed;
          top: 12px;
          right: 16px;
          z-index: 100;
          background: #ffffff;
          border: 1px solid var(--border-color);
          color: var(--text-dark);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .mobile-menu-toggle-floating:hover {
          background: var(--secondary-color);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-dark);
        }

        .user-role {
          font-size: 0.8rem;
          color: var(--text-gray);
        }

        .user-profile-wrapper {
          position: relative;
        }

        .profile-dropdown {
          position: absolute;
          top: 60px;
          left: 0;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          width: 150px;
          padding: 8px;
          z-index: 100;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          text-align: right;
          padding: 10px 16px;
          border-radius: 6px;
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-btn {
          color: #ff4d4f;
        }

        .logout-btn:hover {
          background: #ffe6e6;
        }

        .page-content {
          padding: 20px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-right: 0;
          }
          .mobile-menu-toggle-floating {
            display: flex;
          }
          .page-content {
            padding: 12px;
          }
        }
      `}</style>
        </div>
    );
};
