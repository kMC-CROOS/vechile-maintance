<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'Please enter your full name',
            'name.min' => 'Full name must be at least 2 characters',
            'email.required' => 'Please enter a valid email address',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email address is already registered. Please sign in instead.',
            'password.required' => 'Password is required',
            'password.min' => 'Password must contain at least 8 characters',
            'password.confirmed' => 'Passwords do not match',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Please enter your email address',
            'email.email' => 'Please enter a valid email address',
            'password.required' => 'Password is required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
                'errors' => [
                    'credentials' => ['Invalid email or password.'],
                ],
            ], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
        ]);
    }

    public function googleAuth(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
            'google_id' => 'nullable|string',
        ]);

        $user = User::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                'password' => Hash::make(Str::random(32)),
            ]
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Please enter your email address',
            'email.email' => 'Please enter a valid email address',
        ]);

        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        // Privacy-safe behavior: always return the same message
        if ($user) {
            $token = Str::random(60);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );
        }

        return response()->json([
            'message' => 'If an account exists for this email, a password reset link has been sent.',
            'status' => 'success',
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
        $user = $request->user();
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $user->name = $validated['name'];
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
            ],
        ]);
    }
}

