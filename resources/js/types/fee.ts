export interface FeeInvoiceItem {
    id: number;
    fee_invoice_id: number;
    fee_type: 'tuition' | 'admission' | 'annual' | 'transport' | 'exam' | 'laboratory' | 'other' | string;
    description: string;
    amount: number | string;
}

export interface FeePayment {
    id: number;
    organization_id: number;
    fee_invoice_id: number;
    student_id: number;
    payment_number: string;
    receipt_number?: string;
    amount: number | string;
    payment_date: string;
    payment_method: 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'card' | 'other' | string;
    reference_number?: string | null;
    transaction_reference?: string | null;
    notes?: string | null;
    received_by?: number | null;
    receiver?: {
        id: number;
        name: string;
        email?: string;
    } | null;
    created_at: string;
}

export interface FeeInvoice {
    id: number;
    organization_id: number;
    student_id: number;
    student_enrollment_id?: number | null;
    school_class_id: number;
    class_section_id?: number | null;
    academic_year_id: number;
    invoice_number: string;
    billing_month: string;
    issue_date: string;
    due_date: string;
    subtotal: number | string;
    discount_amount: number | string;
    discount_reason?: string | null;
    late_fee: number | string;
    total_amount: number | string;
    paid_amount: number | string;
    balance_due: number | string;
    status: 'paid' | 'partially_paid' | 'unpaid' | 'overdue' | 'cancelled' | string;
    currency: string;
    notes?: string | null;
    created_by?: number | null;
    items?: FeeInvoiceItem[];
    payments?: FeePayment[];
    student?: {
        id: number;
        name: string;
        email: string;
        studentProfile?: {
            admission_number?: string;
            admission_date?: string;
            phone?: string;
        };
    };
    studentEnrollment?: {
        id: number;
        roll_number?: string;
    };
    schoolClass?: {
        id: number;
        name: string;
    };
    classSection?: {
        id: number;
        name: string;
    };
    academicYear?: {
        id: number;
        name: string;
    };
}

export interface ClassFeeStructure {
    id: number;
    organization_id: number;
    school_class_id: number;
    academic_year_id: number;
    monthly_tuition_fee: number | string;
    admission_fee: number | string;
    annual_fee: number | string;
    transport_fee?: number | string;
    other_recurring_charges: number | string;
    currency: string;
    due_day: number;
    late_fee_enabled: boolean;
    late_fee_amount: number | string;
    notes?: string | null;
    schoolClass?: {
        id: number;
        name: string;
    };
    academicYear?: {
        id: number;
        name: string;
    };
}

export interface StudentFeeStructure {
    id: number;
    organization_id: number;
    student_id: number;
    academic_year_id?: number | null;
    fee_category: string;
    monthly_tuition_fee: number | string;
    admission_fee: number | string;
    annual_fee: number | string;
    transport_fee?: number | string;
    other_recurring_charges: number | string;
    discount_type: 'none' | 'fixed' | 'percentage' | string;
    discount_value: number | string;
    discount_reason?: string | null;
    net_monthly_fee: number | string;
    currency: string;
    payment_frequency: string;
    due_day: number;
    effective_date?: string | null;
    fee_notes?: string | null;
}
