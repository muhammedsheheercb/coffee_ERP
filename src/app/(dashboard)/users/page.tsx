"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IUser, IUserPermissions, IActionPermission } from "@/types";
import { 
    Users, Mail, Shield, Plus, Edit2, Trash2, 
    LayoutDashboard, Package, ShoppingCart, 
    TruckIcon, Receipt, ReceiptText, Undo2, Ban, PieChart,
    Eye, EyeOff
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";

const PAGES = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "items", label: "Items", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "suppliers", label: "Suppliers", icon: TruckIcon },
    { id: "sales", label: "Sales", icon: ReceiptText },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "sales_returns", label: "Sales Returns", icon: Undo2 },
    { id: "damaged_items", label: "Damaged Items", icon: Ban },
    { id: "users", label: "Users", icon: Shield },
];

export default function UsersPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.users;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const initialPermissions = PAGES.reduce((acc, page) => ({
        ...acc,
        [page.id]: { view: false, create: false, edit: false, delete: false }
    }), {} as IUserPermissions);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff" as "admin" | "staff",
        permissions: initialPermissions
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setUsers(data.data);
            } else {
                setUsers([]);
                if (!data.success) toast.error(data.error || "Failed to fetch users");
            }
        } catch (error) {
            toast.error("Failed to fetch users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.email.includes("@")) return toast.error("Valid email is required");
        if (!editingUser && formData.password.length < 6) return toast.error("Password must be at least 6 characters");
        
        try {
            const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
            const method = editingUser ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingUser ? "User updated" : "User created");
                setModalOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || "Something went wrong");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("User deleted");
                setDeleteId(null);
                fetchUsers();
            }
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="py-20 text-center"><Spinner /></div>;

    return (
        <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
                <TopBar
                    title="User Management"
                    subtitle="Create and manage user roles and permissions"
                    actions={
                        canCreate && (
                            <Button onClick={() => {
                                setEditingUser(null);
                                setFormData({ name: "", email: "", password: "", role: "staff", permissions: initialPermissions });
                                setModalOpen(true);
                            }} icon={<Plus size={18} />}>
                                Add User
                            </Button>
                        )
                    }
                />

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                {user.name ? user.name[0]?.toUpperCase() : (user.email?.[0]?.toUpperCase() || "U")}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name || "N/A"}</div>
                                                <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${(user.role || 'staff') === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                            {(user.role || 'staff')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {canEdit && (
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setFormData({
                                                            name: user.name || "",
                                                            email: user.email,
                                                            password: "",
                                                            role: user.role || "staff",
                                                            permissions: user.permissions || initialPermissions
                                                        });
                                                        setModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => setDeleteId(user._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUser ? "Edit User" : "Add New User"}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                                hint={editingUser ? "Leave blank to keep current password" : ""}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            <input
                                type="checkbox"
                                id="is_admin"
                                checked={formData.role === "admin"}
                                onChange={(e) => setFormData({ ...formData, role: e.target.checked ? "admin" : "staff" })}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="is_admin" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Administrator access
                            </label>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="text-indigo-600" size={20} />
                            Permissions
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {PAGES.map((page) => {
                                const pagePerms = (formData.permissions[page.id] as any) || { view: false, create: false, edit: false, delete: false };
                                const isAllChecked = pagePerms.view && pagePerms.create && pagePerms.edit && pagePerms.delete;
                                const isAnyChecked = pagePerms.view || pagePerms.create || pagePerms.edit || pagePerms.delete;

                                return (
                                    <div key={page.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white group transition-all">
                                        <div className="flex items-center gap-4 mb-3 md:mb-0 cursor-pointer select-none"
                                            onClick={() => {
                                                const newPerms = { ...formData.permissions };
                                                const targetVal = !isAllChecked;
                                                (newPerms as any)[page.id] = { view: targetVal, create: targetVal, edit: targetVal, delete: targetVal };
                                                setFormData({ ...formData, permissions: newPerms });
                                            }}
                                        >
                                            <div className={`p-2 rounded-lg transition-colors ${isAnyChecked ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400 group-hover:bg-gray-300'}`}>
                                                <page.icon size={20} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-800">{page.label}</span>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Module Access</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isAllChecked}
                                                readOnly
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer ml-2"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 md:mt-0">
                                            {["view", "create", "edit", "delete"].map((action) => (
                                                <label key={action} className="flex items-center gap-2 cursor-pointer group/item">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!(formData.permissions[page.id] as any)?.[action]}
                                                        onChange={(e) => {
                                                            const newPerms = { ...formData.permissions };
                                                            const pPerms = (newPerms as any)[page.id] ? { ...(newPerms as any)[page.id] } : { view: false, create: false, edit: false, delete: false };
                                                            (pPerms as any)[action] = e.target.checked;
                                                            (newPerms as any)[page.id] = pPerms;
                                                            setFormData({ ...formData, permissions: newPerms });
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-600 capitalize group-hover/item:text-gray-900 font-medium">
                                                        {action}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-6">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingUser ? "Update User" : "Create User"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmLabel="Delete"
                loading={deleting}
            />
        </main>
    );
}
