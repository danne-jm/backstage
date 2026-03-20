const fs = require('fs');
const file = 'resources/js/components/ticket-scanner/scanned-ticket-dialog.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(
    /const isCurrent =\s*t\.ticket_code && ticket\.ticket_code && t\.ticket_code === ticket\.ticket_code \|\|\s*t\.id && ticket\.id && t\.id === ticket\.id;/,
    `const isCurrent =
    (t.ticket_code && ticket.ticket_code && t.ticket_code === ticket.ticket_code) ||
    (t.id && ticket.id && t.id === ticket.id) ||
    (t.ticket_id && ticket.ticket_id && t.ticket_id === ticket.ticket_id);`
);
fs.writeFileSync(file, data);
