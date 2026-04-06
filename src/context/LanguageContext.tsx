import React, { createContext, useContext, useState } from "react";

type Language = "bn" | "en";

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  customers: { bn: "কাস্টমার", en: "Customers" },
  products: { bn: "প্রোডাক্ট", en: "Products" },
  createOrder: { bn: "নতুন অর্ডার", en: "New Order" },
  orders: { bn: "অর্ডার লিস্ট", en: "Orders" },
  categories_menu: { bn: "ক্যাটাগরি", en: "Categories" },
  reports: { bn: "রিপোর্ট", en: "Reports" },
  settings: { bn: "সেটিংস", en: "Settings" },
  logout: { bn: "লগ আউট", en: "Logout" },

  // Bottom nav
  home: { bn: "হোম", en: "Home" },
  navOrders: { bn: "অর্ডার", en: "Orders" },
  navNew: { bn: "নতুন", en: "New" },
  navCustomers: { bn: "কাস্টমার", en: "Customers" },
  navMore: { bn: "আরো", en: "More" },

  // Dashboard
  dashboardDesc: { bn: "আপনার শপের সারসংক্ষেপ", en: "Your shop overview" },
  todayOrders: { bn: "আজকের অর্ডার", en: "Today's Orders" },
  pending: { bn: "পেন্ডিং", en: "Pending" },
  in_production: { bn: "প্রোডাকশনে", en: "In Production" },
  ready: { bn: "রেডি", en: "Ready" },
  delivered: { bn: "ডেলিভারড", en: "Delivered" },
  cancelled: { bn: "ক্যানসেল", en: "Cancelled" },
  deliveryReady: { bn: "ডেলিভারি রেডি", en: "Delivery Ready" },
  recentOrders: { bn: "সাম্প্রতিক অর্ডার", en: "Recent Orders" },
  viewAll: { bn: "সব দেখুন", en: "View All" },
  totalDue: { bn: "মোট বাকি", en: "Total Due" },
  totalRevenue: { bn: "মোট আয়", en: "Total Revenue" },
  monthlyRevenue: { bn: "মাসিক আয়", en: "Monthly Revenue" },
  orderStatusBreakdown: {
    bn: "অর্ডার স্ট্যাটাস বিশ্লেষণ",
    en: "Order Status Breakdown",
  },
  noData: { bn: "কোনো ডেটা নেই", en: "No data available" },
  orderId: { bn: "অর্ডার ID", en: "Order ID" },

  // Common labels
  date: { bn: "তারিখ", en: "Date" },
  customerName: { bn: "কাস্টমার", en: "Customer" },
  productName: { bn: "প্রোডাক্ট", en: "Product" },
  qty: { bn: "পরিমাণ", en: "Qty" },
  unitPrice: { bn: "একক মূল্য", en: "Unit Price" },
  total: { bn: "মোট", en: "Total" },
  range: { bn: "রেঞ্জ", en: "Range" },
  advance: { bn: "অ্যাডভান্স", en: "Advance" },
  due: { bn: "বাকি", en: "Due" },
  status: { bn: "স্ট্যাটাস", en: "Status" },
  deliveryDate: { bn: "ডেলিভারি তারিখ", en: "Delivery Date" },
  allStatus: { bn: "সব স্ট্যাটাস", en: "All Status" },
  action: { bn: "অ্যাকশন", en: "Action" },
  name: { bn: "নাম", en: "Name" },
  phone: { bn: "ফোন", en: "Phone" },
  address: { bn: "ঠিকানা", en: "Address" },
  notes: { bn: "নোটস", en: "Notes" },
  save: { bn: "সেভ", en: "Save" },
  saving: { bn: "সেভ হচ্ছে...", en: "Saving..." },
  saved: { bn: "সেভ হয়েছে ✓", en: "Saved ✓" },
  update: { bn: "আপডেট", en: "Update" },
  cancel: { bn: "বাতিল", en: "Cancel" },
  delete: { bn: "মুছে ফেলুন", en: "Delete" },
  edit: { bn: "এডিট", en: "Edit" },
  add: { bn: "যোগ করুন", en: "Add" },
  search: { bn: "খুঁজুন", en: "Search" },
  back: { bn: "পিছনে", en: "Back" },
  next: { bn: "পরবর্তী", en: "Next" },
  price: { bn: "দাম", en: "Price" },
  totalPrice: { bn: "মোট মূল্য", en: "Total Price" },

  // Reports
  reportsDesc: {
    bn: "ব্যবসার পরিসংখ্যান দেখুন",
    en: "View business statistics",
  },
  orderReport: { bn: "অর্ডার রিপোর্ট", en: "Order Report" },
  customerReport: { bn: "কাস্টমার রিপোর্ট", en: "Customer Report" },
  customDate: { bn: "কাস্টম তারিখ", en: "Custom Date" },
  fromDate: { bn: "থেকে", en: "From" },
  toDate: { bn: "পর্যন্ত", en: "To" },
  totalOrders: { bn: "মোট অর্ডার", en: "Total Orders" },
  totalAdvance: { bn: "মোট অ্যাডভান্স", en: "Total Advance" },
  last7days: { bn: "গত ৭ দিন", en: "Last 7 days" },
  last30days: { bn: "গত ৩০ দিন", en: "Last 30 days" },
  last90days: { bn: "গত ৯০ দিন", en: "Last 90 days" },
  allTime: { bn: "সব সময়", en: "All Time" },

  // Settings
  settingsDesc: {
    bn: "দোকানের সেটিংস পরিচালনা করুন",
    en: "Manage shop settings",
  },
  shopName: { bn: "টেইলারিং শপ", en: "Tailoring Shop" },
  shopDesc: { bn: "ম্যানেজমেন্ট সিস্টেম", en: "Management System" },
  shopInfo: { bn: "দোকানের তথ্য", en: "Shop Info" },
  shopInfoDesc: {
    bn: "দোকানের নাম, ঠিকানা ও লোগো সেট করুন",
    en: "Set your shop name, address and logo",
  },
  shopLogo: { bn: "দোকানের লোগো", en: "Shop Logo" },
  uploadLogo: { bn: "লোগো আপলোড", en: "Upload Logo" },
  dataManagement: { bn: "ডেটা ম্যানেজমেন্ট", en: "Data Management" },
  dataManagementLockDesc: {
    bn: "অ্যাক্সেস করতে পিন দিন",
    en: "Enter PIN to access",
  },
  enterPin: { bn: "পিন দিন", en: "Enter PIN" },
  enterPinDesc: {
    bn: "ডেটা ম্যানেজমেন্ট সেকশন সুরক্ষিত। অ্যাক্সেস করতে পিন কোড দিন।",
    en: "Data management is protected. Enter your PIN to continue.",
  },
  incorrectPin: {
    bn: "ভুল পিন, আবার চেষ্টা করুন",
    en: "Incorrect PIN, try again",
  },
  dataUnlocked: {
    bn: "ডেটা ম্যানেজমেন্ট আনলক হয়েছে",
    en: "Data management unlocked",
  },
  lock: { bn: "লক করুন", en: "Lock" },
  theme: { bn: "থিম", en: "Theme" },
  language: { bn: "ভাষা", en: "Language" },
  light: { bn: "লাইট", en: "Light" },
  dark: { bn: "ডার্ক", en: "Dark" },
  bangla: { bn: "বাংলা", en: "Bangla" },
  english: { bn: "ইংরেজি", en: "English" },
  invoice: { bn: "ইনভয়েস", en: "Invoice" },
  invoiceSettings: { bn: "ইনভয়েস সেটিংস", en: "Invoice Settings" },
  invoicePrefix: { bn: "ইনভয়েস প্রিফিক্স", en: "Invoice Prefix" },
  defaultAdvance: { bn: "ডিফল্ট অ্যাডভান্স", en: "Default Advance" },
  autoPrint: { bn: "অটো প্রিন্ট", en: "Auto Print" },
  notifications: { bn: "নোটিফিকেশন", en: "Notifications" },
  smsNotification: { bn: "SMS নোটিফিকেশন", en: "SMS Notification" },
  appearance: { bn: "অ্যাপিয়ারেন্স", en: "Appearance" },
  darkMode: { bn: "ডার্ক মোড", en: "Dark Mode" },
  darkModeDesc: {
    bn: "ডার্ক থিম চালু/বন্ধ করুন",
    en: "Toggle dark theme on/off",
  },
  colorTheme: { bn: "কালার থিম", en: "Color Theme" },
  colorThemeDesc: {
    bn: "অ্যাপের প্রাইমারি কালার নির্বাচন করুন",
    en: "Choose the primary color for the app",
  },
  fontSize: { bn: "ফন্ট সাইজ", en: "Font Size" },
  fontSizeDesc: {
    bn: "অ্যাপের টেক্সটের আকার পরিবর্তন করুন",
    en: "Change the text size of the app",
  },
  fontSizeSmall: { bn: "ছোট", en: "Small" },
  fontSizeMedium: { bn: "মাঝারি", en: "Medium" },
  fontSizeLarge: { bn: "বড়", en: "Large" },
  borderRadius: { bn: "বর্ডার রেডিয়াস", en: "Border Radius" },
  borderRadiusDesc: {
    bn: "কার্ড ও বাটনের কোণার আকৃতি",
    en: "Shape of card and button corners",
  },
  radiusSharp: { bn: "তীক্ষ্ণ", en: "Sharp" },
  radiusDefault: { bn: "ডিফল্ট", en: "Default" },
  radiusRounded: { bn: "গোলাকার", en: "Rounded" },
  radiusPill: { bn: "পিল", en: "Pill" },
  layoutDensity: { bn: "লেআউট ঘনত্ব", en: "Layout Density" },
  layoutDensityDesc: {
    bn: "কন্টেন্টের স্পেসিং নিয়ন্ত্রণ করুন",
    en: "Control the spacing of content",
  },
  densityCompact: { bn: "কমপ্যাক্ট", en: "Compact" },
  densityDefault: { bn: "ডিফল্ট", en: "Default" },
  densityComfortable: { bn: "প্রশস্ত", en: "Comfortable" },
  languageDesc: {
    bn: "অ্যাপের ভাষা পরিবর্তন করুন",
    en: "Change the display language",
  },
  reduceMotion: { bn: "অ্যানিমেশন কমান", en: "Reduce Motion" },
  reduceMotionDesc: {
    bn: "অ্যানিমেশন ও ট্রানজিশন কমিয়ে আনুন",
    en: "Minimize animations and transitions",
  },
  reduceMotionOn: { bn: "অ্যানিমেশন বন্ধ আছে", en: "Animations disabled" },
  reduceMotionOff: { bn: "অ্যানিমেশন চালু আছে", en: "Animations enabled" },
  themeTeal: { bn: "টিল", en: "Teal" },
  themeBlue: { bn: "নীল", en: "Blue" },
  themePurple: { bn: "বেগুনি", en: "Purple" },
  themeRose: { bn: "গোলাপি", en: "Rose" },
  themeOrange: { bn: "কমলা", en: "Orange" },
  themeGreen: { bn: "সবুজ", en: "Green" },
  currency: { bn: "মুদ্রা", en: "Currency" },
  reset: { bn: "রিসেট", en: "Reset" },
  saveSettings: { bn: "সেভ করুন", en: "Save Settings" },
  photo: { bn: "ছবি", en: "Photo" },
  image: { bn: "ছবি", en: "Image" },
  smsProviderSettings: {
    bn: "SMS প্রোভাইডার সেটিংস",
    en: "SMS Provider Settings",
  },
  smsApiKey: { bn: "API Key", en: "API Key" },
  smsSenderId: { bn: "Sender ID", en: "Sender ID" },
  smsSent: { bn: "SMS পাঠানো হয়েছে", en: "SMS Sent" },
  smsFailed: { bn: "SMS পাঠানো যায়নি", en: "SMS Failed" },

  // Login
  loginTitle: { bn: "টেইলারিং শপ", en: "Tailoring Shop" },
  loginSubtitle: {
    bn: "ম্যানেজমেন্ট সিস্টেমে লগইন করুন",
    en: "Login to Management System",
  },
  username: { bn: "ইউজারনেম", en: "Username" },
  password: { bn: "পাসওয়ার্ড", en: "Password" },
  login: { bn: "লগইন", en: "Login" },
  loginSuccess: { bn: "✅ সফলভাবে লগইন হয়েছে", en: "✅ Login successful" },
  loginError: { bn: "ভুল ইমেইল বা পাসওয়ার্ড", en: "Wrong email or password" },
  defaultCredentials: {
    bn: "ডিফল্ট: admin / admin123",
    en: "Default: admin / admin123",
  },
  email: { bn: "ইমেইল", en: "Email" },
  emailPlaceholder: { bn: "আপনার ইমেইল দিন", en: "Enter your email" },
  passwordPlaceholder: {
    bn: "আপনার পাসওয়ার্ড দিন",
    en: "Enter your password",
  },
  signup: { bn: "সাইন আপ", en: "Sign Up" },
  signupSubtitle: {
    bn: "নতুন অ্যাকাউন্ট তৈরি করুন",
    en: "Create a new account",
  },
  signupSuccess: {
    bn: "✅ সাইন আপ সফল! ইমেইল ভেরিফাই করুন।",
    en: "✅ Signup successful! Please verify your email.",
  },
  signupError: { bn: "সাইন আপ ব্যর্থ", en: "Signup failed" },
  alreadyHaveAccount: {
    bn: "আগে থেকে অ্যাকাউন্ট আছে?",
    en: "Already have an account?",
  },
  dontHaveAccount: { bn: "অ্যাকাউন্ট নেই?", en: "Don't have an account?" },
  fullName: { bn: "পুরো নাম", en: "Full Name" },
  fullNamePlaceholder: { bn: "আপনার নাম দিন", en: "Enter your name" },
  loggingIn: { bn: "লগইন হচ্ছে...", en: "Logging in..." },
  signingUp: { bn: "সাইন আপ হচ্ছে...", en: "Signing up..." },
  forgotPassword: { bn: "পাসওয়ার্ড ভুলে গেছেন?", en: "Forgot Password?" },
  sendResetLink: { bn: "রিসেট লিংক পাঠান", en: "Send Reset Link" },
  sendingResetLink: { bn: "লিংক পাঠানো হচ্ছে...", en: "Sending..." },
  resetPassword: { bn: "পাসওয়ার্ড রিসেট", en: "Reset Password" },
  resetLinkSent: {
    bn: "✅ রিসেট লিংক পাঠানো হয়েছে",
    en: "✅ Reset link sent",
  },
  resetLinkSentDesc: {
    bn: "আপনার ইমেইল চেক করুন",
    en: "Check your email inbox",
  },
  passwordResetSuccess: {
    bn: "✅ পাসওয়ার্ড রিসেট সফল হয়েছে",
    en: "✅ Password reset successful",
  },
  enterEmailForReset: {
    bn: "আপনার ইমেইল দিন রিসেট লিংক পেতে",
    en: "Enter your email to receive a reset link",
  },
  backToLogin: { bn: "লগইনে ফিরুন", en: "Back to Login" },
  confirmNewPassword: {
    bn: "পাসওয়ার্ড নিশ্চিত করুন",
    en: "Confirm New Password",
  },

  // Customers
  customersCount: { bn: "জন কাস্টমার", en: "customers" },
  newCustomer: { bn: "নতুন কাস্টমার", en: "New Customer" },
  searchByNamePhone: {
    bn: "নাম বা ফোন দিয়ে খুঁজুন...",
    en: "Search by name or phone...",
  },
  editCustomer: { bn: "কাস্টমার এডিট", en: "Edit Customer" },
  photoOptional: { bn: "ছবি (ঐচ্ছিক)", en: "Photo (Optional)" },
  nameRequired: { bn: "নাম *", en: "Name *" },
  customerNamePlaceholder: { bn: "কাস্টমারের নাম", en: "Customer name" },
  phoneRequired: { bn: "ফোন নম্বর *", en: "Phone *" },
  invalidBdMobile: {
    bn: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন",
    en: "Enter a valid Bangladeshi mobile number",
  },
  addressPlaceholder: { bn: "ঠিকানা লিখুন", en: "Enter address" },
  notesPlaceholder: { bn: "অতিরিক্ত তথ্য", en: "Additional info" },
  referenceNo: { bn: "রেফারেন্স নং", en: "Reference No" },
  referenceNoPlaceholder: { bn: "অফলাইন ইনভয়েস নং", en: "Offline invoice no." },
  customerUpdated: {
    bn: "✅ কাস্টমার আপডেট হয়েছে",
    en: "✅ Customer updated",
  },
  customerAdded: { bn: "✅ কাস্টমার যোগ করা হয়েছে", en: "✅ Customer added" },
  customerDeleted: {
    bn: "🗑️ কাস্টমার মুছে ফেলা হয়েছে",
    en: "🗑️ Customer deleted",
  },
  noCustomerFound: {
    bn: "কোনো কাস্টমার পাওয়া যায়নি",
    en: "No customer found",
  },

  // Products
  productsCount: { bn: "টি প্রোডাক্ট", en: "products" },
  newProduct: { bn: "নতুন প্রোডাক্ট", en: "New Product" },
  editProduct: { bn: "প্রোডাক্ট এডিট", en: "Edit Product" },
  nameEn: { bn: "Name (English) *", en: "Name (English) *" },
  nameBn: { bn: "নাম (বাংলা)", en: "Name (Bangla)" },
  category: { bn: "ক্যাটাগরি", en: "Category" },
  selectCategory: { bn: "ক্যাটাগরি সিলেক্ট করুন", en: "Select category" },
  basePrice: { bn: "বেজ প্রাইস (৳) *", en: "Base Price (৳) *" },
  productImage: {
    bn: "প্রোডাক্ট ছবি (ঐচ্ছিক)",
    en: "Product Image (Optional)",
  },
  measurementFields: { bn: "মেজারমেন্ট ফিল্ড", en: "Measurement Fields" },
  productUpdated: { bn: "✅ প্রোডাক্ট আপডেট হয়েছে", en: "✅ Product updated" },
  productAdded: { bn: "✅ প্রোডাক্ট যোগ করা হয়েছে", en: "✅ Product added" },
  productDeleted: {
    bn: "🗑️ প্রোডাক্ট মুছে ফেলা হয়েছে",
    en: "🗑️ Product deleted",
  },

  // Create Order
  createOrderTitle: { bn: "নতুন অর্ডার", en: "New Order" },
  createOrderDesc: {
    bn: "অর্ডার তৈরি করতে নিচের ধাপগুলো সম্পন্ন করুন",
    en: "Complete the steps below to create an order",
  },
  stepCustomer: { bn: "কাস্টমার", en: "Customer" },
  stepProduct: { bn: "প্রোডাক্ট", en: "Product" },
  stepMeasurement: { bn: "মেজারমেন্ট", en: "Measurement" },
  stepPayment: { bn: "পেমেন্ট", en: "Payment" },
  selectCustomer: { bn: "কাস্টমার সিলেক্ট করুন", en: "Select Customer" },
  selectProduct: { bn: "প্রোডাক্ট সিলেক্ট করুন", en: "Select Product" },
  newShort: { bn: "নতুন", en: "New" },
  saveAndSelect: { bn: "সেভ ও সিলেক্ট", en: "Save & Select" },
  quantity: { bn: "পরিমাণ", en: "Quantity" },
  specialNotes: { bn: "বিশেষ নোট", en: "Special Notes" },
  specialNotesPlaceholder: {
    bn: "বিশেষ কোনো নির্দেশনা...",
    en: "Any special instructions...",
  },
  inchPlaceholder: { bn: "ইঞ্চি", en: "Inch" },
  advancePayment: { bn: "অগ্রিম পেমেন্ট (৳)", en: "Advance Payment (৳)" },
  submitOrder: { bn: "অর্ডার তৈরি করুন", en: "Create Order" },
  orderCreated: {
    bn: "✅ অর্ডার সফলভাবে তৈরি হয়েছে",
    en: "✅ Order created successfully",
  },
  smsSuccessDesc: { bn: "নম্বরে SMS পাঠানো হয়েছে", en: "SMS sent to number" },
  smsFailTitle: { bn: "⚠️ SMS পাঠানো যায়নি", en: "⚠️ SMS failed" },
  smsFailDesc: {
    bn: "অর্ডার তৈরি হয়েছে, কিন্তু SMS পাঠানো সম্ভব হয়নি।",
    en: "Order created but SMS could not be sent.",
  },
  unitPriceLabel: { bn: "ইউনিট প্রাইস (৳)", en: "Unit Price (৳)" },

  // Orders List
  ordersCount: { bn: "টি অর্ডার", en: "orders" },
  searchOrderPlaceholder: {
    bn: "নাম, ফোন বা অর্ডার ID...",
    en: "Name, phone or order ID...",
  },
  all: { bn: "সব", en: "All" },
  noOrderFound: { bn: "কোনো অর্ডার পাওয়া যায়নি", en: "No order found" },
  payment: { bn: "পেমেন্ট", en: "Payment" },
  history: { bn: "হিস্ট্রি", en: "History" },
  statusUpdated: { bn: "✅ স্ট্যাটাস আপডেট", en: "✅ Status updated" },
  statusUpdatedFull: {
    bn: "✅ অর্ডার স্ট্যাটাস আপডেট হয়েছে",
    en: "✅ Order status updated",
  },
  editOrder: { bn: "অর্ডার এডিট করুন", en: "Edit Order" },
  editOrderDesc: {
    bn: "অর্ডারের তথ্য পরিবর্তন করুন",
    en: "Modify order details",
  },
  advancePaid: { bn: "অগ্রিম পরিশোধিত (৳)", en: "Advance Paid (৳)" },
  measurements: { bn: "মাপ", en: "Measurements" },
  orderUpdated: { bn: "অর্ডার আপডেট হয়েছে", en: "Order updated" },
  collectPayment: { bn: "পেমেন্ট সংগ্রহ", en: "Collect Payment" },
  collectPaymentDesc: { bn: "বাকি টাকা সংগ্রহ করুন", en: "Collect due amount" },
  paid: { bn: "পরিশোধিত", en: "Paid" },
  paymentAmount: { bn: "পেমেন্টের পরিমাণ (৳)", en: "Payment Amount (৳)" },
  maxAmount: { bn: "সর্বোচ্চ", en: "Max" },
  fullDue: { bn: "পুরো বাকি", en: "Full Due" },
  collect: { bn: "সংগ্রহ করুন", en: "Collect" },
  paymentCollected: { bn: "পেমেন্ট সংগ্রহ হয়েছে", en: "Payment collected" },
  orderHistory: { bn: "অর্ডার হিস্ট্রি", en: "Order History" },
  allChangesLog: { bn: "সকল পরিবর্তনের লগ", en: "All changes log" },
  noHistory: { bn: "কোনো হিস্ট্রি নেই", en: "No history" },
  deleteOrder: { bn: "অর্ডার মুছে ফেলবেন?", en: "Delete Order?" },
  deleteOrderDesc: {
    bn: "এই অর্ডারটি স্থায়ীভাবে মুছে যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
    en: "This order will be permanently deleted. This action cannot be undone.",
  },
  orderDeleted: { bn: "অর্ডার মুছে ফেলা হয়েছে", en: "Order deleted" },
  orderEdited: { bn: "অর্ডার এডিট করা হয়েছে", en: "Order edited" },
  paymentCollectedLog: { bn: "পেমেন্ট সংগ্রহ", en: "Payment collected" },

  // History change labels
  changeQty: { bn: "পরিমাণ", en: "Quantity" },
  changeUnitPrice: { bn: "একক মূল্য", en: "Unit Price" },
  changeAdvance: { bn: "অগ্রিম", en: "Advance" },
  changeDeliveryDate: { bn: "ডেলিভারি তারিখ", en: "Delivery Date" },
  changeNotes: { bn: "নোট", en: "Notes" },
  changePaid: { bn: "পরিশোধিত", en: "Paid" },
  changeDue: { bn: "বাকি", en: "Due" },

  // Invoice
  orderNotFound: { bn: "অর্ডার পাওয়া যায়নি", en: "Order not found" },
  goToOrders: { bn: "অর্ডার লিস্টে যান", en: "Go to Orders" },
  orderList: { bn: "অর্ডার লিস্ট", en: "Order List" },
  print: { bn: "প্রিন্ট", en: "Print" },
  customerInfo: { bn: "কাস্টমার তথ্য", en: "Customer Info" },
  orderInfo: { bn: "অর্ডার তথ্য", en: "Order Info" },
  notSet: { bn: "নির্ধারিত নয়", en: "Not set" },
  thankYou: {
    bn: "ধন্যবাদ আপনার অর্ডারের জন্য!",
    en: "Thank you for your order!",
  },
  order: { bn: "অর্ডার", en: "Order" },
  craftsmanInvoice: { bn: "কারিগর ইনভয়েস", en: "Craftsman Invoice" },
  customerInvoice: { bn: "কাস্টমার ইনভয়েস", en: "Customer Invoice" },
  productWise: { bn: "প্রোডাক্ট ভিত্তিক", en: "Product Wise" },
  allProducts: { bn: "সব প্রোডাক্ট", en: "All Products" },
  productWiseInvoice: { bn: "প্রোডাক্ট ভিত্তিক ইনভয়েস", en: "Product Wise Invoice" },
  assignCraftsman: { bn: "কারিগর নির্বাচন", en: "Assign Craftsman" },
  assignedTo: { bn: "কারিগরের নাম", en: "Assigned To" },
  notAssigned: { bn: "নির্ধারিত নয়", en: "Not Assigned" },
  wages: { bn: "মজুরি", en: "Wages" },
  signature: { bn: "স্বাক্ষর", en: "Signature" },

  // Categories
  categoriesCount: { bn: "টি ক্যাটাগরি", en: "categories" },
  newCategoryPlaceholder: {
    bn: "নতুন ক্যাটাগরি নাম...",
    en: "New category name...",
  },
  categoryExists: {
    bn: "এই ক্যাটাগরি আগে থেকেই আছে",
    en: "This category already exists",
  },
  categoryAdded: { bn: "ক্যাটাগরি যোগ করা হয়েছে", en: "Category added" },
  categoryUpdated: { bn: "ক্যাটাগরি আপডেট হয়েছে", en: "Category updated" },
  categoryDeleted: { bn: "ক্যাটাগরি মুছে ফেলা হয়েছে", en: "Category deleted" },
  deleteCategory: { bn: "ক্যাটাগরি মুছে ফেলবেন?", en: "Delete Category?" },
  deleteCategoryDesc: {
    bn: "ক্যাটাগরি মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
    en: "This category will be deleted. This action cannot be undone.",
  },
  deleteProduct: { bn: "প্রোডাক্ট মুছে ফেলবেন?", en: "Delete Product?" },
  deleteProductDesc: {
    bn: "এই প্রোডাক্টটি মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
    en: "This product will be deleted. This action cannot be undone.",
  },
  deleteCustomer: { bn: "কাস্টমার মুছে ফেলবেন?", en: "Delete Customer?" },
  deleteCustomerDesc: {
    bn: "এই কাস্টমারটি মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
    en: "This customer will be deleted. This action cannot be undone.",
  },

  // Settings specific
  shopNameEn: { bn: "Shop Name (English)", en: "Shop Name (English)" },
  shopNameBnLabel: { bn: "দোকানের নাম (বাংলা)", en: "Shop Name (Bangla)" },
  shopAddressPlaceholder: { bn: "দোকানের ঠিকানা", en: "Shop address" },
  invoicePrefixDesc: {
    bn: "ইনভয়েস নম্বরের আগে যোগ হবে",
    en: "Added before invoice number",
  },
  defaultAdvanceDesc: {
    bn: "ডিফল্ট অ্যাডভান্স পেমেন্ট শতাংশ",
    en: "Default advance payment percentage",
  },
  autoPrintDesc: {
    bn: "অর্ডার তৈরি হলে স্বয়ংক্রিয়ভাবে প্রিন্ট ডায়ালগ খুলবে",
    en: "Auto open print dialog when order is created",
  },
  smsNotificationDesc: {
    bn: "অর্ডার তৈরি হলে কাস্টমারকে SMS নোটিফিকেশন পাঠান",
    en: "Send SMS notification to customer when order is created",
  },
  smsApiKeyPlaceholder: {
    bn: "আপনার BulkSMSBD API Key",
    en: "Your BulkSMSBD API Key",
  },
  smsApiKeyDesc: {
    bn: "BulkSMSBD থেকে প্রাপ্ত API Key দিন",
    en: "Enter API Key from BulkSMSBD",
  },
  smsSenderIdPlaceholder: {
    bn: "আপনার অনুমোদিত Sender ID",
    en: "Your approved Sender ID",
  },
  smsSenderIdDesc: {
    bn: "BulkSMSBD তে অনুমোদিত Sender ID দিন",
    en: "Enter approved Sender ID from BulkSMSBD",
  },
  smsWarning: {
    bn: "SMS পাঠাতে BulkSMSBD অ্যাকাউন্ট প্রয়োজন।",
    en: "BulkSMSBD account required to send SMS.",
  },
  smsBalance: { bn: "SMS ব্যালেন্স", en: "SMS Balance" },
  checkBalance: { bn: "চেক করুন", en: "Check" },
  currentBalance: { bn: "বর্তমান ব্যালেন্স:", en: "Current Balance:" },
  taka: { bn: "টাকা", en: "Taka" },
  lowBalanceWarning: {
    bn: "আপনার SMS ব্যালেন্স থ্রেশহোল্ডের নিচে! দয়া করে রিচার্জ করুন।",
    en: "Your SMS balance is below threshold! Please recharge.",
  },
  lowBalanceThreshold: {
    bn: "লো ব্যালেন্স থ্রেশহোল্ড (৳)",
    en: "Low Balance Threshold (৳)",
  },
  thresholdDesc: {
    bn: "ব্যালেন্স এই পরিমাণের নিচে গেলে সতর্কতা দেখাবে",
    en: "Warning shown when balance drops below this amount",
  },
  enterApiKey: {
    bn: "ব্যালেন্স চেক করতে API Key দিন",
    en: "Enter API Key to check balance",
  },

  settingsSaved: { bn: "সেটিংস সেভ হয়েছে", en: "Settings saved" },
  settingsSavedDesc: {
    bn: "আপনার পরিবর্তনগুলি সংরক্ষিত হয়েছে।",
    en: "Your changes have been saved.",
  },
  apiKeyRequired: { bn: "API Key প্রয়োজন", en: "API Key required" },
  apiKeyRequiredDesc: {
    bn: "প্রথমে BulkSMSBD API Key দিন",
    en: "Enter BulkSMSBD API Key first",
  },
  balanceLow: { bn: "SMS ব্যালেন্স কম!", en: "Low SMS balance!" },
  balanceCheckSuccess: {
    bn: "ব্যালেন্স চেক সফল",
    en: "Balance check successful",
  },
  balanceInfoReceived: {
    bn: "ব্যালেন্স তথ্য পাওয়া গেছে",
    en: "Balance info received",
  },
  balanceCheckFailed: {
    bn: "ব্যালেন্স চেক ব্যর্থ",
    en: "Balance check failed",
  },

  // Notifications
  pendingOrders: { bn: "পেন্ডিং অর্ডার", en: "Pending Orders" },
  duePayments: { bn: "বকেয়া পেমেন্ট", en: "Due Payments" },
  readyForDelivery: { bn: "ডেলিভারি রেডি", en: "Ready for Delivery" },
  markAllRead: { bn: "সব পঠিত", en: "Mark all read" },
  noNewNotifications: {
    bn: "কোনো নতুন নোটিফিকেশন নেই",
    en: "No new notifications",
  },

  // Account settings
  account: { bn: "অ্যাকাউন্ট", en: "Account" },
  accountInfo: { bn: "অ্যাকাউন্ট তথ্য", en: "Account Info" },
  changeEmail: { bn: "ইমেইল পরিবর্তন", en: "Change Email" },
  currentEmail: { bn: "বর্তমান ইমেইল", en: "Current Email" },
  newEmail: { bn: "নতুন ইমেইল", en: "New Email" },
  newEmailPlaceholder: { bn: "নতুন ইমেইল দিন", en: "Enter new email" },
  updateEmail: { bn: "ইমেইল আপডেট", en: "Update Email" },
  emailUpdated: { bn: "✅ ইমেইল আপডেট হয়েছে", en: "✅ Email updated" },
  emailUpdateDesc: {
    bn: "নতুন ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে",
    en: "Verification link sent to new email",
  },
  emailUpdateFailed: { bn: "ইমেইল আপডেট ব্যর্থ", en: "Email update failed" },
  changePassword: { bn: "পাসওয়ার্ড পরিবর্তন", en: "Change Password" },
  currentPassword: { bn: "বর্তমান পাসওয়ার্ড", en: "Current Password" },
  newPassword: { bn: "নতুন পাসওয়ার্ড", en: "New Password" },
  confirmPassword: { bn: "পাসওয়ার্ড নিশ্চিত করুন", en: "Confirm Password" },
  newPasswordPlaceholder: {
    bn: "নতুন পাসওয়ার্ড দিন",
    en: "Enter new password",
  },
  confirmPasswordPlaceholder: {
    bn: "পাসওয়ার্ড আবার দিন",
    en: "Re-enter password",
  },
  updatePassword: { bn: "পাসওয়ার্ড আপডেট", en: "Update Password" },
  passwordUpdated: {
    bn: "✅ পাসওয়ার্ড আপডেট হয়েছে",
    en: "✅ Password updated",
  },
  passwordUpdateFailed: {
    bn: "পাসওয়ার্ড আপডেট ব্যর্থ",
    en: "Password update failed",
  },
  passwordMismatch: { bn: "পাসওয়ার্ড মিলছে না", en: "Passwords do not match" },
  passwordTooShort: {
    bn: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে",
    en: "Password must be at least 6 characters",
  },

  // Role Management
  roleManagement: { bn: "রোল ম্যানেজমেন্ট", en: "Role Management" },
  roleManagementDesc: {
    bn: "কাস্টম রোল তৈরি করুন এবং মেনু পারমিশন সেট করুন",
    en: "Create custom roles and set menu permissions",
  },
  roleName: { bn: "রোলের নাম (ইংরেজি)", en: "Role Name (English)" },
  roleNameBn: { bn: "রোলের নাম (বাংলা)", en: "Role Name (Bengali)" },
  menuPermissions: { bn: "মেনু পারমিশন", en: "Menu Permissions" },
  addRole: { bn: "রোল যোগ করুন", en: "Add Role" },
  editRole: { bn: "রোল এডিট", en: "Edit Role" },
  deleteRole: { bn: "রোল মুছুন", en: "Delete Role" },
  deleteRoleDesc: {
    bn: "আপনি কি নিশ্চিত যে এই রোলটি মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।",
    en: "Are you sure you want to delete this role? This action cannot be undone.",
  },
  noRoles: { bn: "কোনো রোল নেই", en: "No roles yet" },
  noRolesDesc: {
    bn: "আপনার প্রথম রোল তৈরি করতে উপরের বাটনে ক্লিক করুন",
    en: "Click the button above to create your first role",
  },
  noPermissions: { bn: "কোনো পারমিশন নেই", en: "No permissions" },
  selectAll: { bn: "সব নির্বাচন", en: "Select all" },
  clearAll: { bn: "সব বাতিল", en: "Clear all" },
  more: { bn: "আরো", en: "more" },
  roleCreated: { bn: "রোল তৈরি হয়েছে", en: "Role created" },
  roleUpdated: { bn: "রোল আপডেট হয়েছে", en: "Role updated" },
  roleDeleted: { bn: "রোল মুছে ফেলা হয়েছে", en: "Role deleted" },
  roleDialogDesc: {
    bn: "রোলের নাম এবং মেনু অ্যাক্সেস পারমিশন সেট করুন",
    en: "Set role name and menu access permissions",
  },
  permissionView: { bn: "দেখুন", en: "View" },
  permissionEdit: { bn: "এডিট", en: "Edit" },
  permissionDelete: { bn: "মুছুন", en: "Delete" },
  actions: { bn: "অ্যাকশন", en: "Actions" },
  menu: { bn: "মেনু", en: "Menu" },
  error: { bn: "ত্রুটি", en: "Error" },
  roles: { bn: "রোল", en: "Roles" },

  // Staff Management
  staffManagement: { bn: "স্টাফ ম্যানেজমেন্ট", en: "Staff Management" },
  staffManagementDesc: {
    bn: "স্টাফ যোগ করুন, রোল অ্যাসাইন করুন এবং লগইন ক্রেডেনশিয়াল তৈরি করুন",
    en: "Add staff, assign roles and create login credentials",
  },
  addStaff: { bn: "স্টাফ যোগ করুন", en: "Add Staff" },
  editStaff: { bn: "স্টাফ এডিট", en: "Edit Staff" },
  deleteStaff: { bn: "স্টাফ মুছুন", en: "Delete Staff" },
  deleteStaffDesc: {
    bn: "আপনি কি নিশ্চিত যে এই স্টাফকে মুছে ফেলতে চান?",
    en: "Are you sure you want to delete this staff member?",
  },
  noStaff: { bn: "কোনো স্টাফ নেই", en: "No staff members yet" },
  staffCreated: { bn: "স্টাফ যোগ হয়েছে", en: "Staff member added" },
  staffUpdated: { bn: "স্টাফ আপডেট হয়েছে", en: "Staff member updated" },
  staffDeleted: { bn: "স্টাফ মুছে ফেলা হয়েছে", en: "Staff member deleted" },
  staffDialogDesc: {
    bn: "স্টাফের তথ্য এবং রোল সেট করুন",
    en: "Set staff details and assign a role",
  },
  staffNamePlaceholder: { bn: "স্টাফের নাম", en: "Staff name" },
  staffNameRequired: { bn: "স্টাফের নাম লিখুন", en: "Enter the staff name" },
  selectRole: { bn: "রোল নির্বাচন করুন", en: "Select a role" },
  salary: { bn: "বেতন", en: "Salary" },
  activeStatus: { bn: "সক্রিয়", en: "Active" },
  active: { bn: "সক্রিয়", en: "Active" },
  inactive: { bn: "নিষ্ক্রিয়", en: "Inactive" },
  noRole: { bn: "রোল নেই", en: "No role" },
  staffActiveDesc: { bn: "স্টাফ লগইন করতে পারবে", en: "Staff can log in" },
  staffInactiveDesc: {
    bn: "স্টাফ লগইন করতে পারবে না",
    en: "Staff cannot log in",
  },
  loginEnabled: { bn: "লগইন সক্রিয়", en: "Login enabled" },
  noLogin: { bn: "লগইন নেই", en: "No login" },
  createLoginCredentials: {
    bn: "লগইন ক্রেডেনশিয়াল তৈরি",
    en: "Create Login Credentials",
  },
  createCredentialsDesc: {
    bn: "এই স্টাফের জন্য লগইন ইমেইল ও পাসওয়ার্ড তৈরি করুন:",
    en: "Create login email and password for:",
  },
  staffEmail: { bn: "ইমেইল", en: "Email" },
  staffPassword: { bn: "পাসওয়ার্ড", en: "Password" },
  minSixChars: { bn: "কমপক্ষে ৬ অক্ষর", en: "Minimum 6 characters" },
  createAccount: { bn: "অ্যাকাউন্ট তৈরি করুন", en: "Create Account" },
  staffAccountCreated: {
    bn: "স্টাফ অ্যাকাউন্ট তৈরি হয়েছে",
    en: "Staff account created successfully",
  },
  staffMenu: { bn: "স্টাফ", en: "Staff" },
  craftsmanDashboard: { bn: "কারিগর ড্যাশবোর্ড", en: "Craftsman Dashboard" },
  craftsmanDashboardDesc: {
    bn: "কারিগরদের অ্যাসাইন করা অর্ডার দেখুন",
    en: "View orders assigned to craftsmen",
  },
  noAssignedOrders: {
    bn: "কোনো অ্যাসাইন করা অর্ডার নেই",
    en: "No assigned orders",
  },
  overdue: { bn: "সময় পার", en: "Overdue" },
  daysLeft: { bn: "দিন বাকি", en: "days left" },
  craftsmanView: { bn: "কারিগর ভিউ", en: "Craftsman View" },
  craftsmanWages: { bn: "কারিগর মজুরি", en: "Craftsman Wages" },
  craftsmanWagesDesc: {
    bn: "কারিগরদের মজুরি ব্যবস্থাপনার জন্য এই সেকশন ব্যবহার করুন",
    en: "Use this section to manage craftsman wages",
  },
  comingSoon: {
    bn: "শীঘ্রই আসছে",
    en: "Coming Soon",
  },
  wagesSetupPending: {
    bn: "মজুরি ম্যানেজমেন্ট স্ক্রিন প্রস্তুত হচ্ছে",
    en: "Wage management screen is being prepared",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "bn";
    const stored = localStorage.getItem("pos_lang");
    return stored === "bn" || stored === "en" ? stored : "bn";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("pos_lang", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
