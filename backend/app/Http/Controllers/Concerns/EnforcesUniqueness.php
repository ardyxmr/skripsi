<?php

namespace App\Http\Controllers\Concerns;

use Closure;
use Illuminate\Support\Facades\DB;

// Shared validation helper for the Settings modules: a CASE-INSENSITIVE "unique name" rule.
// Laravel's Rule::unique() compares the column verbatim (case-sensitive on PostgreSQL), so
// "Bronze" and "bronze" would both be accepted. This closure rule normalizes with LOWER() so a
// name is unique regardless of case — and it pairs with the LOWER() functional unique indexes
// (defense-in-depth) added in the duplicate-data-protection migration.
trait EnforcesUniqueness
{
    /**
     * Build a case-insensitive "already taken" rule. $table/$column are controller-supplied
     * literals (never user input), so the raw LOWER() comparison is safe. $ignoreId skips the
     * row being edited so an update doesn't collide with itself.
     */
    protected function uniqueNameCI(string $table, string $column, ?int $ignoreId = null): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($table, $column, $ignoreId) {
            $exists = DB::table($table)
                ->whereRaw("LOWER({$column}) = ?", [mb_strtolower(trim((string) $value))])
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists();

            if ($exists) {
                $fail('The :attribute has already been taken.');
            }
        };
    }
}
