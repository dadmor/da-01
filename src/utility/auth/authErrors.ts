// utility/auth/authErrors.ts

// Refine wymaga błędu który rozszerza Error lub HttpError
export class AuthError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;

  constructor(message: string, code?: string, statusCode?: number, details?: Record<string, any>) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode || 400; // Refine wymaga statusCode dla HttpError
    this.details = details;
  }
}

// Mapa błędów - jedno miejsce prawdy
const ERROR_MESSAGES: Record<string, string> = {
  // Błędy rejestracji
  'user_already_exists': 'Konto z tym adresem email już istnieje.',
  'password_too_short': 'Hasło musi mieć co najmniej 6 znaków.',
  'password_too_long': 'Hasło nie może być dłuższe niż 72 znaki.',
  'invalid_email': 'Nieprawidłowy format adresu email.',
  'over_email_send_rate_limit': 'Za szybko! Poczekaj 2 sekundy przed ponowną próbą.',
  'registration_failed': 'Rejestracja nie powiodła się.',
  
  // Błędy logowania
  'invalid_credentials': 'Nieprawidłowy email lub hasło.',
  'email_not_confirmed': 'Potwierdź swój adres email przed zalogowaniem.',
  'user_not_found': 'Nie znaleziono użytkownika.',
  
  // Błędy resetowania hasła
  'reset_password_rate_limit': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
  'invalid_recovery_token': 'Link do resetowania hasła wygasł lub jest nieprawidłowy.',
  
  // Błędy aktualizacji
  'update_failed': 'Aktualizacja nie powiodła się.',
  'session_expired': 'Sesja wygasła. Zaloguj się ponownie.',
  
  // Błędy OAuth
  'oauth_error': 'Błąd podczas logowania przez zewnętrznego dostawcę.',
  'oauth_cancelled': 'Logowanie zostało anulowane.',
  
  // Domyślne
  'unknown_error': 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
  'network_error': 'Błąd połączenia. Sprawdź swoje połączenie internetowe.',
};

/**
 * Parsuje błąd Supabase i zwraca znormalizowany obiekt błędu
 */
export const parseSupabaseError = (error: any): AuthError => {
  if (!error) {
    return new AuthError(ERROR_MESSAGES.unknown_error, 'unknown_error');
  }

  // Jeśli już jest instancją AuthError
  if (error instanceof AuthError) {
    return error;
  }

  const errorMessage = error.message || error.error_description || '';
  const errorCode = error.code || error.error || '';
  let code = 'unknown_error';
  let message = ERROR_MESSAGES.unknown_error;
  let statusCode = 400;

  // Sprawdź kod błędu Supabase
  if (errorCode) {
    switch (errorCode) {
      case 'user_already_exists':
      case 'user_already_registered':
        code = 'user_already_exists';
        statusCode = 409; // Conflict
        break;
      case 'weak_password':
        code = 'password_too_short';
        statusCode = 422; // Unprocessable Entity
        break;
      case 'invalid_email':
        code = 'invalid_email';
        statusCode = 422;
        break;
      case 'over_email_send_rate_limit':
        code = 'over_email_send_rate_limit';
        statusCode = 429; // Too Many Requests
        break;
      case 'invalid_credentials':
        code = 'invalid_credentials';
        statusCode = 401; // Unauthorized
        break;
      case 'email_not_confirmed':
        code = 'email_not_confirmed';
        statusCode = 403; // Forbidden
        break;
      case 'session_not_found':
        code = 'session_expired';
        statusCode = 401;
        break;
    }
  }

  // Jeśli nie znaleziono po kodzie, sprawdź po treści komunikatu
  if (code === 'unknown_error') {
    if (errorMessage.includes('User already registered') || 
        errorMessage.includes('already exists')) {
      code = 'user_already_exists';
      statusCode = 409;
    } else if (errorMessage.includes('Password should be at least')) {
      code = 'password_too_short';
      statusCode = 422;
    } else if (errorMessage.includes('Password cannot be longer than 72')) {
      code = 'password_too_long';
      statusCode = 422;
    } else if (errorMessage.includes('Invalid email')) {
      code = 'invalid_email';
      statusCode = 422;
    } else if (errorMessage.includes('over_email_send_rate_limit')) {
      code = 'over_email_send_rate_limit';
      statusCode = 429;
    } else if (errorMessage.includes('Invalid login credentials')) {
      code = 'invalid_credentials';
      statusCode = 401;
    } else if (errorMessage.includes('Email not confirmed')) {
      code = 'email_not_confirmed';
      statusCode = 403;
    } else if (errorMessage.includes('Network request failed')) {
      code = 'network_error';
      statusCode = 503; // Service Unavailable
    }
  }

  // Pobierz komunikat z mapy lub użyj oryginalnego
  message = ERROR_MESSAGES[code] || errorMessage || ERROR_MESSAGES.unknown_error;

  return new AuthError(
    message, 
    code,
    statusCode,
    { 
      originalError: errorMessage,
      originalCode: errorCode 
    }
  );
};

/**
 * Pobiera komunikat błędu po kodzie
 */
export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.unknown_error;
};