import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import image from './image'
/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/sellables/products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::store
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
export const update = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/sellables/products/{product}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
update.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return update.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
update.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SellablesController::update
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
const updateForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
updateForm.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
export const destroy = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sellables/products/{product}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroy.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroy.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
const destroyForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroyForm.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const products = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    image: Object.assign(image, image),
}

export default products