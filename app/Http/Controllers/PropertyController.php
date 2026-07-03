<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Property::class);

        $user = $request->user();

        if ($user->isTenant()) {
            $property = $user->tenantProfile?->unit?->property;

            return response()->json($property ? [$property] : []);
        }

        return Property::with('units')->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', Property::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $data['owner_id'] = $request->user()->id;

        return response()->json(Property::create($data), 201);
    }

    public function show(Property $property)
    {
        $this->authorize('view', $property);

        return $property->load('units');
    }

    public function update(Request $request, Property $property)
    {
        $this->authorize('update', $property);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'location' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $property->update($data);

        return $property;
    }

    public function destroy(Property $property)
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->noContent();
    }
}
