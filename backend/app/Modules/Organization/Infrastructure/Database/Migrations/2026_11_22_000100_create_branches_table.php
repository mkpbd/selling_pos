<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address', 500)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE branches ADD CONSTRAINT branches_code_format CHECK (code ~ '^[A-Z0-9-]{2,20}$')");
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
