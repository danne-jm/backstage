<?php

namespace App\Http\Controllers;

use App\Models\OnlineSellable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OnlineSellableController extends Controller
{
    public function index()
    {
        return response()->json(OnlineSellable::all());
    }
    public function find(Request $request)
    {
        $type = $request->query('type');
        $id = (int) $request->query('id');

        if (! in_array($type, ['product', 'event'])) {
            return response()->json(['success' => false, 'message' => 'Invalid type'], 400);
        }

        $os = OnlineSellable::where('original_type', $type)->where('original_id', $id)->first();
        return response()->json(['success' => true, 'data' => $os]);
    }

    public function show(OnlineSellable $onlineSellable)
    {
        return response()->json(['success' => true, 'data' => $onlineSellable]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'original_type' => 'required|string',
            'original_id' => 'required|integer',
            'name' => 'nullable|string',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric',
            'event_date' => 'nullable|date',
            'remaining' => 'nullable|integer',
            'metadata' => 'nullable|array',
        ]);

        $os = OnlineSellable::create($data);
        return response()->json(['success' => true, 'data' => $os], 201);
    }

    public function update(Request $request, OnlineSellable $onlineSellable)
    {
        $data = $request->validate([
            'name' => 'nullable|string',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric',
            'event_date' => 'nullable|date',
            'remaining' => 'nullable|integer',
            'metadata' => 'nullable|array',
        ]);

        $onlineSellable->update($data);
        return response()->json(['success' => true, 'data' => $onlineSellable]);
    }

    public function destroy(OnlineSellable $onlineSellable)
    {
        $onlineSellable->delete();
        return response()->json(['success' => true]);
    }

    public function uploadImage(Request $request, OnlineSellable $onlineSellable)
    {
        $request->validate(['image' => 'required|file|image|max:5120']);

        $file = $request->file('image');
        $path = $file->storePublicly('online-sellables/'.$onlineSellable->id, 'public');

        $images = $onlineSellable->images ?? [];
        $images[] = Storage::url($path);
        $onlineSellable->images = $images;
        $onlineSellable->save();

        return response()->json(['success' => true, 'url' => Storage::url($path), 'data' => $onlineSellable]);
    }
}
