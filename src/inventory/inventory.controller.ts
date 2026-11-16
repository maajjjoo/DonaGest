import { Body, Controller, Get, Param, Put } from '@nestjs/common';

interface InventoryItem {
    id: number;
    productId: number;
    quantity: number;
}

const LOW_STOCK_THRESHOLD = 10;

@Controller('inventory')
export class InventoryController {
    private inventoryItems: InventoryItem[] = [];

    @Get()
    getAllInventoryItems() {
        return this.inventoryItems;
    }

    @Get('low-stock')
    getLowStockItems() {
        const lowStockItems = this.inventoryItems.filter(
            (item) => item.quantity < LOW_STOCK_THRESHOLD,
        );

        return {
            msg: `Productos con bajo stock (menos de ${LOW_STOCK_THRESHOLD} unidades)`,
            data: lowStockItems,
        };
    }

    @Get(':id')
    getInventoryItemById(@Param('id') id: number) {
        const inventoryItem = this.inventoryItems.find(
            (item) => item.id === Number(id),
        );

        if (inventoryItem) {
            return {
                msg: `Artículo de inventario con id ${id} encontrado`,
                data: inventoryItem,
            };
        } else {
            return {
                msg: `Artículo de inventario con id ${id} no encontrado`,
            };
        }
    }

    @Put(':id')
    updateInventoryItem(@Param('id') id: number, @Body() updatedItem: InventoryItem) {
        const itemIndex = this.inventoryItems.findIndex(
            (item) => item.id === Number(id),
        );

        if (itemIndex === -1) {
            return {
                msg: `Artículo de inventario con id ${id} no encontrado`,
            };
        }

        this.inventoryItems[itemIndex] = { ...this.inventoryItems[itemIndex], ...updatedItem };
        return {
            msg: `Artículo de inventario con id ${id} actualizado exitosamente`,
            data: this.inventoryItems[itemIndex],
        };
    }
}
