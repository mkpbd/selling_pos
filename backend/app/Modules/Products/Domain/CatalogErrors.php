<?php

declare(strict_types=1);

namespace App\Modules\Products\Domain;

use App\Shared\Domain\Result\Error;

final class CatalogErrors
{
    public static function productNotFound(): Error
    {
        return Error::notFound('PRODUCT_NOT_FOUND', 'Product not found.');
    }

    public static function skuTaken(string $sku): Error
    {
        return Error::conflict('SKU_TAKEN', "SKU [{$sku}] is already in use.", ['sku' => ["SKU [{$sku}] is already in use."]]);
    }

    public static function barcodeTaken(): Error
    {
        return Error::conflict('BARCODE_TAKEN', 'This barcode is already assigned to another product.', [
            'barcode' => ['This barcode is already assigned to another product.'],
        ]);
    }

    public static function invalidCategory(): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The selected category is invalid or inactive.', [
            'category_id' => ['The selected category is invalid or inactive.'],
        ]);
    }

    public static function invalidUnit(): Error
    {
        return Error::validation('VALIDATION_FAILED', 'The selected unit is invalid.', [
            'unit_id' => ['The selected unit is invalid.'],
        ]);
    }

    public static function categoryNotFound(): Error
    {
        return Error::notFound('CATEGORY_NOT_FOUND', 'Category not found.');
    }

    public static function categoryNameTaken(): Error
    {
        return Error::conflict('CATEGORY_NAME_TAKEN', 'A category with this name already exists.', [
            'name' => ['A category with this name already exists.'],
        ]);
    }

    public static function categoryInUse(): Error
    {
        return Error::conflict('CATEGORY_IN_USE', 'The category has products. Move or deactivate them first.');
    }

    public static function unitNotFound(): Error
    {
        return Error::notFound('UNIT_NOT_FOUND', 'Unit not found.');
    }

    public static function unitCodeTaken(): Error
    {
        return Error::conflict('UNIT_CODE_TAKEN', 'A unit with this code already exists.', [
            'code' => ['A unit with this code already exists.'],
        ]);
    }

    public static function unitInUse(): Error
    {
        return Error::conflict('UNIT_IN_USE', 'The unit is used by products and cannot be deleted.');
    }
}
