import { usePage } from '@inertiajs/react';

/**
 * Returns true when the currently authenticated user holds the given permission key.
 * Reads from the Inertia shared `auth.user.permissions` array.
 */
export function usePermission(permission: string): boolean {
    const { auth } = usePage().props;
    const permissions: string[] = (auth?.user?.permissions as string[]) ?? [];
    return permissions.includes(permission);
}

/**
 * Returns a record of booleans for multiple permission keys at once.
 * Useful when a single component needs to check several permissions.
 *
 * @example
 * const { canCreate, canEdit, canDelete } = usePermissions(
 *     'create_item', 'update_item', 'delete_item'
 * );
 */
export function usePermissions<K extends string>(
    ...keys: K[]
): Record<K, boolean> {
    const { auth } = usePage().props;
    const permissions: string[] = (auth?.user?.permissions as string[]) ?? [];
    return Object.fromEntries(keys.map((k) => [k, permissions.includes(k)])) as Record<K, boolean>;
}
