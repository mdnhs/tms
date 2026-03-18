"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Customer,
  Product,
  Order,
  OrderStatus,
  ShopSettings,
  OrderHistoryEntry,
  OrderHistoryAction,
} from "@/types";
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";
import { invalidationMap } from "@/lib/query-keys";

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Tailoring Shop",
  shopNameBn: "টেইলারিং শপ",
  shopAddress: "",
  shopPhone: "",
  shopLogo: "",
  currency: "৳",
  invoicePrefix: "INV-",
  defaultAdvancePercent: 50,
  enableSMS: false,
  enablePrintAutoOpen: false,
  smsApiKey: "",
  smsSenderId: "",
  smsBalanceThreshold: 50,
};

interface StaffMember {
  id: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

interface DataContextType {
  isLoggedIn: boolean;
  authLoading: boolean;
  dataLoading: boolean;
  userType: "owner" | "staff" | null;
  staffId: string | null;
  staffPermissions: string[];
  loginWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<Customer>;
  updateCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  orders: Order[];
  addOrder: (o: Omit<Order, "id" | "createdAt">) => Promise<Order>;
  updateOrder: (o: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  orderHistory: OrderHistoryEntry[];
  addOrderHistory: (
    orderId: string,
    action: OrderHistoryAction,
    description: string,
    changes?: Record<string, { from: string; to: string }>,
  ) => Promise<void>;
  getOrderHistory: (orderId: string) => OrderHistoryEntry[];
  getCustomer: (id: string) => Customer | undefined;
  getProduct: (id: string) => Product | undefined;
  getOrder: (id: string) => Order | undefined;
  settings: ShopSettings;
  updateSettings: (s: ShopSettings) => Promise<void>;
  categories: string[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  readNotifications: Set<string>;
  markNotificationRead: (key: string) => void;
  markAllNotificationsRead: () => void;
  unmarkNotificationRead: (key: string) => void;
  hasMenuPermission: (menuKey: string) => boolean;
  hasActionPermission: (
    menuKey: string,
    action: "view" | "edit" | "delete",
  ) => boolean;
  staffList: StaffMember[];
  getStaffName: (id: string) => string | undefined;
  notificationCounts: {
    pending: number;
    due: number;
    ready: number;
  };
  reloadData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadNotifications(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const d = localStorage.getItem("pos_read_notifications");
    return d ? new Set(JSON.parse(d)) : new Set();
  } catch {
    return new Set();
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (...scopes: (keyof typeof invalidationMap)[]) => {
      const seen = new Set<string>();
      for (const scope of scopes) {
        for (const key of invalidationMap[scope]) {
          const k = JSON.stringify(key);
          if (!seen.has(k)) {
            seen.add(k);
            queryClient.invalidateQueries({
              queryKey: key as unknown as string[],
            });
          }
        }
      }
    },
    [queryClient],
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<string[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);
  const [readNotifications, setReadNotifications] =
    useState<Set<string>>(loadNotifications);
  const [userType, setUserType] = useState<"owner" | "staff" | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);
  const [staffPermissionsObj, setStaffPermissionsObj] = useState<Record<
    string,
    string[]
  > | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [notificationCounts, setNotificationCounts] = useState({
    pending: 0,
    due: 0,
    ready: 0,
  });

  const isLoggedIn = !!session.data?.user;
  const loadedRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      const shellData = await apiFetch("/api/app-shell-data");
      setUserType(shellData.userType || "owner");
      setStaffId(shellData.staffId || null);
      setStaffName(shellData.staffName || null);
      setStaffList(shellData.staffList || []);
      setSettings(shellData.settings || DEFAULT_SETTINGS);
      setNotificationCounts(
        shellData.notificationCounts || { pending: 0, due: 0, ready: 0 },
      );

      const perms = shellData.staffPermissions || {};
      if (typeof perms === "object" && !Array.isArray(perms)) {
        setStaffPermissions(Object.keys(perms));
        setStaffPermissionsObj(perms);
      } else if (Array.isArray(perms)) {
        setStaffPermissions(perms);
        setStaffPermissionsObj(null);
      } else {
        setStaffPermissions([]);
        setStaffPermissionsObj(null);
      }
    } catch (error) {
      console.error("Error loading app shell data:", error);
      setUserType("owner");
      setStaffId(null);
      setStaffName(null);
      setStaffList([]);
      setStaffPermissions([]);
      setStaffPermissionsObj(null);
      setSettings(DEFAULT_SETTINGS);
      setNotificationCounts({ pending: 0, due: 0, ready: 0 });
      setCustomers([]);
      setProducts([]);
      setOrders([]);
      setOrderHistory([]);
      setCategories([]);
    } finally {
      loadedRef.current = userId;
      setDataLoading(false);
    }
  }, []);

