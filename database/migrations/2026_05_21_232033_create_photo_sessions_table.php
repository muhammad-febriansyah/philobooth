<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photo_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_code', 32)->unique();
            $table->foreignId('branch_id')
                ->constrained('branches')->cascadeOnDelete();
            $table->foreignId('printer_id')->nullable()
                ->constrained('printers')->nullOnDelete();
            $table->foreignId('frame_id')->nullable()
                ->constrained('frames')->nullOnDelete();
            $table->foreignId('filter_id')->nullable()
                ->constrained('filters')->nullOnDelete();
            $table->foreignId('paper_size_id')
                ->constrained('paper_sizes')->restrictOnDelete();
            $table->foreignId('voucher_id')->nullable()
                ->constrained('vouchers')->nullOnDelete();
            $table->foreignId('operator_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('status', 32)->default('started');
            $table->string('current_step', 32)->default('start');
            $table->string('payment_method', 32)->nullable();

            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2)->default(0);

            // DOKU payment refs
            $table->string('doku_invoice_number', 64)->nullable();
            $table->string('doku_payment_url', 1024)->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->unsignedInteger('print_quantity')->default(1);
            $table->string('final_image_path')->nullable();
            $table->string('final_image_url', 1024)->nullable();

            $table->string('download_token', 64)->nullable()->unique();
            $table->string('download_qr_path')->nullable();
            $table->timestamp('download_expires_at')->nullable();
            $table->unsignedInteger('download_count')->default(0);

            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expired_at')->nullable();

            $table->string('customer_phone', 32)->nullable();
            $table->string('customer_email')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['status', 'current_step']);
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photo_sessions');
    }
};
