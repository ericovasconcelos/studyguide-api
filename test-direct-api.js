const axios = require('axios');

// Token de teste - substitua por um token válido se necessário
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJuYmYiOjE3NDE2MzY5ODUsImlhdCI6MTc0MTYzNjk4NSwiaXNzIjoid3MyLmdyYW5jdXJzb3NvbmxpbmUuY29tLmJyIiwiZXhwIjoxNzQyMjQxNzg1LCJkYXRhIjp7ImVtYWlsIjoiZXJpY292YXNjb25jZWxvc0BnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6IkFSQU5URVMgU0FOVE9TIFZBU0NPTkNFTE9TIiwiZ2l2ZW5fbmFtZSI6IkVSSUNPIiwibmFtZSI6IkVSSUNPIiwibmlja25hbWUiOiJFUklDTyIsInBpY3R1cmUiOm51bGwsInN1YiI6IjAwMTU4MDE4MTA5IiwidXNlcl9pZCI6NDUwMDI5NiwiY2xpZW50SUQiOjQ1MDAyOTYsInNlc3Npb24iOiJlcjkxcXE4N3Y4aW1wcDJwZW1vZW4xbjdqdSIsImNyZWF0ZWRBdCI6MTc0MTYzNjk4NSwiY2xpZW50QXBwIjoiZ2Vfd2ViIn19.d0stU07pRRZcktrlrkP44JxBRP7C0DO9xU53Zx05DM6eEYVctmOp0YIvfSgMxStMAaChkSBXjQvz-Xzg0kG2TK7oLfyWONwqcBCb1NkUj8d266Lv7t-GA9CZz2mKK6XDPOs4vNb3sXaX9qj7nWiOSXAGXDsBPTZBSi9zsVvXUu3fOVGn_O2nlm8USlsAdYKloc6ZG9hzdganykX7OwGj_gr0Y0xMO9fQL24f0i5WKZ5RFChS7R1KaXH5YaOKCQXX41NwjouoVInoEdiGc3GrKgErNe1OZLDEB21Q7cZwEoedGNhbDDAGxtz-c1oe7vfiE1lfQK7gD4j1gAjDukduoA';

// URL base da API
const API_BASE_URL = 'https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1';

async function testCycleAPI() {
  try {
    console.log('Testando API de ciclos de estudo diretamente...');
    
    // Configurar a requisição
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Buscando ciclos...');
    const cycleResponse = await axios.get(`${API_BASE_URL}/ciclo-estudo?page=1&perPage=50`, config);
    
    console.log('Resposta da API de ciclos:');
    console.log('Status:', cycleResponse.status);
    console.log('Headers:', cycleResponse.headers);
    console.log('Data:', JSON.stringify(cycleResponse.data, null, 2).substring(0, 500) + '...');
    
    if (cycleResponse.data && cycleResponse.data.data && cycleResponse.data.data.rows) {
      console.log(`Total de ciclos encontrados: ${cycleResponse.data.data.rows.length}`);
      if (cycleResponse.data.data.rows.length > 0) {
        console.log('Primeiro ciclo:', JSON.stringify(cycleResponse.data.data.rows[0], null, 2));
      }
    } else {
      console.log('Formato de resposta não contém ciclos.');
    }
    
    console.log('\nBuscando registros de estudo...');
    const studyResponse = await axios.get(`${API_BASE_URL}/estudo?page=1&perPage=10`, config);
    
    console.log('Resposta da API de estudo:');
    console.log('Status:', studyResponse.status);
    if (studyResponse.data && studyResponse.data.data && studyResponse.data.data.rows) {
      console.log(`Total de registros de estudo: ${studyResponse.data.data.rows.length}`);
      if (studyResponse.data.data.rows.length > 0) {
        console.log('Ciclos nos registros:');
        const cycleIds = new Set();
        studyResponse.data.data.rows.forEach(record => {
          if (record.cicloId) {
            cycleIds.add(record.cicloId);
          }
        });
        console.log('IDs de ciclos encontrados:', Array.from(cycleIds));
      }
    }
    
  } catch (error) {
    console.error('Erro ao testar API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor:', error.request);
    }
  }
}

// Executar o teste
testCycleAPI();