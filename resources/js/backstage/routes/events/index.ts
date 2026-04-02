import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import attendeesA703fb from './attendees'
/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
export const attendees = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendees.url(args, options),
    method: 'get',
})

attendees.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/attendees',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
attendees.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { event: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            event: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        event: typeof args.event === 'object'
        ? args.event.id
        : args.event,
    }

    return attendees.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
attendees.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
attendees.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: attendees.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
const attendeesForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
attendeesForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::attendees
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
attendeesForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

attendees.form = attendeesForm

const events = {
    attendees: Object.assign(attendees, attendeesA703fb),
}

export default events