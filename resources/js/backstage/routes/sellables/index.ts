import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import products from './products'
import events from './events'
/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
export const expired = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

expired.definition = {
    methods: ["get","head"],
    url: '/sellables/expired',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.url = (options?: RouteQueryOptions) => {
    return expired.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expired.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
const expiredForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expiredForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expiredForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

expired.form = expiredForm

const sellables = {
    expired: Object.assign(expired, expired),
    products: Object.assign(products, products),
    events: Object.assign(events, events),
}

export default sellables