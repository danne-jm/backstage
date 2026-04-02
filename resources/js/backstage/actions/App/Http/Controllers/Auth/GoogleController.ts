import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
export const redirectToConnect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToConnect.url(options),
    method: 'get',
})

redirectToConnect.definition = {
    methods: ["get","head"],
    url: '/auth/google/connect',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
redirectToConnect.url = (options?: RouteQueryOptions) => {
    return redirectToConnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
redirectToConnect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToConnect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
redirectToConnect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirectToConnect.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
const redirectToConnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToConnect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
redirectToConnectForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToConnect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToConnect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
redirectToConnectForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToConnect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

redirectToConnect.form = redirectToConnectForm

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
export const redirectToLogin = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToLogin.url(options),
    method: 'get',
})

redirectToLogin.definition = {
    methods: ["get","head"],
    url: '/auth/google/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
redirectToLogin.url = (options?: RouteQueryOptions) => {
    return redirectToLogin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
redirectToLogin.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToLogin.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
redirectToLogin.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirectToLogin.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
const redirectToLoginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToLogin.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
redirectToLoginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToLogin.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::redirectToLogin
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
redirectToLoginForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirectToLogin.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

redirectToLogin.form = redirectToLoginForm

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
export const handleConnectCallback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleConnectCallback.url(options),
    method: 'get',
})

handleConnectCallback.definition = {
    methods: ["get","head"],
    url: '/auth/google/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
handleConnectCallback.url = (options?: RouteQueryOptions) => {
    return handleConnectCallback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
handleConnectCallback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleConnectCallback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
handleConnectCallback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: handleConnectCallback.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
const handleConnectCallbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: handleConnectCallback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
handleConnectCallbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: handleConnectCallback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::handleConnectCallback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
handleConnectCallbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: handleConnectCallback.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

handleConnectCallback.form = handleConnectCallbackForm

/**
* @see \App\Http\Controllers\Auth\GoogleController::disconnect
* @see app/Http/Controllers/Auth/GoogleController.php:100
* @route '/auth/google/disconnect'
*/
export const disconnect = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: disconnect.url(options),
    method: 'delete',
})

disconnect.definition = {
    methods: ["delete"],
    url: '/auth/google/disconnect',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::disconnect
* @see app/Http/Controllers/Auth/GoogleController.php:100
* @route '/auth/google/disconnect'
*/
disconnect.url = (options?: RouteQueryOptions) => {
    return disconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::disconnect
* @see app/Http/Controllers/Auth/GoogleController.php:100
* @route '/auth/google/disconnect'
*/
disconnect.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: disconnect.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::disconnect
* @see app/Http/Controllers/Auth/GoogleController.php:100
* @route '/auth/google/disconnect'
*/
const disconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disconnect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::disconnect
* @see app/Http/Controllers/Auth/GoogleController.php:100
* @route '/auth/google/disconnect'
*/
disconnectForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disconnect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

disconnect.form = disconnectForm

const GoogleController = { redirectToConnect, redirectToLogin, handleConnectCallback, disconnect }

export default GoogleController