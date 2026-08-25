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
            $table->foreignId('booth_device_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('booth_devices')
                ->nullOnDelete();
            $table->string('booth_request_id', 100)->nullable()->after('booth_device_id');

            $table->unique(['booth_device_id', 'booth_request_id']);
            $table->index(['booth_device_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->dropUnique(['booth_device_id', 'booth_request_id']);
            $table->dropIndex(['booth_device_id', 'status']);
            $table->dropConstrainedForeignId('booth_device_id');
            $table->dropColumn('booth_request_id');
        });
    }
};
