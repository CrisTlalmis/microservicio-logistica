const http = require('http');
const shipmentRoutes = require('./routes/shipmentRoutes');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Mandamos la petición (req) y la respuesta (res) a nuestro despachador
    shipmentRoutes(req, res);
});

server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` MICROSERVICIO DE LOGÍSTICA CORRIENDO EN PUERTO ${PORT}`);
    console.log(`Listo para recibir peticiones.`);
    console.log(`===================================================`);
});