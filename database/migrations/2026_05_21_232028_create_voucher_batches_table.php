<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()
                ->constrained('branches')->nullOnDelete();
            $table->string('name');
            $table->string('code_prefix', 32);
            $table->unsignedInteger('max_uses_per_voucher')->default(1);
            $table->timestamp('valid_from');
            $table->timestamp('valid_until');
            $table->unsignedInteger('total_generated')->default(0);
            $table->unsignedInteger('total_used')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['branch_id', 'is_active']);
            $table->index(['valid_from', 'valid_until']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_batches');
    }
};
