<?php

namespace App\Domain;

final class Probability
{
    public static function pick(array $prizes, string $mode, ?float $unit = null): array
    {
        $live = fn ($p) => $p['kind'] === 'lose' || ($p['stock'] > 0 && (($p['codeMode'] ?? 'automatic') !== 'imported' || count($p['voucherCodes'] ?? []) > 0));
        $missing = array_sum(array_map(fn ($p) => $live($p) ? 0 : $p['weight'], $prizes));
        $eligible = count(array_filter($prizes, fn ($p) => $live($p) && $p['weight'] > 100));
        $count = count(array_filter($prizes, fn ($p) => $live($p) && $p['weight'] > 0));
        if (! $count || ($mode === 'weighted' && $missing > 0 && ! $eligible)) {
            Store::fail('Hết kết quả có thể quay. Chiến dịch đang tạm dừng.');
        }
        $unit ??= random_int(0, 9007199254740991) / 9007199254740992;
        if ($unit < 0 || $unit >= 1) {
            throw new \InvalidArgumentException('Invalid random value');
        }
        $cursor = $unit * 10000;
        $last = null;
        foreach ($prizes as $p) {
            $weight = ! $live($p) ? 0 : ($mode === 'uniform' ? ($p['weight'] > 0 ? 10000 / $count : 0) : $p['weight'] + ($p['weight'] > 100 ? $missing / max(1, $eligible) : 0));
            if ($weight <= 0) {
                continue;
            }$last = $p;
            $cursor -= $weight;
            if ($cursor < 0) {
                return $p;
            }
        }

        return $last ?? throw new \RuntimeException('No prize');
    }
}
