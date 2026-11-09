<?php

use App\Domain\GameService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

// CLI-only test worker. Never copy tests/ into a web document root.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || config('database.connections.'.config('database.default').'.database') !== 'anni_game_test') {
    exit(90);
}
[$file,$action,$id,$key] = $argv;
$session = new Store('test', new ArraySessionHandler(120));
$session->start();
$session->put('customer', ['id' => $id, 'expires' => time() + 3600]);
$data = $action === 'spin' ? ['source' => 'free', 'requestId' => $key] : ['code' => $key];
$request = Request::create('/api/'.$action, 'POST', $data);
$request->setLaravelSession($session);
try {
    $result = $action === 'spin' ? app(GameService::class)->spin($request) : app(GameService::class)->redeem($request, false);
    echo json_encode(['ok' => true, 'result' => $result]);
} catch (ValidationException $e) {
    echo json_encode(['ok' => false, 'status' => 422]);
} catch (HttpExceptionInterface $e) {
    echo json_encode(['ok' => false, 'status' => $e->getStatusCode()]);
}
