<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('id');
            $table->string('name', 120)->nullable()->after('batch_id');
            $table->timestamp('valid_from')->nullable()->after('is_active');
            $table->timestamp('valid_until')->nullable()->after('valid_from');

            $table->foreign('branch_id')
                ->references('id')->on('branches')
                ->nullOnDelete();
        });

        // batch_id jadi nullable supaya voucher bisa standalone — pakai schema builder portable
        // (didukung native di Laravel 11+, lintas driver: MySQL/SQLite/Postgres)
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['name', 'valid_from', 'valid_until', 'branch_id']);
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable(false)->change();
        });
    }
};
