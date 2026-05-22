<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')->cascadeOnDelete();
            $table->string('name');
            $table->string('model', 32);
            $table->string('connection_type', 16)->default('usb');
            $table->string('ip_address', 64)->nullable();
            $table->unsignedInteger('port')->nullable();
            $table->string('system_printer_name')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('max_paper_size', 8)->default('A4');
            $table->json('supported_paper_sizes')->nullable();
            $table->json('settings')->nullable();
            $table->string('last_status', 16)->default('offline');
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'is_active']);
            $table->index('last_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printers');
    }
};
