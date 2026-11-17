import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffectedZoneService } from '../affected-zone/affected-zone.service';
import { AffectedZone } from '../affected-zone/entities/affected-zone.entity';
import { ColombianDepartment } from '../affected-zone/enums/colombian-department.enum';
import { ZonePriority } from '../affected-zone/enums/zone-priority.enum';
import { Delivery } from '../delivery/entities/delivery.entity';
import { DeliveryStatus } from '../delivery/enums/delivery-status.enum';
import { Donation } from '../donation/entities/donation.entity';
import { DonationStatus } from '../donation/enums/donation-status.enum';
import { Donor } from '../donor/entities/donor.entity';
import { DonorType } from '../donor/enums/donor-type.enum';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ProductCategory } from '../product/enums/product-category.enum';
import { ProductUnit } from '../product/enums/product-unit.enum';
import {
  DeliveriesByStatusDto,
  SummaryReportDto,
  ZonesByPriorityDto,
} from './dto/summary-report.dto';
import { DeliveriesByDepartmentDto } from './dto/deliveries-by-department.dto';
import { InventoryByCategoryDto } from './dto/inventory-by-category.dto';
import { TopDonorDto } from './dto/top-donor.dto';
import { ZoneReportDto } from './dto/zone-report.dto';

const TOP_DONORS_LIMIT = 5;

interface CountRow {
  key: string;
  count: string;
}

