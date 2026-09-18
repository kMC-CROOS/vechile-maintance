<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS via Twilio when credentials are present.
     * In local/testing (or when Twilio is not configured) the message is
     * written to storage/logs/laravel.log so the OTP flow is fully testable.
     */
    public function send(string $toE164, string $message): void
    {
        $configured = $this->isConfigured();
        $shouldLog = app()->environment('local', 'testing') || ! $configured;

        if ($shouldLog) {
            Log::info('[SmsService] SMS payload (dev/fallback)', [
                'to' => $toE164,
                'body' => $message,
                'provider' => 'twilio',
                'configured' => $configured,
            ]);
        }

        if (! $configured) {
            return;
        }

        $sid = (string) config('services.twilio.sid');
        $token = (string) config('services.twilio.token');
        $from = (string) config('services.twilio.from');

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->timeout(15)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $from,
                'To' => $toE164,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            Log::error('[SmsService] Twilio send failed', [
                'to' => $toE164,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Unable to send SMS at this time.');
        }
    }

    public function isConfigured(): bool
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        return is_string($sid) && $sid !== ''
            && is_string($token) && $token !== ''
            && is_string($from) && $from !== '';
    }
}
