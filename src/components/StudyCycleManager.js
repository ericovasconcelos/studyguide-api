import React, { useState, useEffect } from "react";
import { Input, InputNumber, Button, Upload, List, Select, Tabs, Card, Badge, Spin, Alert, Tooltip } from "antd";
import { UploadOutlined, CloudOutlined, FileOutlined, SyncOutlined, InfoCircleOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { syncStudyCycleWithCloud } from "../utils/storage";
import { 
  fetchCyclesFromAPI, 
  detectCycleRounds, 
  mergeCycleWithLocalGoals,
  saveLocalGoals
} from "../utils/cycleIntegration";

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
  
  // Carregar ciclos da API quando o token muda
  useEffect(() => {
    if (apiToken && activeTab === 'api') {
      loadCyclesFromAPI();
    }
  }, [apiToken, activeTab]);
  
  // Carregar rodadas quando um ciclo é selecionado
  useEffect(() => {
    if (selectedCycleId && apiToken) {
      loadCycleRounds();
    } else {
      setCycleRounds([]);
      setSelectedRound(null);
    }
  }, [selectedCycleId, apiToken]);
  
  // Função para carregar ciclos da API
  const loadCyclesFromAPI = async () => {
    setIsLoadingApiCycles(true);
    setErrorMessage("");
    
    try {
      const cycles = await fetchCyclesFromAPI(apiToken);
      setApiCycles(cycles);
      
      // Se houver ciclos, selecionar o primeiro por padrão
      if (cycles.length > 0) {
        setSelectedCycleId(cycles[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar ciclos da API:", error);
      setErrorMessage(`Erro ao carregar ciclos: ${error.message}`);
    } finally {
      setIsLoadingApiCycles(false);
    }
  };
  
  // Função para carregar rodadas do ciclo selecionado
  const loadCycleRounds = async () => {
    if (!selectedCycleId) return;
    
    try {
      const rounds = await detectCycleRounds(apiToken, selectedCycleId);
      setCycleRounds(rounds);
      
      // Se houver rodadas, selecionar a primeira por padrão
      if (rounds.length > 0) {
        setSelectedRound(rounds[0].version);
        
        // Aqui podemos carregar as disciplinas disponíveis para este ciclo/rodada
        // Em uma implementação real, buscaríamos da API
        setApiSubjects([
          { id: 33, name: "Língua Portuguesa" },
          { id: 88, name: "Direito Civil" },
          { id: 21, name: "Direito Constitucional" },
          { id: 235863, name: "Raciocínio Lógico" }
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar rodadas do ciclo:", error);
      setErrorMessage(`Erro ao carregar rodadas: ${error.message}`);
    }
  };

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
      
      // Feedback ao usuário
      alert(`Meta definida: ${subjectTargetTime} horas para a disciplina selecionada na rodada ${selectedRound} do ciclo`);
      
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
    
    // Se alternar para a tab da API e tiver token, carregar dados
    if (key === 'api' && apiToken) {
      loadCyclesFromAPI();
    }
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
                  <label>Selecione uma Disciplina:</label>
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
                
                <Button 
                  type="primary" 
                  onClick={handleSetApiSubjectGoal}
                  disabled={!selectedSubject}
                >
                  Definir Meta
                </Button>
              </Card>
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
}
