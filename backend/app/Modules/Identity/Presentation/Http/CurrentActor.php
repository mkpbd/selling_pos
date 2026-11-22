<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Shared\Application\Context\Actor;
use App\Shared\Application\Context\BranchContext;
use Illuminate\Http\Request;
use LogicException;

/**
 * Builds the application-level {@see Actor} from the HTTP request.
 */
final readonly class CurrentActor
{
    public function __construct(private BranchContext $context) {}

    public function from(Request $request): Actor
    {
        $user = $request->user();

        if (! $user instanceof User || ! $this->context->isResolved()) {
            throw new LogicException('CurrentActor requires an authenticated request with a resolved branch context.');
        }

        return new Actor(
            $user->id,
            $user->is_super_admin,
            $this->context->currentBranchId(),
            $this->context->accessibleBranchIds(),
        );
    }
}
