<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function googleAuth(Request $request)
    {
        $validated = $request->validate([
            'id_token' => 'required|string',
        ]);

        $clientId = config('services.google.client_id');
        if (!is_string($clientId) || $clientId === '') {
            \Illuminate\Support\Facades\Log::error('GoogleAuth: config(services.google.client_id) is empty or missing.');
            return response()->json([
                'message' => 'Google sign-in is not configured.',
            ], 500);
        }

        try {
            $googleResponse = Http::timeout(10)
                ->withoutVerifying()
                ->acceptJson()
                ->get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $validated['id_token'],
                ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('GoogleAuth: HTTP exception when calling tokeninfo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Could not verify Google token.',
            ], 401);
        }

        if (!$googleResponse->successful()) {
            \Illuminate\Support\Facades\Log::error('GoogleAuth: tokeninfo returned error status: ' . $googleResponse->status() . ' body: ' . $googleResponse->body());
            return response()->json([
                'message' => 'Invalid Google token.',
            ], 401);
        }

        $payload = $googleResponse->json();
        if (!is_array($payload)) {
            \Illuminate\Support\Facades\Log::error('GoogleAuth: payload is not an array.');
            return response()->json([
                'message' => 'Invalid Google token.',
            ], 401);
        }

        $audience = $payload['aud'] ?? '';
        $issuer = $payload['iss'] ?? '';
        $expiresAt = (int) ($payload['exp'] ?? 0);
        $email = $payload['email'] ?? null;
        $emailVerified = $payload['email_verified'] ?? false;
        $googleId = $payload['sub'] ?? null;
        $name = $payload['name'] ?? null;

        $validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        $isEmailVerified = $emailVerified === true || $emailVerified === 'true';

        if (
            !is_string($audience)
            || !hash_equals($clientId, $audience)
            || !in_array($issuer, $validIssuers, true)
            || $expiresAt <= time()
            || !is_string($email)
            || $email === ''
            || !$isEmailVerified
            || !is_string($googleId)
            || $googleId === ''
        ) {
            \Illuminate\Support\Facades\Log::error('GoogleAuth: payload validation failed.', [
                'expected_client_id' => $clientId,
                'actual_aud' => $audience,
                'expected_issuers' => $validIssuers,
                'actual_iss' => $issuer,
                'current_time' => time(),
                'actual_exp' => $expiresAt,
                'email' => $email,
                'email_verified' => $emailVerified,
                'google_id' => $googleId,
            ]);
            return response()->json([
                'message' => 'Invalid Google token.',
            ], 401);
        }

        $user = User::where('google_id', $googleId)->first()
            ?? User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => is_string($name) && $name !== '' ? $name : explode('@', $email)[0],
                'email' => $email,
                'google_id' => $googleId,
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        } else {
            $updates = [];
            if (!$user->google_id) {
                $updates['google_id'] = $googleId;
            }
            if (!$user->email_verified_at) {
                $updates['email_verified_at'] = now();
            }
            if ($updates) {
                $user->update($updates);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->fresh(),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
