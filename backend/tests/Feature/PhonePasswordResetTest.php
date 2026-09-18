<?php

namespace Tests\Feature;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PhonePasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_register_stores_e164_phone(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+94771234567',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'phone' => '+94771234567',
        ]);
    }

    public function test_register_rejects_non_e164_phone(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0771234567',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_otp_request_is_privacy_safe_and_logs_code_for_registered_phone(): void
    {
        Log::spy();

        User::factory()->create(['phone' => '+94771234567']);

        $this->postJson('/api/forgot-password/phone/request', [
            'phone' => '+94771234567',
        ])->assertOk()->assertJson([
            'message' => 'If this number is registered, an OTP has been sent.',
        ]);

        $this->assertDatabaseCount('otps', 1);
        Log::shouldHaveReceived('info')->withArgs(function ($message, $context) {
            return $message === '[SmsService] SMS payload (dev/fallback)'
                && ($context['to'] ?? null) === '+94771234567'
                && str_contains((string) ($context['body'] ?? ''), 'password reset code');
        })->once();
    }

    public function test_otp_request_does_not_reveal_missing_account(): void
    {
        $this->postJson('/api/forgot-password/phone/request', [
            'phone' => '+94770000000',
        ])->assertOk()->assertJson([
            'message' => 'If this number is registered, an OTP has been sent.',
        ]);

        $this->assertDatabaseCount('otps', 0);
    }

    public function test_verify_and_reset_password_flow(): void
    {
        $user = User::factory()->create([
            'phone' => '+94771234567',
            'password' => 'oldpassword',
        ]);

        $otp = Otp::create([
            'phone' => '+94771234567',
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $verify = $this->postJson('/api/forgot-password/phone/verify', [
            'phone' => '+94771234567',
            'code' => '123456',
        ]);

        $verify->assertOk();
        $token = $verify->json('reset_token');
        $this->assertNotEmpty($token);

        $otp->refresh();
        $this->assertNotNull($otp->consumed_at);

        $this->postJson('/api/forgot-password/phone/reset', [
            'phone' => '+94771234567',
            'token' => $token,
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword', $user->fresh()->password));
        $this->assertDatabaseMissing('phone_password_reset_tokens', [
            'phone' => '+94771234567',
        ]);
    }

    public function test_wrong_otp_is_rejected(): void
    {
        User::factory()->create(['phone' => '+94771234567']);

        Otp::create([
            'phone' => '+94771234567',
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/forgot-password/phone/verify', [
            'phone' => '+94771234567',
            'code' => '000000',
        ])->assertStatus(422)->assertJson([
            'message' => 'Invalid or expired code',
        ]);
    }

    public function test_expired_otp_is_rejected(): void
    {
        User::factory()->create(['phone' => '+94771234567']);

        Otp::create([
            'phone' => '+94771234567',
            'code' => Hash::make('123456'),
            'expires_at' => now()->subMinute(),
        ]);

        $this->postJson('/api/forgot-password/phone/verify', [
            'phone' => '+94771234567',
            'code' => '123456',
        ])->assertStatus(422)->assertJson([
            'message' => 'Invalid or expired code',
        ]);
    }

    public function test_consumed_otp_cannot_be_reused(): void
    {
        User::factory()->create(['phone' => '+94771234567']);

        Otp::create([
            'phone' => '+94771234567',
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
            'consumed_at' => now(),
        ]);

        $this->postJson('/api/forgot-password/phone/verify', [
            'phone' => '+94771234567',
            'code' => '123456',
        ])->assertStatus(422);
    }

    public function test_otp_request_is_rate_limited(): void
    {
        User::factory()->create(['phone' => '+94771234567']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/forgot-password/phone/request', [
                'phone' => '+94771234567',
            ])->assertOk();
        }

        $this->postJson('/api/forgot-password/phone/request', [
            'phone' => '+94771234567',
        ])->assertStatus(429);
    }
}
