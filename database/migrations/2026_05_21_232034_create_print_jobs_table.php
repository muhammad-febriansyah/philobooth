<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('photo_sessions')->cascadeOnDelete();
            $table->foreignId('printer_id')
                ->constrained('printers')->restrictOnDelete();
            $table->foreignId('paper_size_id')
                ->constrained('paper_sizes')->restrictOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('file_path');
            $table->string('status', 16)->default('queued');
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamps();

            $table->index(['session_id', 'status']);
            $table->index(['printer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
