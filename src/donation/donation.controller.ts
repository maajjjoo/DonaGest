import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

interface Donation {
    id: number;
    donorId: number;
    productId: number;
    quantity: number;
    donationDate: string;
}

@Controller('donations')
export class DonationController {
    private donations: Donation[] = [];

    @Get()
    getAllDonations() {
        return this.donations;
    }

    @Get(':id')
    getDonationById(@Param('id') id: number) {
        const donation = this.donations.find(
            (donation) => donation.id === Number(id),
        );

        if (donation) {
            return {
                msg: `Donación con id ${id} encontrada`,
                data: donation,
            };
        } else {
            return {
                msg: `Donación con id ${id} no encontrada`,
            };
        }
    }

    @Post()
    createDonation(@Body() donation: Donation) {
        this.donations.push(donation);
        return {
            msg: 'Donación creada exitosamente',
            data: donation,
        };
    }

    @Put(':id')
    updateDonation(@Param('id') id: number, @Body() updatedDonation: Donation) {
        const donationIndex = this.donations.findIndex(
            (donation) => donation.id === Number(id),
        );

        if (donationIndex === -1) {
            return {
                msg: `Donación con id ${id} no encontrada`,
            };
        }

        this.donations[donationIndex] = { ...this.donations[donationIndex], ...updatedDonation };
        return {
            msg: `Donación con id ${id} actualizada exitosamente`,
            data: this.donations[donationIndex],
        };
    }

    @Delete(':id')
    deleteDonation(@Param('id') id: number) {
        const donationIndex = this.donations.findIndex(
            (donation) => donation.id === Number(id),
        );

        if (donationIndex === -1) {
            return {
                msg: `Donación con id ${id} no encontrada`,
            };
        }

        this.donations.splice(donationIndex, 1);
        return {
            msg: `Donación con id ${id} eliminada exitosamente`,
        };
    }
}
