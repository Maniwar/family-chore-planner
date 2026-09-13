const http = require('http');

const hhId = 'test_household_' + Date.now();
let authKey = '';

function makeRequest(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("1. Creating household");
  const createRes = await makeRequest('/api/household/create', 'POST', {
    familyName: 'Test Family',
    houseAddressOrMotto: 'Test Motto',
    adminPin: '1234',
    joinPassphrase: 'testpassphrase'
  });
  console.log("Create response:", createRes.status);
  
  if (createRes.status !== 200) {
    console.log(createRes.data);
    return;
  }
  
  authKey = createRes.data.authKey;
  const actualHhId = createRes.data.household.id;
  
  const authHeaders = {
    'Authorization': `Bearer ${authKey}`,
    'X-Household-Auth': authKey,
    'X-Household-Id': actualHhId
  };

  console.log("2. Phone syncs members with PIN");
  const phoneMembers = [{ id: 'm1', name: 'Kid', pin: '1111' }];
  const sync1Res = await makeRequest(`/api/household/${actualHhId}/sync`, 'POST', { members: phoneMembers }, authHeaders);
  console.log("Sync 1 status:", sync1Res.status);

  console.log("3. Phone syncs logs immediately after");
  const phoneLogs = [{ id: 'log1', choreId: 'c1', memberId: 'm1', checklistStatus: { 0: true } }];
  const sync2Res = await makeRequest(`/api/household/${actualHhId}/sync`, 'POST', { logs: phoneLogs }, authHeaders);
  console.log("Sync 2 status:", sync2Res.status);
  
  console.log("4. Tablet polls (no since)");
  const pollRes = await makeRequest(`/api/household/${actualHhId}/poll`, 'GET', null, authHeaders);
  console.log("Poll status:", pollRes.status);
  console.log("Tablet received PIN:", pollRes.data.household?.members?.[0]?.pin);
  console.log("Tablet received Logs:", JSON.stringify(pollRes.data.household?.logs));
}

run().catch(console.error);
