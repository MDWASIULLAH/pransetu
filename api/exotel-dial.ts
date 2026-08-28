export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const accountSid = process.env.EXOTEL_ACCOUNT_SID || 'pransetu1';
  const apiKey = process.env.EXOTEL_API_KEY || '09398667333f3e437df9c5f4bad5a81844c8ed3ae185c1df';
  const apiToken = process.env.EXOTEL_API_TOKEN || '82ad72ad2e93efe141c95509b66df6941cc246555e9ac54a';
  const callerId = process.env.EXOTEL_EXOPHONE || '03348054234';
  const appId = process.env.EXOTEL_APP_ID || '1328745';

  const body = req.body || {};
  let phoneNumbers: string[] = body.phoneNumbers || body.phones || [];
  const campaignTitle = body.campaignTitle || body.title || 'PRANSETU Emergency Broadcast';

  // If no numbers passed in payload, dial all registered citizen phone numbers
  if (!phoneNumbers || phoneNumbers.length === 0) {
    phoneNumbers = ['08967836222', '07205395577', '07319375744', '07644002898'];
  }

  const results: any[] = [];
  const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
  const exotelEndpoint = `https://api.exotel.com/v1/Accounts/${accountSid}/Calls/connect.json`;
  const appUrl = `http://my.exotel.com/${accountSid}/exoml/start_voice/${appId}`;

  for (const rawPhone of phoneNumbers) {
    let cleanPhone = String(rawPhone).trim().replace(/\s+/g, '').replace(/-/g, '');
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.slice(3);
    }
    if (!cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = `0${cleanPhone}`;
    }

    const params = new URLSearchParams();
    params.append('From', cleanPhone);
    params.append('CallerId', callerId);
    params.append('Url', appUrl);
    params.append('CallType', 'trans');
    params.append('CustomField', campaignTitle);

    try {
      const response = await fetch(exotelEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      results.push({
        phone: cleanPhone,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        statusCode: response.status,
        callSid: data?.Call?.Sid || null,
        data,
      });
    } catch (err: any) {
      results.push({
        phone: cleanPhone,
        status: 'ERROR',
        error: err.message,
      });
    }
  }

  return res.status(200).json({
    status: 'success',
    dispatchedCount: results.filter(r => r.status === 'SUCCESS').length,
    totalTargeted: phoneNumbers.length,
    results,
  });
}
