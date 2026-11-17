import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DonorType } from '../enums/donor-type.enum';

export class FilterDonorDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Busca por nombre, número de documento o correo',
    example: 'ospina',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MaxLength(100, { message: 'La búsqueda no puede superar 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({ enum: DonorType, example: DonorType.EMPRESA })
  @IsOptional()
  @IsEnum(DonorType, {
    message: `El tipo de donante debe ser uno de: ${Object.values(DonorType).join(', ')}`,
  })
  donorType?: DonorType;
}
