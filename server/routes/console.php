<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('anni:prune')->dailyAt('03:30')->timezone('Asia/Ho_Chi_Minh')->withoutOverlapping();
