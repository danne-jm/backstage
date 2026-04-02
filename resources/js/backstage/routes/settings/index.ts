import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import footer42f611 from './footer'
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
export const google = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: google.url(options),
    method: 'get',
})

google.definition = {
    methods: ["get","head"],
    url: '/settings/google',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
google.url = (options?: RouteQueryOptions) => {
    return google.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
google.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: google.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
google.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: google.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
const googleForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: google.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
googleForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: google.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/settings/google'
*/
googleForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: google.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

google.form = googleForm

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
export const footer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: footer.url(options),
    method: 'get',
})

footer.definition = {
    methods: ["get","head"],
    url: '/settings/footer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
footer.url = (options?: RouteQueryOptions) => {
    return footer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
footer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: footer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
footer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: footer.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
const footerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: footer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
footerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: footer.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\FooterController::footer
* @see app/Http/Controllers/Settings/FooterController.php:13
* @route '/settings/footer'
*/
footerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: footer.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

footer.form = footerForm

const settings = {
    google: Object.assign(google, google),
    footer: Object.assign(footer, footer42f611),
}

export default settings