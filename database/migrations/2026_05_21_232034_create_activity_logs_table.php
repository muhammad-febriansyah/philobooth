<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()
                ->constrained('branches')->nullOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('session_id')->nullable()
                ->constrained('photo_sessions')->nullOnDelete();
            $table->string('action', 64);
            $table->text('description')->nullable();
            $table->json('properties')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['branch_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
