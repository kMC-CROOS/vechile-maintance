<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('phone', '')->update(['phone' => null]);

        $duplicatePhones = DB::table('users')
            ->select('phone')
            ->whereNotNull('phone')
            ->groupBy('phone')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('phone');

        foreach ($duplicatePhones as $phone) {
            $ids = DB::table('users')->where('phone', $phone)->orderBy('id')->pluck('id');
            $keep = $ids->shift();
            if ($ids->isNotEmpty()) {
                DB::table('users')->whereIn('id', $ids)->update(['phone' => null]);
            }
            unset($keep);
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('CREATE UNIQUE INDEX users_phone_unique ON users (phone) WHERE phone IS NOT NULL');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('phone');
            });
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS users_phone_unique');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['phone']);
            });
        }
    }
};
