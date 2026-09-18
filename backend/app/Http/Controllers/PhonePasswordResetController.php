<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use App\Models\User;
use App\Services\SmsService;
use App\Support\E164Phone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PhonePasswordResetController extends Controller
{
    public function __construct(private SmsService $sms)
    {
    }

    public function requestOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:'.E164Phone::PATTERN],
        ], [
            'phone.required' => 'Please enter a valid phone number',
            'phone.regex' => 'Please enter a valid international phone number',
        ]);

        $phone = E164Phone::normalize($validated['phone']);
        $user = User::where('phone', $phone)->first();

        if ($user) {
            Otp::query()
                ->where('phone', $phone)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            Otp::create([
                'phone' => $phone,
                'code' => Hash::make($code),
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->sms->send(
                $phone,
                "Your VehicleCare password reset code is {$code}. It expires in 10 minutes."
            );
        }

        return response()->json([
            'message' => 'If this number is registered, an OTP has been sent.',
            'status' => 'success',
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:'.E164Phone::PATTERN],
            'code' => ['required', 'string', 'size:6'],
        ], [
            'phone.required' => 'Please enter a valid phone number',
            'phone.regex' => 'Please enter a valid international phone number',
            'code.required' => 'Please enter the 6-digit code',
            'code.size' => 'Please enter the 6-digit code',
        ]);

        $phone = E164Phone::normalize($validated['phone']);
        $code = $validated['code'];

        $otp = Otp::query()
            ->where('phone', $phone)
            ->whereNull('consumed_at')
            ->orderByDesc('id')
            ->first();

        if (
            ! $otp
            || $otp->isExpired()
            || ! Hash::check($code, $otp->code)
        ) {
            return response()->json([
                'message' => 'Invalid or expired code',
                'errors' => [
                    'code' => ['Invalid or expired code'],
                ],
            ], 422);
        }

        $otp->update(['consumed_at' => now()]);

        $resetToken = Str::random(64);

        DB::table('phone_password_reset_tokens')->updateOrInsert(
            ['phone' => $phone],
            [
                'token' => Hash::make($resetToken),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Code verified. You can now set a new password.',
            'reset_token' => $resetToken,
        ]);
    }

    public function reset(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:'.E164Phone::PATTERN],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ], [
            'phone.required' => 'Please enter a valid phone number',
            'phone.regex' => 'Please enter a valid international phone number',
            'password.required' => 'Password is required',
            'password.min' => 'Password must contain at least 8 characters',
            'password.confirmed' => 'Passwords do not match',
        ]);

        $phone = E164Phone::normalize($validated['phone']);
        $row = DB::table('phone_password_reset_tokens')->where('phone', $phone)->first();

        $expired = ! $row
            || $row->created_at === null
            || now()->subMinutes(15)->gt($row->created_at);

        if ($expired || ! Hash::check($validated['token'], $row->token ?? '')) {
            return response()->json([
                'message' => 'Invalid or expired reset token. Please request a new code.',
                'errors' => [
                    'token' => ['Invalid or expired reset token. Please request a new code.'],
                ],
            ], 422);
        }

        $user = User::where('phone', $phone)->first();
        if (! $user) {
            return response()->json([
                'message' => 'Unable to reset password. Please try again.',
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        DB::table('phone_password_reset_tokens')->where('phone', $phone)->delete();

        return response()->json([
            'message' => 'Password updated successfully. You can now sign in.',
            'status' => 'success',
        ]);
    }
}
