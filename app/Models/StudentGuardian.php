<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGuardian extends Model
{
    use BelongsToOrganization, HasFactory;

    protected $fillable = [
        'organization_id',
        'student_id',
        'user_id',
        'name',
        'relationship',
        'phone',
        'email',
        'occupation',
        'address',
        'is_primary',
        'is_emergency_contact',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'is_emergency_contact' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
