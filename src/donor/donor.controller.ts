import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

interface Donor {
    id: number;
    name: string;
    email: string;
    phone: string;
}

@Controller('donors')
export class DonorController {
    private donors: Donor[] = [];

    @Get()
    getAllDonors() {
        return this.donors;
    }

    @Get(':id')
    getDonorById(@Param('id') id: number) {
        const donor = this.donors.find(
            (donor) => donor.id === Number(id),
        );

        if (donor) {
            return {
                msg: `Donante con id ${id} encontrado`,
                data: donor,
            };
        } else {
            return {
                msg: `Donante con id ${id} no encontrado`,
            };
        }
    }

    @Post()
    createDonor(@Body() donor: Donor) {
        this.donors.push(donor);
        return {
            msg: 'Donante creado exitosamente',
            data: donor,
        };
    }

    @Put(':id')
    updateDonor(@Param('id') id: number, @Body() updatedDonor: Donor) {
        const donorIndex = this.donors.findIndex(
            (donor) => donor.id === Number(id),
        );

        if (donorIndex === -1) {
            return {
                msg: `Donante con id ${id} no encontrado`,
            };
        }

        this.donors[donorIndex] = { ...this.donors[donorIndex], ...updatedDonor };
        return {
            msg: `Donante con id ${id} actualizado exitosamente`,
            data: this.donors[donorIndex],
        };
    }

    @Delete(':id')
    deleteDonor(@Param('id') id: number) {
        const donorIndex = this.donors.findIndex(
            (donor) => donor.id === Number(id),
        );

        if (donorIndex === -1) {
            return {
                msg: `Donante con id ${id} no encontrado`,
            };
        }

        this.donors.splice(donorIndex, 1);
        return {
            msg: `Donante con id ${id} eliminado exitosamente`,
        };
    }
}
