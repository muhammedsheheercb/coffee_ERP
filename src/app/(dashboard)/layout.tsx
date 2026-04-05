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
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 w-full min-w-0">
                {children}
            </main>
        </div>
    );
}