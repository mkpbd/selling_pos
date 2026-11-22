<?php

use App\Modules\Identity\Infrastructure\Database\Factories\UserFactory;
use App\Modules\Identity\Infrastructure\Notifications\ResetPasswordNotification;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\PersonalAccessToken;

beforeEach(function () {
    $this->branch = makeBranch(['code' => 'HQ', 'name' => 'Head Office']);
    $this->user = makeUser([$this->branch->id => ['manager']], ['email' => 'jane@example.com']);
});

describe('SPA session login', function () {
    it('signs in and returns the current user with branch permissions', function () {
        $response = $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => 'JANE@example.com',
            'password' => UserFactory::PASSWORD,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'jane@example.com')
            ->assertJsonPath('data.current_branch.code', 'HQ')
            ->assertJsonPath('data.roles', ['manager'])
            ->assertJsonStructure(['data' => ['permissions', 'branches'], 'meta' => ['request_id']]);

        expect($response->json('data.permissions'))->toContain('users.create')->not->toContain('roles.manage');
        $this->assertAuthenticatedAs($this->user, 'web');
        expect($this->user->fresh()->last_login_at)->not->toBeNull();
    });

    it('rejects wrong credentials with the error envelope', function () {
        $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'INVALID_CREDENTIALS');

        $this->assertGuest('web');
    });

    it('rejects deactivated accounts', function () {
        $this->user->forceFill(['is_active' => false])->save();

        $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => 'jane@example.com',
            'password' => UserFactory::PASSWORD,
        ])->assertForbidden()->assertJsonPath('error.code', 'ACCOUNT_INACTIVE');
    });

    it('requires the SPA session (non-browser clients must use tokens)', function () {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'jane@example.com',
            'password' => UserFactory::PASSWORD,
        ])->assertStatus(400)->assertJsonPath('error.code', 'BAD_REQUEST');
    });

    it('validates input', function () {
        $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['details' => ['email', 'password']]]);
    });

    it('throttles repeated attempts', function () {
        foreach (range(1, 5) as $_) {
            $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'jane@example.com', 'password' => 'x']);
        }

        $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', ['email' => 'jane@example.com', 'password' => 'x'])
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'TOO_MANY_REQUESTS');
    });
});

describe('API tokens', function () {
    it('issues a bearer token usable on protected routes and revokes it on logout', function () {
        config(['sanctum.expiration' => 60]);

        $issued = $this->postJson('/api/v1/auth/tokens', [
            'email' => 'jane@example.com',
            'password' => UserFactory::PASSWORD,
            'device_name' => 'POS-01',
        ])->assertCreated()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.email', 'jane@example.com');

        $token = $issued->json('data.token');
        expect($issued->json('data.expires_at'))->not->toBeNull();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $this->user->id);

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        expect(PersonalAccessToken::count())->toBe(0);

        app('auth')->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized()->assertJsonPath('error.code', 'UNAUTHENTICATED');
    });
});

describe('current user', function () {
    it('requires authentication', function () {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'UNAUTHENTICATED')
            ->assertHeader('X-Request-Id');
    });

    it('blocks a user deactivated after signing in', function () {
        actingAsUser($this->user);
        $this->user->forceFill(['is_active' => false])->save();

        $this->getJson('/api/v1/auth/me')->assertForbidden()->assertJsonPath('error.code', 'ACCOUNT_INACTIVE');
    });

    it('gives super admins every permission', function () {
        actingAsUser(makeUser([$this->branch->id => []], superAdmin: true));

        $permissions = $this->getJson('/api/v1/auth/me')->assertOk()->json('data.permissions');

        expect($permissions)->toContain('roles.manage', 'branches.create', 'users.update', 'dashboard.view');
    });
});

describe('password management', function () {
    it('sends a reset link without revealing whether the account exists', function () {
        Notification::fake();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'jane@example.com'])->assertOk();
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'ghost@example.com'])->assertOk();

        expect($known->json('message'))->toBe($unknown->json('message'));
        Notification::assertSentTo($this->user, ResetPasswordNotification::class, function (ResetPasswordNotification $n) {
            return str_contains($n->toMail($this->user)->actionUrl, 'http://localhost:5173/reset-password?token=');
        });
    });

    it('resets the password with a valid token and revokes tokens', function () {
        $this->user->createToken('old-device');
        $token = Password::broker()->createToken($this->user);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jane@example.com',
            'token' => $token,
            'password' => 'N3w-Passw0rd!',
            'password_confirmation' => 'N3w-Passw0rd!',
        ])->assertOk();

        expect(Hash::check('N3w-Passw0rd!', $this->user->fresh()->password))->toBeTrue()
            ->and(PersonalAccessToken::count())->toBe(0);
    });

    it('rejects an invalid reset token', function () {
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jane@example.com',
            'token' => 'bogus',
            'password' => 'N3w-Passw0rd!',
            'password_confirmation' => 'N3w-Passw0rd!',
        ])->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_FAILED');
    });

    it('enforces the password policy', function () {
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'jane@example.com',
            'token' => 'x',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['password']]]);
    });

    it('changes the password when the current one is correct', function () {
        actingAsUser($this->user);

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'wrong',
            'password' => 'N3w-Passw0rd!',
            'password_confirmation' => 'N3w-Passw0rd!',
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['current_password']]]);

        $this->putJson('/api/v1/auth/password', [
            'current_password' => UserFactory::PASSWORD,
            'password' => 'N3w-Passw0rd!',
            'password_confirmation' => 'N3w-Passw0rd!',
        ])->assertOk();

        expect(Hash::check('N3w-Passw0rd!', User::find($this->user->id)->password))->toBeTrue();
    });
});
