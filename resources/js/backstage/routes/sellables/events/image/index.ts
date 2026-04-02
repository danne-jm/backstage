import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
export const destroy = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/sellables/events/image/{image}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroy.url = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { image: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            image: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        image: typeof args.image === 'object'
        ? args.image.id
        : args.image,
    }

    return destroy.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroy.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroy
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
const destroyForm = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroyForm.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const image = {
    destroy: Object.assign(destroy, destroy),
}

export default image