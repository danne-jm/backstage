import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/email-distributor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::index
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
export const getAttendees = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAttendees.url(args, options),
    method: 'get',
})

getAttendees.definition = {
    methods: ["get","head"],
    url: '/email-distributor/attendees/{event}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
getAttendees.url = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

    if (Array.isArray(args)) {
        args = {
            event: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        event: args.event,
    }

    return getAttendees.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
getAttendees.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
getAttendees.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAttendees.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
const getAttendeesForm = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
getAttendeesForm.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAttendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
getAttendeesForm.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAttendees.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAttendees.form = getAttendeesForm

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
export const getAllAttendees = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllAttendees.url(args, options),
    method: 'get',
})

getAllAttendees.definition = {
    methods: ["get","head"],
    url: '/email-distributor/attendees-all/{event}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
getAllAttendees.url = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

    if (Array.isArray(args)) {
        args = {
            event: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        event: args.event,
    }

    return getAllAttendees.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
getAllAttendees.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
getAllAttendees.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAllAttendees.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
const getAllAttendeesForm = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
getAllAttendeesForm.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllAttendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::getAllAttendees
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
getAllAttendeesForm.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllAttendees.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAllAttendees.form = getAllAttendeesForm

const EmailDistributorController = { index, getAttendees, getAllAttendees }

export default EmailDistributorController