<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Branch membership of users (Identity context). Roles per branch are
     * stored by the Authorization context in model_has_roles.
     */
    public function up(): void
    {
        Schema::create('branch_user', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->primary(['user_id', 'branch_id']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_user');
    }
};
