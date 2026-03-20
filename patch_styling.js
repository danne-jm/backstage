const fs = require('fs');
let file = 'resources/js/components/ticket-scanner/scanned-ticket-dialog.tsx';
let data = fs.readFileSync(file, 'utf8');

// The class we want to replace
data = data.replace(
    /className=\{\`p-3 relative transition-colors \$\{\s*isCurrent\s*\?\s*'bg-primary\/5'\s*:\s*'hover:bg-muted\/50'\s*\}\s*\$\{t\.scan_count > 0 && !isCurrent \? 'bg-green-50\/50 dark:bg-green-900\/10' : ''\}\`\}/,
    "className={`relative rounded-md p-3 transition-colors hover:bg-muted/50 ${isCurrent ? 'bg-primary/5 ring-1 ring-primary' : 'border border-transparent bg-card'} ${t.scan_count > 0 && !isCurrent ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}"
);
data = data.replace(
    /className="absolute left-0 top-0 bottom-0 w-1 bg-primary"/,
    "className=\"absolute left-0 top-0 bottom-0 w-1 rounded-l-md bg-primary\""
);

fs.writeFileSync(file, data);
