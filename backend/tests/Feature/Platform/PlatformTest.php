<?php

it('reports health', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertJsonPath('data.status', 'ok')
        ->assertJsonPath('data.checks.database', 'ok');
});

it('propagates a valid client request id and generates one otherwise', function () {
    $this->getJson('/api/v1/health', ['X-Request-Id' => 'client-req-12345'])
        ->assertHeader('X-Request-Id', 'client-req-12345')
        ->assertJsonPath('meta.request_id', 'client-req-12345');

    $generated = $this->getJson('/api/v1/health', ['X-Request-Id' => 'bad id!'])->headers->get('X-Request-Id');
    expect($generated)->not->toBe('bad id!')->and(strlen((string) $generated))->toBe(36);
});

it('sends security headers on API responses', function () {
    $this->getJson('/api/v1/health')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY');
});

it('renders unknown routes with the error envelope', function () {
    $this->getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertJson(['success' => false, 'error' => ['code' => 'NOT_FOUND']]);
});

it('renders wrong methods with the error envelope', function () {
    $this->deleteJson('/api/v1/health')
        ->assertStatus(405)
        ->assertJsonPath('error.code', 'METHOD_NOT_ALLOWED');
});

it('serves the OpenAPI document', function () {
    $spec = $this->get('/docs/api.json')->assertOk()->json();

    expect($spec['info']['title'])->toBe('Selling POS API')
        ->and(array_keys($spec['paths']))->toContain('/branches', '/users', '/roles', '/auth/login', '/auth/me')
        ->and($spec['components']['securitySchemes'])->toHaveKey('http');
});
