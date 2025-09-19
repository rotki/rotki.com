import type { UpdateProfileResponse } from '~/types';
import type { LoginCredentials } from '~/types/login';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { getErrorMessage } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

/**
 * Authentication API composable
 * Handles user authentication operations
 */
export function useAuthApi() {
  const logger = useLogger('auth-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Login user with credentials
   */
  const login = async ({ password, username }: LoginCredentials): Promise<string> => {
    try {
      await fetchWithCsrf<string>('/webapi/login/', {
        body: {
          password,
          username,
        },
        credentials: 'include',
        method: 'POST',
      });
      return '';
    }
    catch (error: any) {
      logger.error('Login failed:', error);
      return getErrorMessage(error);
    }
  };

  /**
   * Logout user (call logout API)
   */
  const logout = async (): Promise<boolean> => {
    try {
      await fetchWithCsrf<UpdateProfileResponse>('/webapi/logout/', {
        method: 'POST',
      });
      return true;
    }
    catch (error) {
      logger.error('Logout API call failed:', error);
      return false;
    }
  };

  return {
    login,
    logout,
  };
}