  // Load all data when user logs in
  useEffect(() => {
    if (session.isPending) return;
    const userId = session.data?.user?.id;
    if (!userId) {
      setUserType(null);
      setStaffId(null);
      setStaffPermissions([]);
      setStaffList([]);
      setCustomers([]);
      setProducts([]);
      setOrders([]);
      setOrderHistory([]);
      setSettings(DEFAULT_SETTINGS);
      setCategories([]);
      setNotificationCounts({ pending: 0, due: 0, ready: 0 });
      setDataLoading(false);
      setAuthLoading(false);
      loadedRef.current = null;
      return;
    }
    if (loadedRef.current === userId) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(false);
    void loadUserData(userId);
  }, [loadUserData, session.data?.user?.id, session.isPending]);

  // Persist notifications to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pos_read_notifications",
        JSON.stringify([...readNotifications]),
      );
    }
  }, [readNotifications]);

  const hasMenuPermission = useCallback(
    (menuKey: string): boolean => {
      if (userType === "owner") return true;
      if (userType === "staff") return staffPermissions.includes(menuKey);
      return true;
    },
    [userType, staffPermissions],
  );

  const hasActionPermission = useCallback(
    (menuKey: string, action: "view" | "edit" | "delete"): boolean => {
      if (userType === "owner") return true;
      if (userType === "staff") {
        if (staffPermissionsObj) {
          const actions = staffPermissionsObj[menuKey];
          return Array.isArray(actions) && actions.includes(action);
        }
        return staffPermissions.includes(menuKey);
      }
      return true;
    },
    [userType, staffPermissions, staffPermissionsObj],
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn.email({ email, password });
        if (result.error)
          return { success: false, error: result.error.message };
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
      }
    },
    [],
  );

  const signupWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const result = await signUp.email({
          email,
          password,
          name: fullName || "",
        });
        if (result.error)
          return { success: false, error: result.error.message };
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut();
    setUserType(null);
    setStaffId(null);
    setStaffPermissions([]);
    setStaffList([]);
    setCustomers([]);
    setProducts([]);
    setOrders([]);
    setOrderHistory([]);
    setSettings(DEFAULT_SETTINGS);
    setCategories([]);
    setNotificationCounts({ pending: 0, due: 0, ready: 0 });
    setDataLoading(false);
    setAuthLoading(false);
    loadedRef.current = null;
  }, []);

  // Customers
  const addCustomer = useCallback(
    async (c: Omit<Customer, "id" | "createdAt">) => {
      const id = genId();
      const createdAt = new Date().toISOString();
      const newC: Customer = { ...c, id, createdAt };
      setCustomers((prev) => [newC, ...prev]);
      try {
        const data = await apiFetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newC),
        });
        invalidate("customer");
        return data.customer as Customer;
      } catch {
        setCustomers((prev) => prev.filter((x) => x.id !== id));
        throw new Error("Failed to save customer");
      }
    },
    [invalidate],
  );

  const updateCustomer = useCallback(
    async (c: Customer) => {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? c : x)));
      await apiFetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      invalidate("customer");
    },
    [invalidate],
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      setCustomers((prev) => prev.filter((x) => x.id !== id));
      await apiFetch(`/api/customers?id=${id}`, { method: "DELETE" });
      invalidate("customer");
    },
    [invalidate],
  );

  // Products
  const addProduct = useCallback(
    async (p: Omit<Product, "id">) => {
      const id = genId();
      const newP: Product = { ...p, id };
      setProducts((prev) => [newP, ...prev]);
      try {
        const data = await apiFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newP),
        });
        invalidate("product");
        return data.product as Product;
      } catch {
        setProducts((prev) => prev.filter((x) => x.id !== id));
        throw new Error("Failed to save product");
      }
    },
    [invalidate],
  );

  const updateProduct = useCallback(
    async (p: Product) => {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      await apiFetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      invalidate("product");
    },
    [invalidate],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setProducts((prev) => prev.filter((x) => x.id !== id));
      await apiFetch(`/api/products?id=${id}`, { method: "DELETE" });
      invalidate("product");
    },
    [invalidate],
  );

  // Order history helper
  const addOrderHistory = useCallback(
    async (
      orderId: string,
      action: OrderHistoryAction,
      description: string,
      changes?: Record<string, { from: string; to: string }>,
    ) => {
      const performedBy =
        userType === "staff"
          ? staffName || "Staff"
          : userType === "owner"
            ? "Owner"
            : undefined;
      const entry: OrderHistoryEntry = {
        id: genId(),
        orderId,
        action,
        description,
        performedBy,
        changes,
        timestamp: new Date().toISOString(),
      };
      setOrderHistory((prev) => [entry, ...prev]);
      try {
        await apiFetch("/api/order-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      } catch {
        // Keep local history optimistic even if audit logging fails.
      }
    },
    [userType, staffName],
  );

  const getOrderHistory = useCallback(
    (orderId: string) => orderHistory.filter((h) => h.orderId === orderId),
    [orderHistory],
  );

  // Orders
  const addOrder = useCallback(
    async (o: Omit<Order, "id" | "createdAt">) => {
      const id = genId();
      const createdAt = new Date().toISOString();
      const newO: Order = { ...o, id, createdAt };
      setOrders((prev) => [newO, ...prev]);
      try {
        const data = await apiFetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newO),
        });
        await addOrderHistory(newO.id, "created", "অর্ডার তৈরি করা হয়েছে");
        invalidate("order");
        return data.order as Order;
      } catch {
        setOrders((prev) => prev.filter((x) => x.id !== id));
        throw new Error("Failed to save order");
      }
    },
    [addOrderHistory, invalidate],
  );

  const updateOrder = useCallback(
    async (o: Order) => {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)));
      await apiFetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(o),
      });
      invalidate("order");
    },
    [invalidate],
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      const old = orders.find((x) => x.id === id);
      setOrders((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status } : x)),
      );
      if (old) {
        await apiFetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...old, status }),
        });
        await addOrderHistory(id, "status_changed", "স্ট্যাটাস পরিবর্তন", {
          status: { from: old.status, to: status },
        });
        invalidate("order");
      }
    },
    [orders, addOrderHistory, invalidate],
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      await addOrderHistory(id, "deleted", "অর্ডার মুছে ফেলা হয়েছে");
      setOrders((prev) => prev.filter((x) => x.id !== id));
      await apiFetch(`/api/orders?id=${id}`, { method: "DELETE" });
      invalidate("order");
    },
    [addOrderHistory, invalidate],
  );

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  );
  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );
  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  // Settings
  const updateSettings = useCallback(
    async (s: ShopSettings) => {
      setSettings(s);
      await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      invalidate("settings");
    },
    [invalidate],
  );

  // Categories
  const addCategory = useCallback(
    async (name: string) => {
      setCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
      await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      invalidate("category");
    },
    [invalidate],
  );

  const updateCategory = useCallback(
    async (oldName: string, newName: string) => {
      setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
      await apiFetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      invalidate("category");
    },
    [invalidate],
  );

  const deleteCategory = useCallback(
    async (name: string) => {
      setCategories((prev) => prev.filter((c) => c !== name));
      await apiFetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      invalidate("category");
    },
    [invalidate],
  );

  // Notifications (stays in localStorage)
  const markNotificationRead = useCallback((key: string) => {
    setReadNotifications((prev) => new Set([...prev, key]));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setReadNotifications(new Set(["pending", "due", "ready"]));
  }, []);

  const unmarkNotificationRead = useCallback((key: string) => {
    setReadNotifications((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const getStaffName = useCallback(
    (id: string) => staffList.find((s) => s.id === id)?.name,
    [staffList],
  );

  return (
    <DataContext.Provider
      value={{
        isLoggedIn,
        authLoading,
        dataLoading,
        userType,
        staffId,
        staffPermissions,
        hasMenuPermission,
        hasActionPermission,
        loginWithEmail,
        signupWithEmail,
        logout,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        orderHistory,
        addOrderHistory,
        getOrderHistory,
        getCustomer,
        getProduct,
        getOrder,
        settings,
        updateSettings,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        readNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        unmarkNotificationRead,
        staffList,
        getStaffName,
        notificationCounts,
        reloadData: async () => {
          const userId = session.data?.user?.id;
          if (!userId) return;
          await loadUserData(userId);
        },
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
