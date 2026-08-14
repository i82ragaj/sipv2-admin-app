export const environment = {
  production: false,
  // Vacío a propósito: ng serve usa proxy.conf.json para reenviar /api y /login
  // a https://localhost:7119 (perfil "https" de SIPV2.AdminAppApi), evitando CORS en desarrollo.
  apiUrl: '',
};
