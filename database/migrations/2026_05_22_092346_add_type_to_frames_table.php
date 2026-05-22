<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frames', function (Blueprint $table) {
            $table->string('type', 16)->nullable()->after('orientation')->index();
        });
    }

    public function down(): void
    {
        Schema::table('frames', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
        });
    }
};
