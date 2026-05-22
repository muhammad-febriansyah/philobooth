<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('photo_sessions')->cascadeOnDelete();
            $table->string('method', 32);
            $table->decimal('amount', 10, 2);

            // DOKU references
            $table->string('doku_invoice_number', 64)->nullable()->unique();
            $table->string('doku_request_id', 64)->nullable();
            $table->string('doku_acquirer', 64)->nullable();
            $table->string('doku_approval_code', 64)->nullable();

            // QRIS (manual or DOKU)
            $table->text('qris_string')->nullable();
            $table->string('qris_image_path')->nullable();

            $table->string('status', 16)->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
