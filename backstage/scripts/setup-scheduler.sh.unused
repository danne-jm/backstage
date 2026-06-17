#!/bin/bash
# Laravel Scheduler Setup Script
# This script sets up the Laravel scheduler to run payment reconciliation

echo "=== Laravel Scheduler Setup ==="
echo ""

# Get the current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Project directory: $PROJECT_DIR"
echo ""

# Check if cron is already configured
if crontab -l 2>/dev/null | grep -q "schedule:run"; then
    echo "✓ Cron job already exists"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "schedule:run"
else
    echo "⚠ Cron job NOT configured"
    echo ""
    echo "To set up the Laravel scheduler, run:"
    echo ""
    echo "  crontab -e"
    echo ""
    echo "Then add this line:"
    echo ""
    echo "  * * * * * cd $PROJECT_DIR && php artisan schedule:run >> /dev/null 2>&1"
    echo ""
    echo "This will run the scheduler every minute, which will execute:"
    echo "  - payments:verify-pending (every 15 minutes)"
    echo "  - Any other scheduled tasks you add in the future"
    echo ""
    
    read -p "Would you like me to add this automatically? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup existing crontab
        crontab -l > /tmp/crontab.backup 2>/dev/null || true
        
        # Add new cron job
        (crontab -l 2>/dev/null; echo "* * * * * cd $PROJECT_DIR && php artisan schedule:run >> /dev/null 2>&1") | crontab -
        
        echo "✓ Cron job added successfully!"
        echo ""
        echo "Backup saved to: /tmp/crontab.backup"
    else
        echo "Skipped automatic setup. Please configure manually."
    fi
fi

echo ""
echo "=== Verification ==="
php "$PROJECT_DIR/artisan" schedule:list

echo ""
echo "=== Testing ==="
echo "You can test the reconciliation command manually:"
echo "  php artisan payments:verify-pending"
echo ""
echo "Or check the logs:"
echo "  tail -f storage/logs/laravel.log | grep 'Payment reconciliation'"
