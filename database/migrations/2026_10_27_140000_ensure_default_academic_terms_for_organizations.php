<?php

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Organization;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $organizations = Organization::all();

        foreach ($organizations as $org) {
            $ay = AcademicYear::where('organization_id', $org->id)->where('is_current', true)->first()
                ?? AcademicYear::where('organization_id', $org->id)->latest()->first();

            if (! $ay) {
                $currentYear = (int) date('Y');
                $ay = AcademicYear::create([
                    'organization_id' => $org->id,
                    'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                    'start_date' => "{$currentYear}-09-01",
                    'end_date' => ($currentYear + 1).'-06-30',
                    'is_current' => true,
                ]);
            }

            $terms = AcademicTerm::where('organization_id', $org->id)->get();
            if ($terms->isEmpty()) {
                $yearStart = Carbon::parse($ay->start_date);
                $yearEnd = Carbon::parse($ay->end_date);
                $midYear = $yearStart->copy()->addMonths(5);

                $now = now();
                $isTerm1Current = $now->between($yearStart, $midYear) || ! $now->between($midYear, $yearEnd);

                AcademicTerm::create([
                    'organization_id' => $org->id,
                    'academic_year_id' => $ay->id,
                    'name' => 'Fall Term (First Half)',
                    'start_date' => $yearStart->toDateString(),
                    'end_date' => $midYear->toDateString(),
                    'is_current' => $isTerm1Current,
                ]);

                AcademicTerm::create([
                    'organization_id' => $org->id,
                    'academic_year_id' => $ay->id,
                    'name' => 'Spring Term (Second Half)',
                    'start_date' => $midYear->copy()->addDay()->toDateString(),
                    'end_date' => $yearEnd->toDateString(),
                    'is_current' => ! $isTerm1Current,
                ]);
            } else {
                // Ensure at least one term is marked current
                $hasCurrent = $terms->contains('is_current', true);
                if (! $hasCurrent) {
                    $activeTerm = $terms->first(function ($term) {
                        return $term->start_date && $term->end_date && now()->between($term->start_date, $term->end_date);
                    }) ?? $terms->first();

                    if ($activeTerm) {
                        $activeTerm->update(['is_current' => true]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep data intact
    }
};
