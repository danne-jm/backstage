<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password_hash',
        'gmail_refresh_token',
        'gmail_provider_id',
        'gmail_provider_email',
        'pinned',
        'role',
        'last_seen_at',
        'attributes',
        'footer_links',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPasswordName()
    {
        return 'password_hash';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    /**
     * Default footer links shown in the app sidebar.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'footer_links' => '[
            {"label":"Gmail","url":"https://mail.google.com/","icon":"Mail"},
            {"label":"Google Drive","url":"https://drive.google.com/","icon":"Container"},
            {"label":"ESN Leuven Website","url":"https://www.esnleuven.be/","icon":"Globe"},
            {"label":"ESN Leuven Store","url":"https://esn-leuven.sumupstore.com/","icon":"ShoppingBag"},
            {"label":"Linktree","url":"https://linktr.ee/esnleuven","icon":"TreeDeciduous"}
        ]',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_hash' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'pinned' => 'array',
            'last_seen_at' => 'datetime',
            'attributes' => 'array',
            'footer_links' => 'array',
        ];
    }
}
