import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { OrderItem, OrderMeasurement } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Package,
  ShoppingBag,
  Check,
  User,
  Ruler,
  Wallet,
  Calendar,
  FileText,
  UserCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnterNavigation } from "@/hooks/useEnterNavigation";
import { normalizeBangladeshMobile } from "@/lib/bd-phone";

interface DraftItem {
  productId: string;
  measurements: OrderMeasurement[];
  quantity: number;
  unitPrice: number;
}

const PRODUCT_GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-red-600",
  "from-fuchsia-400 to-pink-600",
  "from-cyan-400 to-sky-600",
  "from-lime-400 to-green-600",
];
function productGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PRODUCT_GRADIENTS[Math.abs(h) % PRODUCT_GRADIENTS.length];
}

export default function CreateOrder() {
  const {
    customers,
    products,
    addCustomer,
    addOrder,
    settings,
    getCustomer: findCustomer,
    staffList,
  } = useData();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const cur = settings.currency;

  const [step, setStep] = useState(1);

  // Step 1
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Step 2
  const [items, setItems] = useState<DraftItem[]>([]);
  const [addSubStep, setAddSubStep] = useState<"select" | "measure">("select");
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentMeasurements, setCurrentMeasurements] = useState<
    OrderMeasurement[]
  >([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentUnitPrice, setCurrentUnitPrice] = useState(0);

  // Step 3
  const [deliveryDate, setDeliveryDate] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [advancePaid, setAdvancePaid] = useState(0);
  const [assignedTo, setAssignedTo] = useState("");

  const newCustomerRef = useRef<HTMLDivElement>(null);
  const measurementsRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const specialNotesRef = useRef<HTMLTextAreaElement>(null);
  useEnterNavigation(newCustomerRef);
  useEnterNavigation(measurementsRef);
  useEnterNavigation(paymentRef);

  useEffect(() => {
    const textarea = specialNotesRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [specialNotes]);

  const currentProduct = useMemo(
    () => products.find((p) => p.id === currentProductId),
    [products, currentProductId],
  );
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const dueAmount = subtotal - advancePaid;
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(customerSearch) || c.phone.includes(customerSearch),
  );

  const pickProduct = (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    setCurrentProductId(pid);
    setCurrentUnitPrice(p.basePrice);
    setCurrentQuantity(1);
    setCurrentMeasurements(
      p.measurementFields.map((f) => ({
        fieldId: f.id,
        fieldName: f.name,
        fieldNameBn: f.nameBn,
        value: "",
      })),
    );
    setAddSubStep("measure");
  };

  const confirmItem = () => {
    if (!currentProductId) return;
    setItems((prev) => [
      ...prev,
      {
        productId: currentProductId,
        measurements: currentMeasurements,
        quantity: currentQuantity,
        unitPrice: currentUnitPrice,
      },
    ]);
    setCurrentProductId("");
    setCurrentMeasurements([]);
    setCurrentQuantity(1);
    setCurrentUnitPrice(0);
    setAddSubStep("select");
  };

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    const normalizedPhone = normalizeBangladeshMobile(newCustomer.phone);
    if (!normalizedPhone) {
      toast({ title: t("invalidBdMobile"), variant: "destructive" });
      return;
    }

    try {
      const c = await addCustomer({ ...newCustomer, phone: normalizedPhone });
      setCustomerId(c.id);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", address: "", notes: "" });
      setStep(2);
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      });
    }
  };

  const sendSmsNotification = async (order: {
    totalPrice: number;
    advancePaid: number;
    dueAmount: number;
    deliveryDate: string;
  }) => {
    const customer = findCustomer(customerId);
    if (!customer || !settings.enableSMS || !settings.smsApiKey) return;
    const productNames = items
      .map(
        (item) => products.find((p) => p.id === item.productId)?.nameBn || "",
      )
      .filter(Boolean)
      .join(", ");
    const message = `প্রিয় ${customer.name}, আপনার অর্ডার (${productNames}) নেওয়া হয়েছে। মোট: ৳${order.totalPrice}, অগ্রিম: ৳${order.advancePaid}, বাকি: ৳${order.dueAmount}। ডেলিভারি: ${order.deliveryDate || "পরে জানানো হবে"}। ধন্যবাদ - ${settings.shopNameBn || settings.shopName}`;
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: customer.phone,
          message,
          apiKey: settings.smsApiKey,
          senderId: settings.smsSenderId,
        }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: t("smsSent"),
        description: `${customer.phone} ${t("smsSuccessDesc")}`,
      });
    } catch {
      toast({
        title: t("smsFailTitle"),
        description: t("smsFailDesc"),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!customerId || items.length === 0) return;
    const orderItems: OrderItem[] = items.map((item) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    }));
    const order = await addOrder({
      customerId,
      items: orderItems,
      totalPrice: subtotal,
      advancePaid,
      dueAmount: Math.max(0, dueAmount),
      deliveryDate,
      specialNotes,
      status: "pending",
      assignedTo: assignedTo || undefined,
    });
    toast({ title: t("orderCreated") });
    sendSmsNotification(order);
    router.push(`/invoice/${order.id}`);
  };

  const STEPS = [
    { label: t("stepCustomer"), icon: User },
    { label: t("stepProduct"), icon: Package },
    { label: t("stepPayment"), icon: Wallet },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {t("createOrderTitle")}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {t("createOrderDesc")}
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = step > i + 1;
          const active = step === i + 1;
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all border-2 ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-none ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${step > i + 1 ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Customer ── */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 md:p-5 space-y-3">
            <h2 className="font-semibold text-sm text-foreground">
              {t("selectCustomer")}
            </h2>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t("searchByNamePhone")}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCustomer((v) => !v);
                  setCustomerSearch("");
                }}
                className="rounded-xl shrink-0 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">
                  {t("newShort")}
                </span>
              </Button>
            </div>

            {/* Add customer inline */}
            {showAddCustomer && (
              <div
                ref={newCustomerRef}
                className="bg-muted/40 rounded-xl border border-border p-4 space-y-3"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("newCustomer")}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("name")} *</Label>
                    <Input
                      placeholder="নাম লিখুন"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer((f) => ({ ...f, name: e.target.value }))
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("phone")} *</Label>
                    <Input
                      placeholder="01XXXXXXXXX"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>
                <Input
                  placeholder={t("address")}
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer((f) => ({ ...f, address: e.target.value }))
                  }
                  className="rounded-xl h-9"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCustomer(false)}
                    className="rounded-xl"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddCustomer}
                    className="rounded-xl bg-gradient-to-r from-primary to-primary/80 flex-1"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />{" "}
                    {t("saveAndSelect")}
                  </Button>
                </div>
              </div>
            )}

            {/* Customer list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {filteredCustomers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {t("noCustomerFound")}
                </p>
              )}
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCustomerId(c.id);
                    setStep(2);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                    customerId === c.id
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      customerId === c.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.phone}
                      {c.address ? ` · ${c.address}` : ""}
                    </p>
                  </div>
                  {customerId === c.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Items ── */}
      {step === 2 && (
        <div className="space-y-3">
          {/* Added items */}
          {items.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> {items.length}{" "}
                  {items.length === 1 ? t("stepProduct") : t("stepProduct")}{" "}
                  Added
                </h3>
                <span className="text-xs font-bold text-primary">
                  {cur}
                  {subtotal.toLocaleString()}
                </span>
              </div>
              {items.map((item, i) => {
                const p = products.find((x) => x.id === item.productId);
                const grad = productGradient(p?.name || "");
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 rounded-xl border border-border"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-[11px] font-bold text-white">
                        {(p?.nameBn || p?.name || "?").charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p?.nameBn || p?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ×{item.quantity} · {cur}
                        {(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Product picker / measurement */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-5 space-y-4">
            {addSubStep === "select" && (
              <>
                <h2 className="font-semibold text-sm text-foreground">
                  {items.length === 0
                    ? t("selectProduct")
                    : t("addAnotherProduct") || "আরেকটি পণ্য যোগ করুন"}
                </h2>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {products.map((p) => {
                    const grad = productGradient(p.name);
                    return (
                      <button
                        key={p.id}
                        onClick={() => pickProduct(p.id)}
                        className="group text-left p-3.5 md:p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all bg-card"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            <span className="text-sm font-bold text-white">
                              {(p.nameBn || p.name).charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground leading-tight truncate">
                              {p.nameBn}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {p.category}
                            </p>
                          </div>
                        </div>
                        <p className="text-primary font-bold text-sm">
                          {cur}
                          {p.basePrice.toLocaleString()}
                        </p>
                        {p.measurementFields.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Ruler className="w-2.5 h-2.5" />
                            {p.measurementFields.length}{" "}
                            {t("measurementFields")}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="rounded-xl gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> {t("back")}
                  </Button>
                  {items.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setStep(3)}
                      className="rounded-xl gap-1 ml-auto bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/20"
                    >
                      {t("stepPayment")}{" "}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </>
            )}

            {addSubStep === "measure" && currentProduct && (
              <div ref={measurementsRef} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddSubStep("select")}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${productGradient(currentProduct.name)} flex items-center justify-center shadow-sm`}
                    >
                      <span className="text-sm font-bold text-white">
                        {(currentProduct.nameBn || currentProduct.name).charAt(
                          0,
                        )}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {currentProduct.nameBn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("stepMeasurement")}
                      </p>
                    </div>
                  </div>
                </div>

                {currentMeasurements.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {currentMeasurements.map((m, i) => (
                      <div key={m.fieldId} className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {m.fieldNameBn}
                        </Label>
                        <Input
                          value={m.value}
                          onChange={(e) =>
                            setCurrentMeasurements((ms) =>
                              ms.map((x, idx) =>
                                idx === i ? { ...x, value: e.target.value } : x,
                              ),
                            )
                          }
                          placeholder={t("inchPlaceholder")}
                          className="rounded-xl h-9 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {currentMeasurements.length === 0 && (
                  <div className="py-3 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl">
                    কোনো মাপ ক্ষেত্র নেই — সরাসরি যোগ করুন
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t("quantity")}
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setCurrentQuantity((q) => Math.max(1, q - 1))
                        }
                        className="w-8 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-sm font-bold transition-colors"
                      >
                        −
                      </button>
                      <Input
                        type="number"
                        min={1}
                        value={currentQuantity}
                        onChange={(e) =>
                          setCurrentQuantity(
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        className="rounded-xl h-9 text-center flex-1"
                      />
                      <button
                        onClick={() => setCurrentQuantity((q) => q + 1)}
                        className="w-8 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-sm font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t("unitPriceLabel")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentUnitPrice}
                      onChange={(e) =>
                        setCurrentUnitPrice(Number(e.target.value))
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-xl border border-primary/15">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-bold text-primary text-base">
                    {cur}
                    {(currentUnitPrice * currentQuantity).toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={confirmItem}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/20 gap-1.5"
                  data-enter-submit
                >
                  <Plus className="w-4 h-4" /> অর্ডারে যোগ করুন
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 3 && (
        <div ref={paymentRef} className="space-y-3">
          {/* Order summary */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-5 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              অর্ডার সারসংক্ষেপ
            </h2>

            {/* Customer */}
            {selectedCustomer && (
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer.phone}
                  </p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              {items.map((item, i) => {
                const p = products.find((x) => x.id === item.productId);
                const grad = productGradient(p?.name || "");
                return (
                  <div key={i} className="flex items-center gap-2.5 py-1.5">
                    <div
                      className={`w-6 h-6 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {(p?.nameBn || "?").charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm flex-1">
                      {p?.nameBn}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="text-sm font-semibold">
                      {cur}
                      {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">
                {t("totalPrice")}
              </span>
              <span className="font-bold text-foreground text-base">
                {cur}
                {subtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-5 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> পেমেন্ট
            </h2>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {t("advancePayment")}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {t("totalPrice")}: {cur}
                  {subtotal.toLocaleString()}
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={subtotal}
                value={advancePaid}
                onChange={(e) =>
                  setAdvancePaid(
                    Math.min(subtotal, Math.max(0, Number(e.target.value))),
                  )
                }
                className="rounded-xl h-10 text-base"
                placeholder="0"
              />
              {/* Quick preset buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() =>
                      setAdvancePaid(Math.round((subtotal * pct) / 100))
                    }
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                  >
                    {pct === 0 ? "বাকি" : pct === 100 ? "পুরো" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${dueAmount <= 0 ? "bg-success/8 border-success/20" : "bg-destructive/5 border-destructive/20"}`}
            >
              <span className="text-sm font-medium">{t("due")}</span>
              <span
                className={`font-bold text-lg ${dueAmount <= 0 ? "text-success" : "text-destructive"}`}
              >
                {cur}
                {Math.max(0, dueAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-5 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              বিস্তারিত
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t("deliveryDate")}
                </Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {t("specialNotes")}
                </Label>
                <Textarea
                  ref={specialNotesRef}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder={t("specialNotesPlaceholder")}
                  className="rounded-xl min-h-24 resize-y"
                />
              </div>
            </div>

            {staffList.filter((s) => s.isActive).length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <UserCircle className="w-3 h-3" /> {t("assignCraftsman")}
                </Label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">{t("notAssigned")}</option>
                  {staffList
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="rounded-xl gap-1.5 px-5"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {t("back")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={items.length === 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/25 gap-1.5 font-semibold h-10"
            >
              <Check className="w-4 h-4" /> {t("submitOrder")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
