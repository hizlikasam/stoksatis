// ============================================================================
// Business & Multi-Tenant Types
// ============================================================================

export type BusinessRole = 'owner' | 'manager' | 'cashier';

export interface Business {
    id: string; // uuid
    name: string;
    owner_id: string; // uuid
    business_code: string | null;
    invite_code: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    tax_number: string | null;
    subscription_status: string;
    trial_ends_at: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BusinessUser {
    id: string; // uuid
    business_id: string; // uuid
    user_id: string; // uuid
    role: BusinessRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations for joins
    business?: Business | null;
    profile?: Profile | null;
}

// ============================================================================
// Profile
// ============================================================================

export interface Profile {
    id: string; // uuid
    full_name: string | null;
    shop_name: string | null; // Deprecated: use businesses table instead
    is_platform_admin: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Operational Types
// ============================================================================

export interface Category {
    id: string; // uuid
    business_id: string; // uuid
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: string; // uuid
    business_id: string; // uuid
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string; // uuid
    business_id: string; // uuid
    name: string;
    barcode: string | null;
    internal_code: string | null;
    brand: string | null;
    size: string | null;
    category_id: string | null;
    supplier_id: string | null;
    cost_price: number;
    sale_price: number;
    outlet_price: number;
    stock_quantity: number;
    min_stock_quantity: number;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations for joins
    category?: Category | null;
    supplier?: Supplier | null;
}

export type StockMovementType = 'stock_in' | 'stock_out' | 'adjustment' | 'sale' | 'return';

export interface StockMovement {
    id: string; // uuid
    business_id: string; // uuid
    product_id: string; // uuid
    movement_type: StockMovementType;
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    note: string | null;
    created_by: string | null; // uuid
    created_at: string;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'other';
export type SaleStatus = 'completed' | 'cancelled' | 'refunded';

export interface Sale {
    id: string; // uuid
    business_id: string; // uuid
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    payment_method: PaymentMethod;
    status: SaleStatus;
    note: string | null;
    created_by: string | null; // uuid
    created_at: string;
    updated_at: string;
}

export interface SaleItem {
    id: string; // uuid
    business_id: string; // uuid
    sale_id: string; // uuid
    product_id: string | null; // uuid
    quantity: number;
    unit_price: number;
    total_price: number;
    cost_price: number;
    created_at: string;
}

// ============================================================================
// Form Value Types (for create/update operations)
// ============================================================================

export interface ProductFormValues {
    name: string;
    brand?: string;
    size?: string;
    barcode?: string;
    internal_code?: string;
    category_id?: string | null;
    supplier_id?: string | null;
    cost_price: number;
    sale_price: number;
    outlet_price: number;
    stock_quantity: number;
    min_stock_quantity: number;
    image_url?: string;
}
