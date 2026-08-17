<?php

namespace App\Services;

use DeepL\DeepLClient;

class DeepLService
{
    protected DeepLClient $client;

    public function __construct()
    {
        $this->client = new DeepLClient(
            config('services.deepl.api_key')
        );
    }

    public function translate(string $text, string $targetLanguage): string
    {
        $result = $this->client->translateText(
            $text,
            null,
            $targetLanguage
        );

        return $result->text;
    }
}
