<?php

use App\Shared\Domain\Result\Error;
use App\Shared\Domain\Result\ErrorType;
use App\Shared\Domain\Result\Result;
use App\Shared\Presentation\Http\ApiResponse;

it('carries a value on success', function () {
    $result = Result::success(42);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->isFailure())->toBeFalse()
        ->and($result->value())->toBe(42);
});

it('carries an error on failure and refuses to expose a value', function () {
    $result = Result::failure(Error::notFound('THING_NOT_FOUND', 'Missing'));

    expect($result->isFailure())->toBeTrue()
        ->and($result->error()->code)->toBe('THING_NOT_FOUND')
        ->and($result->error()->type)->toBe(ErrorType::NotFound);

    $result->value();
})->throws(LogicException::class);

it('maps and chains only successful results', function () {
    $doubled = Result::success(2)->map(fn (int $v) => $v * 2);
    $failed = Result::failure(Error::conflict('X', 'x'))->map(fn () => 'never');
    $chained = Result::success(1)->then(fn () => Result::failure(Error::forbidden('NOPE', 'no')));

    expect($doubled->value())->toBe(4)
        ->and($failed->error()->code)->toBe('X')
        ->and($chained->error()->code)->toBe('NOPE');
});

it('maps error types to HTTP statuses', function (ErrorType $type, int $status) {
    expect(ApiResponse::statusFor($type))->toBe($status);
})->with([
    [ErrorType::Validation, 422],
    [ErrorType::BusinessRule, 422],
    [ErrorType::NotFound, 404],
    [ErrorType::Conflict, 409],
    [ErrorType::Forbidden, 403],
    [ErrorType::Unauthorized, 401],
]);
