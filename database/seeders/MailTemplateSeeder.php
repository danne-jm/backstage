<?php

namespace Database\Seeders;

use App\Models\MailTemplate;
use Illuminate\Database\Seeder;

class MailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $defaultHtml = <<<'HTML'
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfcf9; border: 1px solid #d4c5a9;">
    <div style="text-align: center; padding: 40px 20px 20px; border-bottom: 1px solid #d4c5a9;">
        <div style="font-size: 32px; font-weight: 300; letter-spacing: 4px; color: #2c2416; margin-bottom: 8px;">ESN LEUVEN</div>
        <div style="font-size: 11px; letter-spacing: 2px; color: #8b7355; font-weight: 500;">Announcement</div>
    </div>
    
    <div style="padding: 50px 40px; color: #5a4a3a; line-height: 1.8;">
        <h1 style="font-size: 28px; font-weight: 300; color: #2c2416; margin: 0 0 20px 0; text-align: center;">{{event_name}}</h1>
        <p style="text-align: center; color: #8b7355; font-size: 14px; margin: 0 0 30px 0;">{{event_date}}</p>
        {{body}}
    </div>
    
    <div style="padding: 30px 40px; border-top: 1px solid #d4c5a9; background-color: #f8f6f0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #5a4a3a;">© 2025 ESN Leuven. All rights reserved.</p>
        <div style="font-size: 13px; color: #8b7355; margin-bottom: 10px;">
            <a href="https://www.instagram.com/esnleuven/" target="_blank" style="color: #8b7355; text-decoration: none;">Instagram</a> | 
            <a href="https://linktr.ee/esnleuven" target="_blank" style="color: #8b7355; text-decoration: none;">Linktree</a> | 
            <a href="https://www.esnleuven.be/" target="_blank" style="color: #8b7355; text-decoration: none;">Website</a>
        </div>
        <p style="margin: 0; font-size: 12px; color: #a39482;">You received this email because you registered for an ESN Leuven communication.</p>
    </div>
</div>
HTML;

        MailTemplate::firstOrCreate(
            ['name' => 'ESN Leuven Default'],
            ['html_content' => $defaultHtml]
        );
    }
}