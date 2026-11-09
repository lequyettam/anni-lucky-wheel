<?php

use App\Http\ApiController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('app'));
Route::get('/api/state', [ApiController::class, 'state']);
Route::get('/api/reports/export', [ApiController::class, 'export']);
Route::post('/api/{action}', [ApiController::class, 'action'])->where('action', 'customer-login|customer-logout|customer-name|staff-login|staff-logout|staff-save|staff-password|spin|activate|use-voucher|redeem|prizes|settings|appearance|content|code');
