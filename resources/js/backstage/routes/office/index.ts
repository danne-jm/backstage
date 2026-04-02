import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import workers from './workers'
import sales from './sales'
import breakdown from './breakdown'
import start_totals from './start_totals'
import sale_breakdown from './sale_breakdown'
import sale_variant from './sale_variant'
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

const office = {
    start: Object.assign(start, start),
    show: Object.assign(show, show),
    end: Object.assign(end, end),
    reopen: Object.assign(reopen, reopen),
    workers: Object.assign(workers, workers),
    sales: Object.assign(sales, sales),
    breakdown: Object.assign(breakdown, breakdown),
    start_totals: Object.assign(start_totals, start_totals),
    sale_breakdown: Object.assign(sale_breakdown, sale_breakdown),
    sale_variant: Object.assign(sale_variant, sale_variant),
}

export default office