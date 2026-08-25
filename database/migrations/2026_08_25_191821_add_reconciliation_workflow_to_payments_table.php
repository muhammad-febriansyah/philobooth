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
        Schema::table('payments', function (Blueprint $table) {
            $table->boolean('requires_reconciliation')->default(false)->index();
            $table->string('reconciliation_reason')->nullable();
            $table->timestamp('reconciliation_resolved_at')->nullable();
            $table->foreignId('reconciliation_resolved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reconciliation_resolved_by');
            $table->dropColumn([
                'requires_reconciliation',
                'reconciliation_reason',
                'reconciliation_resolved_at',
            ]);
        });
    }
};
