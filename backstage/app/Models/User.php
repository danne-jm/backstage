<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, \Illuminate\Database\Eloquent\Concerns\HasUlids, Notifiable, TwoFactorAuthenticatable;

    use \Spatie\Activitylog\Traits\LogsActivity;

    public function getActivitylogOptions(): \Spatie\Activitylog\LogOptions
    {
        return \Spatie\Activitylog\LogOptions::defaults()
            ->logOnly([
                'role',
                'legacy_permissions',
                'email',
                'first_name',
                'last_name',
                'pinned',
                'theme',
                'password_hash',
                'gmail_provider_email',
                'two_factor_confirmed_at',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        // SECURITY: 'password_hash', 'gmail_refresh_token', 'gmail_provider_id', 'gmail_provider_email'
        // and 'legacy_permissions'/'role' are intentionally NOT fillable to prevent Mass Assignment vulnerability.
        // Use forceFill() in controllers to set these fields.
        'pinned',
        'last_seen_at',
    ];

    /**
     * Default attribute values for the model.
     * Ensure new users have a sensible pinned default server-side (db will also be seeded/migrated).
     * Stored as JSON on the DB and cast to array via casts().
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        // Default pinned quick links for new users. Stored as JSON in DB and cast to array.
        'pinned' => '[
            {"title":"Gmail","href":"https://mail.google.com/","icon":"Mail"},
            {"title":"Google Drive","href":"https://drive.google.com/","icon":"Container"},
            {"title":"ESN Leuven Website","href":"https://www.esnleuven.be/","icon":"Globe"},
            {"title":"ESN Leuven Store","href":"https://esn-leuven.sumupstore.com/","icon":"ShoppingBag"},
            {"title":"Linktree","href":"https://linktr.ee/esnleuven","icon":"TreeDeciduous"}
        ]',
        // Default permissions assigned to newly created users. Stored as JSON array and cast to array.
        'legacy_permissions' => '["guest"]',
        // Default role for new users when none is provided
        'role' => 'Anonymous',
    ];

    /**
     * Hide sensitive attributes from array / JSON outputs.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'gmail_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'legacy_permissions' => 'array',
            'role' => 'string',
            'pinned' => 'array',
            'last_seen_at' => 'datetime',
            'gmail_refresh_token' => 'encrypted',
        ];
    }

    /**
     * Custom accessor for the pinned attribute to handle double-encoded JSON.
     */
    protected function pinned(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (is_null($value)) {
                    return [];
                }

                // If it's already an array, return it
                if (is_array($value)) {
                    return $value;
                }

                // Try to decode if it's a JSON string
                $decoded = json_decode($value, true);

                // If the decoded value is still a string (double-encoded), decode again
                if (is_string($decoded)) {
                    $decoded = json_decode($decoded, true);
                }

                return is_array($decoded) ? $decoded : [];
            },
            set: fn ($value) => is_array($value) ? json_encode($value) : $value
        );
    }

    /**
     * @deprecated Use $this->can() or $this->hasPermissionTo() instead.
     */
    public function hasPermission($permission): bool
    {
        return $this->can($permission instanceof \App\Enums\UserPermission ? $permission->value : $permission);
    }

    /**
     * Return the password for the authentication broker.
     * This tells Laravel to use the `password_hash` column.
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Allow setting `password` on the model and store it hashed into `password_hash`.
     * This keeps compatibility with code that sets `password` attribute.
     */
    public function setPasswordAttribute($value)
    {
        if (empty($value)) {
            return;
        }

        // Always hash incoming plain passwords.
        $this->attributes['password_hash'] = Hash::needsRehash($value) ? Hash::make($value) : Hash::make($value);
    }

    /**
     * Backwards-compatible accessor for `password` so older tests and code
     * that expect `$user->password` to contain the hashed password continue
     * to work. Returns the underlying `password_hash`.
     */
    public function getPasswordAttribute()
    {
        return $this->password_hash;
    }

    /**
     * Provide a `name` accessor combining first and last name for compatibility.
     */
    public function getNameAttribute(): string
    {
        return trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }
}
