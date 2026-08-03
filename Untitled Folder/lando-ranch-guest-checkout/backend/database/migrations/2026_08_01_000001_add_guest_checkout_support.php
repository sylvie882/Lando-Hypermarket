<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Carts: allow a cart to belong to a guest session instead of a user
        Schema::table('carts', function (Blueprint $table) {
            if (Schema::hasColumn('carts', 'user_id')) {
                $table->foreignId('user_id')->nullable()->change();
            }
            if (!Schema::hasColumn('carts', 'session_id')) {
                $table->string('session_id')->nullable()->after('user_id');
            } else {
                $table->string('session_id')->nullable()->change();
            }
            $table->index('session_id');
        });

        // Orders: allow a guest order (no account, no saved address)
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'user_id')) {
                $table->foreignId('user_id')->nullable()->change();
            }
            if (Schema::hasColumn('orders', 'address_id')) {
                $table->foreignId('address_id')->nullable()->change();
            }

            $table->string('session_id')->nullable()->after('user_id')->index();

            $table->string('guest_name')->nullable()->after('session_id');
            $table->string('guest_email')->nullable()->after('guest_name');
            $table->string('guest_phone')->nullable()->after('guest_email');
            $table->string('guest_address_line_1')->nullable()->after('guest_phone');
            $table->string('guest_address_line_2')->nullable()->after('guest_address_line_1');
            $table->string('guest_city')->nullable()->after('guest_address_line_2');
            $table->string('guest_state')->nullable()->after('guest_city');
            $table->string('guest_country')->nullable()->after('guest_state');
            $table->string('guest_postal_code')->nullable()->after('guest_country');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'session_id', 'guest_name', 'guest_email', 'guest_phone',
                'guest_address_line_1', 'guest_address_line_2', 'guest_city',
                'guest_state', 'guest_country', 'guest_postal_code',
            ]);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['session_id']);
            $table->dropColumn('session_id');
        });
    }
};
