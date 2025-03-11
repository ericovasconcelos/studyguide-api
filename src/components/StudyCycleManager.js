import React, { useState } from "react";
import { Input, InputNumber, Button, Upload, List } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { syncStudyCycleWithCloud } from "../utils/storage";

export default function StudyCycleManager({ studyCycle, setStudyCycle }) {
  const [newSubject, setNewSubject] = useState("");
  const [newTime, setNewTime] = useState(0);

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
      <h3>Adicionar Matéria</h3>
      <Input placeholder="Nome da Matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
      <InputNumber min={1} placeholder="Tempo (horas)" value={newTime} onChange={(value) => setNewTime(value)} style={{ marginLeft: "10px" }} />
      <Button type="primary" onClick={handleAddSubject} style={{ marginLeft: "10px" }}>
        Adicionar
      </Button>

      <h3>Importar Ciclo</h3>
      <Upload beforeUpload={handleImportCSV} showUploadList={false}>
        <Button icon={<UploadOutlined />}>Importar CSV</Button>
      </Upload>

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
      <Button type="primary" onClick={handleExportCSV} style={{ marginTop: "10px" }}>
        Exportar CSV
      </Button>
    </div>
  );
}
