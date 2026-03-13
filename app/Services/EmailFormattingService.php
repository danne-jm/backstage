<?php

namespace App\Services;

/**
 * Service for formatting email HTML
 * Applies inline styles and resets for email clients
 */
class EmailFormattingService
{
    /**
     * Apply inline style resets to email HTML
     */
    public function applyInlineReset(string $html): string
    {
        if (empty($html)) {
            return $html;
        }

        libxml_use_internal_errors(true);
        $doc = new \DOMDocument();
        
        $loaded = $doc->loadHTML(
            '<?xml encoding="utf-8"?>' . $html,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );

        if (!$loaded) {
            libxml_clear_errors();
            return $html;
        }

        $this->applyStylesToElements($doc, 'p', 'margin:0; padding:0;');
        $this->applyStylesToElements($doc, 'ul', 'margin:0; padding-left:20px; list-style-type:disc;');
        $this->applyStylesToElements($doc, 'li', 'margin:0; padding:0; display:list-item;');

        $output = $doc->saveHTML();
        libxml_clear_errors();

        // Clean up encoding artifacts
        return $this->cleanupEncodingArtifacts($output);
    }

    /**
     * Apply styles to specific HTML elements
     */
    private function applyStylesToElements(\DOMDocument $doc, string $tagName, string $style): void
    {
        $elements = $doc->getElementsByTagName($tagName);
        
        foreach ($elements as $element) {
            $existingStyle = $element->getAttribute('style');
            $newStyle = $existingStyle ? $existingStyle . ' ' . $style : $style;
            $element->setAttribute('style', $newStyle);
        }
    }

    /**
     * Clean up encoding artifacts from HTML
     */
    private function cleanupEncodingArtifacts(string $html): string
    {
        // Remove XML declaration if present
        $html = preg_replace('/<\?xml[^?]*\?>/', '', $html);
        
        return trim($html);
    }
}
