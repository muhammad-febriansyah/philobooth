<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->foreign('used_by_session_id')
                ->references('id')->on('photo_sessions')
                ->nullOnDelete();

            $table->index(['used_by_session_id']);
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropForeign(['used_by_session_id']);
            $table->dropIndex(['used_by_session_id']);
        });
    }
};
