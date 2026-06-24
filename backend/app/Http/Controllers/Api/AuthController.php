<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // Public payload — role/group are the NAME strings the frontend rbac.js compares.
    public static function userPayload(User $user): array
    {
        $user->loadMissing('role', 'group');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->role_name,
            'group' => $user->group?->group_name,
        ];
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Brute-force protection: throttle by email+IP. 5 failures → locked out for the decay window.
        $throttleKey = Str::lower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $this->audit->log(null, 'LOGIN_THROTTLED', "Login throttled for {$data['email']} from {$request->ip()} ({$seconds}s)", $request);
            abort(429, "Too many login attempts. Please try again in {$seconds} seconds.");
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 900); // count this failure (15-min decay)
            $this->audit->log($user, 'LOGIN_FAILED', "Failed login for {$data['email']} from {$request->ip()}", $request);
            abort(401, 'Invalid email or password.');
        }
        if ($user->status !== 'Active') {
            RateLimiter::hit($throttleKey, 900);
            $this->audit->log($user, 'LOGIN_FAILED', "Inactive account login attempt: {$data['email']} from {$request->ip()}", $request);
            abort(403, 'This account is inactive.');
        }

        // Success → clear the failure counter and establish a server session (no bearer token issued).
        RateLimiter::clear($throttleKey);
        Auth::login($user);
        $request->session()->regenerate();   // prevent session fixation
        $this->audit->log($user, 'LOGIN', "User {$user->email} logged in", $request);

        return response()->json(self::userPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->audit->log($user, 'LOGOUT', "User {$user->email} logged out", $request);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();   // rotate CSRF

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(self::userPayload($request->user()));
    }

    // Lightweight check used by the Reset Password modal to gate the new-password fields:
    // confirms the supplied password matches the signed-in user's current password.
    public function verifyPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string']]);

        return response()->json([
            'valid' => Hash::check($data['password'], $request->user()->password),
        ]);
    }

    // Authenticated self-service password change. Requires the current password and a matching
    // email (verification) before setting the new one. The retype field arrives as `password_confirmation`.
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        $user = $request->user();

        if (Str::lower($data['email']) !== Str::lower($user->email)) {
            $this->audit->log($user, 'PASSWORD_CHANGE_FAILED', "Email mismatch on password change for {$user->email}", $request);
            abort(422, 'Email does not match your account.');
        }

        if (! Hash::check($data['current_password'], $user->password)) {
            $this->audit->log($user, 'PASSWORD_CHANGE_FAILED', "Incorrect current password for {$user->email}", $request);
            abort(422, 'Current password is incorrect.');
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        $this->audit->log($user, 'PASSWORD_CHANGED', "User {$user->email} changed their password", $request);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
