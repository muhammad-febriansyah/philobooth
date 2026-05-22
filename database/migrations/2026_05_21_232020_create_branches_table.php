<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('manager_name')->nullable();
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->boolean('is_active')->default(true);
            $table->date('opened_at')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
