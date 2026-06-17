<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = 50;

        $query = Activity::with('causer', 'subject')
            ->latest();

        // Optional search filter by causer email
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHasMorph('causer', [User::class], fn ($q) => $q->where('email', 'like', "%{$search}%"));
        }

        // Optional filter by subject type (e.g. Event, Product)
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->input('subject_type'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('backstage/audit-log/index', [
            'logs' => $paginator->through(fn (Activity $activity) => [
                'id' => $activity->id,
                'event' => $activity->event,
                'description' => $activity->description,
                'subject_type' => class_basename($activity->subject_type ?? ''),
                'subject_id' => $activity->subject_id,
                'causer' => $activity->causer ? [
                    'id' => $activity->causer->id,
                    'email' => $activity->causer->email,
                    'name' => $activity->causer->first_name.' '.$activity->causer->last_name,
                ] : null,
                'changes' => $activity->changes,
                'occurred_at' => $activity->created_at->toIso8601String(),
            ]),
            'filters' => $request->only(['search', 'subject_type']),
        ]);
    }
}
