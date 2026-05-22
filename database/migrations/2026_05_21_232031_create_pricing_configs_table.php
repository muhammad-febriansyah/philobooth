<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')->cascadeOnDelete();
            $table->foreignId('paper_size_id')
                ->constrained('paper_sizes')->restrictOnDelete();
            $table->decimal('base_price', 10, 2);
            $table->unsignedInteger('min_prints')->default(1);
            $table->unsignedInteger('max_prints')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['branch_id', 'paper_size_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_configs');
    }
};
