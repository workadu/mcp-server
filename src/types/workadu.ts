/**
 * TypeScript type definitions for Workadu entities.
 *
 * These types represent the JSON structures returned by the Workadu Dingo API
 * through its Fractal transformers. They are intentionally loose (using optional
 * fields) since the API may return different subsets depending on the endpoint.
 */

// ─── Orders / Bookings ────────────────────────────────────────────────

export interface WorkaduBooking {
  id: number;
  customer_id?: number;
  acting_username?: string;
  comment?: string;
  locale?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  orders?: WorkaduOrder[];
  customer?: WorkaduCustomer;
}

export interface WorkaduOrder {
  id: number;
  service_id?: number;
  customer_id?: number;
  total_cost?: number;
  status?: string;
  pickup_date?: string;
  return_date?: string;
  pickup_time?: string;
  return_time?: string;
  pickup_parking?: string;
  return_parking?: string;
  pickup_parking_name?: string;
  return_parking_name?: string;
  acting_username?: string;
  comment?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  service?: WorkaduService;
  customer?: WorkaduCustomer;
}

/** Order/Booking statuses */
export const ORDER_STATUSES = {
  CANCELLED: 'CANCELLED',
  PRE_ASSIGNED: 'PRE_ASSIGNED',
  ASSIGNED_NOT_CONFIRMED: 'ASSIGNED_NOT_CONFIRMED',
  NOT_PAID: 'NOT_PAID',
  CHECKED_OUT: 'CHECKED_OUT',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_IN_EARLIER: 'CHECKED_IN_EARLIER',
  ASSIGNED_AND_AGREED: 'ASSIGNED_AND_AGREED',
} as const;

/** Booking statuses */
export const BOOKING_STATUSES = {
  CANCELLED: 'CANCELLED',
  NOT_PAID: 'NOT_PAID',
  PAID: 'PAID',
  PENDING: 'PENDING',
  ON_PROGRESS: 'ON PROGRESS',
} as const;

// ─── Customers ────────────────────────────────────────────────────────

export interface WorkaduCustomer {
  id: number;
  fullname?: string;
  email?: string;
  mobile?: string;
  country?: string;
  city?: string;
  address?: string;
  vat_number?: string;
  ssn?: string;
  gender?: string;
  title?: string;
  company_name?: string;
  is_company_customer?: boolean;
  comments?: string;
  code?: string;
  tax_office?: string;
  postal_code?: string;
  tag_names?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Services ─────────────────────────────────────────────────────────

export interface WorkaduService {
  id: number;
  title?: string;
  description?: string;
  brand?: string;
  category_id?: number;
  type?: string;
  alias?: string;
  published?: boolean;
  pax?: number;
  min_pax?: number;
  zone_id?: number;
  color?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Invoices ─────────────────────────────────────────────────────────

export interface WorkaduInvoice {
  id: number;
  issue_date?: string;
  issue_time?: string;
  customer_id?: number;
  series_id?: number;
  invoice_num?: string;
  vat_percent?: number;
  vat_ammount?: number;
  total_ammount?: number;
  payment_type?: string;
  currency_iso?: string;
  currency_rate?: number;
  due_to?: string;
  due_date?: string;
  discount_percent?: number;
  discount_ammount?: number;
  proposal?: boolean;
  shipping_address?: string;
  notes?: string;
  admin_notes?: string;
  includes_vat?: boolean;
  status?: number;
  payment_status?: string;
  branch_id?: number;
  description?: string;
  totalCost?: number;
  balance?: number;
  created_at?: string;
  updated_at?: string;
  customer?: WorkaduCustomer;
  series?: WorkaduSeries;
  lines?: WorkaduInvoiceLine[];
}

/** Invoice statuses */
export const INVOICE_STATUSES = {
  CANCELED: 0,
  PUBLISHED: 1,
  DRAFT: 2,
  PREVIEW: 99,
} as const;

/** Invoice payment statuses */
export const INVOICE_PAYMENT_STATUSES = {
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  NOT_PAID: 'NOT_PAID',
} as const;

export interface WorkaduInvoiceLine {
  id: number;
  invoice_id?: number;
  service_id?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  net_amount?: number;
  vat_percent?: number;
  discount_percent?: number;
  total?: number;
}

export interface WorkaduSeries {
  id: number;
  title?: string;
  code?: string;
  status?: number;
  last_number?: number;
  type?: string;
  template?: string;
  includes_vat?: boolean;
}

export interface WorkaduWithholding {
  id: number;
  invoice_id?: number;
  type?: string;
  category?: string;
  amount?: number;
  percent?: number;
}

// ─── Payments ─────────────────────────────────────────────────────────

export interface WorkaduPayment {
  id: number;
  issue_date?: string;
  customer_id?: number;
  series_id?: number;
  currency?: string;
  currency_iso?: string;
  currency_rate?: number;
  comments?: string;
  amount?: number;
  order_id?: number;
  status?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  customer?: WorkaduCustomer;
  series?: WorkaduSeries;
}

/** Payment statuses */
export const PAYMENT_STATUSES = {
  ACTIVE: 1,
  DRAFT: 2,
  FAILED: 3,
  REFUNDED: 4,
} as const;

// ─── Assets (DCL) ────────────────────────────────────────────────────

export interface WorkaduAsset {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  status?: string;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Asset Movements (DCL) ───────────────────────────────────────────

export interface WorkaduAssetMovement {
  id: number;
  asset_id?: number;
  type?: string;
  status?: string;
  quantity?: number;
  source?: string;
  destination?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  asset?: WorkaduAsset;
}

// ─── API Response Wrappers ───────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}
