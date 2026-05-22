<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voucher_batches', function (Blueprint $table) {
            $drop = array_filter(
                ['discount_type', 'discount_value'],
                fn ($col) => Schema::hasColumn('voucher_batches', $col),
            );

            if ($drop) {
                $table->dropColumn($drop);
            }
        });
    }

    public function down(): void
    {
        Schema::table('voucher_batches', function (Blueprint $table) {
            if (! Schema::hasColumn('voucher_batches', 'discount_type')) {
                $table->string('discount_type', 32)->default('free_print');
            }

            if (! Schema::hasColumn('voucher_batches', 'discount_value')) {
                $table->decimal('discount_value', 10, 2)->default(0);
            }
        });
    }
};
