<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frame_stickers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frame_id')
                ->constrained('frames')->cascadeOnDelete();
            $table->foreignId('sticker_id')
                ->constrained('stickers')->cascadeOnDelete();
            $table->integer('x');
            $table->integer('y');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->integer('rotation')->default(0);
            $table->integer('z_index')->default(0);
            $table->timestamps();

            $table->index(['frame_id', 'z_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frame_stickers');
    }
};
