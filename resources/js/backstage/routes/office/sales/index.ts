import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OfficeController::record
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
export const record = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: record.url(args, options),
    method: 'post',
})

record.definition = {
    methods: ["post"],
    url: '/office/{office}/record-sale',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::record
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
record.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return record.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::record
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
record.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: record.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::record
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
const recordForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: record.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::record
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
recordForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: record.url(args, options),
    method: 'post',
})

record.form = recordForm

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
export const remove = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

remove.definition = {
    methods: ["delete"],
    url: '/office/{office}/remove-sale',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
remove.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return remove.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
remove.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
const removeForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: remove.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
removeForm.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: remove.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

remove.form = removeForm

const sales = {
    record: Object.assign(record, record),
    remove: Object.assign(remove, remove),
}

export default sales