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
        Schema::table('accounts', function (Blueprint $table) {
            // Add starting_amount column
            $table->decimal('starting_amount', 15, 2)->default(0)->after('bank_name');
            
            // Remove unnecessary columns
            $table->dropColumn(['account_number', 'currency', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            // Add back the removed columns
            $table->string('account_number')->after('bank_name');
            $table->string('currency', 3)->default('USD')->after('balance');
            $table->boolean('is_active')->default(true)->after('currency');
            
            // Remove starting_amount column
            $table->dropColumn('starting_amount');
        });
    }
};
