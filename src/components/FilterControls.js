import React from "react";
import { Select, DatePicker, Space, Typography, Radio, Button } from "antd";
import { FilterOutlined, HistoryOutlined, ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FilterControls = ({
  // Filtros de ciclo e rodada (opcional)
  cycleRounds = [],
  selectedCycle,
  setSelectedCycle,
  selectedRound,
  setSelectedRound,
  showCycleFilters = true,
  
  // Filtros de disciplina
  subjectFilter,
  setSubjectFilter,
  uniqueSubjects = [],
  
  // Filtros de período
  timeFrame,
  setTimeFrame,
  dateRange,
  setDateRange,
  
  // Comparações
  compareMode,
  setCompareMode,
  comparisonPeriod,
  setComparisonPeriod,
  
  // Estilo e layout
  style,
  compact = false,
  onReset
}) => {
  return (
    <div style={{ 
      padding: compact ? "12px" : "15px", 
      borderRadius: "12px", 
      marginBottom: "20px",
      background: "rgba(30, 41, 59, 0.7)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      ...style
    }}>
      {/* CONTROLES PRINCIPAIS */}
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* LINHA 1: FILTROS DE CICLO E RODADA */}
        {showCycleFilters && cycleRounds.length > 0 && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
            {/* Filtro de Ciclo */}
            <div style={{ width: "50%" }}>
              <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                Ciclo de Estudos:
              </Text>
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
            
            {/* Filtro de Rodada */}
            <div style={{ width: "50%" }}>
              <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                Rodada (Versão):
              </Text>
              <Select 
                style={{ width: "100%" }} 
                value={selectedRound} 
                onChange={setSelectedRound}
                placeholder="Selecione uma rodada"
              >
                <Option value={null}>Todas as rodadas</Option>
                {cycleRounds
                  .filter(round => round.cycleId?.toString() === selectedCycle)
                  .map(round => (
                    <Option key={`${round.cycleId}-${round.roundId}`} value={round.roundId?.toString()}>
                      Rodada {round.roundId}
                    </Option>
                  ))
                }
              </Select>
            </div>
          </div>
        )}
        
        {/* LINHA 2: FILTROS DE DISCIPLINA E PERÍODO */}
        {(uniqueSubjects.length > 0 || setTimeFrame) && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
            {/* Filtro de Disciplina */}
            {uniqueSubjects.length > 0 && (
              <div style={{ width: setTimeFrame ? "50%" : "100%" }}>
                <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                  <FilterOutlined /> Disciplina:
                </Text>
                <Select
                  style={{ width: "100%" }}
                  value={subjectFilter}
                  onChange={setSubjectFilter}
                  placeholder="Selecione uma disciplina"
                >
                  <Option value="all">Todas as disciplinas</Option>
                  {uniqueSubjects.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </div>
            )}
            
            {/* Filtro de Período */}
            {setTimeFrame && (
              <div style={{ width: uniqueSubjects.length > 0 ? "50%" : "100%" }}>
                <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                  <HistoryOutlined /> Período:
                </Text>
                <Select
                  style={{ width: "100%" }}
                  value={timeFrame}
                  onChange={setTimeFrame}
                  placeholder="Selecione um período"
                >
                  <Option value="all">Todo o período</Option>
                  <Option value="week">Última semana</Option>
                  <Option value="month">Último mês</Option>
                  <Option value="quarter">Último trimestre</Option>
                  <Option value="year">Último ano</Option>
                </Select>
              </div>
            )}
          </div>
        )}
        
        {/* LINHA 3: SELETOR DE DATA E MODO DE COMPARAÇÃO */}
        {(setDateRange || setCompareMode) && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
            {/* Seletor de intervalo de datas */}
            {setDateRange && (
              <div style={{ width: setCompareMode ? "60%" : "100%" }}>
                <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                  Intervalo de datas:
                </Text>
                <RangePicker
                  style={{ width: "100%" }}
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                    // Se selecionar datas, resetar o filtro de período
                    if (dates && dates.length === 2) {
                      setTimeFrame && setTimeFrame("all");
                    }
                  }}
                />
              </div>
            )}
            
            {/* Controles de comparação */}
            {setCompareMode && (
              <div style={{ width: setDateRange ? "40%" : "100%" }}>
                <Text strong style={{ display: "block", marginBottom: "8px", color: "#e2e8f0" }}>
                  Comparar períodos:
                </Text>
                <Space>
                  <Radio.Group
                    value={compareMode}
                    onChange={(e) => setCompareMode(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                  >
                    <Radio.Button value={false}>Desligado</Radio.Button>
                    <Radio.Button value={true}>Comparar</Radio.Button>
                  </Radio.Group>
                  
                  {compareMode && (
                    <Select
                      style={{ width: 170 }}
                      value={comparisonPeriod}
                      onChange={setComparisonPeriod}
                      size="small"
                    >
                      <Option value="previousPeriod">Período anterior</Option>
                      <Option value="sameLastYear">Mesmo período ano passado</Option>
                    </Select>
                  )}
                </Space>
              </div>
            )}
          </div>
        )}
      </Space>
      
      {/* Botão de Reset */}
      {onReset && (
        <div style={{ marginTop: "10px", textAlign: "right" }}>
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={onReset}
            size="small"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterControls;