import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Users, UserCheck, Wrench,
  CreditCard, Star, Crown, Megaphone, BarChart3, Map,
  ScrollText, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/bookings',      label: 'Bookings',       icon: ShoppingBag     },
  { to: '/users',         label: 'Users',          icon: Users           },
  { to: '/providers',     label: 'Providers',      icon: UserCheck       },
  { to: '/services',      label: 'Services',       icon: Wrench          },
  { to: '/payments',      label: 'Payments',       icon: CreditCard      },
  { to: '/reviews',       label: 'Reviews',        icon: Star            },
  { to: '/subscriptions', label: 'Subscriptions',  icon: Crown           },
  { to: '/announcements', label: 'Announcements',  icon: Megaphone       },
  { to: '/analytics',     label: 'Analytics',      icon: BarChart3       },
  { to: '/map',           label: 'Map View',       icon: Map             },
  { to: '/logs',          label: 'Audit Logs',     icon: ScrollText      },
];

const STORAGE_KEY = 'sidebar_collapsed';

interface SidebarProps {
  /** Mobile open state — when true, sidebar slides over as overlay */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ mobileOpen = false, onMobileClose, isMobile = false }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch { /* noop */ }
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // On mobile the sidebar is always "expanded" inside the drawer.
  const expanded = isMobile ? true : !collapsed;
  const width = expanded ? 220 : 64;

  const baseSidebarStyle: React.CSSProperties = {
    flexShrink: 0,
    background: 'rgba(255, 255, 255, 0.82)',
    backdropFilter: 'blur(24px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
    borderRight: '1px solid rgba(37, 99, 235, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'visible',
    position: isMobile ? 'fixed' : 'sticky',
    top: 0,
    left: 0,
    zIndex: isMobile ? 50 : 2,
    boxShadow: isMobile ? '8px 0 32px rgba(0,0,0,0.5)' : undefined,
  };

  // Hide the sticky desktop sidebar on mobile.
  if (isMobile && !mobileOpen) {
    return null;
  }

  return (
    <motion.aside
      initial={isMobile ? { x: -260, opacity: 0 } : false}
      animate={{ width, x: 0, opacity: 1 }}
      exit={isMobile ? { x: -260, opacity: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={baseSidebarStyle}
    >
      {/* Toggle tab — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute',
            top: 22,
            right: -12,
            width: 22,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(37, 99, 235, 0.30)',
            borderLeft: 'none',
            color: 'var(--amber)',
            borderRadius: '0 8px 8px 0',
            cursor: 'pointer',
            zIndex: 4,
            padding: 0,
            boxShadow: '4px 0 12px rgba(0,0,0,0.35)',
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Logo */}
      <div style={{
        padding: expanded ? '24px 20px 20px' : '24px 0 20px',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: expanded ? 'flex-start' : 'center',
        minHeight: 72,
      }}>
        {expanded ? (
          <>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}>
              7STAR<span style={{ color: 'var(--amber)' }}>/</span>
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--muted)',
              fontFamily: 'var(--mono)',
              marginTop: '2px',
              letterSpacing: '0.1em',
            }}>
              ADMIN PANEL
            </div>
          </>
        ) : (
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--amber)',
            lineHeight: 1,
          }}>
            7
          </div>
        )}
      </div>

      {/* Nav — overflow-y auto for tall menus, overflow-x visible so tooltips
          can escape the collapsed sidebar.  Spec note: when one axis is auto
          and the other visible, recent browsers (>=2023) actually respect
          visible on the named axis, so tooltips do render outside. */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'visible',
        padding: '12px 0',
        minHeight: 0,
      }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to ||
            (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => isMobile && onMobileClose?.()}
              className="sidebar-tooltip-host"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? '12px' : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '10px 18px' : '10px 0',
                fontSize: '13px',
                fontWeight: 500,
                color: active ? 'var(--amber)' : 'var(--muted)',
                background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {/* Animated active indicator (left border line) — shared layout */}
              {active && (
                <motion.span
                  layoutId="activeIndicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    bottom: 4,
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--amber)',
                    boxShadow: '0 0 12px rgba(37,99,235,0.6)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon wrapper with optional active dot when collapsed */}
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={16} />
                {active && !expanded && (
                  <span style={{
                    position: 'absolute',
                    right: -8,
                    top: -2,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--amber)',
                    boxShadow: '0 0 6px var(--amber)',
                  }} />
                )}
              </span>

              <AnimatePresence initial={false} mode="wait">
                {expanded && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Hover tooltip when collapsed */}
              {!expanded && !isMobile && (
                <span className="sidebar-tooltip">{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — logout */}
      <div style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
        <button
          onClick={handleLogout}
          className="sidebar-tooltip-host"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: expanded ? '12px' : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '10px 18px' : '10px 0',
            width: '100%',
            fontSize: '13px',
            fontWeight: 500,
            color: '#f87171',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <LogOut size={16} />
          {expanded && <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>}
          {!expanded && !isMobile && (
            <span className="sidebar-tooltip">Sign Out</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
