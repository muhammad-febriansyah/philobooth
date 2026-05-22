<?php

namespace App\Enums;

enum PrinterLogEvent: string
{
    case StatusCheck = 'status_check';
    case PrintStart = 'print_start';
    case PrintSuccess = 'print_success';
    case PrintError = 'print_error';
    case Offline = 'offline';
}
