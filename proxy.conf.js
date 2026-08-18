// Redirige las llamadas del front (ng serve, puerto 4200) al backend
// SIPV2.AdminAppApi en desarrollo, evitando problemas de CORS/certificado
// autofirmado ya que Program.cs no define una política CORS.
//
// La regla '^/login$' existe porque AuthService.login() hace POST /login
// (sin prefijo /api) contra el backend. Pero esa misma ruta exacta también
// es la página de login de Angular: una navegación GET a /login (recargar
// la pestaña, pegar la URL) NO debe proxearse al backend -- debe servirla
// el propio dev server (index.html + Angular Router). Por eso hace falta
// `bypass`: solo se proxea si el método es POST; en cualquier otro caso se
// deja pasar sin proxear. Esto requiere un archivo .js (con función), no es
// posible expresarlo en proxy.conf.json.
module.exports = {
  '/api': {
    target: 'https://localhost:7119',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
  '^/login$': {
    target: 'https://localhost:7119',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    bypass: function (req) {
      if (req.method !== 'POST') {
        return req.url;
      }
    },
  },
};
