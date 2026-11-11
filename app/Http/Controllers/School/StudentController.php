<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\ClassFeeStructure;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\OrganizationUser;
use App\Models\ParentStudent;
use App\Models\SchoolClass;
use App\Models\StudentDocument;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeStructure;
use App\Models\StudentGuardian;
use App\Models\StudentProfile;
use App\Models\TimetableEntry;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    /**
     * Display student directory with section enrollments, guardians, and fee summaries.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);
        $isTeacher = ($userRole === 'teacher');
        $canManage = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        $canViewFinancials = $canManage;

        $withRelations = [
            'student.studentProfile',
            'classSection.schoolClass',
            'academicYear',
        ];

        if ($canViewFinancials) {
            $withRelations[] = 'student.studentGuardians';
            $withRelations[] = 'student.studentFeeStructure';
        }

        $query = StudentEnrollment::with($withRelations)->where('organization_id', $organization->id);

        $teacherSectionIds = collect();
        if ($isTeacher) {
            $teacherSectionIds = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->pluck('class_section_id')
                ->merge(
                    TimetableEntry::where('organization_id', $organization->id)
                        ->where('teacher_id', $user->id)
                        ->pluck('class_section_id')
                )
                ->unique()
                ->filter()
                ->values();

            $query->whereIn('class_section_id', $teacherSectionIds);
        }

        if ($classId = $request->query('class_id')) {
            $query->whereHas('classSection', function ($q) use ($classId) {
                $q->where('school_class_id', $classId);
            });
        }

        if ($sectionId = $request->query('section_id')) {
            $query->where('class_section_id', $sectionId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search, $canViewFinancials) {
                $q->where('roll_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('student.studentProfile', function ($pq) use ($search) {
                        $pq->where('admission_number', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('identity_number', 'like', "%{$search}%");
                    });

                if ($canViewFinancials) {
                    $q->orWhereHas('student.studentGuardians', function ($gq) use ($search) {
                        $gq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                }
            });
        }

        $enrollments = $query->latest()->paginate(15)->withQueryString();

        if ($isTeacher) {
            $sections = ClassSection::with('schoolClass')
                ->where('organization_id', $organization->id)
                ->whereIn('id', $teacherSectionIds)
                ->get();

            $classes = SchoolClass::where('organization_id', $organization->id)
                ->whereIn('id', $sections->pluck('school_class_id')->unique())
                ->orderBy('name')
                ->get(['id', 'name']);
        } else {
            $sections = ClassSection::with('schoolClass')
                ->where('organization_id', $organization->id)
                ->get();

            $classes = SchoolClass::where('organization_id', $organization->id)
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        $academicYear = AcademicYear::where('organization_id', $organization->id)
            ->where('is_current', true)
            ->first();

        if (! $academicYear) {
            $currentYear = (int) date('Y');
            $academicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => true,
            ]);
        }

        return Inertia::render('school/students', [
            'isTeacher' => $isTeacher,
            'enrollments' => $enrollments,
            'sections' => $sections,
            'classes' => $classes,
            'academicYear' => $academicYear,
            'currency' => $organization->currency ?? 'USD',
            'canManage' => $canManage,
            'canViewFinancials' => $canViewFinancials,
            'filters' => [
                'class_id' => $classId,
                'section_id' => $sectionId,
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the full-page student admission form.
     */
    public function create(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $classes = SchoolClass::with(['sections' => function ($q) use ($organization) {
            $q->where('organization_id', $organization->id)->orderBy('name');
        }])
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get();

        $sections = ClassSection::with('schoolClass')
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get();

        $academicYears = AcademicYear::where('organization_id', $organization->id)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get();

        $currentAcademicYear = $academicYears->firstWhere('is_current', true) ?? $academicYears->first();

        if (! $currentAcademicYear) {
            $currentYear = (int) date('Y');
            $currentAcademicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => true,
            ]);
            $academicYears = collect([$currentAcademicYear]);
        }

        // Generate suggested collision-safe Admission Number
        $year = date('Y');
        $prefix = "ADM-{$year}-";
        $latestProfile = StudentProfile::withoutTenantScope()
            ->where('organization_id', $organization->id)
            ->where('admission_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($latestProfile && preg_match('/-(\d+)$/', $latestProfile->admission_number, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        } else {
            $totalCount = StudentProfile::withoutTenantScope()->where('organization_id', $organization->id)->count();
            $seq = $totalCount + 1;
        }
        $suggestedAdmissionNumber = sprintf('%s%04d', $prefix, $seq);

        // Generate suggested Roll Number
        $latestEnrollment = StudentEnrollment::withoutTenantScope()
            ->where('organization_id', $organization->id)
            ->where('roll_number', 'like', 'STU-%')
            ->orderByDesc('id')
            ->first();

        $rollSeq = 1;
        if ($latestEnrollment && preg_match('/-(\d+)$/', $latestEnrollment->roll_number, $matches)) {
            $rollSeq = ((int) $matches[1]) + 1;
        } else {
            $rollSeq = StudentEnrollment::withoutTenantScope()->where('organization_id', $organization->id)->count() + 1;
        }
        $suggestedRollNumber = sprintf('STU-%03d', $rollSeq);

        $classFeeStructures = ClassFeeStructure::where('organization_id', $organization->id)
            ->where('academic_year_id', $currentAcademicYear?->id)
            ->get();

        return Inertia::render('school/student-create', [
            'classes' => $classes,
            'sections' => $sections,
            'academicYears' => $academicYears,
            'currentAcademicYear' => $currentAcademicYear,
            'classFeeStructures' => $classFeeStructures,
            'currency' => $organization->currency ?? 'USD',
            'suggestedAdmissionNumber' => $suggestedAdmissionNumber,
            'suggestedRollNumber' => $suggestedRollNumber,
        ]);
    }

    /**
     * Store a newly admitted student with comprehensive profile, guardians, enrollment, and fee structure.
     */
    public function store(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        // Pre-fill smart defaults for automated admissions and testing backwards compatibility
        if (empty($request->school_class_id) && ! empty($request->class_section_id)) {
            $sec = ClassSection::where('id', $request->class_section_id)->where('organization_id', $organization->id)->first();
            if ($sec) {
                $request->merge(['school_class_id' => $sec->school_class_id]);
            }
        }
        if (empty($request->admission_number)) {
            $request->merge(['admission_number' => 'ADM-'.date('Y').'-'.str_pad((string) (StudentProfile::withoutTenantScope()->where('organization_id', $organization->id)->count() + 1), 4, '0', STR_PAD_LEFT)]);
        }
        if (empty($request->admission_date)) {
            $request->merge(['admission_date' => now()->toDateString()]);
        }
        if (empty($request->enrollment_status)) {
            $request->merge(['enrollment_status' => 'active']);
        }

        // 1. Comprehensive Validation
        $validated = $request->validate([
            // Student Personal Info
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string|min:6|max:100',
            'admission_number' => 'required|string|max:50',
            'admission_date' => 'required|date',
            'dob' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other,prefer_not_to_say',
            'phone' => 'nullable|string|max:50',
            'nationality' => 'nullable|string|max:100',
            'identity_number' => 'nullable|string|max:100',
            'previous_school' => 'nullable|string|max:255',
            'previous_class' => 'nullable|string|max:100',
            'blood_group' => 'nullable|string|max:10',
            'medical_notes' => 'nullable|string|max:1500',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:3072',

            // Residential & Contact
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:1500',

            // Academic Placement
            'school_class_id' => 'required|exists:school_classes,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'roll_number' => 'nullable|string|max:50',
            'enrollment_status' => 'required|string|in:active,inactive,transferred,graduated',

            // Parent & Guardian Details
            'guardians' => 'nullable|array',
            'guardians.*.name' => 'nullable|string|max:255',
            'guardians.*.relationship' => 'nullable|string|in:father,mother,guardian,other',
            'guardians.*.phone' => 'nullable|string|max:50',
            'guardians.*.email' => 'nullable|email|max:255',
            'guardians.*.occupation' => 'nullable|string|max:255',
            'guardians.*.address' => 'nullable|string|max:500',
            'guardians.*.is_primary' => 'nullable|boolean',
            'guardians.*.is_emergency_contact' => 'nullable|boolean',

            // Fees & Financial Structure
            'fee_category' => 'nullable|string|max:50',
            'monthly_tuition_fee' => 'nullable|numeric|min:0',
            'admission_fee' => 'nullable|numeric|min:0',
            'annual_fee' => 'nullable|numeric|min:0',
            'transport_fee' => 'nullable|numeric|min:0',
            'other_recurring_charges' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|string|in:none,fixed,percentage',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string|max:255',
            'payment_frequency' => 'nullable|string|in:monthly,quarterly,semi_annual,annual',
            'due_day' => 'nullable|integer|min:1|max:31',
            'effective_date' => 'nullable|date',
            'fee_notes' => 'nullable|string|max:1000',

            // Documents
            'document_birth_cert' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:5120',
            'document_previous_school' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:5120',
            'document_leaving_cert' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:5120',
            'document_other' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:5120',
        ]);

        // 2. Ownership & Multi-tenant Cross-Validation
        $section = ClassSection::where('id', $validated['class_section_id'])
            ->where('organization_id', $organization->id)
            ->first();

        if (! $section || (int) $section->school_class_id !== (int) $validated['school_class_id']) {
            throw ValidationException::withMessages([
                'class_section_id' => 'The selected section does not belong to the selected class or organization.',
            ]);
        }

        $class = SchoolClass::where('id', $validated['school_class_id'])
            ->where('organization_id', $organization->id)
            ->first();

        if (! $class) {
            throw ValidationException::withMessages([
                'school_class_id' => 'The selected class is invalid for this institution.',
            ]);
        }

        // Verify unique admission number within this organization
        $existingAdmission = StudentProfile::withoutTenantScope()
            ->where('organization_id', $organization->id)
            ->where('admission_number', $validated['admission_number'])
            ->exists();

        if ($existingAdmission) {
            throw ValidationException::withMessages([
                'admission_number' => "Admission number '{$validated['admission_number']}' is already registered in this organization.",
            ]);
        }

        // Determine Academic Year
        $academicYearId = $validated['academic_year_id'] ?? null;
        if (! $academicYearId) {
            $activeYear = AcademicYear::where('organization_id', $organization->id)
                ->where('is_current', true)
                ->first();
            $academicYearId = $activeYear?->id;
        }

        if (! $academicYearId) {
            $currentYear = (int) date('Y');
            $createdYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => true,
            ]);
            $academicYearId = $createdYear->id;
        }

        // Execute in Atomic Database Transaction
        $studentUser = DB::transaction(function () use ($request, $organization, $validated, $academicYearId) {
            // A. Resolve or generate Student Email & Password
            $admissionNumClean = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($validated['admission_number']));
            $email = ! empty($validated['email'])
                ? strtolower(trim($validated['email']))
                : "stu.{$admissionNumClean}.{$organization->id}@portal.local";

            $password = ! empty($validated['password']) ? $validated['password'] : 'Student@123';

            // Find or create Student User account
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->name = $validated['name'];
                if (! empty($validated['password'])) {
                    $user->password = Hash::make($validated['password']);
                }
                $user->save();
            } else {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $email,
                    'password' => Hash::make($password),
                    'role' => 'student',
                ]);
            }

            // Organization User Membership
            OrganizationUser::firstOrCreate(
                [
                    'organization_id' => $organization->id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => 'student',
                    'status' => 'active',
                    'title' => 'Student',
                ]
            );

            // B. Handle Profile Photo Upload
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store("students/avatars/{$organization->id}", 'public');
            }

            // C. Create Student Profile Record
            StudentProfile::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'admission_number' => $validated['admission_number'],
                'admission_date' => $validated['admission_date'],
                'dob' => $validated['dob'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'nationality' => $validated['nationality'] ?? null,
                'identity_number' => $validated['identity_number'] ?? null,
                'previous_school' => $validated['previous_school'] ?? null,
                'previous_class' => $validated['previous_class'] ?? null,
                'blood_group' => $validated['blood_group'] ?? null,
                'medical_notes' => $validated['medical_notes'] ?? null,
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
                'photo_path' => $photoPath,
                'remarks' => $validated['remarks'] ?? null,
            ]);

            // D. Create Student Class Enrollment Record
            StudentEnrollment::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'academic_year_id' => $academicYearId,
                    'student_id' => $user->id,
                ],
                [
                    'class_section_id' => $validated['class_section_id'],
                    'roll_number' => $validated['roll_number'] ?? null,
                    'status' => $validated['enrollment_status'] ?? 'active',
                ]
            );

            // E. Process Parents and Guardians
            if (! empty($validated['guardians']) && is_array($validated['guardians'])) {
                foreach ($validated['guardians'] as $index => $gData) {
                    if (empty($gData['name']) || empty($gData['phone'])) {
                        continue;
                    }

                    $parentUserId = null;
                    if (! empty($gData['email'])) {
                        $parentEmail = strtolower(trim($gData['email']));
                        $parentUser = User::where('email', $parentEmail)->first();

                        if (! $parentUser) {
                            $parentUser = User::create([
                                'name' => $gData['name'],
                                'email' => $parentEmail,
                                'password' => Hash::make('Parent@123'),
                                'role' => 'parent',
                            ]);
                        }

                        // Attach parent role in organization
                        OrganizationUser::firstOrCreate(
                            [
                                'organization_id' => $organization->id,
                                'user_id' => $parentUser->id,
                            ],
                            [
                                'role' => 'parent',
                                'status' => 'active',
                                'title' => 'Parent / Guardian',
                            ]
                        );

                        // Link in parent_student table for parent portal dashboard
                        ParentStudent::firstOrCreate(
                            [
                                'organization_id' => $organization->id,
                                'parent_id' => $parentUser->id,
                                'student_id' => $user->id,
                            ],
                            [
                                'relationship_type' => $gData['relationship'] ?? 'guardian',
                            ]
                        );

                        $parentUserId = $parentUser->id;
                    }

                    StudentGuardian::create([
                        'organization_id' => $organization->id,
                        'student_id' => $user->id,
                        'user_id' => $parentUserId,
                        'name' => $gData['name'],
                        'relationship' => $gData['relationship'] ?? 'guardian',
                        'phone' => $gData['phone'],
                        'email' => $gData['email'] ?? null,
                        'occupation' => $gData['occupation'] ?? null,
                        'address' => $gData['address'] ?? null,
                        'is_primary' => (bool) ($gData['is_primary'] ?? ($index === 0)),
                        'is_emergency_contact' => (bool) ($gData['is_emergency_contact'] ?? false),
                    ]);
                }
            }

            // F. Process Fee Structure (Exact decimal financial arithmetic)
            $tuition = round((float) ($validated['monthly_tuition_fee'] ?? 0.00), 2);
            $transport = round((float) ($validated['transport_fee'] ?? 0.00), 2);
            $other = round((float) ($validated['other_recurring_charges'] ?? 0.00), 2);
            $baseMonthly = $tuition + $transport + $other;

            $discountType = $validated['discount_type'] ?? 'none';
            $discountVal = round((float) ($validated['discount_value'] ?? 0.00), 2);
            $monthlyDiscount = 0.00;

            if ($discountType === 'percentage') {
                $monthlyDiscount = round(($baseMonthly * ($discountVal / 100)), 2);
            } elseif ($discountType === 'fixed') {
                $monthlyDiscount = min($baseMonthly, $discountVal);
            }

            $netMonthly = max(0.00, round($baseMonthly - $monthlyDiscount, 2));

            StudentFeeStructure::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'student_id' => $user->id,
                ],
                [
                    'academic_year_id' => $academicYearId,
                    'fee_category' => $validated['fee_category'] ?? 'general',
                    'monthly_tuition_fee' => $tuition,
                    'admission_fee' => round((float) ($validated['admission_fee'] ?? 0.00), 2),
                    'annual_fee' => round((float) ($validated['annual_fee'] ?? 0.00), 2),
                    'transport_fee' => $transport,
                    'other_recurring_charges' => $other,
                    'discount_type' => $discountType,
                    'discount_value' => $discountVal,
                    'discount_reason' => $validated['discount_reason'] ?? null,
                    'net_monthly_fee' => $netMonthly,
                    'currency' => $organization->currency ?? 'USD',
                    'payment_frequency' => $validated['payment_frequency'] ?? 'monthly',
                    'due_day' => (int) ($validated['due_day'] ?? 10),
                    'effective_date' => $validated['effective_date'] ?? $validated['admission_date'],
                    'fee_notes' => $validated['fee_notes'] ?? null,
                ]
            );

            // G. Process Document Uploads (Stored securely in private application storage)
            $documentTypes = [
                'document_birth_cert' => ['type' => 'birth_certificate', 'title' => 'Birth Certificate / B-Form'],
                'document_previous_school' => ['type' => 'previous_school_certificate', 'title' => 'Previous School Report'],
                'document_leaving_cert' => ['type' => 'school_leaving_certificate', 'title' => 'School Leaving Certificate (SLC)'],
                'document_other' => ['type' => 'other', 'title' => 'Other Admission Document'],
            ];

            foreach ($documentTypes as $inputKey => $meta) {
                if ($request->hasFile($inputKey)) {
                    $file = $request->file($inputKey);
                    $filename = $file->getClientOriginalName();
                    $storedPath = $file->store("documents/{$organization->id}/{$user->id}", 'local');

                    StudentDocument::create([
                        'organization_id' => $organization->id,
                        'student_id' => $user->id,
                        'title' => $meta['title'],
                        'document_type' => $meta['type'],
                        'file_path' => $storedPath,
                        'file_name' => $filename,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                        'notes' => 'Uploaded during student admission',
                    ]);
                }
            }

            return $user;
        });

        return redirect()->route('school.students.show', $studentUser->id)
            ->with('success', "Student {$studentUser->name} admitted successfully with Admission #{$validated['admission_number']}. Student credentials and records are active.");
    }

    /**
     * Display comprehensive student profile with 8 organized tabs.
     */
    public function show(Request $request, int $studentId): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();

        // 1. Authorization check
        $isStaff = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        $isTeacher = $user->hasRoleInOrganization($organization->id, ['teacher']);
        $isStudentSelf = ($user->id === $studentId);
        $isParentLinked = ParentStudent::withoutTenantScope()
            ->where('organization_id', $organization->id)
            ->where('parent_id', $user->id)
            ->where('student_id', $studentId)
            ->exists();

        if (! $isStaff && ! $isTeacher && ! $isStudentSelf && ! $isParentLinked) {
            abort(403, 'Unauthorized access to student profile.');
        }

        // Restrict teachers strictly to students in their assigned cohorts
        if ($isTeacher) {
            $teacherSectionIds = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->pluck('class_section_id')
                ->merge(
                    TimetableEntry::where('organization_id', $organization->id)
                        ->where('teacher_id', $user->id)
                        ->pluck('class_section_id')
                )
                ->unique()
                ->filter()
                ->values();

            $isEnrolledInTeacherSection = StudentEnrollment::where('organization_id', $organization->id)
                ->where('student_id', $studentId)
                ->whereIn('class_section_id', $teacherSectionIds)
                ->exists();

            if (! $isEnrolledInTeacherSection) {
                abort(403, 'Unauthorized access to student profile. You may only view students in your assigned cohorts.');
            }
        }

        $canManage = $isStaff;
        $canViewFinancials = $isStaff; // Confidential fee information restricted to institution administrators

        // 2. Load Student User and Related Records
        $student = User::where('id', $studentId)
            ->with([
                'studentProfile',
                'studentGuardians',
                'studentDocuments',
                'studentEnrollments' => function ($q) use ($organization) {
                    $q->where('organization_id', $organization->id)
                        ->with(['classSection.schoolClass', 'academicYear'])
                        ->latest();
                },
            ])
            ->firstOrFail();

        // Ensure user belongs to this organization
        $membership = OrganizationUser::where('organization_id', $organization->id)
            ->where('user_id', $student->id)
            ->first();

        if (! $membership) {
            abort(404, 'Student is not a member of this institution.');
        }

        // Active enrollment
        $activeEnrollment = $student->studentEnrollments->firstWhere('status', 'active')
            ?? $student->studentEnrollments->first();

        // Fee structure & Invoices (loaded only if authorized)
        $feeStructure = $canViewFinancials
            ? StudentFeeStructure::where('organization_id', $organization->id)
                ->where('student_id', $student->id)
                ->first()
            : null;

        $feeInvoices = $canViewFinancials
            ? FeeInvoice::where('organization_id', $organization->id)
                ->where('student_id', $student->id)
                ->with(['items', 'payments.receiver'])
                ->orderByDesc('billing_month')
                ->get()
            : collect();

        // 3. Actual Attendance History & Summary
        $attendanceQuery = Attendance::where('organization_id', $organization->id)
            ->where('student_id', $student->id);

        $totalAttendances = (clone $attendanceQuery)->count();
        $presentCount = (clone $attendanceQuery)->where('status', 'present')->count();
        $absentCount = (clone $attendanceQuery)->where('status', 'absent')->count();
        $lateCount = (clone $attendanceQuery)->where('status', 'late')->count();
        $excusedCount = (clone $attendanceQuery)->where('status', 'excused')->count();

        $attendanceRate = $totalAttendances > 0
            ? round((($presentCount + $lateCount) / $totalAttendances) * 100, 1)
            : 100.0;

        $recentAttendance = (clone $attendanceQuery)
            ->latest('date')
            ->take(20)
            ->get();

        // 4. Subjects & Teacher Assignments for active class section
        $sectionSubjects = collect();
        $timetableEntries = collect();

        if ($activeEnrollment && $activeEnrollment->class_section_id) {
            $sectionSubjects = ClassSubjectTeacher::with(['subject', 'teacher'])
                ->where('organization_id', $organization->id)
                ->where('class_section_id', $activeEnrollment->class_section_id)
                ->get();

            $timetableEntries = TimetableEntry::with(['subject', 'teacher'])
                ->where('organization_id', $organization->id)
                ->where('class_section_id', $activeEnrollment->class_section_id)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get();
        }

        return Inertia::render('school/student-show', [
            'student' => $student,
            'activeEnrollment' => $activeEnrollment,
            'feeStructure' => $feeStructure,
            'attendanceSummary' => [
                'total' => $totalAttendances,
                'present' => $presentCount,
                'absent' => $absentCount,
                'late' => $lateCount,
                'excused' => $excusedCount,
                'rate' => $attendanceRate,
            ],
            'recentAttendance' => $recentAttendance,
            'sectionSubjects' => $sectionSubjects,
            'timetableEntries' => $timetableEntries,
            'currency' => $organization->currency ?? 'USD',
            'canManage' => $canManage,
            'canViewFinancials' => $canViewFinancials,
            'feeInvoices' => $feeInvoices,
        ]);
    }

    /**
     * Download an admission document securely.
     */
    public function downloadDocument(Request $request, int $studentId, int $documentId): StreamedResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        $isStaff = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        $isStudentSelf = ($user->id === $studentId);
        $isParentLinked = ParentStudent::withoutTenantScope()
            ->where('organization_id', $organization->id)
            ->where('parent_id', $user->id)
            ->where('student_id', $studentId)
            ->exists();

        if (! $isStaff && ! $isStudentSelf && ! $isParentLinked) {
            abort(403, 'Unauthorized access to student document.');
        }

        $doc = StudentDocument::where('id', $documentId)
            ->where('student_id', $studentId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        if (! Storage::disk('local')->exists($doc->file_path)) {
            abort(404, 'Document file not found in institutional storage.');
        }

        return Storage::disk('local')->download($doc->file_path, $doc->file_name);
    }

    /**
     * Update student and enrollment details.
     */
    public function update(StudentEnrollment $enrollment, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $enrollment->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|min:6|max:100',
            'class_section_id' => 'required|exists:class_sections,id',
            'roll_number' => 'nullable|string|max:50',
            'status' => 'required|string|in:active,completed,transferred,dropped,graduated,inactive',
        ]);

        $enrollment->load('student');
        if ($enrollment->student) {
            $user = $enrollment->student;
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            if (! empty($validated['password'])) {
                $user->password = Hash::make($validated['password']);
            }
            $user->save();
        }

        $enrollment->update([
            'class_section_id' => $validated['class_section_id'],
            'roll_number' => $validated['roll_number'] ?? null,
            'status' => $validated['status'],
        ]);

        return back()->with('success', "Student {$validated['name']} updated successfully.");
    }

    /**
     * Remove a student enrollment record.
     */
    public function destroy(StudentEnrollment $enrollment): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $enrollment->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $studentName = $enrollment->student?->name ?? 'Student';
        $enrollment->delete();

        return back()->with('success', "Enrollment record for {$studentName} removed successfully.");
    }
}
