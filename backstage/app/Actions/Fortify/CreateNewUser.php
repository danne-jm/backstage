<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        // Split provided name into first/last name if possible.
        $firstName = $input['first_name'] ?? null;
        $lastName = $input['last_name'] ?? null;
        if (empty($firstName) && ! empty($input['name'])) {
            $parts = preg_split('/\s+/', trim($input['name']), 2);
            $firstName = $parts[0] ?? null;
            $lastName = $parts[1] ?? null;
        }

        return User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $input['email'],
            'password_hash' => Hash::make($input['password']),
        ]);
    }
}
