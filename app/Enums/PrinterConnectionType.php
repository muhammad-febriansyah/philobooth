<?php

namespace App\Enums;

enum PrinterConnectionType: string
{
    case Usb = 'usb';
    case Network = 'network';
    case Wifi = 'wifi';
}
