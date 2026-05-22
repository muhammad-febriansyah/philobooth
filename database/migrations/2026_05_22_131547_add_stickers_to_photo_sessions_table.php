<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            // Format: [{id, x, y, size, rotate}] — x/y as percentages of canvas (0..1)
            $table->json('stickers')->nullable()->after('show_date_stamp');
        });
    }

    public function down(): void
    {
        Schema::table('photo_sessions', function (Blueprint $table) {
            $table->dropColumn('stickers');
        });
    }
};
