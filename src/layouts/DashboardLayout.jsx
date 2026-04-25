import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const DashboardLayout = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState('المدير العام');
    const [initial, setInitial] = useState('A');

    useEffect(() => {
        try {
            const token = localStorage.getItem('adminToken');
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
            <Sidebar />
            <main className="main-content">
                <div className="top-bar glass-panel">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="ابحث في الإعلانات، الأقسام، المستخدمين..."
                            className="search-input"
                        />
                    </div>
                    <div className="user-profile-wrapper">
                        <div className="user-profile" onClick={toggleDropdown}>
                            <div className="avatar">{initial}</div>
                            <div className="user-info">
                                <span className="user-name">{username}</span>
                                <span className="user-role">Admin</span>
                            </div>
                        </div>
                        
                        {isDropdownOpen && (
                            <div className="profile-dropdown">
                                <button 
                                    onClick={() => {
                                        localStorage.removeItem('adminToken');
                                        window.location.href = '/login';
                                    }}
                                    className="dropdown-item logout-btn"
                                >
                                    تسجيل خروج
                                </button>
                            </div>
                        )}
                    </div>
                </div>

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

        .top-bar {
          height: 80px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 90;
          border-bottom: 1px solid var(--border-color);
        }

        .search-container {
          flex: 1;
          max-width: 480px;
        }

        .search-input {
          width: 100%;
          padding: 12px 20px;
          border-radius: 30px;
          border: 1px solid var(--border-color);
          background-color: var(--secondary-color);
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .search-input:focus {
          outline: none;
          background-color: var(--white);
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-round);
          background-color: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
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
          padding: 32px;
          flex: 1;
        }
      `}</style>
        </div>
    );
};
