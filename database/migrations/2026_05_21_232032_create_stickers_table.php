<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stickers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')
                ->constrained('sticker_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('image_path');
            $table->string('thumbnail_path')->nullable();
            $table->boolean('is_animated')->default(false);
            $table->json('tags')->nullable();
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stickers');
    }
};
