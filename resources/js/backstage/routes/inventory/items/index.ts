import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryController::store
* @see app/Http/Controllers/InventoryController.php:31
* @route '/inventory/items'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventory/items',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::store
* @see app/Http/Controllers/InventoryController.php:31
* @route '/inventory/items'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::store
* @see app/Http/Controllers/InventoryController.php:31
* @route '/inventory/items'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::store
* @see app/Http/Controllers/InventoryController.php:31
* @route '/inventory/items'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::store
* @see app/Http/Controllers/InventoryController.php:31
* @route '/inventory/items'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\InventoryController::increment
* @see app/Http/Controllers/InventoryController.php:79
* @route '/inventory/items/{item}/increment'
*/
export const increment = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: increment.url(args, options),
    method: 'post',
})

increment.definition = {
    methods: ["post"],
    url: '/inventory/items/{item}/increment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::increment
* @see app/Http/Controllers/InventoryController.php:79
* @route '/inventory/items/{item}/increment'
*/
increment.url = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { item: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: typeof args.item === 'object'
        ? args.item.id
        : args.item,
    }

    return increment.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::increment
* @see app/Http/Controllers/InventoryController.php:79
* @route '/inventory/items/{item}/increment'
*/
increment.post = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: increment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::increment
* @see app/Http/Controllers/InventoryController.php:79
* @route '/inventory/items/{item}/increment'
*/
const incrementForm = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: increment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::increment
* @see app/Http/Controllers/InventoryController.php:79
* @route '/inventory/items/{item}/increment'
*/
incrementForm.post = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: increment.url(args, options),
    method: 'post',
})

increment.form = incrementForm

/**
* @see \App\Http\Controllers\InventoryController::decrement
* @see app/Http/Controllers/InventoryController.php:92
* @route '/inventory/items/{item}/decrement'
*/
export const decrement = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decrement.url(args, options),
    method: 'post',
})

decrement.definition = {
    methods: ["post"],
    url: '/inventory/items/{item}/decrement',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::decrement
* @see app/Http/Controllers/InventoryController.php:92
* @route '/inventory/items/{item}/decrement'
*/
decrement.url = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { item: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: typeof args.item === 'object'
        ? args.item.id
        : args.item,
    }

    return decrement.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::decrement
* @see app/Http/Controllers/InventoryController.php:92
* @route '/inventory/items/{item}/decrement'
*/
decrement.post = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decrement.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::decrement
* @see app/Http/Controllers/InventoryController.php:92
* @route '/inventory/items/{item}/decrement'
*/
const decrementForm = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: decrement.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::decrement
* @see app/Http/Controllers/InventoryController.php:92
* @route '/inventory/items/{item}/decrement'
*/
decrementForm.post = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: decrement.url(args, options),
    method: 'post',
})

decrement.form = decrementForm

/**
* @see \App\Http\Controllers\InventoryController::update
* @see app/Http/Controllers/InventoryController.php:55
* @route '/inventory/items/{item}'
*/
export const update = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/inventory/items/{item}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::update
* @see app/Http/Controllers/InventoryController.php:55
* @route '/inventory/items/{item}'
*/
update.url = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { item: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: typeof args.item === 'object'
        ? args.item.id
        : args.item,
    }

    return update.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::update
* @see app/Http/Controllers/InventoryController.php:55
* @route '/inventory/items/{item}'
*/
update.put = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\InventoryController::update
* @see app/Http/Controllers/InventoryController.php:55
* @route '/inventory/items/{item}'
*/
const updateForm = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::update
* @see app/Http/Controllers/InventoryController.php:55
* @route '/inventory/items/{item}'
*/
updateForm.put = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\InventoryController::destroy
* @see app/Http/Controllers/InventoryController.php:108
* @route '/inventory/items/{item}'
*/
export const destroy = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/inventory/items/{item}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\InventoryController::destroy
* @see app/Http/Controllers/InventoryController.php:108
* @route '/inventory/items/{item}'
*/
destroy.url = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { item: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: typeof args.item === 'object'
        ? args.item.id
        : args.item,
    }

    return destroy.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::destroy
* @see app/Http/Controllers/InventoryController.php:108
* @route '/inventory/items/{item}'
*/
destroy.delete = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\InventoryController::destroy
* @see app/Http/Controllers/InventoryController.php:108
* @route '/inventory/items/{item}'
*/
const destroyForm = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\InventoryController::destroy
* @see app/Http/Controllers/InventoryController.php:108
* @route '/inventory/items/{item}'
*/
destroyForm.delete = (args: { item: string | { id: string } } | [item: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const items = {
    store: Object.assign(store, store),
    increment: Object.assign(increment, increment),
    decrement: Object.assign(decrement, decrement),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default items