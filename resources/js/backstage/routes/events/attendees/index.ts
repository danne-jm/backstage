import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EventAttendeeController::config
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
export const config = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: config.url(args, options),
    method: 'post',
})

config.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/config',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::config
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
config.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return config.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::config
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
config.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: config.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::config
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
const configForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: config.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::config
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
configForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: config.url(args, options),
    method: 'post',
})

config.form = configForm

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
export const sheets = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sheets.url(args, options),
    method: 'get',
})

sheets.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/sheets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
sheets.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return sheets.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
sheets.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
sheets.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sheets.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
const sheetsForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
sheetsForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
sheetsForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheets.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

sheets.form = sheetsForm

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
export const sheetData = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sheetData.url(args, options),
    method: 'get',
})

sheetData.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/sheet-data',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
sheetData.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return sheetData.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
sheetData.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
sheetData.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sheetData.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
const sheetDataForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
sheetDataForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::sheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
sheetDataForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sheetData.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

sheetData.form = sheetDataForm

/**
* @see \App\Http\Controllers\EventAttendeeController::update
* @see app/Http/Controllers/EventAttendeeController.php:78
* @route '/sellables/events/{event}/attendees/update'
*/
export const update = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/update',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::update
* @see app/Http/Controllers/EventAttendeeController.php:78
* @route '/sellables/events/{event}/attendees/update'
*/
update.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::update
* @see app/Http/Controllers/EventAttendeeController.php:78
* @route '/sellables/events/{event}/attendees/update'
*/
update.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::update
* @see app/Http/Controllers/EventAttendeeController.php:78
* @route '/sellables/events/{event}/attendees/update'
*/
const updateForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::update
* @see app/Http/Controllers/EventAttendeeController.php:78
* @route '/sellables/events/{event}/attendees/update'
*/
updateForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, options),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\EventAttendeeController::filter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
export const filter = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: filter.url(args, options),
    method: 'post',
})

filter.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/filter',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::filter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
filter.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return filter.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::filter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
filter.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: filter.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::filter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
const filterForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: filter.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::filter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
filterForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: filter.url(args, options),
    method: 'post',
})

filter.form = filterForm

/**
* @see \App\Http\Controllers\EventAttendeeController::validatePurchases
* @see app/Http/Controllers/EventAttendeeController.php:116
* @route '/sellables/events/{event}/attendees/validate-purchases'
*/
export const validatePurchases = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validatePurchases.url(args, options),
    method: 'post',
})

validatePurchases.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/validate-purchases',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::validatePurchases
* @see app/Http/Controllers/EventAttendeeController.php:116
* @route '/sellables/events/{event}/attendees/validate-purchases'
*/
validatePurchases.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return validatePurchases.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::validatePurchases
* @see app/Http/Controllers/EventAttendeeController.php:116
* @route '/sellables/events/{event}/attendees/validate-purchases'
*/
validatePurchases.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validatePurchases.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::validatePurchases
* @see app/Http/Controllers/EventAttendeeController.php:116
* @route '/sellables/events/{event}/attendees/validate-purchases'
*/
const validatePurchasesForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validatePurchases.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::validatePurchases
* @see app/Http/Controllers/EventAttendeeController.php:116
* @route '/sellables/events/{event}/attendees/validate-purchases'
*/
validatePurchasesForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validatePurchases.url(args, options),
    method: 'post',
})

validatePurchases.form = validatePurchasesForm

/**
* @see \App\Http\Controllers\EventAttendeeController::verifyEmails
* @see app/Http/Controllers/EventAttendeeController.php:126
* @route '/sellables/events/{event}/attendees/verify-emails'
*/
export const verifyEmails = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyEmails.url(args, options),
    method: 'post',
})

verifyEmails.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/verify-emails',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::verifyEmails
* @see app/Http/Controllers/EventAttendeeController.php:126
* @route '/sellables/events/{event}/attendees/verify-emails'
*/
verifyEmails.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return verifyEmails.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::verifyEmails
* @see app/Http/Controllers/EventAttendeeController.php:126
* @route '/sellables/events/{event}/attendees/verify-emails'
*/
verifyEmails.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyEmails.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::verifyEmails
* @see app/Http/Controllers/EventAttendeeController.php:126
* @route '/sellables/events/{event}/attendees/verify-emails'
*/
const verifyEmailsForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: verifyEmails.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::verifyEmails
* @see app/Http/Controllers/EventAttendeeController.php:126
* @route '/sellables/events/{event}/attendees/verify-emails'
*/
verifyEmailsForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: verifyEmails.url(args, options),
    method: 'post',
})

verifyEmails.form = verifyEmailsForm

const attendees = {
    config: Object.assign(config, config),
    sheets: Object.assign(sheets, sheets),
    sheetData: Object.assign(sheetData, sheetData),
    update: Object.assign(update, update),
    filter: Object.assign(filter, filter),
    validatePurchases: Object.assign(validatePurchases, validatePurchases),
    verifyEmails: Object.assign(verifyEmails, verifyEmails),
}

export default attendees