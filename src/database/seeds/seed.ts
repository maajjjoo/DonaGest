import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AffectedZoneService } from '../../affected-zone/affected-zone.service';
import { CreateAffectedZoneDto } from '../../affected-zone/dto/create-affected-zone.dto';
import { AffectedZone } from '../../affected-zone/entities/affected-zone.entity';
import { ColombianDepartment } from '../../affected-zone/enums/colombian-department.enum';
import { EmergencyType } from '../../affected-zone/enums/emergency-type.enum';
import { ZonePriority } from '../../affected-zone/enums/zone-priority.enum';
import { AppModule } from '../../app.module';
import { addDays, getTodayInColombia } from '../../common/helpers/date.helper';
import { DeliveryService } from '../../delivery/delivery.service';
import { Delivery } from '../../delivery/entities/delivery.entity';
import { DeliveryStatus } from '../../delivery/enums/delivery-status.enum';
import { DonationService } from '../../donation/donation.service';
import { Donation } from '../../donation/entities/donation.entity';
import { DonorService } from '../../donor/donor.service';
import { CreateDonorDto } from '../../donor/dto/create-donor.dto';
import { Donor } from '../../donor/entities/donor.entity';
import { DocumentType } from '../../donor/enums/document-type.enum';
import { DonorType } from '../../donor/enums/donor-type.enum';
import { CreateProductDto } from '../../product/dto/create-product.dto';
import { Product } from '../../product/entities/product.entity';
import { ProductCategory } from '../../product/enums/product-category.enum';
import { ProductUnit } from '../../product/enums/product-unit.enum';
import { ProductService } from '../../product/product.service';

const logger = new Logger('Seed');

const ZONES: CreateAffectedZoneDto[] = [
  {
    name: 'Casco urbano de San Marcos',
    department: ColombianDepartment.SUCRE,
    municipality: 'San Marcos',
    emergencyType: EmergencyType.INUNDACION,
    priority: ZonePriority.CRITICA,
    affectedFamilies: 1250,
    description:
      'Desbordamiento del río San Jorge en La Mojana. Viviendas y cultivos bajo el agua.',
  },
  {
    name: 'Comunidades wayuu de Uribia',
    department: ColombianDepartment.LA_GUAJIRA,
    municipality: 'Uribia',
    emergencyType: EmergencyType.SEQUIA,
    priority: ZonePriority.ALTA,
    affectedFamilies: 860,
    description:
      'Sequía prolongada: los jagüeyes están secos y no hay acceso a agua potable.',
  },
  {
    name: 'Albergue temporal de Quibdó',
    department: ColombianDepartment.CHOCO,
    municipality: 'Quibdó',
    emergencyType: EmergencyType.DESPLAZAMIENTO,
    priority: ZonePriority.ALTA,
    affectedFamilies: 430,
    description:
      'Familias desplazadas desde comunidades del río Atrato por el conflicto armado.',
  },
  {
    name: 'Barrio La Badea de Dosquebradas',
    department: ColombianDepartment.RISARALDA,
    municipality: 'Dosquebradas',
    emergencyType: EmergencyType.DESLIZAMIENTO,
    priority: ZonePriority.MEDIA,
    affectedFamilies: 75,
    description:
      'Deslizamiento de tierra en la ladera después de lluvias fuertes.',
  },
];

const DONORS: CreateDonorDto[] = [
  {
    fullName: 'Fundación Manos Unidas por Colombia',
    documentType: DocumentType.NIT,
    documentNumber: '900123456-7',
    email: 'donaciones@manosunidas.org.co',
    phone: '3157778899',
    city: 'Bogotá',
    donorType: DonorType.FUNDACION,
  },
  {
    fullName: 'Distribuidora La Esperanza S.A.S.',
    documentType: DocumentType.NIT,
    documentNumber: '901234567-1',
    email: 'responsabilidad@laesperanza.com.co',
    phone: '3186543210',
    city: 'Barranquilla',
    donorType: DonorType.EMPRESA,
  },
  {
    fullName: 'María Fernanda Ospina Restrepo',
    documentType: DocumentType.CC,
    documentNumber: '1020456789',
    email: 'maria.ospina@gmail.com',
    phone: '3104567890',
    city: 'Medellín',
    donorType: DonorType.PERSONA_NATURAL,
  },
  {
    fullName: 'Carlos Andrés Mosquera Palacios',
    documentType: DocumentType.CC,
    documentNumber: '1077456123',
    email: 'carlos.mosquera@hotmail.com',
    phone: '3207654321',
    city: 'Quibdó',
    donorType: DonorType.PERSONA_NATURAL,
  },
];

const PRODUCTS: CreateProductDto[] = [
  {
    name: 'Agua potable en bolsa 6 L',
    category: ProductCategory.AGUA,
    unit: ProductUnit.PAQUETE,
    description: 'Paquete de bolsas de agua potable para consumo familiar',
  },
  {
    name: 'Arroz blanco 1 kg',
    category: ProductCategory.ALIMENTOS,
    unit: ProductUnit.KILOGRAMO,
    description: 'Arroz blanco en bolsa de 1 kg',
  },
  {
    name: 'Kit de aseo familiar',
    category: ProductCategory.ASEO,
    unit: ProductUnit.UNIDAD,
    description: 'Jabón, crema dental, cepillos y toallas higiénicas',
  },
  {
    name: 'Cobija térmica',
    category: ProductCategory.COBIJAS,
    unit: ProductUnit.UNIDAD,
    description: 'Cobija térmica para albergues y zonas frías',
  },
  {
    name: 'Suero oral',
    category: ProductCategory.MEDICAMENTOS,
    unit: ProductUnit.UNIDAD,
    description: 'Sobres de sales de rehidratación oral',
  },
  {
    name: 'Ropa infantil',
    category: ProductCategory.ROPA,
    unit: ProductUnit.PAQUETE,
    description: 'Paquete de ropa para niños de 2 a 8 años',
  },
];

