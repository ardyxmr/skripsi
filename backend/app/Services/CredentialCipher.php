<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

/**
 * Encrypt on write / decrypt on read for provider secret columns (Stage 2+).
 * Decrypted values are used only inside drivers/renderers and must never be
 * placed into a response DTO, table payload, or audit entry
 * (04-backend-services.md §7.1).
 */
class CredentialCipher
{
    public function encrypt(?string $plain): ?string
    {
        return $plain === null || $plain === '' ? null : Crypt::encryptString($plain);
    }

    public function decrypt(?string $cipher): ?string
    {
        if ($cipher === null || $cipher === '') {
            return null;
        }
        try {
            return Crypt::decryptString($cipher);
        } catch (\Throwable) {
            return null;
        }
    }
}
