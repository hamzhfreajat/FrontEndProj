import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const DashboardLayout = () => {
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
                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <div className="user-info">
                            <span className="user-name">المدير العام</span>
                            <span className="user-role">Admin</span>
                        </div>
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

        .page-content {
          padding: 32px;
          flex: 1;
        }
      `}</style>
        </div>
    );
};
