<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEnrollment extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'academic_year_id',
        'class_section_id',
        'student_id',
        'roll_number',
        'status',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function studentProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentProfile::class, 'user_id', 'student_id');
    }

    public function studentGuardians(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'student_id', 'student_id');
    }

    public function studentFeeStructure(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentFeeStructure::class, 'student_id', 'student_id');
    }

    public function feeInvoices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FeeInvoice::class, 'student_enrollment_id');
    }
}
