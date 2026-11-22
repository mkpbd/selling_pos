<?php

use App\Modules\Authorization\Domain\Role;
use App\Modules\Identity\Domain\Email;
use App\Modules\Identity\Domain\User;
use App\Modules\Organization\Domain\Branch;
use App\Modules\Organization\Domain\BranchCode;
use App\Modules\Organization\Domain\Events\BranchCreated;
use App\Modules\Organization\Domain\Events\BranchUpdated;

describe('BranchCode', function () {
    it('normalizes to uppercase', function () {
        expect((new BranchCode(' dhk-01 '))->value)->toBe('DHK-01');
    });

    it('rejects invalid codes', function (string $code) {
        new BranchCode($code);
    })->throws(InvalidArgumentException::class)->with(['A', 'has space', 'TOO-LONG-CODE-1234567', 'bad_underscore']);
});

describe('Branch', function () {
    it('records creation and only real changes', function () {
        $branch = Branch::open('id-1', new BranchCode('HQ'), 'Head Office');
        expect($branch->releaseEvents())->toHaveCount(1)->{0}->toBeInstanceOf(BranchCreated::class);

        $branch->update(new BranchCode('HQ'), 'Head Office', null, null, null, true);
        expect($branch->releaseEvents())->toBeEmpty();

        $branch->update(new BranchCode('HQ'), 'Main Office', null, null, null, false);
        $events = $branch->releaseEvents();
        expect($events)->toHaveCount(1)
            ->and($events[0])->toBeInstanceOf(BranchUpdated::class)
            ->and($events[0]->changes)->toHaveKeys(['name', 'is_active']);
    });
});

describe('Email', function () {
    it('lowercases and validates', function () {
        expect((new Email(' Jane@Example.COM '))->value)->toBe('jane@example.com');
    });

    it('rejects garbage', function () {
        new Email('not-an-email');
    })->throws(InvalidArgumentException::class);
});

describe('User', function () {
    it('requires at least one branch', function () {
        $result = User::register('u1', 'Jane', new Email('jane@example.com'), 'hash', true, null, []);

        expect($result->isFailure())->toBeTrue()
            ->and($result->error()->details)->toHaveKey('branch_roles');
    });

    it('requires the default branch to be assigned', function () {
        $result = User::register('u1', 'Jane', new Email('jane@example.com'), 'hash', true, 'b9', ['b1']);

        expect($result->error()->details)->toHaveKey('default_branch_id');
    });

    it('defaults to the first branch', function () {
        $user = User::register('u1', 'Jane', new Email('jane@example.com'), 'hash', true, null, ['b1', 'b2'])->value();

        expect($user->defaultBranchId())->toBe('b1');
    });

    it('leaves the aggregate untouched when a profile change is invalid', function () {
        $user = User::reconstitute('u1', 'Jane', new Email('jane@example.com'), 'hash', true, false, 'b1', ['b1']);

        $result = $user->changeProfile('Changed', new Email('new@example.com'), true, 'b2', ['b1']);

        expect($result->isFailure())->toBeTrue()
            ->and($user->name())->toBe('Jane')
            ->and($user->email()->value)->toBe('jane@example.com');
    });

    it('records deactivation', function () {
        $user = User::reconstitute('u1', 'Jane', new Email('jane@example.com'), 'hash', true, false, 'b1', ['b1']);
        $user->changeProfile('Jane', new Email('jane@example.com'), false, 'b1', ['b1']);

        expect($user->releaseEvents()[0]->name())->toBe('identity.user_deactivated');
    });
});

describe('Role', function () {
    it('protects system role names and deletion', function () {
        $role = Role::reconstitute(1, 'admin', true, ['a']);

        expect($role->change('boss', ['a'])->error()->code)->toBe('SYSTEM_ROLE_IMMUTABLE')
            ->and($role->change('admin', ['a', 'b'])->isSuccess())->toBeTrue()
            ->and($role->ensureDeletable(false)->error()->code)->toBe('SYSTEM_ROLE_IMMUTABLE');
    });

    it('refuses to delete an assigned role', function () {
        $role = Role::reconstitute(2, 'supervisor', false, []);

        expect($role->ensureDeletable(true)->error()->code)->toBe('ROLE_IN_USE')
            ->and($role->ensureDeletable(false)->isSuccess())->toBeTrue();
    });

    it('normalizes permissions', function () {
        expect(Role::define('x', ['b', 'a', 'b'])->permissions())->toBe(['a', 'b']);
    });
});
