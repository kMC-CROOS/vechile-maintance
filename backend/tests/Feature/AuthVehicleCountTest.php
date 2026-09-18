<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthVehicleCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_zero_vehicles_count(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'user' => [
                'email' => 'newuser@example.com',
                'vehicles_count' => 0,
            ],
        ]);
    }

    public function test_login_returns_zero_when_user_has_no_vehicles(): void
    {
        $user = User::factory()->create([
            'email' => 'novehicles@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'novehicles@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'user' => [
                'email' => 'novehicles@example.com',
                'vehicles_count' => 0,
            ],
        ]);
    }

    public function test_login_returns_accurate_count_when_user_has_vehicles(): void
    {
        $user = User::factory()->create([
            'email' => 'withvehicle@example.com',
            'password' => bcrypt('password123'),
        ]);

        Vehicle::create([
            'user_id' => $user->id,
            'type' => 'Car',
            'brand' => 'Honda',
            'model' => 'Civic',
            'registration_number' => 'AB12CD',
            'fuel_type' => 'Petrol',
            'transmission' => 'Manual',
            'current_odometer' => 12000,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'withvehicle@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'user' => [
                'email' => 'withvehicle@example.com',
                'vehicles_count' => 1,
            ],
        ]);
    }

    public function test_me_returns_accurate_vehicle_count(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/me');

        $response->assertStatus(200);
        $response->assertJson([
            'user' => [
                'vehicles_count' => 0,
            ],
        ]);

        Vehicle::create([
            'user_id' => $user->id,
            'type' => 'Bike',
            'brand' => 'Yamaha',
            'model' => 'R15',
            'registration_number' => 'XY99ZZ',
            'fuel_type' => 'Petrol',
            'transmission' => 'Manual',
            'current_odometer' => 5000,
        ]);

        $responseAfter = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/me');

        $responseAfter->assertStatus(200);
        $responseAfter->assertJson([
            'user' => [
                'vehicles_count' => 1,
            ],
        ]);
    }
}
