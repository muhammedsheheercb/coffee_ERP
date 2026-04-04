"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    TruckIcon, Briefcase, LogOut, ChevronLeft, ChevronRight,
    ReceiptText, Receipt, Undo2, Ban, ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
    { href: "/items", label: "Items", icon: Package, permission: "items" },
    { href: "/customers", label: "Customers", icon: Users, permission: "customers" },
    { href: "/sales", label: "Sales", icon: ReceiptText, permission: "sales" },
    { href: "/purchases", label: "Purchases", icon: ShoppingCart, permission: "purchases" },
    { href: "/expenses", label: "Expenses", icon: Receipt, permission: "expenses" },
    { href: "/suppliers", label: "Suppliers", icon: TruckIcon, permission: "suppliers" },
    { href: "/sales-returns", label: "Sales Returns", icon: Undo2, permission: "sales_returns" },
    { href: "/damaged-items", label: "Damaged Items", icon: Ban, permission: "damaged_items" },
    { href: "/users", label: "Users", icon: ShieldCheck, role: "admin" },
];

export default function Sidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const userRole = (session?.user?.role || "").toLowerCase();
    const permissions = session?.user?.permissions || {};
    const isAuthenticated = status === "authenticated";
    const isAuthenticating = status === "loading";

    const filteredNavItems = navItems.filter(item => {
        // While loading session, show typical modules to avoid a jarring empty sidebar
        if (isAuthenticating) return true;

        // If explicitly unauthenticated, hide everything
        if (status === "unauthenticated") return false;

        // Admins see EVERYTHING - no exceptions
        if (userRole === "admin") return true;

        // Dashboard is the landing zone - always visible for all authenticated users
        if (item.permission === "dashboard") return true;

        // Check module-specific permissions
        if (item.permission) {
            const p = (permissions as any)?.[item.permission];
            
            // Handle new object-based permissions (viewing requires any of the actions to be true)
            if (p && typeof p === 'object') {
                return p.view === true || p.create === true || p.edit === true || p.delete === true;
            }

            // Fallback for legacy boolean permissions (ticked = viewable)
            if (p === true) return true;
        }

        return false;
    });


    const w = collapsed ? 64 : 240;

    return (
        <aside style={{ position: "relative", width: w, minWidth: w, height: "100vh", background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", transition: "width 0.2s" }}>
            {/* logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "20px 0" : "20px 16px", borderBottom: "1px solid #e5e7eb", justifyContent: collapsed ? "center" : "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={16} color="#fff" />
                </div>
                {!collapsed && <span style={{ fontWeight: 700, fontSize: 15, color: "#111827", whiteSpace: "nowrap" }}>ERP System</span>}
            </div>

            {/* nav */}
            <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
                {filteredNavItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href} title={collapsed ? label : undefined}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 0" : "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", justifyContent: collapsed ? "center" : "flex-start", background: active ? "#eef2ff" : "transparent", color: active ? "#6366f1" : "#4b5563", transition: "background 0.15s" }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                            <Icon size={18} style={{ flexShrink: 0 }} />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* logout */}
            <div style={{ padding: "8px 8px 16px" }}>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                    title={collapsed ? "Logout" : undefined}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 0" : "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "none", background: "transparent", color: "#6b7280", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
                >
                    <LogOut size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>

            {/* collapse toggle */}
            <button onClick={() => setCollapsed(p => !p)}
                style={{ position: "absolute", right: -12, top: 72, width: 24, height: 24, borderRadius: "50%", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", zIndex: 10 }}
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </aside>
    );
}