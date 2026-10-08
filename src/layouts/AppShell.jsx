import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ChevronDown, ExternalLink, LogOut, Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { db } from '../firebase';
import { adminName, signOut } from '../lib/api';
import { NAV_GROUPS, currentItem } from '../nav';
import { Button } from '../ui';

const COLLAPSED_KEY = 'admin.sidebar.collapsed';
const SITE_URL = 'https://sooq-com.com';

/** Unread support messages, kept live from the chat store. */
function useUnreadSupport() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        query(collection(db, 'chats'), where('participants', 'array-contains', 'admin')),
        (snapshot) => {
          let total = 0;
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.users && data.users.admin) total += data.users.admin.unreadCount || 0;
          });
          setCount(total);
        },
        () => setCount(0),
      );
    } catch (error) {
      // The badge is a convenience; the panel works without it
    }
    return () => unsubscribe();
  }, []);
  return count;
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const name = adminName();

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hide-mobile">{name}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="menu-list" role="menu">
          <a className="menu-item" href={SITE_URL} target="_blank" rel="noreferrer" role="menuitem">
            <ExternalLink size={16} />
            فتح الموقع
          </a>
          <div className="menu-sep" />
          <button type="button" className="menu-item danger" onClick={signOut} role="menuitem">
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [drawer, setDrawer] = useState(false);
  const unread = useUnreadSupport();
  const item = currentItem(location.pathname);
  const badges = { inbox: unread };

  // Moving to another page closes the drawer and starts at the top
  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.title = item ? `${item.name} | لوحة سوقكم` : 'لوحة سوقكم';
  }, [item]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1');
      return !value;
    });
  };

  return (
    <div className={`shell${collapsed ? ' is-collapsed' : ''}${drawer ? ' is-drawer-open' : ''}`}>
      <div className="sidebar-backdrop" onClick={() => setDrawer(false)} />

      <aside className="sidebar" aria-label="القائمة الرئيسية">
        <div className="sidebar-brand">
          <img src="/logo192.png" alt="" />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">سوقكم</div>
            <div className="sidebar-brand-sub">لوحة الإدارة</div>
          </div>
        </div>

        <nav className="sidebar-scroll">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((link) => {
                const count = link.badge ? badges[link.badge] : 0;
                return (
                  <NavLink key={link.path} to={link.path} end={!!link.exact} title={link.name} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <link.icon size={18} />
                    <span className="nav-link-label">{link.name}</span>
                    {count > 0 && <span className="nav-badge">{count > 99 ? '99+' : count}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Button variant="ghost" block icon={LogOut} onClick={signOut}>
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <Button variant="ghost" icon={Menu} className="only-mobile" onClick={() => setDrawer(true)} aria-label="فتح القائمة" />
          <Button
            variant="ghost"
            icon={collapsed ? PanelRightOpen : PanelRightClose}
            className="only-desktop"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'توسيع القائمة' : 'طيّ القائمة'}
          />
          <div className="topbar-title">
            {item && <div className="topbar-crumb">{item.group}</div>}
            <strong className="truncate">{item ? item.name : 'لوحة الإدارة'}</strong>
          </div>
          <div className="topbar-actions">
            <UserMenu />
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
