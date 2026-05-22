<?php

namespace App\Enums;

enum PhotoSlotShape: string
{
    case Rectangle = 'rectangle';
    case Circle = 'circle';
    case Custom = 'custom';
}
