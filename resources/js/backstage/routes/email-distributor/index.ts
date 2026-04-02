import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import mailsE06fe8 from './mails'
/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
export const attendees = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendees.url(args, options),
    method: 'get',
})

attendees.definition = {
    methods: ["get","head"],
    url: '/email-distributor/attendees/{event}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
attendees.url = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return attendees.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
attendees.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
attendees.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: attendees.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
const attendeesForm = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
attendeesForm.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendees
* @see app/Http/Controllers/EmailDistributorController.php:50
* @route '/email-distributor/attendees/{event}'
*/
attendeesForm.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendees.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

attendees.form = attendeesForm

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
export const attendeesAll = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendeesAll.url(args, options),
    method: 'get',
})

attendeesAll.definition = {
    methods: ["get","head"],
    url: '/email-distributor/attendees-all/{event}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
attendeesAll.url = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return attendeesAll.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
attendeesAll.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attendeesAll.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
attendeesAll.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: attendeesAll.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
const attendeesAllForm = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendeesAll.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
attendeesAllForm.get = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendeesAll.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::attendeesAll
* @see app/Http/Controllers/EmailDistributorController.php:83
* @route '/email-distributor/attendees-all/{event}'
*/
attendeesAllForm.head = (args: { event: string | number } | [event: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: attendeesAll.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

attendeesAll.form = attendeesAllForm

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
export const mails = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mails.url(options),
    method: 'get',
})

mails.definition = {
    methods: ["get","head"],
    url: '/email-distributor/mails',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
mails.url = (options?: RouteQueryOptions) => {
    return mails.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
mails.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mails.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
mails.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mails.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
const mailsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mails.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
mailsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mails.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::mails
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
mailsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mails.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

mails.form = mailsForm

const emailDistributor = {
    attendees: Object.assign(attendees, attendees),
    attendeesAll: Object.assign(attendeesAll, attendeesAll),
    mails: Object.assign(mails, mailsE06fe8),
}

export default emailDistributor