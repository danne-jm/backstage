<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            color: #111827;
        }

        table { border-collapse: collapse; width: 100%; }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #ffffff;
        }

        .header { text-align: center; margin-bottom: 48px; }

        .brand-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            display: block;
        }

        .title { font-size: 28px; font-weight: 700; margin: 0 0 12px; color: #1e3a5f; }

        .subtitle { font-size: 16px; color: #6b7280; margin: 0; }

        .summary-card {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
        }

        .summary-heading { font-size: 18px; font-weight: 600; margin: 0 0 24px; color: #111827; }

        .item-card {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
        }

        .item-name { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px; }

        .item-meta { font-size: 14px; color: #6b7280; margin: 0 0 8px; }

        .item-price { font-size: 16px; font-weight: 600; color: #111827; margin: 0; }

        .reference-section { text-align: right; }

        .reference-label {
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .reference-code {
            background-color: #f3f4f6;
            padding: 10px 14px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            font-weight: 700;
            color: #1f2937;
            display: inline-block;
            letter-spacing: 0.5px;
        }

        .totals-section { border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px; }

        .total-row { padding: 6px 0; }

        .total-label { font-size: 14px; color: #6b7280; }

        .total-value { font-size: 14px; font-weight: 500; color: #111827; text-align: right; }

        .total-final-row { border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 12px; }

        .total-final-label { font-size: 16px; font-weight: 700; color: #111827; }

        .total-final-value { font-size: 20px; font-weight: 700; color: #1e3a5f; text-align: right; }

        .btn-container { text-align: center; margin: 32px 0; }

        .btn {
            display: inline-block;
            background-color: #1f2937;
            color: #ffffff !important;
            padding: 14px 36px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            text-transform: uppercase;
            border-radius: 8px;
            letter-spacing: 0.5px;
        }

        .important-notice {
            background-color: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 32px;
        }

        .important-notice-text { font-size: 14px; color: #854d0e; margin: 0; line-height: 1.6; }

        .footer { text-align: center; padding: 32px 0; }

        .social-links { margin-bottom: 16px; }

        .social-link {
            display: inline-block;
            margin: 0 10px;
            text-decoration: none;
        }

        .social-icon {
            width: 24px;
            height: 24px;
            vertical-align: middle;
        }

        .copyright { font-size: 14px; color: #6b7280; margin: 0; }

        @media only screen and (max-width: 600px) {
            .reference-section { text-align: left; margin-top: 12px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ $message->embed(public_path('images/social/esnstar.png')) }}" alt="ESN" width="80" height="80" class="brand-logo">
            <h1 class="title">Thank you for your purchase!</h1>
            <p class="subtitle">Your order has been confirmed. Please save your reference IDs below.</p>
        </div>

        <div class="summary-card">
            <h2 class="summary-heading">Order Summary</h2>

            @foreach($transaction->sales as $sale)
                @php
                    $itemName = $sale->product ? $sale->product->name : ($sale->event ? $sale->event->name : 'Unknown Item');
                    $variantOptions = $sale->details['options'] ?? null;
                    $codeUsed = $sale->details['code_used'] ?? null;
                    $hasVariants = $variantOptions && is_array($variantOptions) && count($variantOptions) > 0;
                    $hasEsnCardDiscount = !empty($codeUsed) || $sale->ticket_type === 'with_card';
                @endphp
                <div class="item-card">
                    <table style="width: 100%;">
                        <tr>
                            <td style="vertical-align: top; width: 60%;">
                                <div class="item-name">{{ $itemName }}</div>
                                @if($hasVariants)
                                    <div class="item-meta">
                                        @foreach($variantOptions as $key => $value)
                                            {{ $key }}: {{ $value }}@if(!$loop->last), @endif
                                        @endforeach
                                    </div>
                                @endif
                                @if($hasEsnCardDiscount)
                                    <div class="item-meta">With ESNcard</div>
                                @endif
                            </td>
                            <td rowspan="2" class="reference-section" style="vertical-align: top; width: 40%;">
                                <div class="reference-label">Reference ID</div>
                                <div class="reference-code">{{ $sale->reference_id ?? '—' }}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="vertical-align: bottom; padding-top: 8px;">
                                <div class="item-price">€{{ number_format($sale->amount, 2) }}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach

            <div class="totals-section">
                <table>
                    <tr class="total-row">
                        <td class="total-label">Subtotal</td>
                        <td class="total-value">€{{ number_format($transaction->total_amount - $transaction->processing_fee, 2) }}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="total-label">Processing fee</td>
                        <td class="total-value">€{{ number_format($transaction->processing_fee, 2) }}</td>
                    </tr>
                    <tr class="total-final-row">
                        <td class="total-final-label">Total</td>
                        <td class="total-final-value">€{{ number_format($transaction->total_amount, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        @php
            $storeScheme = app()->isProduction() ? 'https' : 'http';
            $storeDomain = env('STORE_DOMAIN', 'store.localhost');
            $storePort = app()->isProduction() ? '' : ':8000';
            $storeUrl = $storeScheme . '://' . $storeDomain . $storePort;
        @endphp

        <div class="btn-container">
            <a href="{{ $storeUrl }}/confirmation?bag={{ $transaction->reference_id }}" class="btn">View Order</a>
        </div>

        <div class="important-notice">
            <p class="important-notice-text">
                <strong>Important:</strong> Please save your reference IDs or return to this email later.
                You may still need to register to the event(s) and/or product(s) and might have to provide
                them in your form submission!
            </p>
        </div>

        <div class="footer">
            <div class="social-links">
                @if(env('LINKTREE_URL'))
                    <a href="{{ env('LINKTREE_URL') }}" class="social-link" title="Linktree">
                        <img src="{{ $message->embed(public_path('images/social/linktree.png')) }}" alt="Linktree" class="social-icon">
                    </a>
                @endif
                @if(env('FACEBOOK_URL'))
                    <a href="{{ env('FACEBOOK_URL') }}" class="social-link" title="Facebook">
                        <img src="{{ $message->embed(public_path('images/social/facebook.png')) }}" alt="Facebook" class="social-icon">
                    </a>
                @endif
                @if(env('WEBSITE_URL'))
                    <a href="{{ env('WEBSITE_URL') }}" class="social-link" title="Website">
                        <img src="{{ $message->embed(public_path('images/social/website.png')) }}" alt="Website" class="social-icon">
                    </a>
                @endif
                @if(env('TIKTOK_URL'))
                    <a href="{{ env('TIKTOK_URL') }}" class="social-link" title="TikTok">
                        <img src="{{ $message->embed(public_path('images/social/tiktok.png')) }}" alt="TikTok" class="social-icon">
                    </a>
                @endif
                @if(env('INSTAGRAM_URL'))
                    <a href="{{ env('INSTAGRAM_URL') }}" class="social-link" title="Instagram">
                        <img src="{{ $message->embed(public_path('images/social/instagram.png')) }}" alt="Instagram" class="social-icon">
                    </a>
                @endif
            </div>
            <p class="copyright">&copy; {{ date('Y') }} {{ env('COPYRIGHT', 'ESN Leuven') }}</p>
        </div>
    </div>
</body>
</html>
