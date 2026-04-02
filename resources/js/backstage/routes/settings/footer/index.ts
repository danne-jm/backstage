import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\FooterController::update
* @see app/Http/Controllers/Settings/FooterController.php:18
* @route '/settings/footer'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/settings/footer',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Settings\FooterController::update
* @see app/Http/Controllers/Settings/FooterController.php:18
* @route '/settings/footer'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\FooterController::update
* @see app/Http/Controllers/Settings/FooterController.php:18
* @route '/settings/footer'
*/
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::update
* @see app/Http/Controllers/Settings/FooterController.php:18
* @route '/settings/footer'
*/
const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::update
* @see app/Http/Controllers/Settings/FooterController.php:18
* @route '/settings/footer'
*/
updateForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

const footer = {
    update: Object.assign(update, update),
}

export default footer