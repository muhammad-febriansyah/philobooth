<?php

namespace App\Services\Pakasir;

use RuntimeException;
use Throwable;

class PakasirException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $providerStatus = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $providerStatus ?? 0, $previous);
    }
}
