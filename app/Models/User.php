<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['first_name', 'last_name', 'email', 'password_hash', 'is_locked', 'role', 'permission', 'gmail_provider_id', 'gmail_provider_email', 'gmail_refresh_token', 'pinned', 'last_seen_at'])]
#[Hidden(['password_hash', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'gmail_refresh_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, HasUlids;

    /**
     * Default model attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_locked' => false,
        'role' => 'anonymous',
        'permission' => 'guest',
        'pinned' => '[{"title":"Gmail","url":"https://mail.google.com","icon":"Mail"},{"title":"Google Drive","url":"https://drive.google.com","icon":"Package"},{"title":"ESN Leuven Website","url":"https://esnleuven.be","icon":"Globe"},{"title":"ESN Leuven Store","url":"https://store.esnleuven.be","icon":"ShoppingBag"},{"title":"Linktree","url":"https://linktr.ee/esnleuven","icon":"TreePine"}]',
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
            'password_hash' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_locked' => 'boolean',
            'pinned' => 'array',
            'last_seen_at' => 'datetime',
        ];
    }

    public function getAuthPasswordName()
    {
        return 'password_hash';
    }
}
