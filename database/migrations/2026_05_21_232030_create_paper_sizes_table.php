<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paper_sizes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->string('name');
            $table->unsignedInteger('width_mm');
            $table->unsignedInteger('height_mm');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paper_sizes');
    }
};
