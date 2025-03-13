// Autor: [Seu Nome]

import React, { useState, useMemo } from "react";
import { Card, Row, Col, Button, Typography, Tag, Empty, Progress, Tabs, Radio, Space, Alert, Badge } from "antd";
import { 
  ClockCircleOutlined, 
  BookOutlined, 
  CheckCircleOutlined, 
  TrophyOutlined,
  FireOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  PlusOutlined,
  SettingOutlined,
  FileSearchOutlined,
  SwapOutlined,
  FundOutlined,
  ThunderboltOutlined, // Adicionado
  HistoryOutlined // Adicionado
} from "@ant-design/icons";

// Importação dos componentes reutilizáveis
import StatisticCard from "./StatisticCard";
import ChartCard from "./ChartCard";
import DashboardHeader from "./DashboardHeader";
import StudyTable from "./StudyTable";
import FilterControls from "../FilterControls";
import DashboardHeaderSection from "./DashboardHeaderSection"; // Importe o novo componente
import DashboardFilters from "./DashboardFilters"; // Importe o novo componente

// Importação das funções de utilidades
import { formatMinutesToHoursMinutes, parseTimeToMinutes } from "../../utils/timeUtils";

const StudyDashboard = ({ studyRecords = [] }) => {
  const [dateRange, setDateRange] = useState(null);
  const [timeFrame, setTimeFrame] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previousPeriod");
  const [activeTab, setActiveTab] = useState("1");
  const [chartView, setChartView] = useState("bar");
  const [cycleRound, setCycleRound] = useState("all"); // Para filtrar por rodada do ciclo
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState(null);

  // Lista de matérias únicas para o filtro
  const uniqueSubjects = useMemo(() => {
    return [...new Set(studyRecords.map(record => record.subject))];
  }, [studyRecords]);

  // Identificação das rodadas do ciclo de estudos, usando o campo version dos registros
  const cycleRounds = useMemo(() => {
    if (!studyRecords || studyRecords.length === 0) {
      return [];
    }
    return [...new Set(studyRecords.map(record => record.version))];
  }, [studyRecords]);

  // Placeholder para as variáveis não definidas
  const comparisonRecords = [];
  const derivedMetrics = {};
  const comparisonMetrics = {};
  const chartData = [];
  const comparisonChartData = [];
  const filteredRecords = [];

  return (
    <div style={{ padding: "20px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Cabeçalho do Dashboard */}
      <DashboardHeaderSection
        cycleRound={cycleRound}
        cycleRounds={cycleRounds}
        compareMode={compareMode}
        setCompareMode={setCompareMode}
        setIsModalVisible={setIsModalVisible}
      />

      {/* Filtros do Dashboard */}
      <DashboardFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        timeFrame={timeFrame}
        setTimeFrame={setTimeFrame}
        uniqueSubjects={uniqueSubjects}
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        cycleRound={cycleRound}
        cycleRounds={cycleRounds}
        setCycleRound={setCycleRound}
      />

      <Row gutter={[16, 16]}>
        {/* Removido o componente WeeklyStudyPanel */}
        {/* ...existing code... */}
      </Row>
    </div>
  );
};

export default StudyDashboard;