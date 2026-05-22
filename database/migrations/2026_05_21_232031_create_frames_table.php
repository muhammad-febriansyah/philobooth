<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frames', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()
                ->constrained('branches')->nullOnDelete();
            $table->foreignId('category_id')
                ->constrained('frame_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug', 96)->index();
            $table->text('description')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('paper_size_id')
                ->constrained('paper_sizes')->restrictOnDelete();
            $table->string('orientation', 16)->default('portrait');
            $table->unsignedInteger('photo_slots')->default(1);
            $table->json('canvas_data')->nullable();
            $table->string('background_path')->nullable();
            $table->string('overlay_path')->nullable();
            $table->decimal('price_addon', 10, 2)->default(0);
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('usage_count')->default(0);
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'is_active']);
            $table->index(['category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frames');
    }
};
