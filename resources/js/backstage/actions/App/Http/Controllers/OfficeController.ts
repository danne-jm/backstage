import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/office',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::index
* @see app/Http/Controllers/OfficeController.php:28
* @route '/office'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\OfficeController::start
* @see app/Http/Controllers/OfficeController.php:73
* @route '/office/start'
*/
export const start = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(options),
    method: 'post',
})

start.definition = {
    methods: ["post"],
    url: '/office/start',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::start
* @see app/Http/Controllers/OfficeController.php:73
* @route '/office/start'
*/
start.url = (options?: RouteQueryOptions) => {
    return start.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::start
* @see app/Http/Controllers/OfficeController.php:73
* @route '/office/start'
*/
start.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::start
* @see app/Http/Controllers/OfficeController.php:73
* @route '/office/start'
*/
const startForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::start
* @see app/Http/Controllers/OfficeController.php:73
* @route '/office/start'
*/
startForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(options),
    method: 'post',
})

start.form = startForm

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
export const show = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/office/{office}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
show.url = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: args.office,
    }

    return show.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
show.get = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
show.head = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
const showForm = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
showForm.get = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\OfficeController::show
* @see app/Http/Controllers/OfficeController.php:84
* @route '/office/{office}'
*/
showForm.head = (args: { office: string | number } | [office: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\OfficeController::end
* @see app/Http/Controllers/OfficeController.php:120
* @route '/office/{office}/end'
*/
export const end = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: end.url(args, options),
    method: 'post',
})

end.definition = {
    methods: ["post"],
    url: '/office/{office}/end',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::end
* @see app/Http/Controllers/OfficeController.php:120
* @route '/office/{office}/end'
*/
end.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return end.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::end
* @see app/Http/Controllers/OfficeController.php:120
* @route '/office/{office}/end'
*/
end.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: end.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::end
* @see app/Http/Controllers/OfficeController.php:120
* @route '/office/{office}/end'
*/
const endForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: end.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::end
* @see app/Http/Controllers/OfficeController.php:120
* @route '/office/{office}/end'
*/
endForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: end.url(args, options),
    method: 'post',
})

end.form = endForm

/**
* @see \App\Http\Controllers\OfficeController::reopen
* @see app/Http/Controllers/OfficeController.php:127
* @route '/office/{office}/reopen'
*/
export const reopen = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopen.url(args, options),
    method: 'post',
})

reopen.definition = {
    methods: ["post"],
    url: '/office/{office}/reopen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::reopen
* @see app/Http/Controllers/OfficeController.php:127
* @route '/office/{office}/reopen'
*/
reopen.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return reopen.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::reopen
* @see app/Http/Controllers/OfficeController.php:127
* @route '/office/{office}/reopen'
*/
reopen.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopen.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::reopen
* @see app/Http/Controllers/OfficeController.php:127
* @route '/office/{office}/reopen'
*/
const reopenForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reopen.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::reopen
* @see app/Http/Controllers/OfficeController.php:127
* @route '/office/{office}/reopen'
*/
reopenForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reopen.url(args, options),
    method: 'post',
})

reopen.form = reopenForm

/**
* @see \App\Http\Controllers\OfficeController::addWorker
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
export const addWorker = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addWorker.url(args, options),
    method: 'post',
})

addWorker.definition = {
    methods: ["post"],
    url: '/office/{office}/workers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::addWorker
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
addWorker.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return addWorker.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::addWorker
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
addWorker.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addWorker.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::addWorker
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
const addWorkerForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: addWorker.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::addWorker
* @see app/Http/Controllers/OfficeController.php:146
* @route '/office/{office}/workers'
*/
addWorkerForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: addWorker.url(args, options),
    method: 'post',
})

addWorker.form = addWorkerForm

/**
* @see \App\Http\Controllers\OfficeController::removeWorker
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
export const removeWorker = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeWorker.url(args, options),
    method: 'delete',
})

removeWorker.definition = {
    methods: ["delete"],
    url: '/office/{office}/workers',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OfficeController::removeWorker
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
removeWorker.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return removeWorker.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::removeWorker
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
removeWorker.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeWorker.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OfficeController::removeWorker
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
const removeWorkerForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeWorker.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::removeWorker
* @see app/Http/Controllers/OfficeController.php:169
* @route '/office/{office}/workers'
*/
removeWorkerForm.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeWorker.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

removeWorker.form = removeWorkerForm

/**
* @see \App\Http\Controllers\OfficeController::recordSale
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
export const recordSale = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordSale.url(args, options),
    method: 'post',
})

recordSale.definition = {
    methods: ["post"],
    url: '/office/{office}/record-sale',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::recordSale
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
recordSale.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return recordSale.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::recordSale
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
recordSale.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recordSale.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::recordSale
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
const recordSaleForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordSale.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::recordSale
* @see app/Http/Controllers/OfficeController.php:180
* @route '/office/{office}/record-sale'
*/
recordSaleForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: recordSale.url(args, options),
    method: 'post',
})

recordSale.form = recordSaleForm

