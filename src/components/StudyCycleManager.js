import React, { useState, useEffect } from "react";
import { Input, InputNumber, Button, Upload, List, Select, Tabs, Card, Alert, Tooltip } from "antd";
import { UploadOutlined, CloudOutlined, FileOutlined, SyncOutlined, InfoCircleOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import axios from "axios";
import { syncStudyCycleWithCloud } from "../utils/storage";
// Importamos como CommonJS agora
const { 
  fetchCyclesFromAPI, 
  detectCycleRounds, 
  saveLocalGoals
} = require("../utils/cycleIntegration");

const { Option } = Select;
const { TabPane } = Tabs;

export default function StudyCycleManager({ studyCycle, setStudyCycle }) {
  // Estado para o gerenciador de ciclo local
  const [newSubject, setNewSubject] = useState("");
  const [newTime, setNewTime] = useState(0);
  
  // Estados para integração com API
  const [apiToken, setApiToken] = useState(localStorage.getItem("bearerToken") || "");
  const [isLoadingApiCycles, setIsLoadingApiCycles] = useState(false);
  const [apiCycles, setApiCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycleRounds, setCycleRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("local"); // 'local' ou 'api'
  
  // Estado para gerenciamento de metas por disciplina na API
  const [apiSubjects, setApiSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectTargetTime, setSubjectTargetTime] = useState(10); // horas
  
  // Função para buscar matérias da API - DEFINIDA PRIMEIRO para evitar referências antes da inicialização
  const loadSubjectsFromAPI = React.useCallback(async (cycleId, roundId) => {
    console.log(`Carregando disciplinas para ciclo ${cycleId}, rodada ${roundId}...`);
    try {
      // Verificar parâmetros
      if (!cycleId || !roundId) {
        console.warn('Ciclo ID ou Rodada ID não fornecidos');
        setApiSubjects([]);
        return [];
      }
      
      // Limpar seleção anterior e disciplinas
      setSelectedSubject(null);
      
      // Configurar a requisição para buscar os registros de estudo
      const apiUrl = 'https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1/estudo';
      const config = {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          perPage: 500, // Aumentamos para pegar mais registros
          sort: 'desc'
        }
      };
      
      console.log('Fazendo requisição para API de estudo...');
      
      // Usar axios para fazer a requisição
      const response = await axios.get(apiUrl, config);
      
      // Verificar se há dados válidos
      if (!response.data?.data?.rows) {
        console.error('Formato de resposta inválido');
        throw new Error('Formato de resposta inválido');
      }
      
      console.log(`Total de registros retornados: ${response.data.data.rows.length}`);
      
      // Filtrar registros pelo ciclo e rodada selecionados
      const records = response.data.data.rows.filter(record => {
        const matchesCycle = record.cicloId === cycleId;
        const matchesRound = record.versao === roundId;
        return matchesCycle && matchesRound;
      });
      
      console.log(`Registros filtrados para ciclo ${cycleId} rodada ${roundId}: ${records.length}`);
      
      // Extrair disciplinas únicas destes registros
      const uniqueSubjects = new Map();
      records.forEach(record => {
        if (record.disciplinaId && record.disciplinaTexto) {
          uniqueSubjects.set(record.disciplinaId, {
            id: record.disciplinaId,
            name: record.disciplinaTexto
          });
        }
      });
      
      // Converter para array e ordenar por nome
      const subjectsList = Array.from(uniqueSubjects.values());
      subjectsList.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`Carregadas ${subjectsList.length} disciplinas para o ciclo ${cycleId}, rodada ${roundId}`);
      if (subjectsList.length > 0) {
        console.log('Exemplos de disciplinas:', subjectsList.slice(0, 3).map(s => s.name).join(', '), '...');
      }
      
      setApiSubjects(subjectsList);
      
      return subjectsList;
    } catch (error) {
      console.error("Erro ao carregar disciplinas:", error);
      setErrorMessage(`Erro ao carregar disciplinas: ${error.message}`);
      setApiSubjects([]);
      return [];
    }
  }, [apiToken]);

  // Função para carregar ciclos da API
  const loadCyclesFromAPI = React.useCallback(async () => {
    console.log("Botão clicado: Carregar ciclos da API");
    setIsLoadingApiCycles(true);
    setErrorMessage("");
    
    try {
      console.log("Token usado na requisição:", apiToken ? "Token presente" : "Token ausente");
      
      if (!apiToken) {
        setErrorMessage("Token não fornecido. Por favor, insira um token de API válido.");
        setIsLoadingApiCycles(false);
        return;
      }
      
      console.log("Chamando fetchCyclesFromAPI...");
      const cycles = await fetchCyclesFromAPI(apiToken);
      console.log("Ciclos recebidos:", cycles);
      
      setApiCycles(cycles);
      alert(`${cycles.length} ciclos carregados com sucesso!`);
      
      // Se houver ciclos, selecionar o primeiro por padrão
      if (cycles.length > 0) {
        setSelectedCycleId(cycles[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar ciclos da API:", error);
      alert(`Erro ao carregar ciclos: ${error.message}`);
      setErrorMessage(`Erro ao carregar ciclos: ${error.message}`);
    } finally {
      setIsLoadingApiCycles(false);
    }
  }, [apiToken]);
  
  // Função para carregar rodadas do ciclo selecionado
  const loadCycleRounds = React.useCallback(async () => {
    if (!selectedCycleId) return;
    
    try {
      const rounds = await detectCycleRounds(apiToken, selectedCycleId);
      setCycleRounds(rounds);
      
      // Se houver rodadas, selecionar a primeira por padrão
      if (rounds.length > 0) {
        setSelectedRound(rounds[0].version);
        
        // Buscar matérias da API com a estrutura correta
        await loadSubjectsFromAPI(selectedCycleId, rounds[0].version);
      }
    } catch (error) {
      console.error("Erro ao carregar rodadas do ciclo:", error);
      setErrorMessage(`Erro ao carregar rodadas: ${error.message}`);
    }
  }, [apiToken, selectedCycleId, loadSubjectsFromAPI]);
  
  // Removemos a chamada automática quando a aba muda para usar apenas o botão
  
  // Carregar rodadas quando um ciclo é selecionado
  useEffect(() => {
    if (selectedCycleId && apiToken) {
      loadCycleRounds();
    } else {
      setCycleRounds([]);
      setSelectedRound(null);
    }
  }, [selectedCycleId, apiToken, loadCycleRounds]);
  
  // Atualizar disciplinas quando a rodada muda
  useEffect(() => {
    console.log("Efeito de mudança de rodada disparado:", 
      { ciclo: selectedCycleId, rodada: selectedRound, tokenPresente: !!apiToken });
    
    if (selectedCycleId && selectedRound && apiToken) {
      console.log("Requisitando busca de disciplinas após mudança de rodada");
      
      // Mostrar mensagem de carregamento
      setErrorMessage("Carregando disciplinas...");
      
      // Carrega com um pequeno delay para garantir que a interface atualizou
      setTimeout(() => {
        loadSubjectsFromAPI(selectedCycleId, selectedRound)
          .then(subjects => {
            console.log(`Carregamento concluído: ${subjects.length} disciplinas encontradas`);
            setErrorMessage("");
          })
          .catch(err => {
            console.error("Erro no efeito de atualização de disciplinas:", err);
          });
      }, 100);
    } else {
      // Limpar disciplinas quando não há rodada selecionada
      if (!selectedRound) {
        console.log("Limpando lista de disciplinas pois não há rodada selecionada");
        setApiSubjects([]);
      }
    }
  }, [selectedRound, selectedCycleId, apiToken, loadSubjectsFromAPI]);

  const handleAddSubject = () => {
    if (newSubject && newTime > 0) {
      // Garantir que newTime seja um número
      const targetTimeInMinutes = parseFloat(newTime) * 60;
      
      if (isNaN(targetTimeInMinutes)) {
        console.error("Tempo inválido:", newTime);
        return;
      }
      
      console.log("Adicionando nova matéria ao ciclo:", newSubject, "com", targetTimeInMinutes, "minutos");
      
      const updatedCycle = [...studyCycle, { 
        subject: newSubject, 
        targetTime: targetTimeInMinutes
      }];
      
      setStudyCycle(updatedCycle);
      localStorage.setItem("studyCycle", JSON.stringify(updatedCycle));
      
      // Tenta sincronizar com a nuvem se estiver disponível
      syncStudyCycleWithCloud(updatedCycle);
      
      setNewSubject("");
      setNewTime(0);
    }
  };

  const handleRemoveSubject = (subject) => {
    const updatedCycle = studyCycle.filter((item) => item.subject !== subject);
    setStudyCycle(updatedCycle);
    localStorage.setItem("studyCycle", JSON.stringify(updatedCycle));
    
    // Tenta sincronizar com a nuvem se estiver disponível
    syncStudyCycleWithCloud(updatedCycle);
  };

  const handleExportCSV = () => {
    const csvData = [
      ["Matéria", "Tempo (horas)"],
      ...studyCycle.map((item) => [item.subject, item.targetTime ? Math.round(item.targetTime / 60) : (item.time || 0)]),
    ];
    const csvContent = Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "ciclo_estudos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Função para adicionar/atualizar uma meta de tempo para disciplina na API
  const handleSetApiSubjectGoal = () => {
    if (!selectedCycleId || !selectedRound || !selectedSubject || subjectTargetTime <= 0) {
      setErrorMessage("Por favor, preencha todos os campos corretamente");
      return;
    }
    
    try {
      // Encontrar o nome da disciplina selecionada
      const selectedSubjectInfo = apiSubjects.find(subject => subject.id === selectedSubject);
      const subjectName = selectedSubjectInfo ? selectedSubjectInfo.name : `Disciplina ${selectedSubject}`;
      
      console.log(`Definindo meta para disciplina: ${subjectName}`);
      
      // Estrutura de dados para as metas
      const newGoal = {
        [selectedCycleId]: {
          [selectedRound]: {
            [selectedSubject]: {
              targetTime: subjectTargetTime * 60 // Converter para minutos
            }
          }
        }
      };
      
      // Salvar localmente
      saveLocalGoals(newGoal);
      
      // Adicionar/atualizar no ciclo local
      const updatedLocalCycle = [...studyCycle];
      
      // Verificar se já existe uma matéria com este nome
      const existingIndex = updatedLocalCycle.findIndex(item => 
        item.subject === subjectName || 
        (item.apiInfo && item.apiInfo.subjectId === selectedSubject)
      );
      
      if (existingIndex >= 0) {
        // Atualizar a matéria existente
        updatedLocalCycle[existingIndex] = {
          ...updatedLocalCycle[existingIndex],
          subject: subjectName,
          targetTime: subjectTargetTime * 60,
          apiInfo: {
            subjectId: selectedSubject,
            cycleId: selectedCycleId,
            roundId: selectedRound
          }
        };
      } else {
        // Adicionar nova matéria
        updatedLocalCycle.push({
          subject: subjectName,
          targetTime: subjectTargetTime * 60,
          apiInfo: {
            subjectId: selectedSubject,
            cycleId: selectedCycleId,
            roundId: selectedRound
          }
        });
      }
      
      // Atualizar o ciclo local
      setStudyCycle(updatedLocalCycle);
      localStorage.setItem("studyCycle", JSON.stringify(updatedLocalCycle));
      
      // Tenta sincronizar com a nuvem se estiver disponível
      syncStudyCycleWithCloud(updatedLocalCycle);
      
      // Feedback ao usuário
      alert(`Meta definida: ${subjectTargetTime} horas para ${subjectName} na rodada ${selectedRound} do ciclo`);
      
      // Limpar campos
      setSelectedSubject(null);
      setSubjectTargetTime(10);
    } catch (error) {
      console.error("Erro ao definir meta:", error);
      setErrorMessage(`Erro ao definir meta: ${error.message}`);
    }
  };
  
  // Função para alternar entre os modos local e API
  const handleTabChange = (key) => {
    setActiveTab(key);
    // Removemos a chamada automática, agora só carrega quando clica no botão
  };

  const handleImportCSV = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        console.log("Dados CSV importados:", result.data);
        
        const newCycle = result.data.slice(1).map((row) => {
          if (!row[0]) return null; // Pular linha sem matéria
          
          let targetTime = 600; // 10 horas em minutos (valor padrão)
          
          // Tentar converter o tempo para número
          if (row[1]) {
            const parsedTime = parseFloat(row[1]);
            if (!isNaN(parsedTime) && parsedTime > 0) {
              targetTime = parsedTime * 60; // Convertendo para minutos
            } else {
              console.warn(`Valor de tempo inválido para "${row[0]}": ${row[1]}, usando padrão de 10h`);
            }
          } else {
            console.warn(`Tempo não especificado para "${row[0]}", usando padrão de 10h`);
          }
          
          return {
            subject: row[0],
            targetTime: targetTime
          };
        }).filter(Boolean); // Remover itens nulos
        
        console.log("Ciclo importado:", newCycle);
        
        setStudyCycle(newCycle);
        localStorage.setItem("studyCycle", JSON.stringify(newCycle));
        
        // Tenta sincronizar com a nuvem se estiver disponível
        syncStudyCycleWithCloud(newCycle);
      },
      header: false,
    });
    return false;
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane 
          tab={<span><FileOutlined /> Ciclo Local</span>} 
          key="local"
        >
          <div style={{ marginBottom: "20px" }}>
            <h3>Adicionar Matéria</h3>
            <Input placeholder="Nome da Matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            <InputNumber min={1} placeholder="Tempo (horas)" value={newTime} onChange={(value) => setNewTime(value)} style={{ marginLeft: "10px" }} />
            <Button type="primary" onClick={handleAddSubject} style={{ marginLeft: "10px" }}>
              Adicionar
            </Button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>Importar/Exportar</h3>
            <Upload beforeUpload={handleImportCSV} showUploadList={false}>
              <Button icon={<UploadOutlined />} style={{ marginRight: "10px" }}>Importar CSV</Button>
            </Upload>
            <Button onClick={handleExportCSV}>
              Exportar CSV
            </Button>
          </div>

          <div>
            <h3>Matérias no Ciclo</h3>
            <List
              dataSource={studyCycle}
              renderItem={(item) => {
                // Calcular o valor correto de horas
                let hoursDisplay = 0;
                
                if (item.targetTime !== undefined && item.targetTime !== null) {
                  if (typeof item.targetTime === 'number' && !isNaN(item.targetTime)) {
                    hoursDisplay = Math.round(item.targetTime / 60);
                  } else {
                    console.warn("Tempo inválido:", item.targetTime);
                  }
                } else if (item.time !== undefined && item.time !== null) {
                  hoursDisplay = item.time;
                }
                
                return (
                  <List.Item>
                    <strong>{item.subject}</strong> - {hoursDisplay} horas
                    <Button type="link" danger onClick={() => handleRemoveSubject(item.subject)}>
                      Remover
                    </Button>
                  </List.Item>
                );
              }}
            />
          </div>
        </TabPane>
        
        <TabPane 
          tab={<span><CloudOutlined /> Integração com API</span>} 
          key="api"
        >
          <div style={{ marginBottom: "20px" }}>
            <Card title="Configuração da API">
              <div style={{ marginBottom: "15px" }}>
                <Input.Password 
                  placeholder="Bearer Token da API Gran Cursos" 
                  value={apiToken} 
                  onChange={(e) => {
                    setApiToken(e.target.value);
                    localStorage.setItem("bearerToken", e.target.value);
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              
              <Button 
                type="primary" 
                onClick={loadCyclesFromAPI} 
                loading={isLoadingApiCycles}
                disabled={!apiToken}
              >
                <SyncOutlined /> Buscar Ciclos da API
              </Button>
              
              {errorMessage && (
                <Alert 
                  type="error" 
                  message={errorMessage} 
                  closable 
                  style={{ marginTop: "15px" }}
                  onClose={() => setErrorMessage("")}
                />
              )}
            </Card>
          </div>
          
          {apiCycles.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <Card title="Ciclos Disponíveis">
                <div style={{ marginBottom: "15px" }}>
                  <label>Selecione um Ciclo:</label>
                  <Select 
                    style={{ width: "100%", marginTop: "5px" }} 
                    value={selectedCycleId}
                    onChange={setSelectedCycleId}
                  >
                    {apiCycles.map(cycle => (
                      <Option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                {cycleRounds.length > 0 && (
                  <div>
                    <label>Selecione uma Rodada:</label>
                    <Select 
                      style={{ width: "100%", marginTop: "5px" }} 
                      value={selectedRound}
                      onChange={setSelectedRound}
                    >
                      {cycleRounds.map(round => (
                        <Option key={round.version} value={round.version}>
                          Rodada {round.version}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
              </Card>
            </div>
          )}
          
          {selectedCycleId && selectedRound && (
            <div>
              <Card 
                title={
                  <span>
                    Definir Metas de Tempo
                    <Tooltip title="As metas de tempo serão salvas localmente e usadas para calcular o progresso de estudo, mas funcionarão com os dados da API.">
                      <InfoCircleOutlined style={{ marginLeft: "5px" }} />
                    </Tooltip>
                  </span>
                }
              >
                <div style={{ marginBottom: "15px" }}>
                  <label>Selecione uma Disciplina: <span style={{ color: "#1890ff" }}>({apiSubjects.length} disciplinas disponíveis)</span></label>
                  <Select 
                    style={{ width: "100%", marginTop: "5px" }} 
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    placeholder="Selecione a disciplina"
                  >
                    {apiSubjects.map(subject => (
                      <Option key={subject.id} value={subject.id}>
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <div style={{ marginBottom: "15px" }}>
                  <label>Meta de Tempo (horas):</label>
                  <InputNumber 
                    min={1} 
                    style={{ width: "100%", marginTop: "5px" }} 
                    value={subjectTargetTime}
                    onChange={setSubjectTargetTime}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button 
                    type="primary" 
                    onClick={handleSetApiSubjectGoal}
                    disabled={!selectedSubject}
                  >
                    Definir Meta para Disciplina Selecionada
                  </Button>
                  
                  <Button
                    type="default"
                    disabled={!selectedCycleId || !selectedRound || apiSubjects.length === 0 || subjectTargetTime <= 0}
                    onClick={() => {
                      // Confirmar antes de aplicar para todas
                      if (window.confirm(`Definir ${subjectTargetTime} horas como meta para TODAS as ${apiSubjects.length} disciplinas?`)) {
                        try {
                          // Estrutura para armazenar todas as metas
                          const allGoals = {
                            [selectedCycleId]: {
                              [selectedRound]: {}
                            }
                          };
                          
                          // Atualizar o ciclo local
                          const updatedLocalCycle = [...studyCycle];
                          
                          // Para cada disciplina
                          apiSubjects.forEach(subject => {
                            // Adicionar à estrutura de metas
                            allGoals[selectedCycleId][selectedRound][subject.id] = {
                              targetTime: subjectTargetTime * 60
                            };
                            
                            // Verificar se já existe no ciclo local
                            const existingIndex = updatedLocalCycle.findIndex(item => 
                              item.subject === subject.name || 
                              (item.apiInfo && item.apiInfo.subjectId === subject.id)
                            );
                            
                            if (existingIndex >= 0) {
                              // Atualizar disciplina existente
                              updatedLocalCycle[existingIndex] = {
                                ...updatedLocalCycle[existingIndex],
                                subject: subject.name,
                                targetTime: subjectTargetTime * 60,
                                apiInfo: {
                                  subjectId: subject.id,
                                  cycleId: selectedCycleId,
                                  roundId: selectedRound
                                }
                              };
                            } else {
                              // Adicionar nova disciplina
                              updatedLocalCycle.push({
                                subject: subject.name,
                                targetTime: subjectTargetTime * 60,
                                apiInfo: {
                                  subjectId: subject.id,
                                  cycleId: selectedCycleId,
                                  roundId: selectedRound
                                }
                              });
                            }
                          });
                          
                          // Salvar todas as metas
                          saveLocalGoals(allGoals);
                          
                          // Atualizar o ciclo local
                          setStudyCycle(updatedLocalCycle);
                          localStorage.setItem("studyCycle", JSON.stringify(updatedLocalCycle));
                          
                          // Sincronizar com a nuvem
                          syncStudyCycleWithCloud(updatedLocalCycle);
                          
                          // Feedback
                          alert(`Metas definidas: ${subjectTargetTime} horas para todas as ${apiSubjects.length} disciplinas`);
                        } catch (error) {
                          console.error("Erro ao definir metas para todas:", error);
                          setErrorMessage(`Erro ao definir metas: ${error.message}`);
                        }
                      }
                    }}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Aplicar a Todas
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
}