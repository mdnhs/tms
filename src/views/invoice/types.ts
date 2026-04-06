export type InvoiceMode = "customer" | "craftsman";

export interface InvoiceProductRow {
  id: string;
  name: string;
  name_bn?: string;
  nameBn?: string;
}

export interface InvoiceStaffRow {
  id: string;
  name: string;
  phone?: string;
}

export interface InvoiceHeaderProps {
  title: string;
  invoiceNo: string;
  referenceNo?: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopLogo?: string;
  createdAt: string;
  deliveryDateText?: string;
  deliveryDateTitle?: string;
  deliveryDateLabel?: string;
  rangeTitle?: string;
  rangeValue?: string;
  showDeliveryDate?: boolean;
  showRangeField?: boolean;
}

export interface CraftsmanMeasurementBoxProps {
  label: string;
  value: string;
}

export interface CraftsmanInfoFieldProps {
  label: string;
  value: string;
  secondaryValue?: string;
  inputStyle?: boolean;
  borderless?: boolean;
  compact?: boolean;
  handwrittenPlaceholder?: string;
}

export interface CraftsmanSlipProps {
  compact?: boolean;
  showShopHeader?: boolean;
  showDeliveryDateField?: boolean;
  orderId: string;
  customerName?: string;
  invoiceNo: string;
  referenceNo?: string;
  createdAt: string;
  assignedStaffName: string;
  deliveryDateText: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogo?: string;
  title: string;
  orderLabel: string;
  customerNameLabel?: string;
  assignedToLabel: string;
  deliveryDateLabel: string;
  rangeTitle?: string;
  rangeValue?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
