<?php

namespace App\Enums;

enum SessionStep: string
{
    case Start = 'start';
    case Payment = 'payment';
    case Frame = 'frame';
    case Capture = 'capture';
    case Preview = 'preview';
    case Filter = 'filter';
    case Quantity = 'quantity';
    case Generate = 'generate';
    case Print = 'print';
    case Download = 'download';
    case Done = 'done';
}
