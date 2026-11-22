<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Local projection of catalog products (fed by Products' ProductChanged events).
        Schema::create('inventory_products', function (Blueprint $table) {
            $table->uuid('product_id')->primary();
            $table->string('sku', 40)->index();
            $table->string('name', 150)->index();
            $table->string('barcode', 64)->nullable()->index();
            $table->uuid('unit_id')->index();
            $table->string('unit_code', 10);
            $table->boolean('allows_decimal')->default(false);
            $table->decimal('cost_price', 14, 2)->default(0);
            $table->boolean('track_stock')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('synced_at')->useCurrent();
        });

        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('inventory_products', 'product_id')->cascadeOnDelete();
            $table->decimal('quantity', 14, 3)->default(0);
            $table->decimal('reorder_level', 14, 3)->default(0);
            $table->timestamp('last_movement_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->primary(['branch_id', 'product_id']);
            $table->index('product_id');
        });
        DB::statement('ALTER TABLE inventory_stocks ADD CONSTRAINT inventory_stocks_non_negative CHECK (quantity >= 0 AND reorder_level >= 0)');

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->restrictOnDelete();
            $table->uuid('product_id');
            $table->string('type', 30);
            $table->string('reason', 30)->nullable();
            $table->decimal('quantity', 14, 3);
            $table->decimal('balance_after', 14, 3);
            $table->string('note', 500)->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('reference_type', 50)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['branch_id', 'created_at']);
            $table->index(['branch_id', 'product_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
        DB::statement('ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_non_zero CHECK (quantity <> 0)');

        // The ledger is append-only: block UPDATE and DELETE at the database level.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION inventory_movements_immutable() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'inventory_movements is append-only';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER inventory_movements_no_update_delete
                BEFORE UPDATE OR DELETE ON inventory_movements
                FOR EACH ROW EXECUTE FUNCTION inventory_movements_immutable();
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
        DB::unprepared('DROP FUNCTION IF EXISTS inventory_movements_immutable()');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_products');
    }
};
