
export interface RecipientInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  documentType: 'INVOICE' | 'QUOTE';
  invoiceNumber: string;
  date: string;
  dateDue: string;
  billingRecipient: RecipientInfo;
  shippingRecipient: RecipientInfo;
  shippingSameAsBilling: boolean;
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  gstLabel: string;
  gstRate: number; // as percentage, e.g. 5
  pstLabel: string;
  pstRate: number; // as percentage, e.g. 7
  gst: number;
  pst: number;
  totalDue: number;
  currency: string;
}