const toCountMap = (
  keys: readonly string[],
  rows: CountRow[],
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const key of keys) {
    result[key] = 0;
  }
  let total = 0;
  for (const row of rows) {
    const value = Number(row.count);
    result[row.key] = value;
    total += value;
  }
  result.total = total;
  return result;
};

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Donor)
    private readonly donorRepository: Repository<Donor>,
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(AffectedZone)
    private readonly zoneRepository: Repository<AffectedZone>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly affectedZoneService: AffectedZoneService,
  ) {}

  async getSummary(): Promise<SummaryReportDto> {
    const [donorsTotal, donationRows, deliveryRows, zoneRows, productsInAlert] =
      await Promise.all([
        this.donorRepository.count(),
        this.donationRepository
          .createQueryBuilder('donation')
          .select('donation.status', 'status')
          .addSelect('COUNT(donation.id)', 'count')
          .addSelect('COALESCE(SUM(donation.quantity), 0)', 'units')
          .groupBy('donation.status')
          .getRawMany<{
            status: DonationStatus;
            count: string;
            units: string;
          }>(),
        this.deliveryRepository
          .createQueryBuilder('delivery')
          .select('delivery.status', 'key')
          .addSelect('COUNT(delivery.id)', 'count')
          .groupBy('delivery.status')
          .getRawMany<CountRow>(),
        this.zoneRepository
          .createQueryBuilder('zone')
          .select('zone.priority', 'key')
          .addSelect('COUNT(zone.id)', 'count')
          .where('zone.isActive = true')
          .groupBy('zone.priority')
          .getRawMany<CountRow>(),
        this.inventoryRepository
          .createQueryBuilder('inventory')
          .where('inventory.availableQuantity <= inventory.minimumStock')
          .getCount(),
      ]);

    const received = donationRows.find(
      (row) => row.status === DonationStatus.RECIBIDA,
    );
    const cancelled = donationRows.find(
      (row) => row.status === DonationStatus.ANULADA,
    );

    return {
      donors: { total: donorsTotal },
      donations: {
        received: Number(received?.count ?? 0),
        cancelled: Number(cancelled?.count ?? 0),
        unitsDonated: Number(received?.units ?? 0),
      },
      deliveries: toCountMap(
        Object.values(DeliveryStatus),
        deliveryRows,
      ) as unknown as DeliveriesByStatusDto,
      activeZonesByPriority: toCountMap(
        Object.values(ZonePriority),
        zoneRows,
      ) as unknown as ZonesByPriorityDto,
      productsInAlert,
      generatedAt: new Date(),
    };
  }

  async getZoneReport(zoneId: string): Promise<ZoneReportDto> {
    const zone = await this.affectedZoneService.findOne(zoneId);

    const [statusRows, productRows] = await Promise.all([
      this.deliveryRepository
        .createQueryBuilder('delivery')
        .select('delivery.status', 'key')
        .addSelect('COUNT(delivery.id)', 'count')
        .where('delivery.affected_zone_id = :zoneId', { zoneId })
        .groupBy('delivery.status')
        .getRawMany<CountRow>(),
      this.deliveryRepository
        .createQueryBuilder('delivery')
        .innerJoin('delivery.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'productName')
        .addSelect('product.unit', 'unit')
        .addSelect('SUM(delivery.quantity)', 'unitsDelivered')
        .where('delivery.affected_zone_id = :zoneId', { zoneId })
        .andWhere('delivery.status = :status', {
          status: DeliveryStatus.ENTREGADA,
        })
        .groupBy('product.id')
        .orderBy('"unitsDelivered"', 'DESC')
        .getRawMany<{
          productId: string;
          productName: string;
          unit: ProductUnit;
          unitsDelivered: string;
        }>(),
    ]);

    const deliveredProducts = productRows.map((row) => ({
      ...row,
      unitsDelivered: Number(row.unitsDelivered),
    }));

    return {
      zone,
      deliveriesByStatus: toCountMap(
        Object.values(DeliveryStatus),
        statusRows,
      ) as unknown as DeliveriesByStatusDto,
      deliveredProducts,
      totalUnitsDelivered: deliveredProducts.reduce(
        (sum, item) => sum + item.unitsDelivered,
        0,
      ),
    };
  }

  async getTopDonors(): Promise<TopDonorDto[]> {
    const rows = await this.donationRepository
      .createQueryBuilder('donation')
      .innerJoin('donation.donor', 'donor')
      .select('donor.id', 'donorId')
      .addSelect('donor.fullName', 'fullName')
      .addSelect('donor.donorType', 'donorType')
      .addSelect('donor.city', 'city')
      .addSelect('SUM(donation.quantity)', 'unitsDonated')
      .addSelect('COUNT(donation.id)', 'donationsCount')
      .where('donation.status = :status', { status: DonationStatus.RECIBIDA })
      .groupBy('donor.id')
      .orderBy('"unitsDonated"', 'DESC')
      .addOrderBy('donor.fullName', 'ASC')
      .limit(TOP_DONORS_LIMIT)
      .getRawMany<{
        donorId: string;
        fullName: string;
        donorType: DonorType;
        city: string;
        unitsDonated: string;
        donationsCount: string;
      }>();

    return rows.map((row) => ({
      ...row,
      unitsDonated: Number(row.unitsDonated),
      donationsCount: Number(row.donationsCount),
    }));
  }

  async getInventoryByCategory(): Promise<InventoryByCategoryDto[]> {
    const rows = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .innerJoin('inventory.product', 'product')
      .select('product.category', 'category')
      .addSelect('COUNT(product.id)', 'productsCount')
      .addSelect('SUM(inventory.availableQuantity)', 'availableUnits')
      .addSelect(
        'SUM(CASE WHEN inventory.availableQuantity <= inventory.minimumStock THEN 1 ELSE 0 END)',
        'productsInAlert',
      )
      .groupBy('product.category')
      .getRawMany<{
        category: ProductCategory;
        productsCount: string;
        availableUnits: string;
        productsInAlert: string;
      }>();

    return Object.values(ProductCategory).map((category) => {
      const row = rows.find((item) => item.category === category);
      return {
        category,
        productsCount: Number(row?.productsCount ?? 0),
        availableUnits: Number(row?.availableUnits ?? 0),
        productsInAlert: Number(row?.productsInAlert ?? 0),
      };
    });
  }

  async getZonesWithoutDeliveries(): Promise<AffectedZone[]> {
    return this.zoneRepository
      .createQueryBuilder('zone')
      .where('zone.isActive = true')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM deliveries delivery
          WHERE delivery.affected_zone_id = zone.id
          AND delivery.status <> :cancelled
        )`,
        { cancelled: DeliveryStatus.CANCELADA },
      )
      .orderBy('zone.priority', 'DESC')
      .addOrderBy('zone.affectedFamilies', 'DESC')
      .getMany();
  }

  async getDeliveriesByDepartment(): Promise<DeliveriesByDepartmentDto[]> {
    const rows = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .innerJoin('delivery.affectedZone', 'zone')
      .select('zone.department', 'department')
      .addSelect('COUNT(delivery.id)', 'totalDeliveries')
      .addSelect(
        'COUNT(delivery.id) FILTER (WHERE delivery.status IN (:...pending))',
        'pendingDeliveries',
      )
      .addSelect(
        'COUNT(delivery.id) FILTER (WHERE delivery.status = :delivered)',
        'completedDeliveries',
      )
      .addSelect(
        'COUNT(delivery.id) FILTER (WHERE delivery.status = :cancelled)',
        'cancelledDeliveries',
      )
      .addSelect(
        'COALESCE(SUM(delivery.quantity) FILTER (WHERE delivery.status = :delivered), 0)',
        'unitsDelivered',
      )
      .setParameters({
        pending: [DeliveryStatus.PROGRAMADA, DeliveryStatus.EN_TRANSITO],
        delivered: DeliveryStatus.ENTREGADA,
        cancelled: DeliveryStatus.CANCELADA,
      })
      .groupBy('zone.department')
      .orderBy('"unitsDelivered"', 'DESC')
      .addOrderBy('"totalDeliveries"', 'DESC')
      .getRawMany<{
        department: ColombianDepartment;
        totalDeliveries: string;
        pendingDeliveries: string;
        completedDeliveries: string;
        cancelledDeliveries: string;
        unitsDelivered: string;
      }>();

    return rows.map((row) => ({
      department: row.department,
      totalDeliveries: Number(row.totalDeliveries),
      pendingDeliveries: Number(row.pendingDeliveries),
      completedDeliveries: Number(row.completedDeliveries),
      cancelledDeliveries: Number(row.cancelledDeliveries),
      unitsDelivered: Number(row.unitsDelivered),
    }));
  }
}
