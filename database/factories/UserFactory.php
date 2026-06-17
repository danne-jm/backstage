<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password_hash' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'pinned' => false,
            'role' => 'user',
            'last_seen_at' => null,
            'attributes' => null,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn(array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    /**
     * Grant the user a specific list of permissions.
     */
    public function withPermissions(array $permissions): static
    {
        return $this->state(fn(array $attributes) => [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Grant every known backstage permission — useful in feature tests that
     * exercise endpoints rather than the permission system itself.
     */
    public function withAllPermissions(): static
    {
        return $this->withPermissions([
            'view_dashboard',
            'view_ticket_scanner', 'import_tickets', 'scan_tickets',
            'view_office', 'create_office', 'update_office',
            'view_store_manager',
            'view_sellables',
            'create_product', 'update_product', 'delete_product',
            'create_event', 'update_event', 'delete_event',
            'view_event_attendees', 'update_event_attendee_config', 'update_event_attendee',
            'view_inventory', 'create_item', 'update_item', 'delete_item',
            'view_settings_profile', 'update_settings_profile', 'delete_account',
            'view_settings_password', 'update_settings_password',
            'view_settings_appearance',
            'view_settings_2fa',
            'view_settings_users', 'create_user', 'update_user', 'delete_user',
            'view_settings_google', 'view_settings_footer', 'update_settings_footer',
            'view_audit_log',
            'view_email_distributor', 'send_email_distribution',
        ]);
    }
}
