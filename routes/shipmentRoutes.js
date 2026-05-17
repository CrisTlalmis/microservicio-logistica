const ShipmentController = require('../controllers/shipmentController');

const shipmentRoutes = (req, res) => {
    // Configurar cabeceras universales (JSON) [cite: 2130, 2160]
    res.setHeader('Content-Type', 'application/json');

    const { method, url } = req;

    // RUTA POST: Crear Envío (Lee el stream de datos) [cite: 2120]
    if (url === '/shipments' && method === 'POST') {
        let body = [];
        req.on('data', (chunk) => { 
            body.push(chunk); // Acumular buffers [cite: 2123]
        }); 
        req.on('end', () => {
            // Concatenar e interpretar el buffer a texto [cite: 2126]
            const bodyText = Buffer.concat(body).toString(); 
            ShipmentController.createShipment(req, res, bodyText);
        });
    } 
    // RUTA PATCH: Actualizar Estado o Cancelación Inesperada (/shipments/TRACK-XXXXXX/status)
    else if (url.startsWith('/shipments/') && url.endsWith('/status') && method === 'PATCH') {
        const urlParts = url.split('/');
        const trackingNumber = urlParts[2]; // Extrae de forma dinámica el número de guía de la URI elegante
        
        let body = [];
        req.on('data', (chunk) => { body.push(chunk); }); // Procesamiento del stream de datos entrante
        req.on('end', () => {
            const bodyText = Buffer.concat(body).toString();
            ShipmentController.updateShipmentStatus(req, res, trackingNumber, bodyText);
        });
    }
    // RUTA GET: Rastrear Paquete (Recurso anidado en URL)
    else if (url.startsWith('/shipments/') && method === 'GET') {
        const urlParts = url.split('/');
        const trackingNumber = urlParts[2]; // Extrae el ID de la URL
        ShipmentController.getTracking(res, trackingNumber);
    } 
    // MANEJO DE ERRORES: Rutas no encontradas
    else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Ruta no soportada por el microservicio" }));
    }
};

module.exports = shipmentRoutes;