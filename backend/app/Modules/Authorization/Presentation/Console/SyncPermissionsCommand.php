<?php

declare(strict_types=1);

namespace App\Modules\Authorization\Presentation\Console;

use App\Modules\Authorization\Infrastructure\PermissionCatalogSynchronizer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('authorization:sync {--reset-system-roles : Reset system role permissions to their defaults}')]
#[Description('Sync the code-defined permission catalog and system roles into the database')]
final class SyncPermissionsCommand extends Command
{
    public function handle(PermissionCatalogSynchronizer $synchronizer): int
    {
        $synchronizer->sync((bool) $this->option('reset-system-roles'));
        $this->components->info('Permission catalog and system roles are in sync.');

        return self::SUCCESS;
    }
}
