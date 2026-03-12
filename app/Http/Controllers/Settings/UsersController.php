<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('password.confirm', only: ['index']),
        ];
    }

    public function index(): Response
    {
        return Inertia::render('settings/users', [
            'users' => User::orderBy('first_name')->get([
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'last_seen_at',
            ]),
        ]);
    }
}
