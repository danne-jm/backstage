<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FooterController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/footer');
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'footer_links' => ['required', 'array'],
            'footer_links.*.label' => ['required', 'string', 'max:255'],
            'footer_links.*.url' => ['required', 'string', 'url', 'max:2048'],
            'footer_links.*.icon' => ['required', 'string', 'max:100'],
        ]);

        $request->user()->update([
            'footer_links' => $validated['footer_links'],
        ]);

        return to_route('settings.footer');
    }
}
