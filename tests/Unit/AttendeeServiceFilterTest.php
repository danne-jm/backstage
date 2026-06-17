<?php

namespace Tests\Unit;

use App\Services\AttendeeService;
use Tests\TestCase;

class AttendeeServiceFilterTest extends TestCase
{
    private function makeService(): AttendeeService
    {
        $sheets = $this->createMock(\App\Services\GoogleSheetsService::class);
        $verifier = $this->createMock(\App\Services\EmailVerificationService::class);

        return new AttendeeService($sheets, $verifier);
    }

    private function rows(): array
    {
        return [
            ['Name', 'Status', 'Paid', 'Email'],
            ['Alice', 'active', 'TRUE', 'alice@example.com'],
            ['Bob', 'inactive', 'FALSE', 'bob@example.com'],
            ['Carol', 'active', 'TRUE', ''],
            ['Dave', 'ACTIVE', '', 'dave@example.com'],
        ];
    }

    public function test_no_filter_returns_all_rows(): void
    {
        $result = $this->makeService()->filterRows($this->rows(), []);
        $this->assertCount(5, $result); // header + 4 data rows
    }

    public function test_single_row_with_no_config_returns_unchanged(): void
    {
        $data = [['Name']];
        $result = $this->makeService()->filterRows($data, [['column' => 'Name', 'operator' => 'equals', 'value' => 'X']]);
        $this->assertCount(1, $result); // only header, no data rows to filter
    }

    public function test_equals_is_case_insensitive(): void
    {
        $config = [['column' => 'Status', 'operator' => 'equals', 'value' => 'active']];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Alice (active) + Carol (active) + Dave (ACTIVE)
        $this->assertCount(4, $result);
    }

    public function test_contains_matches_substring(): void
    {
        $config = [['column' => 'Email', 'operator' => 'contains', 'value' => 'example']];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Alice, Bob, Dave (Carol has empty email)
        $this->assertCount(4, $result);
    }

    public function test_not_contains_excludes_matching_rows(): void
    {
        $config = [['column' => 'Email', 'operator' => 'not_contains', 'value' => 'alice']];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        $names = array_column(array_slice($result, 1), 0);
        $this->assertNotContains('Alice', $names);
        $this->assertContains('Bob', $names);
    }

    public function test_is_checked_keeps_only_true_rows(): void
    {
        $config = [['column' => 'Paid', 'operator' => 'is_checked', 'value' => null]];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Alice + Carol (both have TRUE)
        $this->assertCount(3, $result);
    }

    public function test_is_not_checked_keeps_non_true_rows(): void
    {
        $config = [['column' => 'Paid', 'operator' => 'is_not_checked', 'value' => null]];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Bob (FALSE) + Dave ('')
        $this->assertCount(3, $result);
    }

    public function test_is_empty_keeps_blank_cells(): void
    {
        $config = [['column' => 'Email', 'operator' => 'is_empty', 'value' => null]];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Carol (empty email)
        $this->assertCount(2, $result);
    }

    public function test_is_not_empty_excludes_blank_cells(): void
    {
        $config = [['column' => 'Email', 'operator' => 'is_not_empty', 'value' => null]];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Alice, Bob, Dave
        $this->assertCount(4, $result);
    }

    public function test_multiple_rules_are_anded(): void
    {
        $config = [
            ['column' => 'Status', 'operator' => 'equals', 'value' => 'active'],
            ['column' => 'Paid', 'operator' => 'is_checked', 'value' => null],
        ];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // header + Alice (active, TRUE) + Carol (active, TRUE)
        $this->assertCount(3, $result);
    }

    public function test_unknown_column_is_skipped_and_row_included(): void
    {
        $config = [['column' => 'NonExistent', 'operator' => 'equals', 'value' => 'X']];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        // All rows included because the rule can't be evaluated
        $this->assertCount(5, $result);
    }

    public function test_header_row_is_always_preserved(): void
    {
        $config = [['column' => 'Name', 'operator' => 'equals', 'value' => 'Nobody']];
        $result = $this->makeService()->filterRows($this->rows(), $config);

        $this->assertCount(1, $result);
        $this->assertSame(['Name', 'Status', 'Paid', 'Email'], $result[0]);
    }
}