/**
* @see \App\Http\Controllers\OfficeController::removeSale
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
export const removeSale = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeSale.url(args, options),
    method: 'delete',
})

removeSale.definition = {
    methods: ["delete"],
    url: '/office/{office}/remove-sale',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OfficeController::removeSale
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
removeSale.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return removeSale.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::removeSale
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
removeSale.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeSale.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\OfficeController::removeSale
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
const removeSaleForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeSale.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::removeSale
* @see app/Http/Controllers/OfficeController.php:210
* @route '/office/{office}/remove-sale'
*/
removeSaleForm.delete = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeSale.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

removeSale.form = removeSaleForm

/**
* @see \App\Http\Controllers\OfficeController::updateCashBreakdown
* @see app/Http/Controllers/OfficeController.php:219
* @route '/office/{office}/update-cash-breakdown'
*/
export const updateCashBreakdown = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateCashBreakdown.url(args, options),
    method: 'post',
})

updateCashBreakdown.definition = {
    methods: ["post"],
    url: '/office/{office}/update-cash-breakdown',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::updateCashBreakdown
* @see app/Http/Controllers/OfficeController.php:219
* @route '/office/{office}/update-cash-breakdown'
*/
updateCashBreakdown.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return updateCashBreakdown.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::updateCashBreakdown
* @see app/Http/Controllers/OfficeController.php:219
* @route '/office/{office}/update-cash-breakdown'
*/
updateCashBreakdown.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateCashBreakdown.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateCashBreakdown
* @see app/Http/Controllers/OfficeController.php:219
* @route '/office/{office}/update-cash-breakdown'
*/
const updateCashBreakdownForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateCashBreakdown.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateCashBreakdown
* @see app/Http/Controllers/OfficeController.php:219
* @route '/office/{office}/update-cash-breakdown'
*/
updateCashBreakdownForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateCashBreakdown.url(args, options),
    method: 'post',
})

updateCashBreakdown.form = updateCashBreakdownForm

/**
* @see \App\Http\Controllers\OfficeController::updateStartTotals
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
export const updateStartTotals = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStartTotals.url(args, options),
    method: 'post',
})

updateStartTotals.definition = {
    methods: ["post"],
    url: '/office/{office}/update-start-totals',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::updateStartTotals
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
updateStartTotals.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return updateStartTotals.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::updateStartTotals
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
updateStartTotals.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateStartTotals.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateStartTotals
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
const updateStartTotalsForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStartTotals.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateStartTotals
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
updateStartTotalsForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStartTotals.url(args, options),
    method: 'post',
})

updateStartTotals.form = updateStartTotalsForm

/**
* @see \App\Http\Controllers\OfficeController::updateSaleBreakdown
* @see app/Http/Controllers/OfficeController.php:243
* @route '/office/{office}/update-sale-breakdown'
*/
export const updateSaleBreakdown = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSaleBreakdown.url(args, options),
    method: 'post',
})

updateSaleBreakdown.definition = {
    methods: ["post"],
    url: '/office/{office}/update-sale-breakdown',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::updateSaleBreakdown
* @see app/Http/Controllers/OfficeController.php:243
* @route '/office/{office}/update-sale-breakdown'
*/
updateSaleBreakdown.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return updateSaleBreakdown.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::updateSaleBreakdown
* @see app/Http/Controllers/OfficeController.php:243
* @route '/office/{office}/update-sale-breakdown'
*/
updateSaleBreakdown.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSaleBreakdown.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateSaleBreakdown
* @see app/Http/Controllers/OfficeController.php:243
* @route '/office/{office}/update-sale-breakdown'
*/
const updateSaleBreakdownForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSaleBreakdown.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateSaleBreakdown
* @see app/Http/Controllers/OfficeController.php:243
* @route '/office/{office}/update-sale-breakdown'
*/
updateSaleBreakdownForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSaleBreakdown.url(args, options),
    method: 'post',
})

updateSaleBreakdown.form = updateSaleBreakdownForm

/**
* @see \App\Http\Controllers\OfficeController::updateSaleVariant
* @see app/Http/Controllers/OfficeController.php:255
* @route '/office/{office}/update-sale-variant'
*/
export const updateSaleVariant = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSaleVariant.url(args, options),
    method: 'post',
})

updateSaleVariant.definition = {
    methods: ["post"],
    url: '/office/{office}/update-sale-variant',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::updateSaleVariant
* @see app/Http/Controllers/OfficeController.php:255
* @route '/office/{office}/update-sale-variant'
*/
updateSaleVariant.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { office: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { office: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            office: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        office: typeof args.office === 'object'
        ? args.office.id
        : args.office,
    }

    return updateSaleVariant.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::updateSaleVariant
* @see app/Http/Controllers/OfficeController.php:255
* @route '/office/{office}/update-sale-variant'
*/
updateSaleVariant.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSaleVariant.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateSaleVariant
* @see app/Http/Controllers/OfficeController.php:255
* @route '/office/{office}/update-sale-variant'
*/
const updateSaleVariantForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSaleVariant.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::updateSaleVariant
* @see app/Http/Controllers/OfficeController.php:255
* @route '/office/{office}/update-sale-variant'
*/
updateSaleVariantForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSaleVariant.url(args, options),
    method: 'post',
})

updateSaleVariant.form = updateSaleVariantForm

const OfficeController = { index, start, show, end, reopen, addWorker, removeWorker, recordSale, removeSale, updateCashBreakdown, updateStartTotals, updateSaleBreakdown, updateSaleVariant }

export default OfficeController