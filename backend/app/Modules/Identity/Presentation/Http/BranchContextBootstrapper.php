<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http;

use App\Modules\Authorization\Application\Contracts\AccessControl;
use App\Modules\Identity\Application\Services\BranchAccessResolver;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Shared\Application\Context\BranchContext;
use App\Shared\Domain\Result\Result;

/**
 * Resolves the active branch for a user and scopes permission checks to it.
 */
final readonly class BranchContextBootstrapper
{
    public function __construct(
        private BranchAccessResolver $resolver,
        private BranchContext $context,
        private AccessControl $access,
    ) {}

    /**
     * @return Result<null>
     */
    public function boot(User $user, ?string $requestedBranchId = null): Result
    {
        $result = $this->resolver->resolve($user->id, $user->is_super_admin, $user->default_branch_id, $requestedBranchId);

        if ($result->isFailure()) {
            return $result;
        }

        ['current' => $current, 'accessible' => $accessible] = $result->value();

        $this->context->set($current, $accessible);
        $this->access->useBranch($current);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        return Result::success();
    }
}
