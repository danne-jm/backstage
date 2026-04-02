import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
export const index = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/attendees',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
index.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return index.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
index.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
index.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
const indexForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
indexForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::index
* @see app/Http/Controllers/EventAttendeeController.php:22
* @route '/sellables/events/{event}/attendees'
*/
indexForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\EventAttendeeController::updateConfiguration
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
export const updateConfiguration = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateConfiguration.url(args, options),
    method: 'post',
})

updateConfiguration.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/config',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::updateConfiguration
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
updateConfiguration.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateConfiguration.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::updateConfiguration
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
updateConfiguration.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateConfiguration.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::updateConfiguration
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
const updateConfigurationForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateConfiguration.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::updateConfiguration
* @see app/Http/Controllers/EventAttendeeController.php:29
* @route '/sellables/events/{event}/attendees/config'
*/
updateConfigurationForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateConfiguration.url(args, options),
    method: 'post',
})

updateConfiguration.form = updateConfigurationForm

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
export const listSheets = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listSheets.url(args, options),
    method: 'get',
})

listSheets.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/sheets',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
listSheets.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return listSheets.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
listSheets.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listSheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
listSheets.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: listSheets.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
const listSheetsForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listSheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
listSheetsForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listSheets.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::listSheets
* @see app/Http/Controllers/EventAttendeeController.php:41
* @route '/sellables/events/{event}/sheets'
*/
listSheetsForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listSheets.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

listSheets.form = listSheetsForm

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
export const getSheetData = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSheetData.url(args, options),
    method: 'get',
})

getSheetData.definition = {
    methods: ["get","head"],
    url: '/sellables/events/{event}/sheet-data',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
getSheetData.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return getSheetData.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
getSheetData.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
getSheetData.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getSheetData.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
const getSheetDataForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
getSheetDataForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSheetData.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::getSheetData
* @see app/Http/Controllers/EventAttendeeController.php:59
* @route '/sellables/events/{event}/sheet-data'
*/
getSheetDataForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getSheetData.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getSheetData.form = getSheetDataForm

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
* @see \App\Http\Controllers\EventAttendeeController::updateFilter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
export const updateFilter = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateFilter.url(args, options),
    method: 'post',
})

updateFilter.definition = {
    methods: ["post"],
    url: '/sellables/events/{event}/attendees/filter',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventAttendeeController::updateFilter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
updateFilter.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateFilter.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventAttendeeController::updateFilter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
updateFilter.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateFilter.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::updateFilter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
const updateFilterForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateFilter.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EventAttendeeController::updateFilter
* @see app/Http/Controllers/EventAttendeeController.php:103
* @route '/sellables/events/{event}/attendees/filter'
*/
updateFilterForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateFilter.url(args, options),
    method: 'post',
})

updateFilter.form = updateFilterForm

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

const EventAttendeeController = { index, updateConfiguration, listSheets, getSheetData, update, updateFilter, validatePurchases, verifyEmails }

export default EventAttendeeController