<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')
                ->constrained('voucher_batches')->cascadeOnDelete();
            $table->string('code', 64)->unique();
            $table->unsignedInteger('used_count')->default(0);
            $table->unsignedInteger('max_uses')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamp('used_at')->nullable();
            // FK ke photo_sessions ditambah di migration terpisah (circular).
            $table->unsignedBigInteger('used_by_session_id')->nullable();
            $table->timestamps();

            $table->index(['batch_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
