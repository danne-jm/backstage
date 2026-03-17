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
     * Wraps content in a table for better Gmail rendering
     */
    public function applyInlineReset(string $html): string
    {
        if (empty($html)) {
            return $html;
        }

        // First, clean up the HTML structure
        $html = $this->cleanupHtmlStructure($html);

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

        // Apply strict inline style resets to elements
        $this->applyStylesToElements($doc, 'p', 'margin:0; padding:0; line-height:1.4;');
        $this->applyStylesToElements($doc, 'ul', 'margin:0; padding-left:20px; list-style-type:disc; line-height:1.4;');
        $this->applyStylesToElements($doc, 'ol', 'margin:0; padding-left:20px; list-style-type:decimal; line-height:1.4;');
        $this->applyStylesToElements($doc, 'li', 'margin:0; padding:0; display:list-item; line-height:1.4;');
        $this->applyStylesToElements($doc, 'div', 'margin:0; padding:0;');
        $this->applyStylesToElements($doc, 'span', 'margin:0; padding:0;');
        $this->applyStylesToElements($doc, 'strong', 'margin:0; padding:0;');
        $this->applyStylesToElements($doc, 'em', 'margin:0; padding:0;');

        // Remove empty paragraphs
        $this->handleEmptyParagraphs($doc);

        $output = $doc->saveHTML();
        libxml_clear_errors();

        // Clean up encoding artifacts
        return $this->cleanupEncodingArtifacts($output);
    }

    /**
     * Clean up HTML structure to prevent Gmail from adding extra spacing
     * Removes intentional br tags used for spacing in the editor
     */
    private function cleanupHtmlStructure(string $html): string
    {
        // We no longer blindly delete data-spacing paragraphs, as users may type {{qr}} inside them.

        // Remove all standalone <br> tags that aren't inside other elements
        // This prevents Gmail from inserting extra spacing
        $html = preg_replace('/<br\s*\/?>(\s*<(?:p|ul|ol|div|h[1-6]))/i', '$1', $html);
        $html = preg_replace('/(<\/(?:p|ul|ol|div|h[1-6])>)\s*<br\s*\/?>(?=\s*(?:<(?:p|ul|ol|div|h[1-6])|$))/i', '$1', $html);
        // Remove stray <br> directly inside lists
        $html = preg_replace('/<ul>\s*<br\s*\/?>(\s*<li)/i', '<ul>$1', $html);
        $html = preg_replace('/<ol>\s*<br\s*\/?>(\s*<li)/i', '<ol>$1', $html);
        $html = preg_replace('/(<li[^>]*>)\s*<br\s*\/?>(\s*<\/li>)/i', '$1$2', $html);

        return $html;
    }

    /**
     * Remove empty paragraphs that only contain whitespace or br tags
     * These are typically created by users pressing Enter for spacing
     */
    private function handleEmptyParagraphs(\DOMDocument $doc): void
    {
        $paragraphs = $doc->getElementsByTagName('p');
        $toRemove = [];

        // Convert to array to avoid iterator issues when modifying
        $paragraphArray = [];
        foreach ($paragraphs as $p) {
            $paragraphArray[] = $p;
        }

        foreach ($paragraphArray as $p) {
            $text = trim($p->textContent);
            $isMarkedAsSpacing = $p->hasAttribute('data-spacing');
            $hasContent = false;

            // Check if paragraph has actual content (not just br, nbsp, etc.)
            foreach ($p->childNodes as $node) {
                if ($node->nodeType === XML_TEXT_NODE) {
                    $nodeText = trim($node->nodeValue);
                    // Consider nbsp as non-content for removal purposes
                    if ($nodeText !== '' && $nodeText !== '&nbsp;') {
                        $hasContent = true;
                        break;
                    }
                } elseif ($node->nodeType === XML_ELEMENT_NODE) {
                    // br tags are allowed, but other elements mean this has content
                    if ($node->nodeName !== 'br') {
                        $hasContent = true;
                        break;
                    }
                }
            }

            // Remove paragraphs that are genuinely empty (no content)
            if (!$hasContent && $text === '') {
                $toRemove[] = $p;
            }
        }

        // Remove all detected empty paragraphs
        foreach ($toRemove as $p) {
            if ($p->parentNode) {
                $p->parentNode->removeChild($p);
            }
        }

        // Also remove data-spacing attribute from remaining paragraphs
        foreach ($paragraphArray as $p) {
            if ($p->parentNode && $p->hasAttribute('data-spacing')) {
                $p->removeAttribute('data-spacing');
            }
        }
    }

    /**
     * Apply styles to specific HTML elements
     * Intelligently merges new styles with existing ones, ensuring consistency
     */
    private function applyStylesToElements(\DOMDocument $doc, string $tagName, string $newStyle): void
    {
        $elements = $doc->getElementsByTagName($tagName);

        foreach ($elements as $element) {
            $existingStyle = $element->getAttribute('style') ?? '';

            // Parse both styles
            $existingPairs = $this->parseInlineStyle($existingStyle);
            $newPairs = $this->parseInlineStyle($newStyle);

            // Merge: new styles override, but preserve any existing specific values if more precise
            $merged = $this->mergeStylePairs($existingPairs, $newPairs);

            // Rebuild style string
            $styleString = $this->buildInlineStyle($merged);
            if (!empty($styleString)) {
                $element->setAttribute('style', $styleString);
            }
        }
    }

    /**
     * Parse inline style string into key-value pairs
     */
    private function parseInlineStyle(string $style): array
    {
        $pairs = [];
        if (empty($style)) {
            return $pairs;
        }

        $declarations = array_filter(array_map('trim', explode(';', $style)));
        foreach ($declarations as $declaration) {
            if (empty($declaration) || strpos($declaration, ':') === false) {
                continue;
            }
            [$property, $value] = array_map('trim', explode(':', $declaration, 2));
            if (!empty($property)) {
                $pairs[$property] = $value;
            }
        }

        return $pairs;
    }

    /**
     * Merge two style pair arrays, with new pairs taking precedence
     */
    private function mergeStylePairs(array $existing, array $new): array
    {
        $merged = $existing;
        foreach ($new as $property => $value) {
            // Always use new value for margin/padding properties
            if (preg_match('/^(margin|padding|display|line-height)/', $property)) {
                $merged[$property] = $value;
            } elseif (!isset($merged[$property])) {
                // Only add new property if it doesn't exist
                $merged[$property] = $value;
            }
        }
        return $merged;
    }

    /**
     * Build inline style string from key-value pairs
     */
    private function buildInlineStyle(array $pairs): string
    {
        $declarations = [];
        foreach ($pairs as $property => $value) {
            $declarations[] = $property . ':' . $value;
        }
        return implode(';', $declarations);
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
