<?php

use Illuminate\Support\Facades\Schedule;

/*
| Scheduled maintenance. Run the scheduler with `php artisan schedule:work`
| (dev) or a cron entry for `php artisan schedule:run` (production).
*/

Schedule::command('idempotency:prune')->daily()->withoutOverlapping();
