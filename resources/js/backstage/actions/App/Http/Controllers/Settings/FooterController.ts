import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
export const edit = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/settings/footer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
edit.url = (options?: RouteQueryOptions) => {
    return edit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
edit.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
edit.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
const editForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
editForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::edit
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
editForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

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

const FooterController = { edit, update }

export default FooterController