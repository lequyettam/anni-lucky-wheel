<?php

namespace App\Domain;

use Illuminate\Support\Facades\Validator;

final class Validation
{
    public static function phone(string $value): string
    {
        $p = preg_replace('/[\s.()\-]/u', '', trim($value));
        $p = preg_replace('/^(?:\+84|84)(?=[35789]\d{8}$)/', '0', $p);
        if (! preg_match('/^0[35789]\d{8}$/D', $p)) {
            Store::fail('Nhập số di động Việt Nam hợp lệ gồm 10 chữ số.');
        }

return $p;
    }

    public static function image(mixed $value, int $max): string
    {
        if ($value === '') {
            return '';
        }
        if (! is_string($value) || strlen($value) > $max * 4 / 3 + 100 || ! preg_match('~^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$~D', $value, $m)) {
            Store::fail('Ảnh phải là PNG, JPG hoặc WebP hợp lệ.');
        }
        $bytes = base64_decode($m[2], true);
        $info = $bytes !== false ? @getimagesizefromstring($bytes) : false;
        if (! $info || strlen($bytes) > $max || $info[0] * $info[1] > 20000000 || $info['mime'] !== 'image/'.$m[1]) {
            Store::fail('Ảnh vượt giới hạn hoặc không hợp lệ.');
        }
        $image = @imagecreatefromstring($bytes);
        if (! $image) {
            Store::fail('Không đọc được ảnh.');
        }imagedestroy($image);

        return $value;
    }

    public static function prizes(array $input): array
    {
        Validator::make(['prizes' => $input], [
            'prizes' => 'required|array|min:2|max:12', 'prizes.*.id' => 'required|string|max:64|regex:/^[A-Za-z0-9_-]+$/|distinct',
            'prizes.*.name' => 'required|string|max:70', 'prizes.*.short' => 'required|string|max:22',
            'prizes.*.kind' => 'required|in:lose,drink,percent,amount', 'prizes.*.weight' => 'required|integer|min:0|max:10000',
            'prizes.*.stock' => 'nullable|integer|min:0|max:1000000', 'prizes.*.days' => 'required|integer|min:1|max:365',
            'prizes.*.color' => 'required|regex:/^#[0-9a-fA-F]{6}$/', 'prizes.*.icon' => 'required|in:gift,cup,ticket,spark,leaf',
            'prizes.*.terms' => 'required|string|max:500', 'prizes.*.image' => 'present|string',
            'prizes.*.codeMode' => 'sometimes|in:automatic,imported', 'prizes.*.voucherCodes' => 'sometimes|array|max:1000',
            'prizes.*.voucherCodes.*' => 'required|string|max:64|regex:/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/',
            'prizes.*.codeMessage' => 'sometimes|nullable|string|max:500',
        ])->validate();
        if (array_sum(array_column($input, 'weight')) !== 10000) {
            Store::fail('Tổng tỷ lệ phải đúng 100%.');
        }
        $seen = [];
        $result = [];
        foreach ($input as $p) {
            $p = array_intersect_key($p, array_flip(['id', 'name', 'short', 'kind', 'weight', 'stock', 'days', 'color', 'icon', 'terms', 'image', 'codeMode', 'voucherCodes', 'codeMessage']));
            $p['codeMode'] ??= 'automatic';
            $p['codeMessage'] ??= '';
            $p['voucherCodes'] ??= [];
            $p['image'] = self::image($p['image'], 600 * 1024);
            if ($p['kind'] === 'lose') {
                $p['stock'] = null;
                if ($p['codeMode'] === 'imported') {
                    Store::fail('Ô không trúng không thể cấp mã.');
                }
            } elseif (! isset($p['stock'])) {
                Store::fail('Cần nhập số quà còn lại.');
            }
            if ($p['codeMode'] === 'imported') {
                if ((int) $p['stock'] !== count($p['voucherCodes'])) {
                    Store::fail('Số quà phải bằng số mã chưa cấp.');
                }
                foreach ($p['voucherCodes'] as $code) {
                    $key = strtoupper($code);
                    if (isset($seen[$key])) {
                        Store::fail('Mã voucher bị trùng trong danh sách hoặc giữa các quà.');
                    }$seen[$key] = true;
                }
            } elseif ($p['voucherCodes']) {
                Store::fail('Cần chọn chế độ mã nhập sẵn.');
            }
            $p['weight'] = (int) $p['weight'];
            $p['days'] = (int) $p['days'];
            if ($p['stock'] !== null) {
                $p['stock'] = (int) $p['stock'];
            }$result[] = $p;
        }

return $result;
    }

    public static function content(array $value): array
    {
        $schema = Store::decode(file_get_contents(resource_path('game/content-schema.json')));
        $out = ['brand' => [], 'text' => [], 'themes' => []];
        $check = function ($source, $fields) {
            $target = [];
            foreach ($fields as $f) {
                $v = $source[$f['key']] ?? null;
                if (! is_string($v) || mb_strlen($v) > $f['max'] || (! ($f['optional'] ?? false) && ! trim($v))) {
                    Store::fail('Nội dung không hợp lệ: '.$f['label']);
                }
                preg_match_all('/\{([^{}]+)\}/u', $v, $matches);
                foreach ($matches[1] as $key) {
                    if (! in_array($key, ['brand', 'shortBrand', 'customer', 'dailyFree'], true)) {
                        Store::fail('Biến nội dung chưa được hỗ trợ.');
                    }
                }
                $target[$f['key']] = $v;
            }

return $target;
        };
        $out['brand'] = $check($value['brand'] ?? [], $schema['brand']);
        $out['text'] = $check($value['text'] ?? [], $schema['text']);
        foreach (['logo', 'logoDark'] as $key) {
            $out['brand'][$key] = self::image($value['brand'][$key] ?? '', 300 * 1024);
        }
        if (! trim($out['brand']['name']) && ! $out['brand']['logo'] && ! $out['brand']['logoDark']) {
            Store::fail('Cần tên thương hiệu hoặc ít nhất một logo.');
        }
        foreach ($schema['themeIds'] as $id) {
            $out['themes'][$id] = $check($value['themes'][$id] ?? [], $schema['theme']);
        }

return $out;
    }

    public static function themeIds(): array
    {
        return Store::decode(file_get_contents(resource_path('game/content-schema.json')))['themeIds'];
    }
}
