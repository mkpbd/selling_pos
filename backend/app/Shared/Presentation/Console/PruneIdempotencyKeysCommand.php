<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Console;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('idempotency:prune')]
#[Description('Delete expired idempotency keys')]
final class PruneIdempotencyKeysCommand extends Command
{
    public function handle(): int
    {
        $deleted = DB::table('idempotency_keys')->where('expires_at', '<', now())->delete();
        $this->components->info("Pruned {$deleted} expired idempotency keys.");

        return self::SUCCESS;
    }
}
