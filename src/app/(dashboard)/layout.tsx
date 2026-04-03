"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // render immediately — don't wait for loading state
    // proxy.ts already protects the route so unauthenticated users never reach here
    if (!session && status !== "loading") return null;

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#f9fafb",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <Sidebar />
            <main
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px",
                }}
            >
                {children}
            </main>
        </div>
    );
}