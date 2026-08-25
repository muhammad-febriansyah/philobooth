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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('purpose', 32)->default('base')->after('session_id');
            $table->index(['session_id', 'purpose', 'status']);
        });

        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->decimal('extra_amount', 10, 2)->default(0)->after('final_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['session_id', 'purpose', 'status']);
            $table->dropColumn('purpose');
        });

        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->dropColumn('extra_amount');
        });
    }
};
