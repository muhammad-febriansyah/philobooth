<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->unsignedInteger('billing_revision')->default(1)->after('extra_amount');
            $table->string('artifact_disk', 32)->default('public')->after('final_image_url');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedInteger('billing_revision')->default(1)->after('purpose');
            $table->unsignedInteger('attempt')->default(1)->after('billing_revision');
            $table->string('idempotency_key', 100)->nullable()->after('attempt');
            $table->string('settlement_key', 190)->nullable()->after('idempotency_key');
            $table->index(['session_id', 'purpose', 'billing_revision', 'attempt'], 'payments_logical_attempt_index');
            $table->unique(['session_id', 'idempotency_key'], 'payments_session_idempotency_unique');
            $table->unique('settlement_key');
            $table->index(['session_id', 'purpose', 'billing_revision', 'status'], 'payments_logical_bill_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_logical_bill_status_index');
            $table->dropIndex('payments_logical_attempt_index');
            $table->dropUnique('payments_session_idempotency_unique');
            $table->dropUnique(['settlement_key']);
            $table->dropColumn(['billing_revision', 'attempt', 'idempotency_key', 'settlement_key']);
        });

        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->dropColumn(['billing_revision', 'artifact_disk']);
        });
    }
};
