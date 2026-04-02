import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/ticket-scanner',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::index
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
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
* @see \App\Http\Controllers\TicketScannerController::importMethod
* @see app/Http/Controllers/TicketScannerController.php:29
* @route '/ticket-scanner/import'
*/
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/ticket-scanner/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TicketScannerController::importMethod
* @see app/Http/Controllers/TicketScannerController.php:29
* @route '/ticket-scanner/import'
*/
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::importMethod
* @see app/Http/Controllers/TicketScannerController.php:29
* @route '/ticket-scanner/import'
*/
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TicketScannerController::importMethod
* @see app/Http/Controllers/TicketScannerController.php:29
* @route '/ticket-scanner/import'
*/
const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TicketScannerController::importMethod
* @see app/Http/Controllers/TicketScannerController.php:29
* @route '/ticket-scanner/import'
*/
importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
})

importMethod.form = importMethodForm

/**
* @see \App\Http\Controllers\TicketScannerController::verify
* @see app/Http/Controllers/TicketScannerController.php:69
* @route '/ticket-scanner/verify'
*/
export const verify = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

verify.definition = {
    methods: ["post"],
    url: '/ticket-scanner/verify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TicketScannerController::verify
* @see app/Http/Controllers/TicketScannerController.php:69
* @route '/ticket-scanner/verify'
*/
verify.url = (options?: RouteQueryOptions) => {
    return verify.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::verify
* @see app/Http/Controllers/TicketScannerController.php:69
* @route '/ticket-scanner/verify'
*/
verify.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verify.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TicketScannerController::verify
* @see app/Http/Controllers/TicketScannerController.php:69
* @route '/ticket-scanner/verify'
*/
const verifyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: verify.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TicketScannerController::verify
* @see app/Http/Controllers/TicketScannerController.php:69
* @route '/ticket-scanner/verify'
*/
verifyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: verify.url(options),
    method: 'post',
})

verify.form = verifyForm

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
export const availableTickets = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: availableTickets.url(options),
    method: 'get',
})

availableTickets.definition = {
    methods: ["get","head"],
    url: '/ticket-scanner/available-tickets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
availableTickets.url = (options?: RouteQueryOptions) => {
    return availableTickets.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
availableTickets.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: availableTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
availableTickets.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: availableTickets.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
const availableTicketsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: availableTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
availableTicketsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: availableTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::availableTickets
* @see app/Http/Controllers/TicketScannerController.php:45
* @route '/ticket-scanner/available-tickets'
*/
availableTicketsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: availableTickets.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

availableTickets.form = availableTicketsForm

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
export const scannedTickets = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: scannedTickets.url(options),
    method: 'get',
})

scannedTickets.definition = {
    methods: ["get","head"],
    url: '/ticket-scanner/scanned-tickets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
scannedTickets.url = (options?: RouteQueryOptions) => {
    return scannedTickets.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
scannedTickets.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: scannedTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
scannedTickets.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: scannedTickets.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
const scannedTicketsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: scannedTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
scannedTicketsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: scannedTickets.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::scannedTickets
* @see app/Http/Controllers/TicketScannerController.php:57
* @route '/ticket-scanner/scanned-tickets'
*/
scannedTicketsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: scannedTickets.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

scannedTickets.form = scannedTicketsForm

const TicketScannerController = { index, importMethod, verify, availableTickets, scannedTickets, import: importMethod }

export default TicketScannerController