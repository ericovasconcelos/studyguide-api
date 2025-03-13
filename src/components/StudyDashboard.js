import React, { useState, useMemo } from "react";
import { Card, Table, Button, Statistic, Row, Col, Typography, Tag, Select, DatePicker, Empty, Progress, Tooltip as AntTooltip, Tabs, Radio, Space, Alert, Badge } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, ComposedChart, Scatter } from "recharts";
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
  ThunderboltOutlined,
  HistoryOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// Função auxiliar para formatar o tempo
const formatMinutesToHoursMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Função auxiliar para calcular o tempo total em minutos
const getTotalMinutes = (record) => {
  return record.timeSpent || 0;
};

// Função auxiliar para converter tempo em minutos
const getMinutes = (timeStr) => {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr) return 0;
  
  try {
    const parts = timeStr.split(":");
    if (parts.length !== 2) return 0;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return 0;
    
    return hours * 60 + minutes;
  } catch (error) {
    console.error("Erro ao converter tempo:", error);
    return 0;
  }
};

export default function StudyDashboard({ studyRecords, studyCycle, setIsModalVisible, setIsCycleModalVisible }) {
  // Log para depuração
  console.log("StudyDashboard recebeu:", { 
    studyRecords: studyRecords, 
    studyCycle: studyCycle,
    recordsLength: studyRecords?.length || 0
  });

  // Estados para filtros e comparação
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [timeFrame, setTimeFrame] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("previousPeriod");
  const [activeTab, setActiveTab] = useState("1");
  const [chartView, setChartView] = useState("bar");
  const [cycleRound, setCycleRound] = useState("all"); // Para filtrar por rodada do ciclo

  // Lista de matérias únicas para o filtro
  const uniqueSubjects = useMemo(() => {
    return [...new Set(studyRecords.map(record => record.subject))];
  }, [studyRecords]);

  // Identificação das rodadas do ciclo de estudos, usando o campo version dos registros
  const cycleRounds = useMemo(() => {
    if (!studyRecords || studyRecords.length === 0) {
      return [];
    }
    
    // Agrupar os registros pelo campo version (rodada) e cicloId (para separar ciclos diferentes)
    const roundGroups = {};
    
    // Percorrer todos os registros e agrupar por versão e ciclo
    for (const record of studyRecords) {
      // Usar os campos version e cicloId para identificar a rodada
      const version = record.version || 1;
      const cycleId = record.cycleId || 0;
      const cycleName = record.cycle || "Sem ciclo";
      
      // Criamos uma chave combinada para agrupar por ciclo E versão
      const groupKey = `${cycleId}-${version}`;
      
      if (!roundGroups[groupKey]) {
        roundGroups[groupKey] = {
          id: version,
          cycleId: cycleId,
          name: cycleName,
          uniqueKey: groupKey,
          records: [],
          dates: []
        };
      }
      
      // Adicionar o registro ao grupo da sua versão + ciclo
      roundGroups[groupKey].records.push(record);
      
      // Adicionar a data para determinar período do ciclo
      if (record.date) {
        roundGroups[groupKey].dates.push(new Date(record.date));
      }
    }
    
    // Converter para um array e ordenar
    const roundsArray = Object.values(roundGroups);
    
    // Determinar data de início e fim para cada rodada
    roundsArray.forEach(round => {
      if (round.dates && round.dates.length > 0) {
        // Ordenar as datas
        round.dates.sort((a, b) => a - b);
        
        round.startDate = round.dates[0].toISOString();
        round.endDate = round.dates[round.dates.length - 1].toISOString();
        
        // Um ciclo está "completo" se não é o mais recente
        const isLatestRound = round.endDate === 
          roundsArray
            .filter(r => r.cycleId === round.cycleId) // Só comparar com rodadas do mesmo ciclo
            .reduce((latest, r) => {
              if (!latest) return r.endDate;
              return new Date(r.endDate) > new Date(latest) ? r.endDate : latest;
            }, null);
          
        round.isComplete = !isLatestRound;
      }
    });
    
    // Formar um nome descritivo para cada rodada
    roundsArray.forEach(round => {
      // Adicionar número de versão no nome só se diferente de 1
      if (round.id > 1) {
        round.displayName = `${round.name} (Rodada ${round.id})`;
      } else {
        round.displayName = round.name;
      }
    });
    
    // Ordenar por (1) data de início e (2) ID do ciclo para rodadas do mesmo dia
    roundsArray.sort((a, b) => {
      const dateCompare = new Date(a.startDate) - new Date(b.startDate);
      if (dateCompare !== 0) return dateCompare;
      return a.cycleId - b.cycleId;
    });
    
    // Numerar as rodadas em ordem
    roundsArray.forEach((round, index) => {
      round.number = index + 1;
    });
    
    console.log("Rodadas do ciclo identificadas pela versão e cicloId:", roundsArray);
    
    return roundsArray;
  }, [studyRecords]);

  // Função para filtrar registros com base nos seletores
  const filterRecordsByPeriod = (records, subject, dates, period) => {
    console.log("Filtrando registros:", { records, subject, dates, period });
    
    // Proteção contra registros nulos
    if (!records || !Array.isArray(records)) {
      console.error("Registros inválidos:", records);
      return [];
    }
    
    let filtered = [...records];
    
    // Filtrar por matéria
    if (subject !== "all") {
      filtered = filtered.filter(record => record.subject === subject);
    }
    
    // Filtrar por intervalo de datas
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        console.log("Comparando datas:", { recordDate, startDate, endDate, include: recordDate >= startDate && recordDate <= endDate });
        return recordDate >= startDate && recordDate <= endDate;
      });
    }
    
    // Filtrar por período de tempo
    if (period !== "all") {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final do dia atual
      
      let compareDate = new Date();
      compareDate.setHours(0, 0, 0, 0); // Início do dia
      
      switch (period) {
        case "week":
          compareDate.setDate(today.getDate() - 7);
          break;
        case "month":
          compareDate.setMonth(today.getMonth() - 1);
          break;
        case "quarter":
          compareDate.setMonth(today.getMonth() - 3);
          break;
        case "year":
          compareDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= compareDate && recordDate <= today;
      });
    }
    
    return filtered;
  };

  // Registros filtrados para o período atual
  const filteredRecords = useMemo(() => {
    // Primeiro aplicamos o filtro de rodada, se estiver selecionado
    let recordsToFilter = [...studyRecords];
    
    if (cycleRound !== "all" && cycleRounds.length > 0) {
      const selectedRound = cycleRounds.find(r => r.number.toString() === cycleRound);
      if (selectedRound) {
        // Criar um Set com IDs dos registros desta rodada para busca eficiente
        const roundRecordIds = new Set(selectedRound.records.map(r => r.id));
        // Filtrar apenas os registros desta rodada
        recordsToFilter = recordsToFilter.filter(record => roundRecordIds.has(record.id));
        console.log(`Filtro de rodada ${cycleRound} aplicado: ${recordsToFilter.length} registros`);
      }
    }
    
    // Depois aplicamos os demais filtros
    const filtered = filterRecordsByPeriod(recordsToFilter, subjectFilter, dateRange, timeFrame);
    console.log("Registros filtrados após todos os filtros:", filtered);
    return filtered;
  }, [studyRecords, subjectFilter, dateRange, timeFrame, cycleRound, cycleRounds]);

  // Registros filtrados para o período de comparação
  const comparisonRecords = useMemo(() => {
    if (!compareMode) return [];
    
    let comparisonDateRange = null;
    let comparisonTimeFrameValue = "all";
    
    // Calcular o período de comparação com base no período atual
    if (comparisonPeriod === "previousPeriod") {
      // Se estamos usando timeFrame, usamos o período anterior equivalente
      if (timeFrame !== "all") {
        const today = new Date();
        const periodEnd = new Date();
        let periodStart = new Date();
        
        switch (timeFrame) {
          case "week":
            // Periodo atual: últimos 7 dias, período anterior: 7 dias antes disso
            periodStart.setDate(today.getDate() - 7);
            periodEnd.setDate(today.getDate() - 8);
            periodStart.setDate(periodEnd.getDate() - 7);
            comparisonDateRange = [periodStart, periodEnd];
            break;
          case "month":
            // Período atual: último mês, período anterior: mês antes disso
            periodStart.setMonth(today.getMonth() - 1);
            periodEnd.setDate(today.getDate() - 31);
            periodStart.setMonth(periodEnd.getMonth() - 1);
            comparisonDateRange = [periodStart, periodEnd];
            break;
          case "quarter":
            // Período atual: últimos 3 meses, período anterior: 3 meses antes disso
            periodStart.setMonth(today.getMonth() - 3);
            periodEnd.setDate(today.getDate() - 91);
            periodStart.setMonth(periodEnd.getMonth() - 3);
            comparisonDateRange = [periodStart, periodEnd];
            break;
          case "year":
            // Período atual: último ano, período anterior: ano antes disso
            periodStart.setFullYear(today.getFullYear() - 1);
            periodEnd.setDate(today.getDate() - 366);
            periodStart.setFullYear(periodEnd.getFullYear() - 1);
            comparisonDateRange = [periodStart, periodEnd];
            break;
          default:
            break;
        }
      } 
      // Se usamos dateRange específico, calculamos o mesmo período imediatamente anterior
      else if (dateRange) {
        const [startDate, endDate] = dateRange;
        const range = endDate - startDate; // duração em milissegundos
        const newEndDate = new Date(startDate);
        newEndDate.setMilliseconds(newEndDate.getMilliseconds() - 1); // um milissegundo antes do início atual
        const newStartDate = new Date(newEndDate - range); // mesmo intervalo de tempo
        comparisonDateRange = [newStartDate, newEndDate];
      }
    } 
    // Período de comparação específico
    else if (comparisonPeriod === "sameLastYear") {
      if (dateRange) {
        const [startDate, endDate] = dateRange;
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        newEndDate.setFullYear(newEndDate.getFullYear() - 1);
        comparisonDateRange = [newStartDate, newEndDate];
      } else if (timeFrame !== "all") {
        comparisonTimeFrameValue = timeFrame;
        const today = new Date();
        today.setFullYear(today.getFullYear() - 1);
        // Usamos a mesma lógica, mas a partir de um ano atrás
      }
    }

    return filterRecordsByPeriod(
      studyRecords, 
      subjectFilter, 
      comparisonDateRange, 
      comparisonPeriod === "sameLastYear" ? comparisonTimeFrameValue : "all"
    );
  }, [studyRecords, subjectFilter, dateRange, timeFrame, compareMode, comparisonPeriod]);

  // Função para calcular métricas a partir de registros
  const calculateMetrics = (records) => {
    // Proteção contra registros inválidos
    if (!records || !Array.isArray(records)) {
      console.error("Registros inválidos em calculateMetrics:", records);
      return {
        totalTimeInMinutes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        avgTimePerDay: 0,
        avgQuestionsPerDay: 0,
        avgAccuracy: 0,
        subjectDistribution: [],
        timeDistribution: [],
        studyDays: 0
      };
    }

    const totalTimeInMinutes = records.reduce((total, record) => total + getTotalMinutes(record), 0);
    const totalQuestions = records.reduce((total, record) => total + (record.questions || 0), 0);
    const totalCorrect = records.reduce((total, record) => total + (record.correctAnswers || 0), 0);

    // Calcular média de tempo por dia usando datas únicas
    const uniqueDates = [...new Set(records
      .filter(r => r.date) // Filtrar registros sem data
      .map(r => {
        const date = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
        return date;
      }))];
    const avgTimePerDay = uniqueDates.length > 0 ? Math.round(totalTimeInMinutes / uniqueDates.length) : 0;

    // Distribuição por matéria
    const subjectGroups = {};
    records.forEach(record => {
      if (!record.date || !record.subject) return; // Pular registros inválidos
      
      const date = typeof record.date === 'string' 
        ? record.date.split('T')[0] 
        : new Date(record.date).toISOString().split('T')[0];

      if (!subjectGroups[record.subject]) {
        subjectGroups[record.subject] = {
          subject: record.subject,
          totalTime: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          days: new Set()
        };
      }
      subjectGroups[record.subject].totalTime += getTotalMinutes(record);
      subjectGroups[record.subject].totalQuestions += (record.questions || 0);
      subjectGroups[record.subject].totalCorrect += (record.correctAnswers || 0);
      subjectGroups[record.subject].days.add(date);
    });

    // ... rest of the code ...

    return {
      totalTimeInMinutes,
      totalQuestions,
      totalCorrect,
      avgTimePerDay,
      avgQuestionsPerDay: totalQuestions / uniqueDates.length,
      avgAccuracy: totalCorrect > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      subjectDistribution: Object.values(subjectGroups),
      timeDistribution: [],
      studyDays: uniqueDates.length
    };
  };

  // Calcular métricas derivadas para o período atual
  const derivedMetrics = useMemo(() => {
    return calculateMetrics(filteredRecords);
  }, [filteredRecords]);

  // Calcular métricas derivadas para o período de comparação
  const comparisonMetrics = useMemo(() => {
    if (!compareMode || comparisonRecords.length === 0) return null;
    return calculateMetrics(comparisonRecords);
  }, [compareMode, comparisonRecords]);

  // Função para processar dados de gráficos com base em registros
  const processChartData = (records, cycle, isRoundFilter = false) => {
    // Proteção contra registros inválidos
    if (!records || !Array.isArray(records)) {
      console.error("Registros inválidos em processChartData:", records);
      return {
        timeBySubject: [],
        timeByDay: [],
        accuracyBySubject: [],
        questionsData: []
      };
    }

    // Agrupar por matéria
    const subjectGroups = {};
    records.forEach(record => {
      if (!record.subject) return; // Pular registros sem matéria
      
      if (!subjectGroups[record.subject]) {
        subjectGroups[record.subject] = {
          subject: record.subject,
          totalTime: 0,
          totalQuestions: 0,
          correctAnswers: 0
        };
      }
      
      subjectGroups[record.subject].totalTime += getTotalMinutes(record);
      subjectGroups[record.subject].totalQuestions += (record.questions || 0);
      subjectGroups[record.subject].correctAnswers += (record.correctAnswers || 0);
    });

    // Converter para arrays para os gráficos
    const timeBySubject = Object.entries(subjectGroups).map(([subject, data]) => ({
      subject,
      time: data.totalTime,
      timeFormatted: formatMinutesToHoursMinutes(data.totalTime)
    }));

    // Agrupar por dia
    const dayGroups = {};
    records.forEach(record => {
      if (!record.date) return; // Pular registros sem data
      
      const date = typeof record.date === 'string' 
        ? record.date.split('T')[0] 
        : new Date(record.date).toISOString().split('T')[0];

      if (!dayGroups[date]) {
        dayGroups[date] = {
          date,
          totalTime: 0,
          totalQuestions: 0,
          correctAnswers: 0
        };
      }
      
      dayGroups[date].totalTime += getTotalMinutes(record);
      dayGroups[date].totalQuestions += (record.questions || 0);
      dayGroups[date].correctAnswers += (record.correctAnswers || 0);
    });

    // Converter para array e ordenar por data
    const timeByDay = Object.values(dayGroups)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        date: day.date,
        time: day.totalTime,
        timeFormatted: formatMinutesToHoursMinutes(day.totalTime),
        questions: day.totalQuestions,
        correctAnswers: day.correctAnswers
      }));

    // Calcular taxa de acerto por matéria
    const accuracyBySubject = Object.values(subjectGroups)
      .map(data => ({
        subject: data.subject,
        accuracy: data.totalQuestions > 0 
          ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
          : 0
      }));

    // Dados de questões
    const questionsData = Object.values(subjectGroups)
      .map(data => ({
        subject: data.subject,
        total: data.totalQuestions,
        correct: data.correctAnswers
      }));

    return {
      timeBySubject,
      timeByDay,
      accuracyBySubject,
      questionsData
    };
  };

  // Dados para os gráficos do período atual
  const chartData = useMemo(() => {
    // O filtro de rodada já foi aplicado aos registros filtrados
    // Precisamos apenas ajustar o cálculo do progresso quando estamos em uma rodada específica
    const isRoundFilter = cycleRound !== "all";
    
    // Processa os dados usando os registros já filtrados
    const data = processChartData(filteredRecords, studyCycle, isRoundFilter);
    
    if (isRoundFilter) {
      console.log("Dados dos gráficos processados para rodada específica:", data);
    } else {
      console.log("Dados dos gráficos processados (todas rodadas):", data);
    }
    
    return data;
  }, [filteredRecords, studyCycle, cycleRound]);

  // Dados para os gráficos do período de comparação
  const comparisonChartData = useMemo(() => {
    if (!compareMode || comparisonRecords.length === 0) return null;
    return processChartData(comparisonRecords, studyCycle, cycleRound !== "all");
  }, [compareMode, comparisonRecords, studyCycle, cycleRound]);

  // Dados para comparação combinada
  const combinedChartData = useMemo(() => {
    if (!compareMode || !comparisonChartData) return null;
    
    // Comparação por disciplina
    const subjectComparison = uniqueSubjects.map(subject => {
      const currentData = chartData.timeBySubject.find(item => item.subject === subject) || { 
        subject, 
        time: 0, 
        timeFormatted: formatMinutesToHoursMinutes(0)
      };
      
      const prevData = comparisonChartData.timeBySubject.find(item => item.subject === subject) || { 
        subject, 
        time: 0, 
        timeFormatted: formatMinutesToHoursMinutes(0)
      };
      
      const timeChange = currentData.time - prevData.time;
      const percentChange = prevData.time > 0 
        ? Math.round((timeChange / prevData.time) * 100) 
        : currentData.time > 0 ? 100 : 0;
      
      return {
        subject,
        current: currentData.time,
        previous: prevData.time,
        currentDisplay: currentData.timeFormatted,
        previousDisplay: prevData.timeFormatted,
        change: timeChange,
        percentChange: percentChange,
        changeDisplay: `${percentChange > 0 ? '+' : ''}${percentChange}%`,
        positive: percentChange >= 0,
        currentAccuracy: chartData.accuracyBySubject.find(item => item.subject === subject)?.accuracy || 0,
        previousAccuracy: comparisonChartData.accuracyBySubject.find(item => item.subject === subject)?.accuracy || 0
      };
    });
    
    // Comparação por dia da semana
    const dayOfWeekComparison = Array(7).fill().map((_, i) => {
      const current = chartData.timeByDay[i];
      const previous = comparisonChartData.timeByDay[i];
      
      return {
        name: current.date,
        current: current.time,
        previous: previous.time,
        currentDisplay: current.timeFormatted,
        previousDisplay: previous.timeFormatted,
        change: current.time - previous.time,
        percentChange: previous.time > 0 
          ? Math.round(((current.time - previous.time) / previous.time) * 100) 
          : current.time > 0 ? 100 : 0
      };
    });
    
    return {
      subjectComparison,
      dayOfWeekComparison
    };
  }, [compareMode, chartData, comparisonChartData, uniqueSubjects]);

  // Configuração das colunas da tabela
  const columns = [
    { 
      title: "Data", 
      dataIndex: "date", 
      key: "date",
      render: (text) => new Date(text).toLocaleDateString('pt-BR'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    { 
      title: "Disciplina", 
      dataIndex: "subject", 
      key: "subject",
      render: (text) => <Tag color="blue">{text}</Tag>,
      filters: uniqueSubjects.map(subject => ({ text: subject, value: subject })),
      onFilter: (value, record) => record.subject === value
    },
    { 
      title: "Tipo", 
      dataIndex: "source", 
      key: "source",
      render: (text) => {
        let color = 'default';
        switch(text) {
          case 'Gran Cursos': color = 'purple'; break;
          case 'Manual': color = 'green'; break;
          default: color = 'default';
        }
        return <Tag color={color}>{text || 'Outros'}</Tag>;
      }
    },
    { 
      title: "Tempo", 
      dataIndex: "timeSpent", 
      key: "timeSpent",
      render: (minutes) => formatMinutesToHoursMinutes(minutes),
      sorter: (a, b) => (a.timeSpent || 0) - (b.timeSpent || 0)
    },
    { 
      title: "Questões", 
      dataIndex: "questions", 
      key: "questions",
      sorter: (a, b) => (a.questions || 0) - (b.questions || 0)
    },
    { 
      title: "Acertos", 
      dataIndex: "correctAnswers", 
      key: "correctAnswers",
      render: (text, record) => {
        if (!text || !record.questions) return text || 0;
        const percentage = Math.round((text / record.questions) * 100);
        return (
          <AntTooltip title={`${percentage}% de acerto`}>
            <span>{text} <Progress type="circle" percent={percentage} width={20} /></span>
          </AntTooltip>
        );
      },
      sorter: (a, b) => (a.correctAnswers || 0) - (b.correctAnswers || 0)
    },
    { 
      title: "Tópico", 
      dataIndex: "topic", 
      key: "topic",
      render: (text) => text && <Tag>{text}</Tag>
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (text) => text && (
        <AntTooltip title={text}>
          <InfoCircleOutlined />
        </AntTooltip>
      )
    }
  ];

  // Cores para os gráficos
  const COLORS = ["#1890ff", "#52c41a", "#fa8c16", "#722ed1", "#eb2f96", "#13c2c2", "#faad14", "#ff4d4f", "#2f54eb", "#fa541c"];
  const COMPARISON_COLORS = {
    current: "#1890ff",
    previous: "#8bbdff",
    positive: "#52c41a",
    negative: "#ff4d4f",
    neutral: "#d9d9d9"
  };

  return (
    <div className="fade-in">
      {/* Seção de Filtros */}
      <div className="filter-section">
        <Select
          style={{ width: 200 }}
          value={subjectFilter}
          onChange={setSubjectFilter}
          placeholder="Filtrar por matéria"
        >
          <Option value="all">Todas as matérias</Option>
          {uniqueSubjects.map(subject => (
            <Option key={subject} value={subject}>{subject}</Option>
          ))}
        </Select>
        
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 300 }}
        />
        
        <Select
          style={{ width: 150 }}
          value={timeFrame}
          onChange={setTimeFrame}
        >
          <Option value="all">Todo período</Option>
          <Option value="today">Hoje</Option>
          <Option value="week">Esta semana</Option>
          <Option value="month">Este mês</Option>
        </Select>
      </div>

      {/* Cards de Estatísticas */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stats-card">
            <Statistic
              title="Total de Horas"
              value={Math.floor(derivedMetrics.totalTimeInMinutes / 60)}
              suffix="h"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stats-card">
            <Statistic
              title="Matérias Estudadas"
              value={uniqueSubjects.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stats-card">
            <Statistic
              title="Questões Resolvidas"
              value={derivedMetrics.totalQuestions}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-card stats-card">
            <Statistic
              title="Meta Diária"
              value={derivedMetrics.avgTimePerDay}
              suffix="h"
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card className="dashboard-card" title="Horas por Matéria">
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData.timeBySubject}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <Tooltip formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]} />
                  <Bar dataKey="time" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="dashboard-card" title="Distribuição do Tempo">
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData.timeByDay}
                    dataKey="time"
                    nameKey="date"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({date}) => date}
                  >
                    {chartData.timeByDay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabela de Registros */}
      <Card className="dashboard-card" title="Registros de Estudo">
        <Table
          dataSource={filteredRecords}
          columns={columns}
          rowKey={(record) => record.id}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}