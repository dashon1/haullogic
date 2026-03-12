import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { photo_urls, service_type, junk_location, heavy_materials, special_items, estimated_size } = await req.json();

    const prompt = `You are an expert junk removal estimator. Analyze these photos of junk/debris and provide a structured assessment for quoting purposes.

Customer provided context:
- Service type: ${service_type}
- Junk location: ${junk_location}
- Heavy materials reported: ${JSON.stringify(heavy_materials)}
- Special items reported: ${JSON.stringify(special_items)}
- Customer's size estimate: ${estimated_size}

Analyze the photos carefully and return ONLY a valid JSON object with this exact structure:
{
  "service_recommendation": "trailer_drop_off" | "curbside_pickup" | "full_service",
  "estimated_trailer_fill_percent": <number 0-100>,
  "estimated_load_bucket": "minimum" | "eighth" | "quarter" | "half" | "three_quarter" | "full",
  "estimated_volume_cubic_yards": <number>,
  "visible_items": [{"type": "<item_type>", "count": <number>}],
  "material_categories": ["<category>"],
  "material_profile": "household_mixed" | "construction_debris" | "yard_waste" | "appliances" | "furniture" | "mixed_heavy",
  "weight_class": "light" | "medium" | "heavy",
  "density_class": "light" | "light_to_medium" | "medium" | "medium_to_heavy" | "heavy",
  "heavy_material_flag": <boolean>,
  "access_difficulty": "easy" | "moderate" | "hard",
  "stairs_flag": <boolean>,
  "crew_recommendation": <number 1-4>,
  "confidence_score": <number 0.0-1.0>,
  "review_required": <boolean>,
  "notes": "<any important observations>"
}

Rules:
- confidence_score below 0.60 means review_required must be true
- heavy_material_flag true always means review_required true
- Be conservative — it's better to slightly overestimate than underestimate
- Return ONLY the JSON, no other text`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: photo_urls,
      response_json_schema: {
        type: "object",
        properties: {
          service_recommendation: { type: "string" },
          estimated_trailer_fill_percent: { type: "number" },
          estimated_load_bucket: { type: "string" },
          estimated_volume_cubic_yards: { type: "number" },
          visible_items: { type: "array", items: { type: "object" } },
          material_categories: { type: "array", items: { type: "string" } },
          material_profile: { type: "string" },
          weight_class: { type: "string" },
          density_class: { type: "string" },
          heavy_material_flag: { type: "boolean" },
          access_difficulty: { type: "string" },
          stairs_flag: { type: "boolean" },
          crew_recommendation: { type: "number" },
          confidence_score: { type: "number" },
          review_required: { type: "boolean" },
          notes: { type: "string" }
        }
      }
    });

    return Response.json({ success: true, assessment: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});