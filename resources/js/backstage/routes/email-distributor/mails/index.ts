import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
export const ticket = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticket.url(args, options),
    method: 'get',
})

ticket.definition = {
    methods: ["get","head"],
    url: '/email-distributor/mails/{mail}/ticket',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
ticket.url = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { mail: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { mail: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            mail: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        mail: typeof args.mail === 'object'
        ? args.mail.id
        : args.mail,
    }

    return ticket.definition.url
            .replace('{mail}', parsedArgs.mail.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
ticket.get = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
ticket.head = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ticket.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
const ticketForm = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
ticketForm.get = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::ticket
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
ticketForm.head = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ticket.form = ticketForm

const mails = {
    ticket: Object.assign(ticket, ticket),
}

export default mails