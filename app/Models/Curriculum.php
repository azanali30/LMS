<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Curriculum extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $table = 'curriculums';

    protected $fillable = [
        'organization_id',
        'subject_id',
        'school_class_id',
        'academic_year_id',
        'title',
        'description',
        'status', // draft, published, archived
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(CurriculumUnit::class)->orderBy('order');
    }

    public function topics(): HasManyThrough
    {
        return $this->hasManyThrough(CurriculumTopic::class, CurriculumUnit::class);
    }
}
