import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/email-distributor/mails',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::index
* @see app/Http/Controllers/MailsController.php:14
* @route '/email-distributor/mails'
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
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
export const getTicketForMail = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getTicketForMail.url(args, options),
    method: 'get',
})

getTicketForMail.definition = {
    methods: ["get","head"],
    url: '/email-distributor/mails/{mail}/ticket',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
getTicketForMail.url = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return getTicketForMail.definition.url
            .replace('{mail}', parsedArgs.mail.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
getTicketForMail.get = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getTicketForMail.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
getTicketForMail.head = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getTicketForMail.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
const getTicketForMailForm = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getTicketForMail.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
getTicketForMailForm.get = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getTicketForMail.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MailsController::getTicketForMail
* @see app/Http/Controllers/MailsController.php:64
* @route '/email-distributor/mails/{mail}/ticket'
*/
getTicketForMailForm.head = (args: { mail: string | { id: string } } | [mail: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getTicketForMail.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getTicketForMail.form = getTicketForMailForm

const MailsController = { index, getTicketForMail }

export default MailsController