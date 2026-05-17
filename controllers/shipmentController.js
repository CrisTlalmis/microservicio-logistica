const ShipmentModel = require('../models/shipmentModel');

const ShipmentController = {
    async createShipment(req, res, bodyText) {
        try {
            // Desafío 2: Try-catch para evitar crash si el JSON viene roto 
            const body = JSON.parse(bodyText); 

            const { orderId, recipientName, address, zipCode, city, weight } = body;

            // Validación profunda de reglas de negocio
            if (!orderId || !recipientName || !address || !zipCode || !city || !weight) {
                res.statusCode = 400; // Bad Request
                return res.end(JSON.stringify({ error: "Campos obligatorios incompletos" }));
            }

            if (typeof weight !== 'number' || weight <= 0) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "El peso debe ser un número estrictamente mayor a 0" }));
            }

            if (!/^[0-9]{5}$/.test(zipCode)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "El código postal debe tener exactamente 5 dígitos numéricos" }));
            }

            // Generar número de guía aleatorio y simular paquetería
            const trackingNumber = `TRACK-${Math.floor(100000 + Math.random() * 900000)}`;
            const courier = weight > 10 ? 'FedEx Heavy' : 'DHL Express';

            // Llamamos a la bóveda (Modelo)
            const result = await ShipmentModel.create({
                orderId, trackingNumber, courier, weight, recipientName, address, zipCode, city
            });

            res.statusCode = 201; // Created
            res.end(JSON.stringify({ mensaje: "Envío programado con éxito", data: result }));

        } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "JSON inválido o error de base de datos", detalles: error.message }));
        }
    },

    async getTracking(res, trackingNumber) {
        try {
            const shipment = await ShipmentModel.findByTrackingNumber(trackingNumber);
            
            if (!shipment) {
                res.statusCode = 404; // Not Found
                return res.end(JSON.stringify({ error: "Número de guía no localizado" }));
            }

            res.statusCode = 200; // OK
            res.end(JSON.stringify(shipment));
        } catch (error) {
            res.statusCode = 500; // Internal Server Error
            res.end(JSON.stringify({ error: "Fallo en la comunicación con la bóveda de datos" }));
        }
    },

    async updateShipmentStatus(req, res, trackingNumber, bodyText) {
        try {
            // Manejo de excepciones para evitar el colapso del proceso asíncrono
            const body = JSON.parse(bodyText);
            const { status, location } = body;

            if (!status || !location) {
                res.statusCode = 400; // Bad Request
                return res.end(JSON.stringify({ error: "El estado y la ubicación física son obligatorios" }));
            }

            const validStatuses = ['PREPARACION', 'RECOLECCION', 'TRANSITO', 'ENTREGA', 'CANCELADO'];
            if (!validStatuses.includes(status)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "El estado proporcionado no pertenece al catálogo homologado" }));
            }

            // Recuperamos el historial analítico para validar las reglas antes de escribir en la bóveda
            const shipment = await ShipmentModel.findByTrackingNumber(trackingNumber);
            if (!shipment) {
                res.statusCode = 404; // Not Found
                return res.end(JSON.stringify({ error: "El número de guía proporcionado no existe en el sistema" }));
            }

            const currentEvents = shipment.tracking_events || [];
            const lastEvent = currentEvents[currentEvents.length - 1];
            const currentStatus = lastEvent ? lastEvent.status : '';

            // Regla de negocio: No se puede cancelar o alterar un flujo logístico ya concluido
            if (currentStatus === 'ENTREGA' || currentStatus === 'CANCELADO') {
                res.statusCode = 409; // Conflict
                return res.end(JSON.stringify({ 
                    error: `Acción denegada. El envío ya se encuentra concluido en estado: ${currentStatus}` 
                }));
            }

            // Persistimos el cambio de estado en la nube
            const result = await ShipmentModel.updateStatus(trackingNumber, status, location);
            
            res.statusCode = 200; // OK
            res.end(JSON.stringify({ mensaje: "Hito logístico actualizado con éxito", datos: result }));

        } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Estructura de payload JSON inválida", detalles: error.message }));
        }
    }
};

module.exports = ShipmentController;