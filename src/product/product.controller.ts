import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
}

@Controller('products')
export class ProductController {
    private products: Product[] = [];

    @Get()
    getAllProducts() {
        return this.products;
    }

    @Get(':id')
    getProductById(@Param('id') id: number) {
        const product = this.products.find(
            (product) => product.id === Number(id),
        );

        if (product) {
            return {
                msg: `Producto con id ${id} encontrado`,
                data: product,
            };
        } else {
            return {
                msg: `Producto con id ${id} no encontrado`,
            };
        }
    }

    @Post()
    createProduct(@Body() product: Product) {
        this.products.push(product);
        return {
            msg: 'Producto creado exitosamente',
            data: product,
        };
    }

    @Put(':id')
    updateProduct(@Param('id') id: number, @Body() updatedProduct: Product) {
        const productIndex = this.products.findIndex(
            (product) => product.id === Number(id),
        );

        if (productIndex === -1) {
            return {
                msg: `Producto con id ${id} no encontrado`,
            };
        }

        this.products[productIndex] = { ...this.products[productIndex], ...updatedProduct };
        return {
            msg: `Producto con id ${id} actualizado exitosamente`,
            data: this.products[productIndex],
        };
    }

    @Delete(':id')
    deleteProduct(@Param('id') id: number) {
        const productIndex = this.products.findIndex(
            (product) => product.id === Number(id),
        );

        if (productIndex === -1) {
            return {
                msg: `Producto con id ${id} no encontrado`,
            };
        }

        this.products.splice(productIndex, 1);
        return {
            msg: `Producto con id ${id} eliminado exitosamente`,
        };
    }
}
