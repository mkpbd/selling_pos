<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 10)->unique();
            $table->string('name', 50);
            $table->boolean('allows_decimal')->default(false);
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('description', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX categories_name_lower_unique ON categories (lower(name))');

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku', 40)->unique();
            $table->string('barcode', 64)->nullable()->unique();
            $table->string('name', 150)->index();
            $table->text('description')->nullable();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->restrictOnDelete();
            $table->foreignUuid('unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('cost_price', 14, 2)->default(0);
            $table->decimal('selling_price', 14, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->boolean('track_stock')->default(true);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE products ADD CONSTRAINT products_prices_non_negative CHECK (cost_price >= 0 AND selling_price >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('units');
    }
};
