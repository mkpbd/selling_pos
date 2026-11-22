<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain;

use App\Shared\Domain\Result\Error;

final class UserErrors
{
    public static function notFound(): Error
    {
        return Error::notFound('USER_NOT_FOUND', 'User not found.');
    }

    public static function emailTaken(): Error
    {
        return Error::conflict('EMAIL_TAKEN', 'The email address is already registered.', [
            'email' => ['The email address is already registered.'],
        ]);
    }

    public static function invalidCredentials(): Error
    {
        return Error::unauthorized('INVALID_CREDENTIALS', 'These credentials do not match our records.');
    }

    public static function inactive(): Error
    {
        return Error::forbidden('ACCOUNT_INACTIVE', 'This account is deactivated. Contact your administrator.');
    }

    public static function branchRequired(): Error
    {
        return Error::validation('VALIDATION_FAILED', 'At least one branch must be assigned.', [
            'branch_roles' => ['At least one branch must be assigned.'],
        ]);
    }

    public static function defaultBranchNotAssigned(): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The default branch must be one of the assigned branches.', [
            'default_branch_id' => ['The default branch must be one of the assigned branches.'],
        ]);
    }

    public static function wrongCurrentPassword(): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The current password is incorrect.', [
            'current_password' => ['The current password is incorrect.'],
        ]);
    }

    public static function branchAccessDenied(): Error
    {
        return Error::forbidden('BRANCH_ACCESS_DENIED', 'You do not have access to this branch.');
    }

    public static function protectedUser(): Error
    {
        return Error::forbidden('FORBIDDEN', 'Only a super administrator can modify this user.');
    }

    public static function cannotDeactivateSelf(): Error
    {
        return Error::businessRule('BUSINESS_RULE_VIOLATION', 'You cannot deactivate your own account.', [
            'is_active' => ['You cannot deactivate your own account.'],
        ]);
    }

    /**
     * @param  array<string, list<string>>  $fieldErrors
     */
    public static function invalidAssignment(array $fieldErrors): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The branch role assignment is invalid.', $fieldErrors);
    }

    public static function roleEscalation(string $role): Error
    {
        return Error::forbidden('FORBIDDEN', "You cannot assign role [{$role}]: it grants permissions you do not have.");
    }
}
