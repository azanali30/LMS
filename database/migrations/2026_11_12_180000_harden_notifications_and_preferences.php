<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add non-nullable scope_key to notification_preferences so MySQL enforces uniqueness for NULL organization_id
        if (Schema::hasTable('notification_preferences')) {
            if (! Schema::hasColumn('notification_preferences', 'scope_key')) {
                Schema::table('notification_preferences', function (Blueprint $table) {
                    $table->string('scope_key', 40)->default('platform')->after('organization_id');
                });
            }

            DB::table('notification_preferences')
                ->whereNotNull('organization_id')
                ->update([
                    'scope_key' => DB::raw("CASE WHEN organization_id IS NULL THEN 'platform' ELSE CONCAT('org:', organization_id) END"),
                ]);

            // Safely deduplicate any pre-existing duplicate (user_id, scope_key, category) rows, keeping the newest id
            $duplicates = DB::table('notification_preferences')
                ->select('user_id', 'scope_key', 'category', DB::raw('MAX(id) as keep_id'), DB::raw('COUNT(*) as cnt'))
                ->groupBy('user_id', 'scope_key', 'category')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($duplicates as $dup) {
                DB::table('notification_preferences')
                    ->where('user_id', $dup->user_id)
                    ->where('scope_key', $dup->scope_key)
                    ->where('category', $dup->category)
                    ->where('id', '!=', $dup->keep_id)
                    ->delete();
            }

            Schema::table('notification_preferences', function (Blueprint $table) {
                $table->unique(['user_id', 'scope_key', 'category'], 'notif_prefs_user_scope_cat_unique');
            });
        }

        // 2. Safely backfill unambiguous legacy notifications (fee_invoice_id -> fee_invoices.organization_id)
        if (Schema::hasTable('notifications') && Schema::hasTable('fee_invoices')) {
            $legacyFeeNotifs = DB::table('notifications')
                ->whereNull('organization_id')
                ->where('scope', 'organization')
                ->where('data', 'like', '%fee_invoice_id%')
                ->get(['id', 'data']);

            foreach ($legacyFeeNotifs as $row) {
                $decoded = json_decode((string) $row->data, true);
                $invoiceId = is_array($decoded) ? ($decoded['fee_invoice_id'] ?? null) : null;
                if (! $invoiceId) {
                    continue;
                }

                $orgId = DB::table('fee_invoices')->where('id', $invoiceId)->value('organization_id');
                if ($orgId) {
                    DB::table('notifications')
                        ->where('id', $row->id)
                        ->update([
                            'organization_id' => $orgId,
                            'category' => 'fees',
                        ]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_preferences')) {
            Schema::table('notification_preferences', function (Blueprint $table) {
                $table->dropUnique('notif_prefs_user_scope_cat_unique');
                if (Schema::hasColumn('notification_preferences', 'scope_key')) {
                    $table->dropColumn('scope_key');
                }
            });
        }
    }
};

