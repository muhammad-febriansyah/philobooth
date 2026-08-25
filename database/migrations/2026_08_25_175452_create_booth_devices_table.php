<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('booth_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();
            $table->uuid('device_uuid')->nullable()->unique();
            $table->string('name', 120);
            $table->string('token_hash', 64)->nullable()->unique();
            $table->string('pairing_code_hash', 64)->nullable()->unique();
            $table->timestamp('pairing_expires_at')->nullable();
            $table->timestamp('paired_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('app_version', 32)->nullable();
            $table->json('capabilities')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'revoked_at']);
            $table->index(['pairing_code_hash', 'pairing_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booth_devices');
    }
};
