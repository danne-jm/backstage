<?php

namespace App\Contracts;

interface Purchasable
{
    public function getPrice(): float;
    public function getName(): string;
    public function getDescription(): string;
    public function isAvailable(): bool;
    public function getRemainingStock(): ?int;
}
