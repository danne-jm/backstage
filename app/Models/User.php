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

#[Fillable(['first_name', 'last_name', 'email', 'password_hash', 'is_locked', 'gmail_provider_id', 'gmail_provider_email', 'gmail_refresh_token', 'pinned', 'footer_links', 'last_seen_at'])]
#[Hidden(['password_hash', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'gmail_refresh_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, HasUlids;

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
            'footer_links' => 'array',
            'last_seen_at' => 'datetime',
        ];
    }

    public function getAuthPasswordName()
    {
        return 'password_hash';
    }
}
