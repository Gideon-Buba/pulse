import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/database';

export const ROLES_KEY = 'roles';

/** Pairs with `RolesGuard` — restricts a route to the given profile roles. */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
