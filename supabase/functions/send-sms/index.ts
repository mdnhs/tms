const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, apiKey, senderId } = await req.json();

    if (!phone || !message || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone, message, apiKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number - ensure it starts with 88 for Bangladesh
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '88' + cleanPhone;
    } else if (!cleanPhone.startsWith('88')) {
      cleanPhone = '88' + cleanPhone;
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'text',
      number: cleanPhone,
      senderid: senderId || '',
      message: message,
    });

    const response = await fetch(`http://bulksmsbd.net/api/smsapi?${params.toString()}`);
    const result = await response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = { raw: result };
    }

    console.log('BulkSMSBD response:', parsedResult);

    return new Response(
      JSON.stringify({ success: true, result: parsedResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SMS send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
