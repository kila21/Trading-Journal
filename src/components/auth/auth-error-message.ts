type Translator = (key: string) => string;

export function authErrorMessage(t: Translator, code: string | undefined): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return t("errorInvalidCredentials");
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
    case "USER_ALREADY_EXISTS":
      return t("errorEmailTaken");
    case "PASSWORD_TOO_SHORT":
      return t("errorPasswordTooShort");
    case "PASSWORD_TOO_LONG":
      return t("errorPasswordTooLong");
    case "INVALID_EMAIL":
      return t("errorInvalidEmail");
    case "INVALID_PASSWORD":
      return t("errorInvalidCurrentPassword");
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return t("errorGeneric");
    default:
      return t("errorGeneric");
  }
}
