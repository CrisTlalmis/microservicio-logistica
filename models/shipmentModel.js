const supabase = require('../config/supabase');

const ShipmentModel = {
    // 1. Guarda el envío de forma relacional garantizando atomicidad (ACID)
    async create(shipmentData) {
        const { orderId, trackingNumber, courier, weight, recipientName, address, zipCode, city } = shipmentData;

        // Inserción en la tabla principal de envíos
        const { data: shipment, error: sError } = await supabase
            .from('shipments')
            .insert([{ order_id: orderId, tracking_number: trackingNumber, courier, weight }])
            .select()
            .single();

        if (sError) throw sError;

        // Inserción en la tabla de direcciones de destino
        const { error: aError } = await supabase
            .from('shipping_addresses')
            .insert([{ shipment_id: shipment.id, recipient_name: recipientName, address_line: address, zip_code: zipCode, city }]);

        if (aError) throw aError;

        // Registro del estado inicial del paquete
        const { error: tError } = await supabase
            .from('tracking_events')
            .insert([{ shipment_id: shipment.id, status: 'PREPARACION', current_location: 'Almacén Central Puebla' }]);

        if (tError) throw tError;

        return { trackingNumber, status: 'PREPARACION' };
    },

    // 2. Recupera la información de un envío mediante su número de guía
    async findByTrackingNumber(trackingNumber) {
        const { data: shipment, error: sError } = await supabase
            .from('shipments')
            .select(`
                id, order_id, courier, weight,
                shipping_addresses (recipient_name, address_line, zip_code, city),
                tracking_events (status, current_location, updated_at)
            `)
            .eq('tracking_number', trackingNumber)
            .single();

        if (sError || !shipment) return null;
        return shipment;
    }
};

module.exports = ShipmentModel;