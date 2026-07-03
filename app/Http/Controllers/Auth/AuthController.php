<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\OwnerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    // Public self-registration is owner-only; tenants are created by their
    // owner (see TenantProfileController::store) and admins via seeder.
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'owner',
        ]);

        OwnerProfile::create([
            'user_id' => $user->id,
            'company_name' => $data['company_name'] ?? null,
            'phone' => $data['phone'] ?? null,
        ]);

        // Browser (stateful) clients get an HttpOnly session — no token in JS.
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return response()->json(['user' => $user], 201);
        }

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status === 'suspended') {
            throw ValidationException::withMessages([
                'email' => ['This account has been suspended.'],
            ]);
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return response()->json(['user' => $user]);
        }

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out.']);
    }
}
