import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
*/
loginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:47
* @route '/login'
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
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::logout
* @see vendor/laravel/fortify/src/Http/Controllers/AuthenticatedSessionController.php:100
* @route '/logout'
*/
logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

logout.form = logoutForm

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
registerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url(options),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RegisteredUserController::register
* @see vendor/laravel/fortify/src/Http/Controllers/RegisteredUserController.php:41
* @route '/register'
*/
registerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: register.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

register.form = registerForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
export const home = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

home.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.url = (options?: RouteQueryOptions) => {
    return home.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: home.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
const homeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

home.form = homeForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/dashboard'
*/
dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

dashboard.form = dashboardForm

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
export const office = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: office.url(options),
    method: 'get',
})

office.definition = {
    methods: ["get","head"],
    url: '/office',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
office.url = (options?: RouteQueryOptions) => {
    return office.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
office.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: office.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
office.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: office.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
const officeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: office.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
officeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: office.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::office
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
officeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: office.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

office.form = officeForm

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
export const sellables = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sellables.url(options),
    method: 'get',
})

sellables.definition = {
    methods: ["get","head"],
    url: '/sellables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
sellables.url = (options?: RouteQueryOptions) => {
    return sellables.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
sellables.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sellables.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
sellables.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sellables.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
const sellablesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sellables.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
sellablesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sellables.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::sellables
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
sellablesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: sellables.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

sellables.form = sellablesForm

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
export const ticketScanner = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticketScanner.url(options),
    method: 'get',
})

ticketScanner.definition = {
    methods: ["get","head"],
    url: '/ticket-scanner',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
ticketScanner.url = (options?: RouteQueryOptions) => {
    return ticketScanner.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
ticketScanner.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticketScanner.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
ticketScanner.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ticketScanner.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
const ticketScannerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticketScanner.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
ticketScannerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticketScanner.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\TicketScannerController::ticketScanner
* @see app/Http/Controllers/TicketScannerController.php:18
* @route '/ticket-scanner'
*/
ticketScannerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticketScanner.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ticketScanner.form = ticketScannerForm

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
export const emailDistributor = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: emailDistributor.url(options),
    method: 'get',
})

emailDistributor.definition = {
    methods: ["get","head"],
    url: '/email-distributor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
emailDistributor.url = (options?: RouteQueryOptions) => {
    return emailDistributor.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
emailDistributor.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: emailDistributor.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
emailDistributor.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: emailDistributor.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
const emailDistributorForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: emailDistributor.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
emailDistributorForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: emailDistributor.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\EmailDistributorController::emailDistributor
* @see app/Http/Controllers/EmailDistributorController.php:30
* @route '/email-distributor'
*/
emailDistributorForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: emailDistributor.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

emailDistributor.form = emailDistributorForm

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
export const inventory = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(options),
    method: 'get',
})

inventory.definition = {
    methods: ["get","head"],
    url: '/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
inventory.url = (options?: RouteQueryOptions) => {
    return inventory.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
inventory.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
inventory.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: inventory.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
const inventoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
inventoryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\InventoryController::inventory
* @see app/Http/Controllers/InventoryController.php:16
* @route '/inventory'
*/
inventoryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

inventory.form = inventoryForm

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
export const storeManager = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: storeManager.url(options),
    method: 'get',
})

storeManager.definition = {
    methods: ["get","head"],
    url: '/store-manager',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
storeManager.url = (options?: RouteQueryOptions) => {
    return storeManager.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
storeManager.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: storeManager.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
storeManager.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: storeManager.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
const storeManagerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: storeManager.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
storeManagerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: storeManager.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/store-manager'
*/
storeManagerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: storeManager.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

storeManager.form = storeManagerForm
