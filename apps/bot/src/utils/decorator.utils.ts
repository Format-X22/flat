import { applyDecorators, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { ApiPropertyOptions } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchemaObjectMetadata } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';
import { getHeadersFromRequest } from './get-headers-from-request';

type TPropertyOptions = ApiPropertyOptions & {
    isRequired?: boolean;
    isRange?: boolean;
};

const NUMBER_RANGE_DESCRIPTION =
    'Array of numbers. First value is "min", the second is "max". ' +
    'If "min" = "max" it will match. Examples: "0,0", "-Infinity,0", "0,Infinity", "0,1"';

export const HeadersWithSession = createParamDecorator((value: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return getHeadersFromRequest(request);
});

export function Property(options: TPropertyOptions = {}): PropertyDecorator {
    const { isArray, isRange } = options;

    let swaggerWrapper: typeof ApiProperty | typeof ApiPropertyOptional;
    if (options.isRequired) {
        swaggerWrapper = ApiProperty;
    } else {
        swaggerWrapper = ApiPropertyOptional;
    }

    const customWrapper = function (target: Record<string, unknown>, propertyKey: string | symbol) {
        const typeMeta = Reflect.getMetadata('design:type', target, propertyKey);

        if (typeMeta.name === 'Boolean') {
            TransformBooleanFix()(target, propertyKey);
        }

        if (isArray || isRange) {
            AddCommasSupport(options.type, isRange)(target, propertyKey);
        }
    };

    if (!options.enum && !options.enumName && options.isArray) {
        delete options.isArray;
    }

    if (isRange) {
        options.type = 'string';
        options.description = NUMBER_RANGE_DESCRIPTION;
    }

    const decoratorsToApply = [swaggerWrapper(options), customWrapper];

    if (isRange) {
        decoratorsToApply.push(IsRange());
    }

    return applyDecorators(...decoratorsToApply);
}
export function RequiredProperty(options: TPropertyOptions = { isRequired: true }) {
    return Property({ ...options, isRequired: true });
}

// https://github.com/typestack/class-transformer/issues/626
export function TransformBooleanFix() {
    return Transform(({ obj, key }) => {
        return Boolean([true, 'enabled', 'true'].indexOf(obj[key]) + 1);
    });
}

export function AddCommasSupport(type?: SchemaObjectMetadata['type'], isRange?: boolean): PropertyDecorator {
    return Transform(({ value }) => {
        return addCommasSupportForValue(value, type, isRange);
    });
}

export function addCommasSupportForValue(
    value: string | Array<string>,
    type?: SchemaObjectMetadata['type'],
    isRange?: boolean,
): Array<string | number> {
    let result: Array<string | number>;

    if (!Array.isArray(value)) {
        result = value.split(',');
    } else {
        result = value;
    }

    if (isRange || type?.['name'] === 'Number') {
        result = result.map((v) => Number(v));
    }

    if (isRange && result[0] === -Infinity && result[1] === Infinity) {
        return undefined;
    }

    return result;
}

function IsRange(validationOptions?: ValidationOptions) {
    return function (object: Record<string, unknown>, propertyName: string) {
        registerDecorator({
            name: 'isRange',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    const absValue0 = Math.abs(value[0]);
                    const absValue1 = Math.abs(value[1]);
                    return (
                        Array.isArray(value) &&
                        value.length === 2 &&
                        typeof value[0] === 'number' &&
                        typeof value[1] === 'number' &&
                        (absValue0 === Infinity || absValue0 === 0 || (absValue0 <= 1e15 && absValue0 >= 1e-15)) &&
                        (absValue1 === Infinity || absValue1 === 0 || (absValue1 <= 1e15 && absValue1 >= 1e-15)) &&
                        value[0] <= value[1]
                    );
                },
                defaultMessage(validationArguments) {
                    return (
                        `invalid range in ${validationArguments.property}: [${validationArguments.value}]; ` +
                        `range must contain exactly 2 numbers whose absolute values are between [1e-15,1e15] and the first <= the second`
                    );
                },
            },
        });
    };
}
