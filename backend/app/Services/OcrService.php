<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Process an image file or base64 string for OCR text extraction and field parsing.
     * Uses Google Cloud Vision API if GOOGLE_CLOUD_VISION_API_KEY is configured.
     *
     * @param string $imagePathOrBase64 Path to file or base64 string
     * @return array
     */
    public function extractFieldsFromImage(string $imagePathOrBase64): array
    {
        $apiKey = env('GOOGLE_CLOUD_VISION_API_KEY') ?: config('services.google.vision_api_key');

        if (empty($apiKey)) {
            Log::warning('OcrService: GOOGLE_CLOUD_VISION_API_KEY is not set in environment.');
            return [
                'success' => false,
                'error' => 'GOOGLE_CLOUD_VISION_API_KEY missing in server .env. Please configure a Google Vision API key.',
                'raw_text' => null,
                'extracted' => [],
            ];
        }

        // Get base64 representation of image
        $base64Image = '';
        if (file_exists($imagePathOrBase64)) {
            $base64Image = base64_encode(file_get_contents($imagePathOrBase64));
        } elseif (str_starts_with($imagePathOrBase64, 'data:image')) {
            $parts = explode(',', $imagePathOrBase64);
            $base64Image = $parts[1] ?? $imagePathOrBase64;
        } else {
            $base64Image = $imagePathOrBase64;
        }

        try {
            $response = Http::post("https://vision.googleapis.com/v1/images:annotate?key={$apiKey}", [
                'requests' => [
                    [
                        'image' => [
                            'content' => $base64Image,
                        ],
                        'features' => [
                            [
                                'type' => 'TEXT_DETECTION',
                                'maxResults' => 1,
                            ],
                            [
                                'type' => 'DOCUMENT_TEXT_DETECTION',
                                'maxResults' => 1,
                            ],
                        ],
                    ],
                ],
            ]);

            if (!$response->successful()) {
                Log::error('Google Vision API HTTP error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'Google Cloud Vision API request failed: ' . $response->status(),
                    'raw_text' => null,
                    'extracted' => [],
                ];
            }

            $responseData = $response->json();
            $textAnnotation = $responseData['responses'][0]['fullTextAnnotation']['text']
                ?? $responseData['responses'][0]['textAnnotations'][0]['description']
                ?? null;

            if (empty($textAnnotation)) {
                return [
                    'success' => false,
                    'error' => 'No legible text detected in the uploaded document image.',
                    'raw_text' => '',
                    'extracted' => [],
                ];
            }

            $extractedFields = $this->parseSriLankaRmvDocumentText($textAnnotation);

            return [
                'success' => true,
                'error' => null,
                'raw_text' => $textAnnotation,
                'extracted' => $extractedFields,
            ];
        } catch (\Throwable $e) {
            Log::error('OcrService exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'OCR processing exception: ' . $e->getMessage(),
                'raw_text' => null,
                'extracted' => [],
            ];
        }
    }

    /**
     * Parses raw OCR text extracted from Sri Lanka Certificate of Registration (CR/RC).
     *
     * @param string $rawText
     * @return array
     */
    public function parseSriLankaRmvDocumentText(string $rawText): array
    {
        $fields = [];
        $lines = array_values(array_filter(array_map('trim', explode("\n", $rawText))));

        // Combine text for global regex checks
        $fullText = implode(" ", $lines);

        // 1. Registration Number (e.g. WP CAB-1234, 300-1234, EP CAI-5678, CAD-9012, 19-4567)
        if (preg_match('/\b(?:[A-Z]{1,3}\s+)?([A-Z]{2,3}[- ]\d{4}|\d{2,3}[- ]\d{4})\b/i', $fullText, $m)) {
            $fields['registration_number'] = strtoupper(trim($m[1]));
        }

        // 2. Chassis VIN (e.g. Chassis No / Chassis VIN: KSP90-1234567 or JTEBU...)
        if (preg_match('/chassis\s*(?:no|vin|number)?[:\s\-]*([A-Z0-9\-]{8,20})/i', $fullText, $m)) {
            $fields['chassis_number'] = strtoupper(trim($m[1]));
        }

        // 3. Engine Serial No (e.g. Engine No: 1KR-123456)
        if (preg_match('/engine\s*(?:no|serial|number)?[:\s\-]*([A-Z0-9\-]{5,20})/i', $fullText, $m)) {
            $fields['engine_number'] = strtoupper(trim($m[1]));
        }

        // 4. Cylinder Capacity (CC)
        if (preg_match('/(\d{2,4})\s*(?:cc|cylinder)/i', $fullText, $m)) {
            $fields['cylinder_capacity'] = (int) $m[1];
        } elseif (preg_match('/cylinder\s*capacity[:\s\-]*(\d{2,4})/i', $fullText, $m)) {
            $fields['cylinder_capacity'] = (int) $m[1];
        }

        // 5. Fuel Type (Petrol / Diesel / Electric / Hybrid)
        if (preg_match('/\b(PETROL|DIESEL|ELECTRIC|HYBRID|EV|GAS)\b/i', $fullText, $m)) {
            $fields['fuel_type'] = ucfirst(strtolower($m[1]));
        }

        // 6. Make (Brand)
        $makes = ['TOYOTA', 'HONDA', 'NISSAN', 'BAJAJ', 'TATA', 'ISUZU', 'MITSUBISHI', 'SUZUKI', 'HYUNDAI', 'MAZDA', 'BMW', 'BENZ', 'MERCEDES', 'TVS', 'YAMAHA', 'KUBOTA', 'MASSEY FERGUSON', 'KIA', 'DAIHATSU', 'AUDI', 'VOLKSWAGEN', 'MAHINDRA', 'ROYAL ENFIELD'];
        foreach ($makes as $makeCandidate) {
            if (preg_match('/\b' . preg_quote($makeCandidate, '/') . '\b/i', $fullText)) {
                $fields['make'] = strtoupper($makeCandidate);
                $fields['brand'] = strtoupper($makeCandidate);
                break;
            }
        }

        // 7. Model
        $models = ['COROLLA', 'ALTO', 'AXIO', 'CIVIC', 'PRADO', 'VITZ', 'PRIUS', 'VEZEL', 'CT100', 'RE 205', 'HILUX', 'LAND CRUISER', 'MONTERO', 'WAGON R', 'CARINA', 'ALLION', 'PREMIO', 'MARUTI', 'KLUGER', 'SUNNY', 'LANCER', 'FB15', 'KSP90'];
        foreach ($models as $modelCandidate) {
            if (preg_match('/\b' . preg_quote($modelCandidate, '/') . '\b/i', $fullText)) {
                $fields['model'] = strtoupper($modelCandidate);
                break;
            }
        }

        // 8. Country of Origin
        if (preg_match('/\b(JAPAN|INDIA|GERMANY|CHINA|UK|UNITED KINGDOM|USA|UNITED STATES|THAILAND|KOREA|SOUTH KOREA|ITALY|FRANCE)\b/i', $fullText, $m)) {
            $fields['country_of_origin'] = strtoupper($m[1]);
        }

        // 9. Year of Manufacture (4 digits between 1950 and current year+1)
        $currentYear = (int) date('Y');
        if (preg_match_all('/\b(19[5-9]\d|20[0-2]\d)\b/', $fullText, $matches)) {
            foreach ($matches[1] as $possibleYear) {
                $yr = (int) $possibleYear;
                if ($yr >= 1950 && $yr <= ($currentYear + 1)) {
                    $fields['year_of_manufacture'] = $yr;
                    break;
                }
            }
        }

        // 10. Colour
        $colours = ['WHITE', 'BLACK', 'RED', 'BLUE', 'SILVER', 'GREY', 'GRAY', 'GREEN', 'YELLOW', 'PEARL', 'GOLD', 'MAROON', 'ORANGE', 'PURPLE', 'BROWN', 'BEIGE', 'WINE RED'];
        foreach ($colours as $col) {
            if (preg_match('/\b' . preg_quote($col, '/') . '\b/i', $fullText)) {
                $fields['colour'] = strtoupper($col);
                break;
            }
        }

        // 11. Class of Vehicle
        if (preg_match('/class\s*of\s*vehicle[:\s\-]*([A-Z0-9\s\/]+)/i', $fullText, $m)) {
            $fields['vehicle_class'] = strtoupper(trim(substr($m[1], 0, 30)));
        } elseif (preg_match('/\b(DUAL PURPOSE|MOTOR CAR|CAR|MOTOR CYCLE|MOTORCYCLE|THREE WHEELER|MOTOR LORRY|SPECIAL PURPOSE|AGRICULTURAL|BUS|TRUCK|HEAVY DUTY)\b/i', $fullText, $m)) {
            $fields['vehicle_class'] = strtoupper($m[1]);
        }

        // 12. Taxation Class
        if (preg_match('/taxation\s*class[:\s\-]*([A-Z0-9\s\/]+)/i', $fullText, $m)) {
            $fields['taxation_class'] = strtoupper(trim(substr($m[1], 0, 30)));
        }

        // 13. Status When Registered
        if (preg_match('/\b(BRAND NEW|RECONDITIONED|REGISTERED)\b/i', $fullText, $m)) {
            $fields['status_when_registered'] = strtoupper($m[1]);
        }

        // 14. Date of First Registration (YYYY-MM-DD or DD/MM/YYYY or DD.MM.YYYY)
        if (preg_match('/(\d{4}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2})/', $fullText, $m)) {
            $fields['date_of_first_registration'] = date('Y-m-d', strtotime(str_replace('.', '-', $m[1])));
        } elseif (preg_match('/(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4})/', $fullText, $m)) {
            $fields['date_of_first_registration'] = date('Y-m-d', strtotime(str_replace('.', '-', $m[1])));
        }

        // 15. Absolute Owner (Bank / Leasing / Finance)
        if (preg_match('/absolute\s*owner[:\s\-]*([A-Z0-9\s\.,&]+)/i', $fullText, $m)) {
            $fields['absolute_owner'] = strtoupper(trim(substr($m[1], 0, 80)));
        }

        // 16. Current Owner Details (Address / NIC)
        if (preg_match('/(?:current\s*owner|owner\s*details)[:\s\-]*([A-Z0-9\s\.,\/\-]+)/i', $fullText, $m)) {
            $fields['owner_details'] = trim(substr($m[1], 0, 150));
        }

        // 17. Seating Capacity
        if (preg_match('/seating\s*capacity[:\s\-]*(\d{1,3})/i', $fullText, $m)) {
            $fields['seating_capacity'] = (int) $m[1];
        }

        // 18. Weight (KG)
        if (preg_match('/weight[:\s\-]*(\d{2,5})\s*(?:kg)?/i', $fullText, $m)) {
            $fields['weight_kg'] = (int) $m[1];
        }

        // 19. Wheel Base (mm)
        if (preg_match('/wheel\s*base[:\s\-]*(\d{3,5})\s*(?:mm)?/i', $fullText, $m)) {
            $fields['wheel_base'] = (int) $m[1];
        }

        // 20. Over Hang (mm)
        if (preg_match('/over\s*hang[:\s\-]*(\d{3,5})\s*(?:mm)?/i', $fullText, $m)) {
            $fields['overhang'] = (int) $m[1];
        }

        // 21. Body Type
        if (preg_match('/(?:type\s*of\s*body|body\s*type)[:\s\-]*([A-Z0-9\s\/]+)/i', $fullText, $m)) {
            $fields['body_type'] = strtoupper(trim(substr($m[1], 0, 30)));
        }

        // 22. Previous Owners
        if (preg_match('/previous\s*owners?[:\s\-]*([A-Z0-9\s\/]+)/i', $fullText, $m)) {
            $fields['previous_owners'] = trim(substr($m[1], 0, 30));
        }

        // 23. Provincial Council / Province
        if (preg_match('/\b(WESTERN|CENTRAL|SOUTHERN|NORTHERN|EASTERN|NORTH WESTERN|NORTH CENTRAL|UVA|SABARAGAMUWA)\s*(?:PROVINCE|PROVINCIAL COUNCIL)?\b/i', $fullText, $m)) {
            $fields['provincial_council'] = strtoupper($m[1]) . ' PROVINCE';
        }

        // 24. Tyre Size
        if (preg_match('/tyre\s*size[:\s\-]*([A-Z0-9\/\s\-R]+)/i', $fullText, $m)) {
            $fields['tyre_size'] = trim(substr($m[1], 0, 40));
        }

        // 25. Dimensions (Length / Width / Height)
        if (preg_match('/dimensions[:\s\-]*([A-Z0-9\s\.\*xX\-]+)/i', $fullText, $m)) {
            $fields['dimensions'] = trim(substr($m[1], 0, 50));
        }

        // 26. Taxes Payable
        if (preg_match('/taxes\s*payable[:\s\-]*([A-Z0-9\s\/]+)/i', $fullText, $m)) {
            $fields['taxes_payable'] = strtoupper(trim(substr($m[1], 0, 30)));
        }

        return $fields;
    }
}
