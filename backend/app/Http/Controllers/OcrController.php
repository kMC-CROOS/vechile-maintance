<?php

namespace App\Http\Controllers;

use App\Services\OcrService;
use Illuminate\Http\Request;

class OcrController extends Controller
{
    protected $ocrService;

    public function __construct(OcrService $ocrService)
    {
        $this->ocrService = $ocrService;
    }

    public function extract(Request $request)
    {
        $request->validate([
            'document' => 'nullable|file|image|max:10240', // Max 10MB
            'base64_image' => 'nullable|string',
        ]);

        if (!$request->hasFile('document') && !$request->filled('base64_image')) {
            return response()->json([
                'success' => false,
                'error' => 'No document image file or base64 image string provided.',
                'extracted' => [],
            ], 422);
        }

        $imageInput = null;
        if ($request->hasFile('document')) {
            $imageInput = $request->file('document')->getRealPath();
        } else {
            $imageInput = $request->input('base64_image');
        }

        $result = $this->ocrService->extractFieldsFromImage($imageInput);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'error' => $result['error'],
                'raw_text' => $result['raw_text'] ?? null,
                'extracted' => [],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'raw_text' => $result['raw_text'],
            'extracted' => $result['extracted'],
        ]);
    }
}
