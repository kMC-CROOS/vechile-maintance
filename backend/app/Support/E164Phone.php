<?php

namespace App\Support;

class E164Phone
{
    public const PATTERN = '/^\+[1-9]\d{7,14}$/';

    public static function normalize(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $trimmed = trim($phone);

        return $trimmed === '' ? null : $trimmed;
    }

    public static function isValid(?string $phone): bool
    {
        $normalized = self::normalize($phone);

        return $normalized !== null && preg_match(self::PATTERN, $normalized) === 1;
    }
}
