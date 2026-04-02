import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DistributionController::distribute
* @see app/Http/Controllers/DistributionController.php:26
* @route '/distribution/distribute'
*/
export const distribute = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: distribute.url(options),
    method: 'post',
})

distribute.definition = {
    methods: ["post"],
    url: '/distribution/distribute',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DistributionController::distribute
* @see app/Http/Controllers/DistributionController.php:26
* @route '/distribution/distribute'
*/
distribute.url = (options?: RouteQueryOptions) => {
    return distribute.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DistributionController::distribute
* @see app/Http/Controllers/DistributionController.php:26
* @route '/distribution/distribute'
*/
distribute.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: distribute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DistributionController::distribute
* @see app/Http/Controllers/DistributionController.php:26
* @route '/distribution/distribute'
*/
const distributeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: distribute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\DistributionController::distribute
* @see app/Http/Controllers/DistributionController.php:26
* @route '/distribution/distribute'
*/
distributeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: distribute.url(options),
    method: 'post',
})

distribute.form = distributeForm

const distribution = {
    distribute: Object.assign(distribute, distribute),
}

export default distribution