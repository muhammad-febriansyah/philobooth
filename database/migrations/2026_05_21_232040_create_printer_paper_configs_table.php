<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_paper_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')
                ->constrained('printers')->cascadeOnDelete();
            $table->foreignId('paper_size_id')
                ->constrained('paper_sizes')->restrictOnDelete();
            $table->decimal('price_per_print', 10, 2)->default(0);
            $table->decimal('ink_cost_estimate', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['printer_id', 'paper_size_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_paper_configs');
    }
};
