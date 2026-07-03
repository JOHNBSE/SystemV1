<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // No dedicated policy: messages are only ever scoped to sender/receiver = auth user.
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        return Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'receiver_id' => ['required', 'exists:users,id'],
            'message' => ['required', 'string'],
        ]);

        abort_unless(
            $this->canContact($user, (int) $data['receiver_id']),
            403,
            'You may only message your own owner or tenants.'
        );

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $data['receiver_id'],
            'message' => $data['message'],
        ]);

        return response()->json($message, 201);
    }

    public function show(Request $request, Message $message)
    {
        $userId = $request->user()->id;
        abort_unless($message->sender_id === $userId || $message->receiver_id === $userId, 403);

        return $message;
    }

    public function update(Request $request, Message $message)
    {
        abort_unless($message->receiver_id === $request->user()->id, 403);

        $data = $request->validate(['read_status' => ['required', 'boolean']]);
        $message->update($data);

        return $message;
    }

    public function destroy(Request $request, Message $message)
    {
        $userId = $request->user()->id;
        abort_unless($message->sender_id === $userId || $message->receiver_id === $userId, 403);

        $message->delete();

        return response()->noContent();
    }

    private function canContact($user, int $otherId): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isOwner()) {
            return $otherId === $user->id
                || $user->tenants()->where('user_id', $otherId)->exists();
        }

        if ($user->isTenant()) {
            return $otherId === $user->tenantProfile?->owner_id;
        }

        return false;
    }
}
