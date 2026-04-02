import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OfficeController::update
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
export const update = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/office/{office}/update-start-totals',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OfficeController::update
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
update.url = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{office}', parsedArgs.office.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OfficeController::update
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
update.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::update
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
const updateForm = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OfficeController::update
* @see app/Http/Controllers/OfficeController.php:231
* @route '/office/{office}/update-start-totals'
*/
updateForm.post = (args: { office: string | { id: string } } | [office: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, options),
    method: 'post',
})

update.form = updateForm

const start_totals = {
    update: Object.assign(update, update),
}

export default start_totals