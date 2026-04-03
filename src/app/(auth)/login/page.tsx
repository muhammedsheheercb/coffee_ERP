"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();
    const [showPwd, setShowPwd] = useState(false);
    const [authError, setAuthError] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (status === "authenticated") router.replace("/");
    }, [status, router]);

    if (status === "loading") return null;

    const onSubmit = async (data: FormData) => {
        setAuthError("");
        const res = await signIn("credentials", {
            email: data.email, password: data.password, redirect: false,
        });
        if (res?.error) setAuthError("Invalid email or password");
        else { router.push("/"); router.refresh(); }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter, sans-serif" }}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes blob1 { 0%,100%{border-radius:60% 40% 70% 30%/50% 60% 40% 50%} 50%{border-radius:40% 60% 30% 70%/60% 40% 60% 40%} }
        @keyframes blob2 { 0%,100%{border-radius:40% 60% 50% 50%/60% 30% 70% 40%} 50%{border-radius:60% 40% 70% 30%/40% 70% 30% 60%} }
        * { box-sizing: border-box; }
      `}</style>

            <div style={{ display: "flex", width: "100%", maxWidth: 900, minHeight: 580, borderRadius: 32, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.14)" }}>

                {/* ── LEFT PANEL ─────────────────────────────── */}
                <motion.div
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }}
                    className="left-panel"
                >
                    {/* top blob */}
                    <div style={{ position: "absolute", top: -60, left: -60, width: 280, height: 220, background: "#F5A623", opacity: 0.15, animation: "blob1 8s ease-in-out infinite", borderRadius: "60% 40% 70% 30%/50% 60% 40% 50%" }} />
                    {/* bottom blob */}
                    <div style={{ position: "absolute", bottom: -80, right: -40, width: 240, height: 200, background: "#F5A623", opacity: 0.12, animation: "blob2 10s ease-in-out infinite", borderRadius: "40% 60% 50% 50%/60% 30% 70% 40%" }} />

                    {/* big yellow brush stroke + illustration */}
                    <div style={{ position: "relative", marginBottom: 40 }}>
                        {/* brush stroke */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            style={{ width: 240, height: 130, background: "#F5A623", borderRadius: "40% 60% 55% 45%/45% 50% 60% 55%", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                        />
                        {/* illustration — warehouse/boxes SVG */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: "relative", zIndex: 2 }}
                        >
                            <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* building */}
                                <rect x="20" y="50" width="120" height="80" rx="4" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
                                <rect x="20" y="50" width="120" height="20" rx="4" fill="#6366f1" />
                                {/* door */}
                                <rect x="65" y="90" width="30" height="40" rx="3" fill="#6366f1" opacity="0.3" />
                                <rect x="65" y="90" width="30" height="40" rx="3" stroke="#6366f1" strokeWidth="1.5" />
                                {/* windows */}
                                <rect x="30" y="80" width="20" height="16" rx="2" fill="#eef2ff" stroke="#6366f1" strokeWidth="1" />
                                <rect x="110" y="80" width="20" height="16" rx="2" fill="#eef2ff" stroke="#6366f1" strokeWidth="1" />
                                {/* boxes */}
                                <rect x="28" y="108" width="22" height="22" rx="2" fill="#F5A623" />
                                <rect x="110" y="108" width="22" height="22" rx="2" fill="#F5A623" />
                                <line x1="39" y1="108" x2="39" y2="130" stroke="#fff" strokeWidth="1" opacity="0.5" />
                                <line x1="28" y1="119" x2="50" y2="119" stroke="#fff" strokeWidth="1" opacity="0.5" />
                                <line x1="121" y1="108" x2="121" y2="130" stroke="#fff" strokeWidth="1" opacity="0.5" />
                                <line x1="110" y1="119" x2="132" y2="119" stroke="#fff" strokeWidth="1" opacity="0.5" />
                                {/* roof triangle */}
                                <path d="M10 52 L80 10 L150 52" stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round" />
                                {/* chart bars */}
                                <rect x="72" y="60" width="6" height="8" rx="1" fill="rgba(255,255,255,0.6)" />
                                <rect x="80" y="56" width="6" height="12" rx="1" fill="rgba(255,255,255,0.9)" />
                                <rect x="88" y="58" width="6" height="10" rx="1" fill="rgba(255,255,255,0.7)" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        style={{ textAlign: "center", position: "relative", zIndex: 2 }}
                    >
                        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                            Welcome to <span style={{ color: "#F5A623" }}>ERP</span>
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                            Manage your business<br />operations seamlessly
                        </p>
                    </motion.div>

                    {/* arrow cta */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}
                    >
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>Unlock your business</span>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ArrowRight size={16} color="#fff" />
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── RIGHT PANEL ────────────────────────────── */}
                <motion.div
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ flex: 1, background: "#F5A623", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden" }}
                >
                    {/* decorative blobs on right panel */}
                    <div style={{ position: "absolute", bottom: -80, left: -60, width: 280, height: 200, background: "#fff", opacity: 0.12, animation: "blob1 9s ease-in-out infinite", borderRadius: "60% 40% 70% 30%/50% 60% 40% 50%" }} />
                    <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 180, background: "#fff", opacity: 0.1, animation: "blob2 11s ease-in-out infinite" }} />

                    {/* ERP icons top right */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ position: "absolute", top: 32, right: 36, opacity: 0.9 }}
                    >
                        <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
                            <rect x="2" y="18" width="28" height="28" rx="4" fill="#fff" opacity="0.3" />
                            <rect x="8" y="10" width="22" height="22" rx="4" fill="#fff" opacity="0.5" />
                            <rect x="14" y="2" width="18" height="18" rx="4" fill="#fff" opacity="0.8" />
                            <rect x="36" y="22" width="20" height="20" rx="10" fill="#fff" opacity="0.4" />
                            <line x1="46" y1="28" x2="46" y2="36" stroke="#F5A623" strokeWidth="2" />
                            <line x1="42" y1="32" x2="50" y2="32" stroke="#F5A623" strokeWidth="2" />
                        </svg>
                    </motion.div>

                    {/* heading */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        style={{ marginBottom: 32, position: "relative", zIndex: 2 }}
                    >
                        <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Welcome!</h1>
                        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Sign in to continue</p>
                    </motion.div>

                    {/* form */}
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>

                        {/* email */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 50, padding: "0 20px", height: 52, boxShadow: focused === "email" ? "0 0 0 3px rgba(255,255,255,0.5)" : "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s" }}>
                                <Mail size={16} color="#9ca3af" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    {...register("email")}
                                    onFocus={() => setFocused("email")}
                                    onBlur={() => setFocused(null)}
                                    style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111827", background: "transparent" }}
                                />
                            </div>
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        style={{ margin: "6px 0 0 16px", fontSize: 12, color: "#fff", fontWeight: 500 }}>
                                        {errors.email.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* password */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 50, padding: "0 20px", height: 52, boxShadow: focused === "password" ? "0 0 0 3px rgba(255,255,255,0.5)" : "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s" }}>
                                <Lock size={16} color="#9ca3af" />
                                <input
                                    type={showPwd ? "text" : "password"}
                                    placeholder="Password"
                                    {...register("password")}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused(null)}
                                    style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111827", background: "transparent" }}
                                />
                                <button type="button" onClick={() => setShowPwd(p => !p)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <AnimatePresence>
                                {errors.password && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        style={{ margin: "6px 0 0 16px", fontSize: 12, color: "#fff", fontWeight: 500 }}>
                                        {errors.password.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* auth error */}
                        <AnimatePresence>
                            {authError && (
                                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 16px", fontSize: 13, color: "#fff", fontWeight: 500, backdropFilter: "blur(4px)" }}>
                                    ⚠ {authError}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* submit */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65, duration: 0.4 }}
                            style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                                style={{ width: 56, height: 56, borderRadius: "50%", background: "#111827", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
                            >
                                {isSubmitting ? (
                                    <svg style={{ animation: "spin 0.8s linear infinite" }} width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                                        <path d="M10 2 a8 8 0 0 1 8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    </svg>
                                ) : (
                                    <ArrowRight size={22} color="#fff" />
                                )}
                            </motion.button>
                        </motion.div>
                    </form>

                    {/* terms */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 2 }}
                    >
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid rgba(255,255,255,0.7)", background: "transparent", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>I agree with Terms &amp; Conditions</span>
                    </motion.div>
                </motion.div>
            </div>

            {/* mobile responsive */}
            <style>{`
        @media (max-width: 640px) {
          .left-panel { display: none !important; }
        }
      `}</style>
        </div>
    );
}