import { ClsServiceManager } from 'nestjs-cls';

import type { Admin } from '../modules/admins/entities/admin.entity';

export class ContextProvider {
  private static readonly nameSpace = 'request';

  private static readonly authUserKey = 'user_key';

  private static get<T>(key: string) {
    const store = ClsServiceManager.getClsService();

    return store.get<T>(ContextProvider.getKeyWithNamespace(key));
  }

  private static set(key: string, value: any): void {
    const store = ClsServiceManager.getClsService();

    store.set(ContextProvider.getKeyWithNamespace(key), value);
  }

  private static getKeyWithNamespace(key: string): string {
    return `${ContextProvider.nameSpace}.${key}`;
  }

  static setAuthUser(user: Admin): void {
    ContextProvider.set(ContextProvider.authUserKey, user);
  }

  static getAuthUser(): Admin | undefined {
    return ContextProvider.get<Admin>(ContextProvider.authUserKey);
  }
}
