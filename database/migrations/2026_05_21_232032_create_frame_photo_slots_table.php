<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frame_photo_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frame_id')
                ->constrained('frames')->cascadeOnDelete();
            $table->unsignedInteger('slot_number');
            $table->integer('x');
            $table->integer('y');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->integer('rotation')->default(0);
            $table->string('shape', 16)->default('rectangle');
            $table->unsignedInteger('border_radius')->default(0);
            $table->string('mask_path')->nullable();
            $table->timestamps();

            $table->unique(['frame_id', 'slot_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frame_photo_slots');
    }
};
