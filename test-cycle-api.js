/**
 * Script para testar a análise de estrutura do ciclo de estudos
 * Este script faz uma requisição para o endpoint de análise no servidor local
 * e mostra os resultados na console
 */

const axios = require('axios');
const fs = require('fs');

// Token de teste - substitua por um token válido se necessário
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJuYmYiOjE3NDE2MzY5ODUsImlhdCI6MTc0MTYzNjk4NSwiaXNzIjoid3MyLmdyYW5jdXJzb3NvbmxpbmUuY29tLmJyIiwiZXhwIjoxNzQyMjQxNzg1LCJkYXRhIjp7ImVtYWlsIjoiZXJpY292YXNjb25jZWxvc0BnbWFpbC5jb20iLCJmYW1pbHlfbmFtZSI6IkFSQU5URVMgU0FOVE9TIFZBU0NPTkNFTE9TIiwiZ2l2ZW5fbmFtZSI6IkVSSUNPIiwibmFtZSI6IkVSSUNPIiwibmlja25hbWUiOiJFUklDTyIsInBpY3R1cmUiOm51bGwsInN1YiI6IjAwMTU4MDE4MTA5IiwidXNlcl9pZCI6NDUwMDI5NiwiY2xpZW50SUQiOjQ1MDAyOTYsInNlc3Npb24iOiJlcjkxcXE4N3Y4aW1wcDJwZW1vZW4xbjdqdSIsImNyZWF0ZWRBdCI6MTc0MTYzNjk4NSwiY2xpZW50QXBwIjoiZ2Vfd2ViIn19.d0stU07pRRZcktrlrkP44JxBRP7C0DO9xU53Zx05DM6eEYVctmOp0YIvfSgMxStMAaChkSBXjQvz-Xzg0kG2TK7oLfyWONwqcBCb1NkUj8d266Lv7t-GA9CZz2mKK6XDPOs4vNb3sXaX9qj7nWiOSXAGXDsBPTZBSi9zsVvXUu3fOVGn_O2nlm8USlsAdYKloc6ZG9hzdganykX7OwGj_gr0Y0xMO9fQL24f0i5WKZ5RFChS7R1KaXH5YaOKCQXX41NwjouoVInoEdiGc3GrKgErNe1OZLDEB21Q7cZwEoedGNhbDDAGxtz-c1oe7vfiE1lfQK7gD4j1gAjDukduoA';

// URL do servidor local
const serverUrl = 'http://localhost:5000';

async function analyzeApi() {
  try {
    console.log('Iniciando análise da API de ciclos de estudo...');
    
    // Fazer a requisição para o endpoint de análise
    const response = await axios.post(`${serverUrl}/analyze-cycle-structure`, {
      token
    });
    
    if (response.data.success) {
      console.log('Análise concluída com sucesso!');
      
      // Extrair o relatório
      const report = response.data.analysisReport;
      
      // Mostrar recomendação
      console.log('\n===== RECOMENDAÇÃO =====');
      console.log(`Abordagem sugerida: ${report.recommendation.suggestedApproach}`);
      console.log(`Motivo: ${report.recommendation.reasoning}`);
      
      // Dados de amostra do ciclo
      console.log('\n===== CAMPOS DO CICLO DE ESTUDOS =====');
      if (report.cycleEndpoint.structure.fields) {
        console.log(`Total de campos: ${report.cycleEndpoint.structure.totalFields}`);
        console.log('Campos disponíveis:');
        report.cycleEndpoint.structure.fields.forEach(field => {
          const stats = report.cycleEndpoint.structure.fieldStats[field];
          console.log(`- ${field} (presente em ${stats.count} registros, tipos: ${stats.types.join(', ')})`);
          if (stats.sampleValues.length > 0) {
            console.log(`  Exemplo(s): ${JSON.stringify(stats.sampleValues)}`);
          }
        });
      }
      
      // Campos relacionados a tempo
      console.log('\n===== CAMPOS POTENCIAIS DE METAS DE TEMPO =====');
      if (report.cycleEndpoint.potentialTimeFields.length > 0) {
        report.cycleEndpoint.potentialTimeFields.forEach(field => {
          console.log(`- ${field.field} (tipos: ${field.stats.types.join(', ')})`);
          if (field.stats.sampleValues.length > 0) {
            console.log(`  Exemplo(s): ${JSON.stringify(field.stats.sampleValues)}`);
          }
        });
      } else {
        console.log('Nenhum campo relacionado a metas de tempo foi encontrado.');
      }
      
      // Disciplinas relacionadas
      console.log('\n===== DADOS DE DISCIPLINAS =====');
      if (report.disciplineEndpoint.hasData && report.disciplineEndpoint.sampleData) {
        console.log(`Encontradas disciplinas na API.`);
        console.log(`Exemplo: ${JSON.stringify(report.disciplineEndpoint.sampleData[0])}`);
      } else {
        console.log('Não foi possível obter dados de disciplinas.');
      }
      
      // Endpoint de estudo
      console.log('\n===== DADOS DO ENDPOINT ESTUDO =====');
      if (report.studyEndpoint.hasData) {
        console.log('Dados de estudo encontrados na API.');
        
        if (report.studyEndpoint.structure) {
          const structure = report.studyEndpoint.structure;
          
          // Mostrar campos relacionados a ciclos
          if (structure.cycleFields && structure.cycleFields.length > 0) {
            console.log(`\nCampos relacionados a ciclos: ${structure.cycleFields.join(', ')}`);
          }
          
          // Mostrar campos relacionados a versões/rodadas
          if (structure.versionFields && structure.versionFields.length > 0) {
            console.log(`\nCampos relacionados a versões/rodadas: ${structure.versionFields.join(', ')}`);
          }
          
          // Mostrar relações de ciclo encontradas
          if (structure.cicloRelations && structure.cicloRelations.length > 0) {
            console.log('\nRelações de ciclo encontradas:');
            structure.cicloRelations.forEach(relation => console.log(`- ${relation}`));
          }
        }
        
        // Mostrar amostra de dados
        if (report.studyEndpoint.sampleData && report.studyEndpoint.sampleData.length > 0) {
          console.log('\nAmostra de dados de estudo:');
          const sample = report.studyEndpoint.sampleData[0];
          const fieldsToShow = [
            'id', 'cicloId', 'cicloTexto', 'versao', 'disciplinaTexto', 
            'tipoEstudo', 'tempoGasto', 'dataEstudo'
          ];
          
          const sampleData = {};
          fieldsToShow.forEach(field => {
            if (sample[field] !== undefined) {
              sampleData[field] = sample[field];
            }
          });
          
          console.log(JSON.stringify(sampleData, null, 2));
        }
      } else {
        console.log('Não foi possível obter dados de estudo.');
      }
      
      // Salvar o relatório completo em um arquivo para análise detalhada
      fs.writeFileSync('api-analysis-report.json', JSON.stringify(response.data, null, 2));
      console.log('\nRelatório completo salvo em api-analysis-report.json');
      
    } else {
      console.error('Erro ao analisar a API:', response.data.error);
    }
  } catch (error) {
    console.error('Erro ao executar análise:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar a análise
analyzeApi();