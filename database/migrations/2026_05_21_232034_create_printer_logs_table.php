<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')
                ->constrained('printers')->cascadeOnDelete();
            $table->string('event', 32);
            $table->text('message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['printer_id', 'event']);
            $table->index(['printer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_logs');
    }
};
