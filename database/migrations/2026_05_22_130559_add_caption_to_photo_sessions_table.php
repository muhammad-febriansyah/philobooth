<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->string('caption', 60)->nullable()->after('filter_id');
            $table->boolean('show_date_stamp')->default(true)->after('caption');
        });
    }

    public function down(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->dropColumn(['caption', 'show_date_stamp']);
        });
    }
};
