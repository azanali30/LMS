<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassFeeStructure extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'school_class_id',
        'academic_year_id',
        'monthly_tuition_fee',
        'admission_fee',
        'annual_fee',
        'transport_fee',
        'other_recurring_charges',
        'currency',
        'due_day',
        'late_fee_enabled',
        'late_fee_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'monthly_tuition_fee' => 'decimal:2',
            'admission_fee' => 'decimal:2',
            'annual_fee' => 'decimal:2',
            'transport_fee' => 'decimal:2',
            'other_recurring_charges' => 'decimal:2',
            'late_fee_amount' => 'decimal:2',
            'late_fee_enabled' => 'boolean',
            'due_day' => 'integer',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
