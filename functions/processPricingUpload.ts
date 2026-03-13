import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { csv_text, business_id } = await req.json();

    if (!csv_text || !business_id) {
      return Response.json({ error: 'csv_text and business_id are required' }, { status: 400 });
    }

    const lines = csv_text.trim().split('\n');
    if (lines.length < 2) {
      return Response.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted fields with commas
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? '';
      });

      // Map CSV columns to entity fields
      const record = {
        BusinessId: row['BusinessId'] || business_id,
        Region: row['Region'] || '',
        ServiceType: row['ServiceType'] || '',
        TierCode: row['TierCode'] || '',
        TierLabel: row['TierLabel'] || '',
        TierOrder: parseInt(row['TierOrder']) || 0,
        LineType: row['LineType'] || 'BASE',
        ItemOrCondition: row['ItemOrCondition'] || '',
        AmountMin: parseFloat(row['AmountMin']) || 0,
        AmountMax: parseFloat(row['AmountMax']) || 0,
        Unit: row['Unit'] || 'flat',
        Trigger: row['Trigger'] || '',
        DisposalCredit: row['DisposalCredit'] ? parseFloat(row['DisposalCredit']) : null,
        Notes: row['Notes'] || '',
      };

      // Basic validation
      if (!record.ServiceType || !record.TierCode || !record.LineType || !record.ItemOrCondition) {
        continue; // Skip invalid rows
      }

      rows.push(record);
    }

    if (rows.length === 0) {
      return Response.json({ error: 'No valid rows found in CSV' }, { status: 400 });
    }

    // Ensure minimum floor RULE rows are always present
    const SERVICE_MINIMUMS = [
      { ServiceType: 'FullService', AmountMin: 125 },
      { ServiceType: 'Curbside',    AmountMin: 125 },
      { ServiceType: 'DropOff',     AmountMin: 175 },
    ];
    for (const svc of SERVICE_MINIMUMS) {
      const alreadyPresent = rows.some(r =>
        r.LineType === 'RULE' &&
        r.ServiceType === svc.ServiceType &&
        r.TierCode === 'ANY' &&
        r.Trigger === 'min_total'
      );
      if (!alreadyPresent) {
        rows.push({
          BusinessId: business_id,
          Region: '',
          ServiceType: svc.ServiceType,
          TierCode: 'ANY',
          TierLabel: 'Any Tier',
          TierOrder: 99,
          LineType: 'RULE',
          ItemOrCondition: 'Minimum Charge',
          AmountMin: svc.AmountMin,
          AmountMax: svc.AmountMin,
          Unit: 'flat',
          Trigger: 'min_total',
          DisposalCredit: null,
          Notes: 'Auto-injected minimum floor',
        });
      }
    }

    // Delete existing rules for this business before inserting new ones
    const existing = await base44.asServiceRole.entities.PricingRule.filter({ BusinessId: business_id });
    for (const rule of existing) {
      await base44.asServiceRole.entities.PricingRule.delete(rule.id);
    }

    // Bulk create new rules
    const created = await base44.asServiceRole.entities.PricingRule.bulkCreate(rows);

    return Response.json({
      success: true,
      imported: created.length,
      skipped: rows.length - created.length,
      total_rows: lines.length - 1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});