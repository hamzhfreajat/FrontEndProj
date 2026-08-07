import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  LayoutDashboard, Tags, FileText, Users, Settings, LogOut, Globe, BellRing,
  Flag, Search, AlertCircle, MapPin, Facebook, MessageSquare, ChevronDown, ChevronUp, PieChart, BarChart2
} from 'lucide-react';

const navGroups = [
  {
    title: 'لوحة القيادة',
    icon: LayoutDashboard,
    items: [
      { path: '/user-analytics', name: 'إحصائيات المستخدمين', icon: Users },
      { path: '/geo-analytics', name: 'تحليلات جغرافية للإعلانات', icon: PieChart },
      { path: '/user-tracking', name: 'تتبع المستخدمين', icon: BarChart2 },
      { path: '/api-hits', name: 'إحصائيات استهلاك الـ API', icon: LayoutDashboard }
    ]
  },
  {
    title: 'الإعلانات والأقسام',
    icon: FileText,
    items: [
      { path: '/ads', name: 'إدارة الإعلانات', icon: FileText },
      { path: '/categories', name: 'الأقسام', icon: Tags },
      { path: '/locations-manager', name: 'إدارة المدن والمناطق', icon: MapPin },
      { path: '/change-ads-location', name: 'تغيير موقع الإعلانات', icon: MapPin }
    ]
  },
  {
    title: 'المستخدمين والتواصل',
    icon: Users,
    items: [
      { path: '/users', name: 'إدارة المستخدمين', icon: Users },
      { path: '/inbox', name: 'البريد الوارد (الدعم)', icon: MessageSquare },
      { path: '/send-notification', name: 'إرسال إشعارات', icon: BellRing },
      { path: '/reports', name: 'البلاغات', icon: Flag }
    ]
  },
  {
    title: 'التكامل والسحب',
    icon: Globe,
    items: [
      { path: '/saved-groups', name: 'رابط فيسبوك', icon: Globe },
      { path: '/facebook-autopost', name: 'نشر فيسبوك', icon: Facebook },
      { path: '/scraping-logs', name: 'سجل السحب', icon: Globe }
    ]
  },
  {
    title: 'النظام',
    icon: Settings,
    items: [
      { path: '/searches', name: 'عمليات البحث', icon: Search },
      { path: '/errors', name: 'سجل الأخطاء', icon: AlertCircle },
      { path: '/settings', name: 'الإعدادات', icon: Settings },
      { path: '/app-settings', name: 'إعدادات التطبيق', icon: Settings }
    ]
  }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalUnread, setTotalUnread] = useState(0);
  const [openGroups, setOpenGroups] = useState({ 'لوحة القيادة': true }); // Default open first group

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', 'admin')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.users && data.users['admin']) {
          count += (data.users['admin'].unreadCount || 0);
        }
      });
      setTotalUnread(count);
    });

    return () => unsubscribe();
  }, []);

  // Auto-open group based on current path
  useEffect(() => {
    navGroups.forEach(group => {
      if (group.items.some(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))) {
        setOpenGroups(prev => ({ ...prev, [group.title]: true }));
      }
    });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
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
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupOpen = openGroups[group.title];
            
            return (
              <div key={group.title} className="nav-group">
                <div 
                  className={`nav-group-header ${isGroupOpen ? 'open' : ''}`}
                  onClick={() => toggleGroup(group.title)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GroupIcon size={20} className="group-icon" />
                    <span>{group.title}</span>
                  </div>
                  {isGroupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {isGroupOpen && (
                  <div className="nav-group-items">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                      const ItemIcon = item.icon;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`nav-item-link ${isActive ? 'active' : ''}`}
                        >
                          <ItemIcon size={18} className="item-icon" />
                          <span>{item.name}</span>
                          {item.path === '/inbox' && totalUnread > 0 && (
                            <span className="sidebar-badge">{totalUnread}</span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
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
            background-color: #1a1e27; /* Darker theme like the image */
            border-left: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            position: fixed;
            right: 0;
            top: 0;
            z-index: 100;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #d1d5db;
          }
          
          .sidebar-backdrop {
            display: none;
          }

          .sidebar-header {
            padding: 32px 24px 24px;
            background-color: #151821;
          }

          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #00A3FF);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 1.2rem;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
          }

          .logo-text {
            font-size: 1.5rem;
            margin-bottom: 0;
            color: #fff;
            font-weight: bold;
          }

          .sidebar-nav {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-nav::-webkit-scrollbar-thumb {
            background-color: #374151;
            border-radius: 10px;
          }

          .nav-group {
            border-bottom: 1px solid rgba(255,255,255,0.02);
          }

          .nav-group-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
            color: #9ca3af;
          }

          .nav-group-header:hover {
            background-color: rgba(255, 255, 255, 0.03);
            color: #fff;
          }
          
          .nav-group-header.open {
            color: #3b82f6; /* Highlight when open */
          }

          .group-icon {
            opacity: 0.8;
          }

          .nav-group-items {
            background-color: #13161c; /* Slightly darker for submenu */
            padding: 8px 0;
          }

          .nav-item-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 24px 12px 48px; /* Indented padding */
            color: #9ca3af;
            font-weight: 500;
            font-size: 0.95rem;
            text-decoration: none;
            transition: all 0.2s ease;
            position: relative;
          }

          .nav-item-link:hover {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.03);
          }

          .nav-item-link.active {
            color: #3b82f6;
          }

          .nav-item-link.active::before {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background-color: #3b82f6;
          }

          .sidebar-badge {
            background-color: #ef4444;
            color: white;
            font-size: 0.75rem;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 12px;
            margin-right: auto;
          }

          .sidebar-footer {
            padding: 24px;
            background-color: #151821;
          }

          .logout-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            font-weight: 600;
            cursor: pointer;
            border-radius: var(--radius-md);
            transition: all 0.2s ease;
          }

          .logout-btn:hover {
            background: rgba(239, 68, 68, 0.2);
          }

          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(100%);
            }
            
            .sidebar.open {
              transform: translateX(0);
              box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
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
