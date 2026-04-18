<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        activity('settings')
            ->causedBy(Auth::user())
            ->withProperties(['link_count' => count($validated['footer_links'])])
            ->log('footer links updated');

        return to_route('settings.footer');
    }
}
