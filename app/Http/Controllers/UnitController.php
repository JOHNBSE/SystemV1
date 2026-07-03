<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Unit::class);

        $user = $request->user();

        if ($user->isTenant()) {
            $unit = $user->tenantProfile?->unit;

            return response()->json($unit ? [$unit] : []);
        }

        $query = Unit::query();

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->integer('property_id'));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', Unit::class);

        $data = $request->validate([
            'property_id' => ['required', 'exists:properties,id'],
            'unit_number' => ['required', 'string', 'max:50'],
            'type' => ['required', 'string', 'max:100'],
            'rent_price' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:vacant,occupied'],
        ]);

        $property = Property::findOrFail($data['property_id']);
        $this->authorize('update', $property);

        $data['owner_id'] = $property->owner_id;

        return response()->json(Unit::create($data)->refresh(), 201);
    }

    public function show(Unit $unit)
    {
        $this->authorize('view', $unit);

        return $unit->load('property', 'tenantProfile.user');
    }

    public function update(Request $request, Unit $unit)
    {
        $this->authorize('update', $unit);

        $data = $request->validate([
            'unit_number' => ['sometimes', 'string', 'max:50'],
            'type' => ['sometimes', 'string', 'max:100'],
            'rent_price' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:vacant,occupied'],
        ]);

        $unit->update($data);

        return $unit;
    }

    public function destroy(Unit $unit)
    {
        $this->authorize('delete', $unit);

        $unit->delete();

        return response()->noContent();
    }
}
