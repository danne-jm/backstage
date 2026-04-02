import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
export const connect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: connect.url(options),
    method: 'get',
})

connect.definition = {
    methods: ["get","head"],
    url: '/auth/google/connect',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
connect.url = (options?: RouteQueryOptions) => {
    return connect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
connect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: connect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
connect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: connect.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
const connectForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: connect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
connectForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: connect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::connect
* @see app/Http/Controllers/Auth/GoogleController.php:17
* @route '/auth/google/connect'
*/
connectForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: connect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

connect.form = connectForm

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/auth/google/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
loginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::login
* @see app/Http/Controllers/Auth/GoogleController.php:88
* @route '/auth/google/login'
*/
loginForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

login.form = loginForm

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/auth/google/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\GoogleController::callback
* @see app/Http/Controllers/Auth/GoogleController.php:35
* @route '/auth/google/callback'
*/
callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

callback.form = callbackForm

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

const google = {
    connect: Object.assign(connect, connect),
    login: Object.assign(login, login),
    callback: Object.assign(callback, callback),
    disconnect: Object.assign(disconnect, disconnect),
}

export default google