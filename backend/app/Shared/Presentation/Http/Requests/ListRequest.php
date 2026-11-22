<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Requests;

use App\Shared\Application\Pagination\PageRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Base for list endpoints: validates `page`, `per_page`, `search` and
 * `sort` (field or -field) and converts them into a {@see PageRequest}.
 */
abstract class ListRequest extends FormRequest
{
    /**
     * Sortable field names exposed by the endpoint.
     *
     * @return list<string>
     */
    abstract protected function sortable(): array;

    /**
     * Additional filter rules (query parameter => rules).
     *
     * @return array<string, mixed>
     */
    protected function filterRules(): array
    {
        return [];
    }

    /**
     * Validated filter values passed to the query side.
     *
     * @return array<string, mixed>
     */
    protected function filters(): array
    {
        return [];
    }

    protected function defaultSort(): ?string
    {
        return null;
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $sorts = [];
        foreach ($this->sortable() as $field) {
            $sorts[] = $field;
            $sorts[] = '-'.$field;
        }

        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.PageRequest::MAX_PER_PAGE],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sort' => ['sometimes', 'nullable', 'string', Rule::in($sorts)],
            ...$this->filterRules(),
        ];
    }

    public function toPageRequest(): PageRequest
    {
        $sort = $this->validated('sort') ?? $this->defaultSort();
        $search = trim((string) $this->validated('search', ''));

        return new PageRequest(
            page: (int) $this->validated('page', 1),
            perPage: (int) $this->validated('per_page', PageRequest::DEFAULT_PER_PAGE),
            search: $search === '' ? null : $search,
            sortField: $sort === null ? null : ltrim($sort, '-'),
            sortDescending: $sort !== null && str_starts_with($sort, '-'),
            filters: array_filter($this->filters(), static fn (mixed $v): bool => $v !== null),
        );
    }

    /**
     * Rule for query-string booleans ("true"/"false"/"1"/"0").
     *
     * @return list<mixed>
     */
    protected function booleanQueryRule(): array
    {
        return ['sometimes', 'nullable', Rule::in(['true', 'false', '1', '0'])];
    }

    protected function booleanQuery(string $key): ?bool
    {
        $value = $this->validated($key);

        return $value === null ? null : filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
