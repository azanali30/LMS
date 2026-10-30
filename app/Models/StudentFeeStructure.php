<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentFeeStructure extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'student_id',
        'academic_year_id',
        'fee_category',
        'monthly_tuition_fee',
        'admission_fee',
        'annual_fee',
        'transport_fee',
        'other_recurring_charges',
        'discount_type',
        'discount_value',
        'discount_reason',
        'net_monthly_fee',
        'currency',
        'payment_frequency',
        'due_day',
        'effective_date',
        'fee_notes',
    ];

    protected function casts(): array
    {
        return [
            'monthly_tuition_fee' => 'decimal:2',
            'admission_fee' => 'decimal:2',
            'annual_fee' => 'decimal:2',
            'transport_fee' => 'decimal:2',
            'other_recurring_charges' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'net_monthly_fee' => 'decimal:2',
            'due_day' => 'integer',
            'effective_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
