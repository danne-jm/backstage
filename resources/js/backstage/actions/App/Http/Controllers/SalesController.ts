import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
export const summary = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: summary.url(options),
    method: 'get',
})

summary.definition = {
    methods: ["get","head"],
    url: '/sales/summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
summary.url = (options?: RouteQueryOptions) => {
    return summary.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
summary.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: summary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
summary.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: summary.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
const summaryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: summary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
summaryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: summary.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SalesController::summary
* @see app/Http/Controllers/SalesController.php:18
* @route '/sales/summary'
*/
summaryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: summary.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

summary.form = summaryForm

const SalesController = { summary }

export default SalesController