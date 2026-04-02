import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import image from './image'
/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/sellables/events',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
export const update = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/sellables/events/{event}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
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
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
update.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
const updateForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
updateForm.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
export const destroy = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sellables/events/{event}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroy.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroy.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
const destroyForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroyForm.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const events = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    image: Object.assign(image, image),
}

export default events