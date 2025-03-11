import React, { useState, useEffect } from "react";
import { Button, Modal, Input, Drawer, Form, notification, Select } from "antd";
import StudyForm from "./components/StudyForm";
import StudyCycleManager from "./components/StudyCycleManager";
import StudyDashboard from "./components/StudyDashboard";
import { getStoredRecords, saveStudyRecord, syncToCloud, isCloudSynced, disconnectFromCloud, getCloudData, getCloudStudyCycle, generateMockGranData } from "./utils/storage";
import axios from "axios";
import { ConfigProvider, Typography, Tag } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined, LogoutOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

export default function StudyTracker() {
  const [studyRecords, setStudyRecords] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCycleModalVisible, setIsCycleModalVisible] = useState(false);
  const [studyCycle, setStudyCycle] = useState([]);
  const [bearerToken, setBearerToken] = useState(localStorage.getItem("bearerToken") || "");
  const [isCloudDrawerVisible, setIsCloudDrawerVisible] = useState(false);
  const [cloudUserId, setCloudUserId] = useState("");
  const [cloudKey, setCloudKey] = useState("");
  const [cloudSyncStatus, setCloudSyncStatus] = useState(isCloudSynced());
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem("lastCloudSync") || null);
  
  // Estados para controle dos filtros de ciclo e rodada
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleRounds, setCycleRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  // Função para processar registros e extrair ciclos e rodadas
  const processStudyRecords = (records) => {
    // Identificar ciclos únicos nos registros e suas rodadas
    const uniqueCycles = {};
    const roundsByCluster = {};
    
    records.forEach(record => {
      // Se tem ciclo e id
      if (record.cycleId && record.cycle) {
        const cycleId = record.cycleId;
        // Armazenar ciclo único
        if (!uniqueCycles[cycleId]) {
          uniqueCycles[cycleId] = {
            id: cycleId,
            name: record.cycle
          };
        }
        
        // Armazenar versão (rodada) única
        const version = record.version || 1;
        const key = `${cycleId}-${version}`;
        
        if (!roundsByCluster[key]) {
          roundsByCluster[key] = {
            cycleId: cycleId,
            cycleName: record.cycle,
            roundId: version
          };
        }
      }
    });
    
    // Converter objetos para arrays
    const cyclesList = Object.values(uniqueCycles);
    const roundsList = Object.values(roundsByCluster);
    
    // Ordenar ciclos e rodadas
    cyclesList.sort((a, b) => a.name.localeCompare(b.name));
    roundsList.sort((a, b) => {
      // Primário por ciclo, secundário por rodada
      if (a.cycleId === b.cycleId) {
        return a.roundId - b.roundId;
      }
      return a.cycleId - b.cycleId;
    });
    
    console.log("Ciclos identificados:", cyclesList);
    console.log("Rodadas por ciclo:", roundsList);
    
    return {
      cycles: cyclesList,
      rounds: roundsList
    };
  };

  useEffect(() => {
    const storedRecords = getStoredRecords();
    setStudyRecords(storedRecords);
    
    // Processar os registros para extrair ciclos e rodadas
    const { cycles, rounds } = processStudyRecords(storedRecords);
    
    // Atualizar estados para os seletores
    if (cycles.length > 0) {
      setSelectedCycle(cycles[0].id.toString());
    }
    setCycleRounds(rounds);
    
    // Carregar e validar o ciclo de estudos
    try {
      const storedCycleRaw = localStorage.getItem("studyCycle");
      let storedCycle = [];
      
      if (storedCycleRaw) {
        const parsedCycle = JSON.parse(storedCycleRaw);
        
        // Verificar se é um array válido
        if (Array.isArray(parsedCycle)) {
          // Validar cada item do ciclo
          storedCycle = parsedCycle.map(item => {
            // Garantir que o targetTime seja um número
            if (item.targetTime && typeof item.targetTime === 'number') {
              return item; // Manter como está se for válido
            } else {
              console.warn("Corrigindo targetTime inválido para:", item.subject);
              // Corrigir o item com target time inválido
              return {
                ...item,
                targetTime: typeof item.targetTime === 'string' ? 
                  parseInt(item.targetTime, 10) : 600 // 10 horas em minutos como padrão
              };
            }
          });
        }
      }
      
      console.log("Ciclo de estudos carregado:", storedCycle);
      setStudyCycle(storedCycle);
    } catch (error) {
      console.error("Erro ao carregar ciclo de estudos:", error);
      setStudyCycle([]);
    }
    
    // Verifica se já existe sincronização com a nuvem
    if (isCloudSynced()) {
      setCloudSyncStatus(true);
      const cloudData = getCloudData();
      if (cloudData) {
        setCloudUserId(cloudData.userId);
        setLastSyncTime(cloudData.lastSync);
      }
    }
  }, []);

  const handleSaveStudy = (newRecord) => {
    const updatedRecords = [...studyRecords, newRecord];
    setStudyRecords(updatedRecords);
    saveStudyRecord(updatedRecords);
    setIsModalVisible(false);
  };

  const handleTokenChange = (e) => {
    const token = e.target.value;
    setBearerToken(token);
    localStorage.setItem("bearerToken", token);
  };

  const fetchGranData = async () => {
    if (!bearerToken) {
      notification.error({
        message: "Token não informado",
        description: "Por favor, informe o Bearer Token antes de importar os dados.",
        placement: "topRight"
      });
      return;
    }

    try {
      // Mostrar notificação de carregamento
      notification.info({
        key: 'loading-notification',
        message: "Buscando dados...",
        description: "Conectando ao servidor, aguarde um momento...",
        placement: "topRight",
        duration: 0
      });

      // Escolher a API baseado no ambiente
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? "https://studyguide-api.onrender.com/fetch-gran-data"
        : "http://localhost:5000/fetch-gran-data";
      
      const response = await axios.post(apiUrl, { token: bearerToken }, {
        timeout: 15000, // Timeout de 15 segundos
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        }
      });
      
      // Fechar notificação de carregamento
      notification.destroy('loading-notification');
      
      if (response.data && response.data.studyRecords) {
        // Log para debug
        console.log("Dados recebidos da API:", response.data.studyRecords);
        
        const newRecords = response.data.studyRecords.map(record => {
          // Verificar e formatar o tempo corretamente
          let formattedStudyTime = "0:00";
          
          if (record.studyTime !== undefined && record.studyTime !== null) {
            // Verificar se já está no formato "hh:mm"
            if (typeof record.studyTime === 'string' && record.studyTime.includes(':')) {
              // O formato já é correto, vamos apenas validar
              const parts = record.studyTime.split(':');
              if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                formattedStudyTime = record.studyTime;
                console.log("Mantendo formato original de tempo:", record.studyTime);
              } else {
                console.warn("Formato de tempo inválido:", record.studyTime);
              }
            } else {
              // Converter de segundos para "hh:mm"
              const studyTimeValue = typeof record.studyTime === 'string' ? 
                parseInt(record.studyTime, 10) : record.studyTime;
                
              if (!isNaN(studyTimeValue)) {
                const hours = Math.floor(studyTimeValue / 3600);
                const minutes = Math.floor((studyTimeValue % 3600) / 60);
                formattedStudyTime = `${hours}:${String(minutes).padStart(2, '0')}`;
                console.log("Convertendo tempo de segundos:", record.studyTime, "->", formattedStudyTime);
              } else {
                console.warn("Valor de tempo não numérico:", record.studyTime);
              }
            }
          }
          
          // Garantir que a data esteja em um formato válido
          let validDate = record.date;
          try {
            // Verificar se a data é válida
            const dateObj = new Date(record.date);
            if (isNaN(dateObj.getTime())) {
              // Se for inválida, usar a data atual como fallback
              validDate = new Date().toISOString();
            }
          } catch (e) {
            console.warn("Erro ao validar data:", e);
            validDate = new Date().toISOString();
          }
          
          return {
            id: record.id,
            date: validDate,
            subject: record.subject || "Sem disciplina",
            studyTime: formattedStudyTime,
            totalExercises: record.totalExercises || 0,
            correctAnswers: record.correctAnswers || 0,
            studyType: record.studyType || "Desconhecido",
            studyPeriod: record.studyPeriod || "Desconhecido",
            cycle: record.cycle || "",
            cycleId: record.cycleId || 0,
            version: record.version || 1 // Manter a informação de versão (rodada)
          };
        });

        // Remover duplicatas comparando os registros pelo ID e data
        const uniqueRecords = newRecords.filter(newRecord =>
          !studyRecords.some(existingRecord =>
            existingRecord.date === newRecord.date && existingRecord.subject === newRecord.subject
          )
        );

        const updatedRecords = [...studyRecords, ...uniqueRecords];
        
        // Log para debug dos dados
        console.log("Dados recebidos do Gran Cursos:", {
          originalData: response.data,
          processedRecords: newRecords,
          uniqueRecords: uniqueRecords,
          updatedState: updatedRecords
        });
        
        // Processar os registros para atualizar ciclos e rodadas
        const { cycles, rounds } = processStudyRecords(updatedRecords);
        setCycleRounds(rounds);
        
        // Se não houver ciclo selecionado ainda e temos ciclos, selecione o primeiro
        if (!selectedCycle && cycles.length > 0) {
          setSelectedCycle(cycles[0].id.toString());
        }
        
        setStudyRecords(updatedRecords);
        saveStudyRecord(updatedRecords);
        notification.success({
          message: "Dados importados",
          description: `${uniqueRecords.length} novos registros importados com sucesso do Gran Cursos!`,
          placement: "topRight"
        });
      } else {
        notification.warning({
          message: "Sem novos dados",
          description: "Não foram encontrados registros novos para importar.",
          placement: "topRight"
        });
      }
    } catch (error) {
      // Fechar notificação de carregamento
      notification.destroy('loading-notification');
      
      console.error("Erro ao importar dados do Gran Cursos:", error);
      
      let errorMessage = "Erro ao buscar os registros do Gran Cursos.";
      
      // Mensagens de erro mais específicas com base no tipo de erro
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Tempo limite excedido na conexão. O servidor pode estar lento ou indisponível.";
      } else if (error.response) {
        // Resposta foi recebida com código de erro
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = "Acesso negado. Verifique se o seu token é válido.";
        } else if (error.response.status === 404) {
          errorMessage = "API não encontrada. O serviço pode estar temporariamente indisponível.";
        } else if (error.response.status >= 500) {
          errorMessage = "Erro no servidor da API. Tente novamente mais tarde.";
        }
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      }
      
      notification.error({
        message: "Erro de importação",
        description: errorMessage,
        placement: "topRight",
        duration: 7,
        btn: (
          <Button 
            type="primary" 
            size="small" 
            onClick={() => {
              // Usar dados simulados
              notification.destroy('error-notification');
              handleMockData();
            }}
          >
            Usar dados de demonstração
          </Button>
        ),
        key: 'error-notification'
      });
    }
  };
  
  // Função para usar dados simulados quando a API estiver indisponível
  const handleMockData = () => {
    notification.info({
      message: "Usando dados de demonstração",
      description: "Carregando dados simulados para demonstração...",
      placement: "topRight",
      duration: 2
    });
    
    // Pequeno atraso para simular carregamento
    setTimeout(() => {
      try {
        const mockResponse = generateMockGranData();
        
        if (mockResponse && mockResponse.studyRecords) {
          // Log para debug dos dados simulados
          console.log("Dados simulados gerados:", mockResponse.studyRecords);
          
          const newRecords = mockResponse.studyRecords.map(record => {
            // Verificar e formatar o tempo corretamente
            let formattedStudyTime = "0:00";
            
            if (record.studyTime !== undefined && record.studyTime !== null) {
              // Verificar se já está no formato "hh:mm"
              if (typeof record.studyTime === 'string' && record.studyTime.includes(':')) {
                // O formato já é correto, vamos apenas validar
                const parts = record.studyTime.split(':');
                if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                  formattedStudyTime = record.studyTime;
                  console.log("Mantendo formato original de tempo (simulado):", record.studyTime);
                } else {
                  console.warn("Formato de tempo inválido (simulado):", record.studyTime);
                }
              } else {
                // Converter de segundos para "hh:mm"
                const studyTimeValue = typeof record.studyTime === 'string' ? 
                  parseInt(record.studyTime, 10) : record.studyTime;
                  
                if (!isNaN(studyTimeValue)) {
                  const hours = Math.floor(studyTimeValue / 3600);
                  const minutes = Math.floor((studyTimeValue % 3600) / 60);
                  formattedStudyTime = `${hours}:${String(minutes).padStart(2, '0')}`;
                  console.log("Convertendo tempo de segundos (simulado):", record.studyTime, "->", formattedStudyTime);
                } else {
                  console.warn("Valor de tempo não numérico (simulado):", record.studyTime);
                }
              }
            }
            
            // Garantir que a data esteja em um formato válido
            let validDate = record.date;
            try {
              // Verificar se a data é válida
              const dateObj = new Date(record.date);
              if (isNaN(dateObj.getTime())) {
                // Se for inválida, usar a data atual como fallback
                validDate = new Date().toISOString();
              }
            } catch (e) {
              console.warn("Erro ao validar data em dados simulados:", e);
              validDate = new Date().toISOString();
            }
            
            return {
              date: validDate,
              subject: record.subject || "Sem disciplina",
              studyTime: formattedStudyTime,
              totalExercises: record.totalExercises || 0,
              correctAnswers: record.correctAnswers || 0,
              studyType: record.studyType || "Desconhecido"
            };
          });

          // Remover duplicatas
          const uniqueRecords = newRecords.filter(newRecord =>
            !studyRecords.some(existingRecord =>
              existingRecord.date === newRecord.date && existingRecord.subject === newRecord.subject
            )
          );

          const updatedRecords = [...studyRecords, ...uniqueRecords];
          setStudyRecords(updatedRecords);
          saveStudyRecord(updatedRecords);
          
          notification.success({
            message: "Dados de demonstração importados",
            description: `${uniqueRecords.length} registros de demonstração foram adicionados com sucesso.`,
            placement: "topRight"
          });
        }
      } catch (error) {
        console.error("Erro ao gerar dados simulados:", error);
        notification.error({
          message: "Erro nos dados de demonstração",
          description: "Não foi possível gerar os dados de demonstração.",
          placement: "topRight"
        });
      }
    }, 1500);
  };

  const clearStudyRecords = () => {
    setStudyRecords([]);
    saveStudyRecord([]);
    notification.success({
      message: "Registros apagados",
      description: "Todos os registros de estudo foram apagados.",
      placement: "topRight"
    });
  };

  // Funções de sincronização com a nuvem
  const handleConnectToCloud = () => {
    if (!cloudUserId || !cloudKey) {
      notification.error({
        message: "Campos obrigatórios",
        description: "Por favor, preencha o ID do usuário e a chave de sincronização",
        placement: "topRight"
      });
      return;
    }
    
    // Executa a sincronização
    const result = syncToCloud(cloudUserId, cloudKey);
    
    if (result && result.isConnected) {
      setCloudSyncStatus(true);
      setLastSyncTime(result.lastSync);
      
      // Se os dados foram atualizados da nuvem, atualize o estado
      if (result.dataUpdated) {
        // Recarrega os registros atualizados
        const updatedRecords = getStoredRecords();
        setStudyRecords(updatedRecords);
        
        // Tenta recuperar o ciclo de estudos da nuvem
        const cloudCycle = getCloudStudyCycle();
        if (cloudCycle) {
          setStudyCycle(cloudCycle);
          localStorage.setItem("studyCycle", JSON.stringify(cloudCycle));
        }
        
        notification.success({
          message: "Dados recuperados da nuvem!",
          description: "Seus dados foram atualizados com as informações da nuvem",
          placement: "topRight"
        });
      } else {
        // Mesmo que não tenha atualizado registros, tenta buscar ciclo de estudos
        const cloudCycle = getCloudStudyCycle();
        if (cloudCycle) {
          setStudyCycle(cloudCycle);
          localStorage.setItem("studyCycle", JSON.stringify(cloudCycle));
        }
        
        notification.success({
          message: "Sincronização ativada!",
          description: "Seus dados agora estão sincronizados com a nuvem e podem ser acessados em outros dispositivos",
          placement: "topRight"
        });
      }
      
      setIsCloudDrawerVisible(false);
    } else {
      notification.error({
        message: "Erro de sincronização",
        description: "Erro ao sincronizar com a nuvem. Verifique suas credenciais.",
        placement: "topRight"
      });
    }
  };
  
  const handleDisconnectFromCloud = () => {
    const result = disconnectFromCloud();
    
    if (!result.isConnected) {
      setCloudSyncStatus(false);
      setLastSyncTime(null);
      
      notification.info({
        message: "Desconectado da nuvem",
        description: "Seus dados agora são apenas locais e não estão mais sincronizados",
        placement: "topRight"
      });
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#121212',
          colorTextBase: '#fff',
          colorBgElevated: '#1e1e2f',
          colorBgContainer: '#1e1e2f',
          colorBorder: '#333',
          backgroundColor: "#121212",
        },
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "auto", padding: "20px", backgroundColor: "#121212", color: "#fff", borderRadius: "0px" }}>
        <h2 style={{ textAlign: "center", color: "#fff" }}>Dashboard de Estudos</h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div>
            <Input.Password
              placeholder="Cole aqui seu Bearer Token"
              value={bearerToken}
              onChange={handleTokenChange}
              style={{ width: "300px", backgroundColor: "#1e1e2f", color: "#fff", border: "1px solid #555" }}
            />
          </div>
          
          <div>
            {cloudSyncStatus ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "14px", marginRight: "10px", color: "#52c41a" }}>
                  <CloudDownloadOutlined /> Sincronizado {lastSyncTime ? `(${new Date(lastSyncTime).toLocaleString()})` : ""}
                </span>
                <Button 
                  type="text" 
                  danger 
                  icon={<LogoutOutlined />} 
                  onClick={handleDisconnectFromCloud}
                >
                  Desconectar
                </Button>
              </div>
            ) : (
              <Button 
                type="primary" 
                icon={<CloudUploadOutlined />} 
                onClick={() => setIsCloudDrawerVisible(true)}
              >
                Sincronizar Dispositivos
              </Button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "8px", 
            background: "#1e1e3f", 
            padding: "8px 12px", 
            borderRadius: "4px" 
          }}>
            <div>
              <Text style={{ color: "#1890ff", marginRight: "8px" }}>API Local:</Text>
              <Text style={{ color: "#fff" }}>Use os tokens: </Text>
              <Tag color="green">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo</Tag>
              <Text style={{ color: "#fff" }}>ou</Text>
              <Tag color="green">test-token-1234</Tag>
            </div>
            <a 
              href="http://localhost:5000/fetch-gran-data" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "#1890ff", fontSize: "12px" }}
            >
              API Endpoint
            </a>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button type="primary" onClick={fetchGranData}>
                Importar do Gran Cursos
              </Button>
              <Button onClick={handleMockData} style={{ background: "#722ed1", color: "#fff" }}>
                Dados de Demonstração
              </Button>
              <Button type="default" onClick={clearStudyRecords} danger>
                Limpar Registros
              </Button>
            </div>
          </div>
          
          {cycleRounds.length > 0 && (
            <div style={{ 
              display: "flex", 
              gap: "20px", 
              backgroundColor: "#1e1e2f", 
              padding: "15px", 
              borderRadius: "5px", 
              marginBottom: "15px" 
            }}>
              <div style={{ width: "50%" }}>
                <Text strong style={{ display: "block", marginBottom: "5px", color: "#fff" }}>Ciclo de Estudos:</Text>
                <Select 
                  style={{ width: "100%" }} 
                  value={selectedCycle}
                  onChange={(value) => {
                    setSelectedCycle(value);
                    setSelectedRound(null); // Resetar rodada quando mudar o ciclo
                  }}
                >
                  {Object.values(cycleRounds.reduce((acc, round) => {
                    acc[round.cycleId] = {
                      id: round.cycleId,
                      name: round.cycleName
                    };
                    return acc;
                  }, {})).map(cycle => (
                    <Option key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div style={{ width: "50%" }}>
                <Text strong style={{ display: "block", marginBottom: "5px", color: "#fff" }}>Rodada (Versão):</Text>
                <Select 
                  style={{ width: "100%" }} 
                  value={selectedRound} 
                  onChange={setSelectedRound}
                  placeholder="Selecione uma rodada"
                >
                  <Option value={null}>Todas as rodadas</Option>
                  {cycleRounds
                    .filter(round => round.cycleId.toString() === selectedCycle)
                    .map(round => (
                      <Option key={`${round.cycleId}-${round.roundId}`} value={round.roundId.toString()}>
                        Rodada {round.roundId}
                      </Option>
                    ))
                  }
                </Select>
              </div>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "#1e1e2f", padding: "20px", borderRadius: "10px" }}>
          <StudyDashboard
            studyRecords={
              // Filtrar os registros com base no ciclo e rodada selecionados
              studyRecords.filter(record => {
                // Se não tem ciclo selecionado, mostrar todos
                if (!selectedCycle) return true;
                
                // Filtrar por ciclo
                const matchesCycle = record.cycleId && record.cycleId.toString() === selectedCycle.toString();
                
                // Se não tem rodada selecionada, mostrar todos do ciclo
                if (!selectedRound) return matchesCycle;
                
                // Filtrar por ciclo e rodada
                return matchesCycle && record.version && record.version.toString() === selectedRound.toString();
              })
            }
            selectedCycle={selectedCycle}
            selectedRound={selectedRound}
            studyCycle={studyCycle}
            setIsModalVisible={setIsModalVisible}
            setIsCycleModalVisible={setIsCycleModalVisible}
          />
        </div>

        <Modal title="Registrar Estudo" open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null}>
          <StudyForm onSave={handleSaveStudy} />
        </Modal>

        <Modal title="Editar Ciclo de Estudos" open={isCycleModalVisible} onCancel={() => setIsCycleModalVisible(false)} footer={null}>
          <StudyCycleManager studyCycle={studyCycle} setStudyCycle={setStudyCycle} />
        </Modal>
        
        {/* Drawer para sincronização com a nuvem */}
        <Drawer 
          title="Sincronização entre Dispositivos" 
          placement="right"
          onClose={() => setIsCloudDrawerVisible(false)}
          open={isCloudDrawerVisible}
          width={400}
        >
          <div style={{ marginBottom: "20px" }}>
            <p>Configure a sincronização para acessar seus dados de estudo em qualquer dispositivo.</p>
            <p>Crie um ID único e uma chave secreta que você usará em todos os dispositivos para acessar seus dados.</p>
          </div>
          
          <Form layout="vertical">
            <Form.Item label="ID de Usuário (crie um ID único)">
              <Input 
                value={cloudUserId} 
                onChange={(e) => setCloudUserId(e.target.value)}
                placeholder="Ex: eric123"
              />
            </Form.Item>
            
            <Form.Item label="Chave de Sincronização (crie uma senha segura)">
              <Input.Password 
                value={cloudKey} 
                onChange={(e) => setCloudKey(e.target.value)}
                placeholder="Crie uma senha para sincronização"
              />
            </Form.Item>
            
            <Button type="primary" block onClick={handleConnectToCloud}>
              Conectar e Sincronizar
            </Button>
          </Form>
          
          <div style={{ marginTop: "20px", border: "1px solid #333", padding: "15px", borderRadius: "5px" }}>
            <h4>Como funciona?</h4>
            <p>1. Use o mesmo ID e chave em todos os seus dispositivos</p>
            <p>2. Seus dados serão sincronizados automaticamente</p>
            <p>3. Se você perder seus dados, basta usar o mesmo ID e chave para recuperá-los</p>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
