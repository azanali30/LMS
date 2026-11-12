<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'organization_type',
        'email',
        'phone',
        'address',
        'logo_path',
        'primary_color',
        'accent_color',
        'timezone',
        'currency',
        'status',
        'attendance_mode',
        'allow_attendance_editing',
        'created_by',
    ];

    /**
     * Normalize legacy absolute localhost/127.0.0.1 logo URLs to domain-relative /storage paths.
     */
    protected function logoPath(): Attribute
    {
        return Attribute::make(
            get: function (?string $value): ?string {
                if (! $value) {
                    return null;
                }

                if (preg_match('#^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?(/storage/.+)$#i', $value, $matches)) {
                    return $matches[1];
                }

                if (str_starts_with($value, 'logos/')) {
                    return '/storage/' . $value;
                }

                return $value;
            }
        );
    }

    /**
     * Build the fully qualified subdomain URL for this organization.
     */
    public function subdomainUrl(string $path = '/', array $query = []): string
    {
        return app(\App\Services\TenantResolver::class)->buildSubdomainUrl($this, $path, $query);
    }


    /**
     * User who created the organization.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Members belonging to this organization.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot(['role', 'status', 'title'])
            ->withTimestamps();
    }

    /**
     * Membership records for this organization.
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    /**
     * Pending invitations for this organization.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    /**
     * Academic years of this school.
     */
    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    /**
     * Current academic year of this school.
     */
    public function currentAcademicYear(): HasOne
    {
        return $this->hasOne(AcademicYear::class)->where('is_current', true);
    }

    /**
     * School classes / grade levels.
     */
    public function schoolClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    /**
     * Class sections.
     */
    public function classSections(): HasMany
    {
        return $this->hasMany(ClassSection::class);
    }

    /**
     * Subjects offered by this organization.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Curriculums defined by this organization.
     */
    public function curriculums(): HasMany
    {
        return $this->hasMany(Curriculum::class);
    }

    /**
     * Timetables managed by this organization.
     */
    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class);
    }

    /**
     * Timetable entries belonging to this organization.
     */
    public function timetableEntries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class);
    }

    /**
     * Courses offered by this organization.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Subscriptions for this organization.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(OrganizationSubscription::class);
    }

    /**
     * Active subscription for this organization.
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(OrganizationSubscription::class)->latestOfMany();
    }

    /**
     * Subscription invoices for platform billing.
     */
    public function subscriptionInvoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    /**
     * Default class fee structures configured for this organization.
     */
    public function classFeeStructures(): HasMany
    {
        return $this->hasMany(ClassFeeStructure::class);
    }

    /**
     * All student fee invoices in this organization.
     */
    public function feeInvoices(): HasMany
    {
        return $this->hasMany(FeeInvoice::class);
    }

    /**
     * All fee payments recorded for this organization.
     */
    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }
}
