export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redireciona para o fluxo de login com Google OAuth
export const getLoginUrl = () => {
  return `${window.location.origin}/api/auth/google`;
};
