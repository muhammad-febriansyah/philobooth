<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Pakasir transaction reference (order_id). Unique so a webhook can
            // resolve exactly one payment, and a duplicate create is rejected.
            $table->string('pakasir_order_id', 64)->nullable()->unique()->after('doku_approval_code');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['pakasir_order_id']);
            $table->dropColumn('pakasir_order_id');
        });
    }
};
