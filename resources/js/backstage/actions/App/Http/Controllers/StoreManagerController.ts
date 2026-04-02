import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
export const data = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: data.url(options),
    method: 'get',
})

data.definition = {
    methods: ["get","head"],
    url: '/store-manager/data',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
data.url = (options?: RouteQueryOptions) => {
    return data.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
data.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: data.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
data.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: data.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
const dataForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: data.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
dataForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: data.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\StoreManagerController::data
* @see app/Http/Controllers/StoreManagerController.php:18
* @route '/store-manager/data'
*/
dataForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: data.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

data.form = dataForm

const StoreManagerController = { data }

export default StoreManagerController