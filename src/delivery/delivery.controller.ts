import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

interface Delivery {
    id: number;
    productId: number;
    affectedZoneId: number;
    quantity: number;
    deliveryDate: string;
    status: string;
}

@Controller('deliveries')
export class DeliveryController {
    private deliveries: Delivery[] = [];

    @Get()
    getAllDeliveries() {
        return this.deliveries;
    }

    @Get('pending')
    getPendingDeliveries() {
        const pendingDeliveries = this.deliveries.filter(
            (delivery) => delivery.status === 'pending',
        );

        return {
            msg: 'Entregas pendientes',
            data: pendingDeliveries,
        };
    }

    @Get(':id')
    getDeliveryById(@Param('id') id: number) {
        const delivery = this.deliveries.find(
            (delivery) => delivery.id === Number(id),
        );

        if (delivery) {
            return {
                msg: `Entrega con id ${id} encontrada`,
                data: delivery,
            };
        } else {
            return {
                msg: `Entrega con id ${id} no encontrada`,
            };
        }
    }

    @Post()
    createDelivery(@Body() delivery: Delivery) {
        this.deliveries.push(delivery);
        return {
            msg: 'Entrega creada exitosamente',
            data: delivery,
        };
    }

    @Put(':id')
    updateDelivery(@Param('id') id: number, @Body() updatedDelivery: Delivery) {
        const deliveryIndex = this.deliveries.findIndex(
            (delivery) => delivery.id === Number(id),
        );

        if (deliveryIndex === -1) {
            return {
                msg: `Entrega con id ${id} no encontrada`,
            };
        }

        this.deliveries[deliveryIndex] = { ...this.deliveries[deliveryIndex], ...updatedDelivery };
        return {
            msg: `Entrega con id ${id} actualizada exitosamente`,
            data: this.deliveries[deliveryIndex],
        };
    }

    @Delete(':id')
    deleteDelivery(@Param('id') id: number) {
        const deliveryIndex = this.deliveries.findIndex(
            (delivery) => delivery.id === Number(id),
        );

        if (deliveryIndex === -1) {
            return {
                msg: `Entrega con id ${id} no encontrada`,
            };
        }

        this.deliveries.splice(deliveryIndex, 1);
        return {
            msg: `Entrega con id ${id} eliminada exitosamente`,
        };
    }
}
