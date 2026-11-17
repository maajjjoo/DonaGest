import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';

const DOCUMENT_RULES: Record<DocumentType, { pattern: RegExp; hint: string }> =
  {
    [DocumentType.CC]: {
      pattern: /^\d{6,10}$/,
      hint: 'la cédula de ciudadanía debe tener entre 6 y 10 dígitos',
    },
    [DocumentType.CE]: {
      pattern: /^\d{6,10}$/,
      hint: 'la cédula de extranjería debe tener entre 6 y 10 dígitos',
    },
    [DocumentType.NIT]: {
      pattern: /^\d{9}(-\d)?$/,
      hint: 'el NIT debe tener 9 dígitos y opcionalmente el dígito de verificación (ej: 890900608-9)',
    },
    [DocumentType.PASAPORTE]: {
      pattern: /^[A-Z0-9]{6,10}$/,
      hint: 'el pasaporte debe tener entre 6 y 10 letras mayúsculas o números',
    },
  };

export const getDocumentNumberError = (
  documentType: DocumentType,
  documentNumber: string,
): string | null => {
  const rule = DOCUMENT_RULES[documentType];
  if (!rule || rule.pattern.test(documentNumber)) {
    return null;
  }
  return `Número de documento inválido: ${rule.hint}`;
};

export function IsValidDocumentNumber(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidDocumentNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const { documentType } = args.object as {
            documentType?: DocumentType;
          };
          if (typeof value !== 'string' || !documentType) {
            return true;
          }
          return getDocumentNumberError(documentType, value) === null;
        },
        defaultMessage(args: ValidationArguments) {
          const { documentType } = args.object as {
            documentType: DocumentType;
          };
          return (
            getDocumentNumberError(documentType, String(args.value)) ??
            'Número de documento inválido'
          );
        },
      },
    });
  };
}
