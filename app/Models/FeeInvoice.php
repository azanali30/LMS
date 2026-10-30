<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeInvoice extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'student_id',
        'student_enrollment_id',
        'school_class_id',
        'class_section_id',
        'academic_year_id',
        'invoice_number',
        'billing_month',
        'issue_date',
        'due_date',
        'subtotal',
        'discount_amount',
        'discount_reason',
        'late_fee',
        'total_amount',
        'paid_amount',
        'balance_due',
        'status',
        'currency',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'billing_month' => 'date',
            'issue_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'late_fee' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'balance_due' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class, 'class_section_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FeeInvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FeePayment::class)->latest('payment_date');
    }

    public function reminderLogs(): HasMany
    {
        return $this->hasMany(FeeReminderLog::class);
    }

    /**
     * Recalculates total payments, remaining balance and updates invoice status safely.
     */
    public function recalculateFinancials(): self
    {
        $totalPaid = (float) $this->payments()->sum('amount');
        $totalAmount = (float) $this->total_amount;
        $balance = max(0.00, round($totalAmount - $totalPaid, 2));

        $this->paid_amount = $totalPaid;
        $this->balance_due = $balance;

        if ($balance <= 0.0001) {
            $this->status = 'paid';
        } elseif ($totalPaid > 0) {
            $this->status = 'partially_paid';
        } elseif ($this->due_date && Carbon::parse($this->due_date)->isPast() && ! Carbon::parse($this->due_date)->isToday()) {
            $this->status = 'overdue';
        } else {
            $this->status = 'unpaid';
        }

        $this->save();

        return $this;
    }

    /**
     * Contextual human-readable status badge (paid, partially_paid, due_today, due_soon, overdue, unpaid).
     */
    public function getPaymentStatusDetailedAttribute(): string
    {
        if ($this->status === 'paid' || $this->balance_due <= 0) {
            return 'paid';
        }

        $today = Carbon::today();
        $due = Carbon::parse($this->due_date);

        if ($due->isPast() && ! $due->isToday()) {
            return 'overdue';
        }

        if ($due->isToday()) {
            return 'due_today';
        }

        if ($due->diffInDays($today, false) >= -3) {
            return 'due_soon';
        }

        if ($this->paid_amount > 0) {
            return 'partially_paid';
        }

        return 'unpaid';
    }
}
