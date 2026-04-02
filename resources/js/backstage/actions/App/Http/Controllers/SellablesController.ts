import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/sellables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::index
* @see app/Http/Controllers/SellablesController.php:54
* @route '/sellables'
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
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
export const expired = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

expired.definition = {
    methods: ["get","head"],
    url: '/sellables/expired',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.url = (options?: RouteQueryOptions) => {
    return expired.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expired.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expired.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
const expiredForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expiredForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SellablesController::expired
* @see app/Http/Controllers/SellablesController.php:96
* @route '/sellables/expired'
*/
expiredForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

expired.form = expiredForm

/**
* @see \App\Http\Controllers\SellablesController::storeProduct
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
export const storeProduct = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeProduct.url(options),
    method: 'post',
})

storeProduct.definition = {
    methods: ["post"],
    url: '/sellables/products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SellablesController::storeProduct
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
storeProduct.url = (options?: RouteQueryOptions) => {
    return storeProduct.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::storeProduct
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
storeProduct.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeProduct.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::storeProduct
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
const storeProductForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeProduct.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::storeProduct
* @see app/Http/Controllers/SellablesController.php:303
* @route '/sellables/products'
*/
storeProductForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeProduct.url(options),
    method: 'post',
})

storeProduct.form = storeProductForm

/**
* @see \App\Http\Controllers\SellablesController::updateProduct
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
export const updateProduct = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateProduct.url(args, options),
    method: 'put',
})

updateProduct.definition = {
    methods: ["put"],
    url: '/sellables/products/{product}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SellablesController::updateProduct
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
updateProduct.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return updateProduct.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::updateProduct
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
updateProduct.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateProduct.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SellablesController::updateProduct
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
const updateProductForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateProduct.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::updateProduct
* @see app/Http/Controllers/SellablesController.php:321
* @route '/sellables/products/{product}'
*/
updateProductForm.put = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateProduct.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateProduct.form = updateProductForm

/**
* @see \App\Http\Controllers\SellablesController::destroyProduct
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
export const destroyProduct = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProduct.url(args, options),
    method: 'delete',
})

destroyProduct.definition = {
    methods: ["delete"],
    url: '/sellables/products/{product}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroyProduct
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroyProduct.url = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return destroyProduct.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroyProduct
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroyProduct.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProduct.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyProduct
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
const destroyProductForm = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyProduct.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyProduct
* @see app/Http/Controllers/SellablesController.php:350
* @route '/sellables/products/{product}'
*/
destroyProductForm.delete = (args: { product: number | { id: number } } | [product: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyProduct.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyProduct.form = destroyProductForm

/**
* @see \App\Http\Controllers\SellablesController::destroyProductImage
* @see app/Http/Controllers/SellablesController.php:410
* @route '/sellables/products/image/{image}'
*/
export const destroyProductImage = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProductImage.url(args, options),
    method: 'delete',
})

destroyProductImage.definition = {
    methods: ["delete"],
    url: '/sellables/products/image/{image}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroyProductImage
* @see app/Http/Controllers/SellablesController.php:410
* @route '/sellables/products/image/{image}'
*/
destroyProductImage.url = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { image: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            image: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        image: typeof args.image === 'object'
        ? args.image.id
        : args.image,
    }

    return destroyProductImage.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroyProductImage
* @see app/Http/Controllers/SellablesController.php:410
* @route '/sellables/products/image/{image}'
*/
destroyProductImage.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProductImage.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyProductImage
* @see app/Http/Controllers/SellablesController.php:410
* @route '/sellables/products/image/{image}'
*/
const destroyProductImageForm = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyProductImage.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyProductImage
* @see app/Http/Controllers/SellablesController.php:410
* @route '/sellables/products/image/{image}'
*/
destroyProductImageForm.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyProductImage.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyProductImage.form = destroyProductImageForm

/**
* @see \App\Http\Controllers\SellablesController::storeEvent
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
export const storeEvent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEvent.url(options),
    method: 'post',
})

storeEvent.definition = {
    methods: ["post"],
    url: '/sellables/events',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SellablesController::storeEvent
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
storeEvent.url = (options?: RouteQueryOptions) => {
    return storeEvent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::storeEvent
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
storeEvent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEvent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::storeEvent
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
const storeEventForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeEvent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::storeEvent
* @see app/Http/Controllers/SellablesController.php:357
* @route '/sellables/events'
*/
storeEventForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeEvent.url(options),
    method: 'post',
})

storeEvent.form = storeEventForm

/**
* @see \App\Http\Controllers\SellablesController::updateEvent
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
export const updateEvent = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateEvent.url(args, options),
    method: 'put',
})

updateEvent.definition = {
    methods: ["put"],
    url: '/sellables/events/{event}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SellablesController::updateEvent
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
updateEvent.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { event: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            event: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        event: typeof args.event === 'object'
        ? args.event.id
        : args.event,
    }

    return updateEvent.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::updateEvent
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
updateEvent.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateEvent.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SellablesController::updateEvent
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
const updateEventForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEvent.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::updateEvent
* @see app/Http/Controllers/SellablesController.php:375
* @route '/sellables/events/{event}'
*/
updateEventForm.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEvent.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateEvent.form = updateEventForm

/**
* @see \App\Http\Controllers\SellablesController::destroyEvent
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
export const destroyEvent = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyEvent.url(args, options),
    method: 'delete',
})

destroyEvent.definition = {
    methods: ["delete"],
    url: '/sellables/events/{event}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroyEvent
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroyEvent.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { event: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            event: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        event: typeof args.event === 'object'
        ? args.event.id
        : args.event,
    }

    return destroyEvent.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroyEvent
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroyEvent.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyEvent.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyEvent
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
const destroyEventForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyEvent.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyEvent
* @see app/Http/Controllers/SellablesController.php:416
* @route '/sellables/events/{event}'
*/
destroyEventForm.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyEvent.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyEvent.form = destroyEventForm

/**
* @see \App\Http\Controllers\SellablesController::destroyImage
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
export const destroyImage = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyImage.url(args, options),
    method: 'delete',
})

destroyImage.definition = {
    methods: ["delete"],
    url: '/sellables/events/image/{image}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SellablesController::destroyImage
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroyImage.url = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { image: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { image: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            image: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        image: typeof args.image === 'object'
        ? args.image.id
        : args.image,
    }

    return destroyImage.definition.url
            .replace('{image}', parsedArgs.image.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SellablesController::destroyImage
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroyImage.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyImage.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyImage
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
const destroyImageForm = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyImage.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SellablesController::destroyImage
* @see app/Http/Controllers/SellablesController.php:404
* @route '/sellables/events/image/{image}'
*/
destroyImageForm.delete = (args: { image: number | { id: number } } | [image: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyImage.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyImage.form = destroyImageForm

const SellablesController = { index, expired, storeProduct, updateProduct, destroyProduct, destroyProductImage, storeEvent, updateEvent, destroyEvent, destroyImage }

export default SellablesController