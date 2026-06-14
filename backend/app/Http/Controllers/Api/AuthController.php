<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            abort(401, 'Invalid email or password.');
        }
        if ($user->status !== 'Active') {
            abort(403, 'This account is inactive.');
        }

        $token = $user->createToken('spa')->plainTextToken;
        $this->audit->log($user, 'LOGIN', "User {$user->email} logged in", $request);

        return response()->json([
            'user' => self::userPayload($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->audit->log($user, 'LOGOUT', "User {$user->email} logged out", $request);
        $user->currentAccessToken()?->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(self::userPayload($request->user()));
    }
}
