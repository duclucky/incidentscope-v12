import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BookOpen, ClockCounterClockwise, DotsThreeCircle, Gear, House, ListMagnifyingGlass, Stack } from "@phosphor-icons/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { WalletControls } from "../wallet/WalletControls";
import { BrandMark } from "./BrandMark";

const primaryNavigation = [
  { to: "/pools", label: "Pools", icon: ListMagnifyingGlass },
  { to: "/dependencies", label: "Dependencies", icon: Stack },
  { to: "/activity", label: "Activity", icon: ClockCounterClockwise },
];
const supportNavigation = [
  { to: "/settings", label: "Settings", icon: Gear },
  { to: "/help", label: "Help", icon: BookOpen },
];

function NavigationLink({ to, label, icon: Icon }: (typeof primaryNavigation)[number]) {
  return (
    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={to}>
      <Icon aria-hidden="true" /><span>{label}</span>
    </NavLink>
  );
}

function MobileMoreNavigation() {
  const pathname = useLocation().pathname;
  const active = supportNavigation.some(({ to }) => pathname === to);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={`nav-link${active ? " active" : ""}`} type="button">
          <DotsThreeCircle aria-hidden="true" /><span>More</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="account-menu mobile-more-menu" align="end" sideOffset={8}>
          {supportNavigation.map(({ to, label, icon: Icon }) => (
            <DropdownMenu.Item key={to} asChild>
              <NavLink className="menu-item" to={to}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </NavLink>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function AppShell() {
  const publicHome = useLocation().pathname === "/";
  return (
    <div className={`app-shell${publicHome ? " public-home" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <BrandMark />
        {publicHome ? (
          <nav className="public-nav" aria-label="Primary navigation">
            <NavLink to="/pools">Pools</NavLink><NavLink to="/help">How it works</NavLink>
          </nav>
        ) : (
          <div className="network-lockup"><span className="status-marker" aria-hidden="true" /><span>Studionet</span></div>
        )}
        <WalletControls />
      </header>
      {!publicHome ? (
        <aside className="sidebar" aria-label="Product navigation">
          <nav>
            <p className="nav-group-label">Workspace</p>
            {primaryNavigation.map((item) => <NavigationLink key={item.to} {...item} />)}
            <p className="nav-group-label support-label">Support</p>
            {supportNavigation.map((item) => <NavigationLink key={item.to} {...item} />)}
          </nav>
          <div className="sidebar-note"><strong>Bounded evidence</strong><span>Official incident scope, not proof of customer downtime.</span></div>
        </aside>
      ) : null}
      <main id="main-content" className="main-content"><Outlet /></main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavigationLink to="/" label="Home" icon={House} />
        {primaryNavigation.map((item) => <NavigationLink key={item.to} {...item} />)}
        <MobileMoreNavigation />
      </nav>
    </div>
  );
}
