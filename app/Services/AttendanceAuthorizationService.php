<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceSubstitute;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Organization;
use App\Models\StudentEnrollment;
use App\Models\TimetableEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceAuthorizationService
{
    /**
     * Check if a user is authorized to mark or update attendance for a section.
     */
    public function isAuthorized(
        User $user,
        Organization $organization,
        int $classSectionId,
        string $date,
        ?int $timetableEntryId = null
    ): bool {
        // Platform Super Admin, Organization Owner, and Admin have universal administrative override
        if ($user->isSuperAdmin() || $user->hasRoleInOrganization($organization->id, ['owner', 'admin'])) {
            return true;
        }

        // Must be an active teacher in the active organization
        if (! $user->hasRoleInOrganization($organization->id, ['teacher'])) {
            return false;
        }

        $mode = $organization->attendance_mode ?? 'daily_first_period';
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));

        // Check if teacher is an authorized substitute for this section and date
        $isSubstitute = AttendanceSubstitute::where('organization_id', $organization->id)
            ->where('class_section_id', $classSectionId)
            ->whereDate('date', $date)
            ->where('substitute_teacher_id', $user->id)
            ->when($timetableEntryId, function ($q) use ($timetableEntryId) {
                $q->where(function ($sub) use ($timetableEntryId) {
                    $sub->whereNull('timetable_entry_id')
                        ->orWhere('timetable_entry_id', $timetableEntryId);
                });
            })
            ->exists();

        if ($isSubstitute) {
            return true;
        }

        if ($mode === 'period_wise' && $timetableEntryId) {
            // In period-wise mode with a specified period, only the assigned period teacher can take attendance
            $entry = TimetableEntry::where('organization_id', $organization->id)
                ->where('id', $timetableEntryId)
                ->where('class_section_id', $classSectionId)
                ->first();

            return $entry && (int) $entry->teacher_id === (int) $user->id;
        }

        // Default Policy: daily_first_period
        // The teacher assigned to the section's first scheduled period of the day may take daily attendance
        $firstPeriod = $this->getFirstScheduledPeriod($organization->id, $classSectionId, $dayOfWeek);

        if ($firstPeriod) {
            return (int) $firstPeriod->teacher_id === (int) $user->id;
        }

        // If no timetable entry exists for that section and day, check if teacher is assigned to section
        return ClassSubjectTeacher::where('organization_id', $organization->id)
            ->where('class_section_id', $classSectionId)
            ->where('teacher_id', $user->id)
            ->exists();
    }

    /**
     * Get the first scheduled period of the day for a section.
     */
    public function getFirstScheduledPeriod(int $organizationId, int $classSectionId, string $dayOfWeek): ?TimetableEntry
    {
        return TimetableEntry::with(['subject', 'teacher'])
            ->where('organization_id', $organizationId)
            ->where('class_section_id', $classSectionId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_published', true)
            ->orderBy('start_time', 'asc')
            ->first();
    }

    /**
     * Determine if attendance editing is allowed for a user once submitted.
     */
    public function canEditSubmittedAttendance(User $user, Organization $organization): bool
    {
        if ($user->isSuperAdmin() || $user->hasRoleInOrganization($organization->id, ['owner', 'admin'])) {
            return true;
        }

        return (bool) ($organization->allow_attendance_editing ?? true);
    }

    /**
     * Check if attendance has already been submitted for a section on a date.
     */
    public function isSubmitted(
        int $organizationId,
        int $classSectionId,
        string $date,
        ?int $timetableEntryId = null
    ): bool {
        return Attendance::where('organization_id', $organizationId)
            ->where('class_section_id', $classSectionId)
            ->whereDate('date', $date)
            ->when($timetableEntryId, fn ($q) => $q->where('timetable_entry_id', $timetableEntryId))
            ->exists();
    }

    /**
     * Fetch authorized attendance tasks for a teacher on a given date.
     */
    public function getAuthorizedAttendanceTasks(
        User $user,
        Organization $organization,
        ?string $date = null
    ): Collection {
        $targetDate = $date ?? now()->toDateString();
        $dayOfWeek = strtolower(Carbon::parse($targetDate)->format('l'));
        $userRole = TenantContext::currentRole($user);
        $isAdmin = in_array($userRole, ['owner', 'admin'], true) || $user->isSuperAdmin();
        $mode = $organization->attendance_mode ?? 'daily_first_period';

        if ($mode === 'period_wise') {
            // Query all timetable entries for today where user is teacher (or all if admin)
            $query = TimetableEntry::with(['schoolClass', 'classSection', 'subject', 'teacher'])
                ->where('organization_id', $organization->id)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_published', true)
                ->orderBy('start_time', 'asc');

            if (! $isAdmin) {
                $substituteSectionIds = AttendanceSubstitute::where('organization_id', $organization->id)
                    ->whereDate('date', $targetDate)
                    ->where('substitute_teacher_id', $user->id)
                    ->pluck('class_section_id');

                $query->where(function ($q) use ($user, $substituteSectionIds) {
                    $q->where('teacher_id', $user->id)
                        ->orWhereIn('class_section_id', $substituteSectionIds);
                });
            }

            $entries = $query->get();

            return $entries->map(function ($entry) use ($organization, $targetDate, $user) {
                $attendanceRecords = Attendance::where('organization_id', $organization->id)
                    ->where('class_section_id', $entry->class_section_id)
                    ->where('timetable_entry_id', $entry->id)
                    ->whereDate('date', $targetDate)
                    ->get();

                $isSubmitted = $attendanceRecords->isNotEmpty();
                $totalStudents = StudentEnrollment::where('organization_id', $organization->id)
                    ->where('class_section_id', $entry->class_section_id)
                    ->where('status', 'active')
                    ->count();

                $presentCount = $attendanceRecords->where('status', 'present')->count();
                $absentCount = $attendanceRecords->where('status', 'absent')->count();
                $lateCount = $attendanceRecords->where('status', 'late')->count();
                $excusedCount = $attendanceRecords->where('status', 'excused')->count();

                return [
                    'class_section_id' => $entry->class_section_id,
                    'timetable_entry_id' => $entry->id,
                    'class_name' => $entry->schoolClass?->name ?? 'Class',
                    'section_name' => $entry->classSection?->name ?? 'Section',
                    'subject_name' => $entry->subject?->name ?? 'Subject',
                    'period_name' => $entry->period_name ?: 'Period',
                    'start_time' => substr($entry->start_time, 0, 5),
                    'end_time' => substr($entry->end_time, 0, 5),
                    'room' => $entry->room,
                    'is_first_period' => false,
                    'is_submitted' => $isSubmitted,
                    'submitted_at' => $attendanceRecords->first()?->created_at?->toIso8601String(),
                    'marked_by' => $attendanceRecords->first()?->marked_by,
                    'can_edit' => ! $isSubmitted || $this->canEditSubmittedAttendance($user, $organization),
                    'total_students' => $totalStudents,
                    'present_count' => $presentCount,
                    'absent_count' => $absentCount,
                    'late_count' => $lateCount,
                    'excused_count' => $excusedCount,
                ];
            });
        }

        // Mode: daily_first_period
        // Find sections where teacher is assigned to the first period or is substitute
        $allSections = ClassSection::with('schoolClass')
            ->where('organization_id', $organization->id)
            ->get();

        $tasks = collect();

        foreach ($allSections as $section) {
            $firstPeriod = $this->getFirstScheduledPeriod($organization->id, $section->id, $dayOfWeek);

            $isAuthorized = false;
            if ($isAdmin) {
                $isAuthorized = true;
            } elseif ($firstPeriod && (int) $firstPeriod->teacher_id === (int) $user->id) {
                $isAuthorized = true;
            } else {
                $isSubstitute = AttendanceSubstitute::where('organization_id', $organization->id)
                    ->where('class_section_id', $section->id)
                    ->whereDate('date', $targetDate)
                    ->where('substitute_teacher_id', $user->id)
                    ->exists();

                if ($isSubstitute) {
                    $isAuthorized = true;
                } elseif (! $firstPeriod) {
                    // Fallback to assigned subject teacher if section has no timetable entries
                    $isAssigned = ClassSubjectTeacher::where('organization_id', $organization->id)
                        ->where('class_section_id', $section->id)
                        ->where('teacher_id', $user->id)
                        ->exists();
                    if ($isAssigned) {
                        $isAuthorized = true;
                    }
                }
            }

            if (! $isAuthorized) {
                continue;
            }

            $attendanceRecords = Attendance::where('organization_id', $organization->id)
                ->where('class_section_id', $section->id)
                ->whereDate('date', $targetDate)
                ->get();

            $isSubmitted = $attendanceRecords->isNotEmpty();
            $totalStudents = StudentEnrollment::where('organization_id', $organization->id)
                ->where('class_section_id', $section->id)
                ->where('status', 'active')
                ->count();

            $presentCount = $attendanceRecords->where('status', 'present')->count();
            $absentCount = $attendanceRecords->where('status', 'absent')->count();
            $lateCount = $attendanceRecords->where('status', 'late')->count();
            $excusedCount = $attendanceRecords->where('status', 'excused')->count();

            $tasks->push([
                'class_section_id' => $section->id,
                'timetable_entry_id' => $firstPeriod?->id,
                'class_name' => $section->schoolClass?->name ?? 'Class',
                'section_name' => $section->name,
                'subject_name' => $firstPeriod?->subject?->name ?? 'General Attendance',
                'period_name' => $firstPeriod?->period_name ?: 'Period 1 (Morning Register)',
                'start_time' => $firstPeriod ? substr($firstPeriod->start_time, 0, 5) : '08:00',
                'end_time' => $firstPeriod ? substr($firstPeriod->end_time, 0, 5) : '08:45',
                'room' => $firstPeriod?->room ?? $section->room,
                'is_first_period' => true,
                'is_submitted' => $isSubmitted,
                'submitted_at' => $attendanceRecords->first()?->created_at?->toIso8601String(),
                'marked_by' => $attendanceRecords->first()?->marked_by,
                'can_edit' => ! $isSubmitted || $this->canEditSubmittedAttendance($user, $organization),
                'total_students' => $totalStudents,
                'present_count' => $presentCount,
                'absent_count' => $absentCount,
                'late_count' => $lateCount,
                'excused_count' => $excusedCount,
            ]);
        }

        return $tasks;
    }
}
