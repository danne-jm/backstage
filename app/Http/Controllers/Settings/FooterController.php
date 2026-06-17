<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FooterController extends Controller
{
    /**
     * Show the footer settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/footer');
    }

    /**
     * Update the user's pinned footer links.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'pinned' => ['array'],
            'pinned.*.title' => ['required', 'string', 'max:255'],
            'pinned.*.url' => ['required', 'string', 'url', 'max:255'],
            'pinned.*.icon' => ['required', 'string', 'max:50'],
        ]);

        $request->user()->update([
            'pinned' => $request->input('pinned', []),
        ]);

        return back()->with('success', 'Footer links updated successfully.');
    }
}
