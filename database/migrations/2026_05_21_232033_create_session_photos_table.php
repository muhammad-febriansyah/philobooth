<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('photo_sessions')->cascadeOnDelete();
            $table->unsignedInteger('slot_number');
            $table->string('original_path');
            $table->string('processed_path')->nullable();
            $table->boolean('is_selected')->default(false);
            $table->unsignedInteger('retake_count')->default(0);
            $table->timestamp('captured_at')->useCurrent();
            $table->timestamps();

            $table->index(['session_id', 'slot_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_photos');
    }
};
