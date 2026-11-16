import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

interface AffectedZone {
    id: number;
    name: string;
    location: string;
    description: string;
    needs: string[];
}

@Controller('affected-zones')
export class AffectedZoneController {
    private affectedZones: AffectedZone[] = [];

    @Get()
    getAllAffectedZones() {
        return this.affectedZones;
    }

    @Get(':id')
    getAffectedZoneById(@Param('id') id: number) {
        const affectedZone = this.affectedZones.find(
            (zone) => zone.id === Number(id),
        );

        if (affectedZone) {
            return {
                msg: `Zona afectada con id ${id} encontrada`,
                data: affectedZone,
            };
        } else {
            return {
                msg: `Zona afectada con id ${id} no encontrada`,
            };
        }
    }

    @Get(':id/needs')
    getAffectedZoneNeeds(@Param('id') id: number) {
        const affectedZone = this.affectedZones.find(
            (zone) => zone.id === Number(id),
        );

        if (affectedZone) {
            return {
                msg: `Necesidades de la zona afectada con id ${id}`,
                data: affectedZone.needs,
            };
        } else {
            return {
                msg: `Zona afectada con id ${id} no encontrada`,
            };
        }
    }

    @Post()
    createAffectedZone(@Body() affectedZone: AffectedZone) {
        this.affectedZones.push(affectedZone);
        return {
            msg: 'Zona afectada creada exitosamente',
            data: affectedZone,
        };
    }

    @Put(':id')
    updateAffectedZone(@Param('id') id: number, @Body() updatedZone: AffectedZone) {
        const zoneIndex = this.affectedZones.findIndex(
            (zone) => zone.id === Number(id),
        );

        if (zoneIndex === -1) {
            return {
                msg: `Zona afectada con id ${id} no encontrada`,
            };
        }

        this.affectedZones[zoneIndex] = { ...this.affectedZones[zoneIndex], ...updatedZone };
        return {
            msg: `Zona afectada con id ${id} actualizada exitosamente`,
            data: this.affectedZones[zoneIndex],
        };
    }

    @Delete(':id')
    deleteAffectedZone(@Param('id') id: number) {
        const zoneIndex = this.affectedZones.findIndex(
            (zone) => zone.id === Number(id),
        );

        if (zoneIndex === -1) {
            return {
                msg: `Zona afectada con id ${id} no encontrada`,
            };
        }

        this.affectedZones.splice(zoneIndex, 1);
        return {
            msg: `Zona afectada con id ${id} eliminada exitosamente`,
        };
    }
}