const DONATIONS: {
  donor: string;
  product: string;
  quantity: number;
  notes: string;
}[] = [
  {
    donor: '900123456-7',
    product: 'Agua potable en bolsa 6 L',
    quantity: 800,
    notes: 'Recibido en el centro de acopio de Sincelejo',
  },
  {
    donor: '900123456-7',
    product: 'Suero oral',
    quantity: 300,
    notes: 'Donación para atención de niños en La Mojana',
  },
  {
    donor: '901234567-1',
    product: 'Arroz blanco 1 kg',
    quantity: 1200,
    notes: 'Mercados donados por la empresa',
  },
  {
    donor: '901234567-1',
    product: 'Kit de aseo familiar',
    quantity: 250,
    notes: 'Kits armados por voluntarios',
  },
  {
    donor: '1020456789',
    product: 'Cobija térmica',
    quantity: 60,
    notes: 'Campaña de cobijas en Medellín',
  },
  {
    donor: '1077456123',
    product: 'Ropa infantil',
    quantity: 8,
    notes: 'Ropa en buen estado entregada en Quibdó',
  },
];

async function findOrCreate<T>(
  label: string,
  find: () => Promise<T | null>,
  create: () => Promise<T>,
): Promise<T> {
  const existing = await find();
  if (existing) {
    logger.log(`Ya existe: ${label}`);
    return existing;
  }
  const created = await create();
  logger.log(`Creado: ${label}`);
  return created;
}

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dataSource = app.get(DataSource);
    const zoneService = app.get(AffectedZoneService);
    const donorService = app.get(DonorService);
    const productService = app.get(ProductService);
    const donationService = app.get(DonationService);
    const deliveryService = app.get(DeliveryService);

    const zones: AffectedZone[] = [];
    for (const dto of ZONES) {
      zones.push(
        await findOrCreate(
          `zona ${dto.name}`,
          () =>
            dataSource.getRepository(AffectedZone).findOne({
              where: { name: dto.name, municipality: dto.municipality },
            }),
          () => zoneService.create(dto),
        ),
      );
    }

    const donors = new Map<string, Donor>();
    for (const dto of DONORS) {
      donors.set(
        dto.documentNumber,
        await findOrCreate(
          `donante ${dto.fullName}`,
          () =>
            dataSource
              .getRepository(Donor)
              .findOne({ where: { documentNumber: dto.documentNumber } }),
          () => donorService.create(dto),
        ),
      );
    }

    const products = new Map<string, Product>();
    for (const dto of PRODUCTS) {
      products.set(
        dto.name,
        await findOrCreate(
          `producto ${dto.name}`,
          () =>
            dataSource
              .getRepository(Product)
              .findOne({ where: { name: dto.name } }),
          () => productService.create(dto),
        ),
      );
    }

    const seedDonorIds = [...donors.values()].map((donor) => donor.id);
    const existingDonations = await dataSource
      .getRepository(Donation)
      .createQueryBuilder('donation')
      .where('donation.donor_id IN (:...ids)', { ids: seedDonorIds })
      .getCount();

    if (existingDonations > 0) {
      logger.log('Las donaciones de ejemplo ya estaban registradas');
    } else {
      for (const item of DONATIONS) {
        await donationService.create({
          donorId: donors.get(item.donor)!.id,
          productId: products.get(item.product)!.id,
          quantity: item.quantity,
          notes: item.notes,
        });
      }
      logger.log(`Creadas ${DONATIONS.length} donaciones`);
    }

    const [sanMarcos, uribia] = zones;
    const existingDeliveries = await dataSource
      .getRepository(Delivery)
      .createQueryBuilder('delivery')
      .where('delivery.affected_zone_id IN (:...ids)', {
        ids: [sanMarcos.id, uribia.id],
      })
      .getCount();

    if (existingDeliveries > 0) {
      logger.log('Las entregas de ejemplo ya estaban registradas');
    } else {
      const today = getTodayInColombia();
      const delivered = await deliveryService.create({
        affectedZoneId: sanMarcos.id,
        productId: products.get('Agua potable en bolsa 6 L')!.id,
        quantity: 300,
        scheduledDate: today,
        notes: 'Entrega coordinada con la Defensa Civil en el coliseo',
      });
      await deliveryService.updateStatus(delivered.id, {
        status: DeliveryStatus.EN_TRANSITO,
      });
      await deliveryService.updateStatus(delivered.id, {
        status: DeliveryStatus.ENTREGADA,
        notes: 'Recibido por el comité de la junta de acción comunal',
      });

      await deliveryService.create({
        affectedZoneId: uribia.id,
        productId: products.get('Agua potable en bolsa 6 L')!.id,
        quantity: 200,
        scheduledDate: addDays(today, 2),
        notes: 'Entrega en carrotanque a las rancherías',
      });
      logger.log('Creadas 2 entregas (1 ENTREGADA y 1 PROGRAMADA)');
    }

    logger.log('Datos iniciales cargados');
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  logger.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
