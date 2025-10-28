import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedHolding {
  asset_symbol: string;
  asset_name: string;
  amount: number;
  price_usd: number;
  value_usd: number;
}

// Common column name variations across exchanges
const SYMBOL_COLUMNS = ['symbol', 'coin', 'asset', 'currency', 'ticker', 'token'];
const AMOUNT_COLUMNS = ['amount', 'quantity', 'balance', 'qty', 'total', 'holdings'];
const PRICE_COLUMNS = ['price', 'usd price', 'price_usd', 'last price', 'market price', 'current price'];
const NAME_COLUMNS = ['name', 'coin name', 'asset name', 'currency name'];

function findColumn(headers: string[], possibleNames: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const idx = lowerHeaders.indexOf(name);
    if (idx !== -1) return idx;
  }
  // Try partial match
  for (const name of possibleNames) {
    const idx = lowerHeaders.findIndex(h => h.includes(name));
    if (idx !== -1) return idx;
  }
  return -1;
}

async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD&api_key=${Deno.env.get('CRYPTOCOMPARE_API_KEY') || ''}`
    );
    const data = await response.json();
    return data.USD || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized - Authentication required',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized - Invalid token',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated CSV parse request from user:', user.id);

    const { csvText } = await req.json();
    
    // Input validation - Size check
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Invalid CSV data type');
    }

    const MAX_SIZE = 1_000_000; // 1MB
    if (csvText.length > MAX_SIZE) {
      throw new Error(`CSV too large. Maximum size: ${MAX_SIZE / 1_000_000}MB`);
    }

    const lines = csvText.trim().split('\n');
    
    // Input validation - Row count
    const MAX_ROWS = 1000;
    if (lines.length > MAX_ROWS) {
      throw new Error(`Too many rows. Maximum: ${MAX_ROWS} rows`);
    }

    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));

    // Input validation - Column count
    const MAX_COLUMNS = 50;
    if (headers.length > MAX_COLUMNS) {
      throw new Error(`Too many columns. Maximum: ${MAX_COLUMNS} columns`);
    }

    // Input validation - Header content
    for (const header of headers) {
      if (header.length > 100) {
        throw new Error('Column name too long (max 100 characters)');
      }
      // Prevent injection attacks in column names
      if (!/^[a-zA-Z0-9\s_-]+$/.test(header) && header !== '') {
        throw new Error(`Invalid characters in column name: "${header}"`);
      }
    }

    console.log('Detected headers:', headers);

    // Find column indices
    const symbolIdx = findColumn(headers, SYMBOL_COLUMNS);
    const amountIdx = findColumn(headers, AMOUNT_COLUMNS);
    const priceIdx = findColumn(headers, PRICE_COLUMNS);
    const nameIdx = findColumn(headers, NAME_COLUMNS);

    if (symbolIdx === -1 || amountIdx === -1) {
      throw new Error(
        `Could not detect required columns. Found: ${headers.join(', ')}. ` +
        `Need columns for: asset/symbol AND amount/balance`
      );
    }

    console.log(`Column mapping - Symbol: ${symbolIdx}, Amount: ${amountIdx}, Price: ${priceIdx}, Name: ${nameIdx}`);

    const holdings: ParsedHolding[] = [];
    const priceCache = new Map<string, number>();

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV values
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((v: string) => v.replace(/^"|"$/g, '').trim()) || [];
      
      if (values.length < 2) continue;

      const symbol = values[symbolIdx]?.toUpperCase() || '';
      if (!symbol) continue;

      const amountStr = values[amountIdx]?.replace(/[,$]/g, '') || '0';
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) continue;

      // Get price - from CSV or fetch live
      let price = 0;
      if (priceIdx !== -1 && values[priceIdx]) {
        const priceStr = values[priceIdx].replace(/[,$]/g, '');
        price = parseFloat(priceStr);
      }

      // If no price in CSV, fetch live price
      if (!price || isNaN(price)) {
        if (priceCache.has(symbol)) {
          price = priceCache.get(symbol)!;
        } else {
          const fetchedPrice = await fetchCryptoPrice(symbol);
          if (fetchedPrice) {
            price = fetchedPrice;
            priceCache.set(symbol, price);
          }
        }
      }

      if (!price || price <= 0) {
        console.warn(`Skipping ${symbol}: no valid price found`);
        continue;
      }

      const name = nameIdx !== -1 && values[nameIdx] ? values[nameIdx] : symbol;

      holdings.push({
        asset_symbol: symbol,
        asset_name: name,
        amount,
        price_usd: price,
        value_usd: amount * price,
      });
    }

    if (holdings.length === 0) {
      throw new Error('No valid holdings found in CSV. Check that amounts are positive numbers.');
    }

    console.log(`Successfully parsed ${holdings.length} holdings`);

    return new Response(JSON.stringify({
      success: true,
      holdings,
      detectedFormat: {
        exchange: 'auto-detected',
        symbolColumn: headers[symbolIdx],
        amountColumn: headers[amountIdx],
        priceColumn: priceIdx !== -1 ? headers[priceIdx] : 'fetched live',
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('CSV parsing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
