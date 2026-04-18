<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(): Response
    {
        $activities = Activity::query()
            ->with('causer')
            ->orderByDesc('created_at')
            ->paginate(50)
            ->through(fn (Activity $a) => [
                'id'          => $a->id,
                'log_name'    => $a->log_name,
                'description' => $a->description,
                'event'       => $a->event,
                'subject_type' => $a->subject_type ? class_basename($a->subject_type) : null,
                'subject_id'  => $a->subject_id,
                'causer_name' => $a->causer
                    ? trim(($a->causer->first_name ?? '') . ' ' . ($a->causer->last_name ?? ''))
                    : null,
                'causer_email' => $a->causer?->email,
                'properties'  => $a->properties->toArray(),
                'created_at'  => $a->created_at?->toISOString(),
            ]);

        return Inertia::render('audit-log', [
            'activities' => $activities,
        ]);
    }
}
