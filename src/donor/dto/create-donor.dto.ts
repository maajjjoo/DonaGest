import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';
import { DonorType } from '../enums/donor-type.enum';
import { IsValidDocumentNumber } from '../validators/document-number.validator';

export class CreateDonorDto {
  @ApiProperty({
    description: 'Nombre completo o razón social',
    example: 'María Fernanda Ospina Restrepo',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  fullName: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CC,
  })
  @IsEnum(DocumentType, {
    message: `El tipo de documento debe ser uno de: ${Object.values(DocumentType).join(', ')}`,
  })
  documentType: DocumentType;

  @ApiProperty({
    description:
      'Número de documento. CC y CE: 6 a 10 dígitos; NIT: 9 dígitos con dígito de verificación opcional; PASAPORTE: 6 a 10 letras o números',
    example: '1020456789',
  })
  @IsValidDocumentNumber()
  @IsString({ message: 'El número de documento debe ser un texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @MaxLength(20, {
    message: 'El número de documento no puede superar 20 caracteres',
  })
  documentNumber: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'maria.ospina@gmail.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(150, { message: 'El correo no puede superar 150 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Celular colombiano: 10 dígitos que empiezan por 3',
    example: '3104567890',
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Matches(/^3\d{9}$/, {
    message:
      'El teléfono debe tener 10 dígitos y empezar por 3 (ej: 3104567890)',
  })
  phone: string;

  @ApiProperty({ description: 'Ciudad', example: 'Medellín' })
  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100, { message: 'La ciudad no puede superar 100 caracteres' })
  city: string;

  @ApiProperty({
    description: 'Tipo de donante',
    enum: DonorType,
    example: DonorType.PERSONA_NATURAL,
  })
  @IsEnum(DonorType, {
    message: `El tipo de donante debe ser uno de: ${Object.values(DonorType).join(', ')}`,
  })
  donorType: DonorType;
}
