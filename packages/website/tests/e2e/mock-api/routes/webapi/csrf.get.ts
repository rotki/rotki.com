/** Sets the CSRF cookie like the real backend does. */
export default defineEventHandler((event) => {
  setCookie(event, 'csrftoken', 'mock-csrf-token-for-testing', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
  });

  return { detail: 'CSRF cookie set' };
});
