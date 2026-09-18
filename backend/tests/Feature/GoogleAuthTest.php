<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_id_token(): void
    {
        $response = $this->postJson('/api/google-auth', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['id_token']);
    }

    public function test_rejects_invalid_token_from_google(): void
    {
        config(['services.google.client_id' => 'test-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'error' => 'invalid_token',
                'error_description' => 'Invalid Value',
            ], 400),
        ]);

        $response = $this->postJson('/api/google-auth', [
            'id_token' => 'invalid-token-string',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Invalid Google token.']);
    }

    public function test_successful_google_sign_in_creates_user_and_returns_token(): void
    {
        config(['services.google.client_id' => 'test-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-client-id',
                'iss' => 'https://accounts.google.com',
                'exp' => time() + 3600,
                'email' => 'googleuser@example.com',
                'email_verified' => true,
                'sub' => 'google-sub-12345',
                'name' => 'Google Test User',
            ], 200),
        ]);

        $response = $this->postJson('/api/google-auth', [
            'id_token' => 'valid-mock-token',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'googleuser@example.com',
            'google_id' => 'google-sub-12345',
            'name' => 'Google Test User',
        ]);

        $user = User::where('email', 'googleuser@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_links_existing_user_by_email(): void
    {
        config(['services.google.client_id' => 'test-client-id']);

        $existing = User::factory()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-client-id',
                'iss' => 'accounts.google.com',
                'exp' => time() + 3600,
                'email' => 'existing@example.com',
                'email_verified' => true,
                'sub' => 'google-sub-99999',
                'name' => 'Existing User',
            ], 200),
        ]);

        $response = $this->postJson('/api/google-auth', [
            'id_token' => 'valid-mock-token',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $existing->id,
            'email' => 'existing@example.com',
            'google_id' => 'google-sub-99999',
        ]);
    }
}
