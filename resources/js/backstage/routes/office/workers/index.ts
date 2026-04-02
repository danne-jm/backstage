import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OfficeController::add
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
export const add = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

add.definition = {
    methods: ["post"],
    url: '/office/{office}/workers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::add
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
add.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return add.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::add
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
add.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::add
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
const addForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: add.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::add
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
addForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: add.url(args, options),
    method: 'post',
})

add.form = addForm

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
export const remove = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

remove.definition = {
    methods: ["delete"],
    url: '/office/{office}/workers',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
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
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
remove.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: remove.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OfficeController::remove
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
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
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
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

const workers = {
    add: Object.assign(add, add),
    remove: Object.assign(remove, remove),
}

export default workers