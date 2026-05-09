import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Tags,
  FileText,
  Users,
  Settings,
  LogOut,
  Globe,
  BellRing,
  Flag,
  Search
} from 'lucide-react';

const navItems = [
  { path: '/', name: 'لوحة القيادة', icon: LayoutDashboard },
  { path: '/ads', name: 'إدارة الإعلانات', icon: FileText },
  { path: '/categories', name: 'الأقسام', icon: Tags },
  { path: '/users', name: 'المستخدمين', icon: Users },
  { path: '/saved-groups', name: 'ربط الفيسبوك', icon: Globe },
  { path: '/send-notification', name: 'إرسال إشعارات', icon: BellRing },
  { path: '/reports', name: 'البلاغات', icon: Flag },
  { path: '/searches', name: 'عمليات البحث', icon: Search },
  { path: '/scraping-logs', name: 'سجلات السحب', icon: Globe },
  { path: '/settings', name: 'الإعدادات', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // TODO: Clear Auth state
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">C</div>
          <h2 className="logo-text">كلاسيفايدز</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.name}</span>
              {isActive && <div className="active-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>تسجيل خروج</span>
        </button>
      </div>

      <style jsx="true">{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background-color: var(--white);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          right: 0;
          top: 0;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-backdrop {
          display: none;
        }

        .sidebar-header {
          padding: 32px 24px 24px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--primary-color), #00A3FF);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 1.2rem;
          box-shadow: var(--shadow-primary);
        }

        .logo-text {
          font-size: 1.5rem;
          margin-bottom: 0;
          background: linear-gradient(to right, var(--primary-color), var(--text-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          color: var(--text-gray);
          font-weight: 600;
          position: relative;
          overflow: hidden;
        }

        .nav-link:hover {
          background-color: var(--secondary-color);
          color: var(--text-dark);
        }

        .nav-link.active {
          background-color: var(--primary-light);
          color: var(--primary-color);
        }

        .nav-icon {
          transition: transform 0.3s ease;
        }

        .nav-link:hover .nav-icon {
          transform: scale(1.1);
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background-color: var(--primary-color);
          border-radius: 4px 0 0 4px;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: transparent;
          border: none;
          color: var(--danger-color);
          font-weight: 700;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: var(--transition);
        }

        .logout-btn:hover {
          background-color: rgba(229, 57, 53, 0.05);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(100%);
          }
          
          .sidebar.open {
            transform: translateX(0);
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
          }
          
          .sidebar-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 95;
            backdrop-filter: blur(2px);
          }
        }
      `}</style>
    </aside>
    </>
  );
};
