<?php

namespace App\Services;

use BaconQrCode\Encoder\Encoder;
use BaconQrCode\Common\ErrorCorrectionLevel;
use Imagick;
use ImagickPixel;

/**
 * Custom service to render QR codes using a logo image repeated as data modules,
 * and compositing the result onto a poster image.
 */
class CustomQrPosterService
{
    /**
     * Generate a custom QR code using a logo as the data modules,
     * and composite it onto a poster image.
     *
     * @param string $targetUrl      The URL/text to encode
     * @param string $posterPath     Path or blob to the poster image
     * @param string $logoPath       Path or blob to the logo image
     * @param int    $qrSize         The total pixel size of the generated QR code
     * @param int    $placementX     The X coordinate to place the QR on the poster
     * @param int    $placementY     The Y coordinate to place the QR on the poster
     * @param string|null $tintHex   Optional hex color to tint the logo tiles (e.g., '#FF0000')
     * @return string                The final composited image blob (PNG)
     */
    public function generatePosterWithQr(
        string $targetUrl,
        string $posterPath,
        string $logoPath,
        int $qrSize = 300,
        int $placementX = 0,
        int $placementY = 0,
        ?string $tintHex = null
    ): string {
        // 1. Generate QR Code Matrix
        $qrCode = Encoder::encode($targetUrl, ErrorCorrectionLevel::H(), 'utf-8');
        $matrix = $qrCode->getMatrix();
        $matrixSize = $matrix->getWidth();

        // Add quiet zone (standard spacing around the QR)
        $quietZone = 2; // Can be adjusted (standard is 4, but visually 2 is often fine)
        $totalModules = $matrixSize + ($quietZone * 2);

        // Calculate the physical size of each module in pixels
        $modulePixelSize = $qrSize / $totalModules;

        // 2. Prepare the Logo Tile
        $logoTile = new Imagick();
        if (@is_file($logoPath)) {
            $logoTile->readImage($logoPath);
        } else {
            $logoTile->readImageBlob($logoPath); // Fallback if blob is passed
        }

        // Ensure tile has an alpha channel for transparency safety
        $logoTile->setImageAlphaChannel(Imagick::ALPHACHANNEL_ACTIVATE);

        // Scale up the tile so it overlaps slightly to prevent sub-pixel visual grid lines
        $visualModuleSize = ceil($modulePixelSize) + 1;
        $logoTile->scaleImage((int) $visualModuleSize, (int) $visualModuleSize);

        // Apply bonus feature: color tinting
        if ($tintHex) {
            $this->tintLogo($logoTile, $tintHex);
        }

        // 3. Create the transparent base QR Canvas
        $qrCanvas = new Imagick();
        $qrCanvas->newImage($qrSize, $qrSize, new ImagickPixel('transparent'));

        // Create solid black finder pattern tile for corner pieces
        $solidTile = new Imagick();
        $solidTile->newImage((int) $visualModuleSize, (int) $visualModuleSize, new ImagickPixel('#000000'));

        // 4. Render the modules onto the QR canvas
        for ($y = 0; $y < $matrixSize; $y++) {
            for ($x = 0; $x < $matrixSize; $x++) {
                $isDark = $matrix->get($x, $y) === 1;

                if ($isDark) {
                    $pixelX = (int) (($x + $quietZone) * $modulePixelSize);
                    $pixelY = (int) (($y + $quietZone) * $modulePixelSize);

                    // Check if current coordinate belongs to the 3 finder patterns
                    if ($this->isFinderPattern($x, $y, $matrixSize)) {
                        $qrCanvas->compositeImage($solidTile, Imagick::COMPOSITE_OVER, $pixelX, $pixelY);
                    } else {
                        $qrCanvas->compositeImage($logoTile, Imagick::COMPOSITE_OVER, $pixelX, $pixelY);
                    }
                }
            }
        }

        // (Optional Feature) Add a highly-transparent white backdrop to the QR canvas 
        // to guarantee it remains readable against extremely dark posters.
        $qrBackground = new Imagick();
        $qrBackground->newImage($qrSize, $qrSize, new ImagickPixel('rgba(255,255,255,0.7)'));
        $qrBackground->compositeImage($qrCanvas, Imagick::COMPOSITE_OVER, 0, 0);

        // 5. Load Poster and Composite
        $poster = new Imagick();
        if (@is_file($posterPath)) {
            $poster->readImage($posterPath);
        } else {
            $poster->readImageBlob($posterPath);
        }

        // Overlay QR design onto the poster exactly where specified
        $poster->compositeImage($qrBackground, Imagick::COMPOSITE_OVER, $placementX, $placementY);

        // Return final image
        $poster->setImageFormat('png');
        $finalBlob = $poster->getImageBlob();

        // Clean up memory
        $logoTile->destroy();
        $solidTile->destroy();
        $qrCanvas->destroy();
        $qrBackground->destroy();
        $poster->destroy();

        return $finalBlob;
    }

    /**
     * Determine if a coordinate is within the three corner finder patterns.
     * Standard Finder patterns are 7x7 squares located strictly at the corners.
     */
    private function isFinderPattern(int $x, int $y, int $matrixSize): bool
    {
        $finderSize = 7;

        // Top-Left Finder Pattern
        if ($x < $finderSize && $y < $finderSize) {
            return true;
        }

        // Top-Right Finder Pattern
        if ($x >= ($matrixSize - $finderSize) && $y < $finderSize) {
            return true;
        }

        // Bottom-Left Finder Pattern
        if ($x < $finderSize && $y >= ($matrixSize - $finderSize)) {
            return true;
        }

        return false;
    }

    /**
     * Apply a color tint to an Imagick object preserving transparency
     */
    private function tintLogo(Imagick $image, string $hexColor): void
    {
        $colorLayer = new Imagick();
        $colorLayer->newImage($image->getImageWidth(), $image->getImageHeight(), new ImagickPixel($hexColor));

        // Copy the alpha channel from the original image to the color layer
        // So the mask is only safely opaque precisely where the logo holds pixels.
        $colorLayer->compositeImage($image, Imagick::COMPOSITE_DSTIN, 0, 0);

        // Multiply the color tint into the underlying logo texture
        $image->compositeImage($colorLayer, Imagick::COMPOSITE_MULTIPLY, 0, 0);

        $colorLayer->destroy();
    }
}
