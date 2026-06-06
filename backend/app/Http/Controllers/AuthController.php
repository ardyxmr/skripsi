<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

            // Optional: Get roles/permissions if spatie is installed
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [];

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
                'roles' => $roles
            ]);
        }

        return response()->json([
            'message' => 'Invalid login credentials'
        ], 401);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        if(method_exists($user, 'load')) {
             $user->load('group');
        }
        return response()->json($user);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
}
