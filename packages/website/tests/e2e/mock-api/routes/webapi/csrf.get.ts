export default defineEventHandler((event) => {
  // Set the CSRF cookie like the real backend does
  setCookie(event, 'csrftoken', 'mock-csrf-token-for-testing', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
  });

  return { detail: 'CSRF cookie set' };
});
