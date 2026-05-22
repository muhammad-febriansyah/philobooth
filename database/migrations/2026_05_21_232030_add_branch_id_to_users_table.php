<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('id')
                ->constrained('branches')->nullOnDelete();
            $table->string('phone', 32)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('avatar');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->softDeletes();

            $table->index(['branch_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn([
                'branch_id', 'phone', 'avatar',
                'is_active', 'last_login_at',
            ]);
            $table->dropSoftDeletes();
        });
    }
};
