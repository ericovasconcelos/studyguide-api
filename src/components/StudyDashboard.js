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
    if (!records || !Array.isArray(records) || records.length === 0) {
      return {
        totalTimeInMinutes: 0,
        avgTimePerSession: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        accuracyRate: 0,
        timeSeriesData: [],
        streak: 0,
        avgTimePerDay: 0,
        studyTypeDistribution: {},
        totalSessions: 0,
        uniqueDays: 0
      };
    }
    
    // Tempo total em minutos
    const totalTimeInMinutes = records.reduce((sum, record) => {
      if (!record || !record.studyTime) {
        console.warn("Registro inválido encontrado:", record);
        return sum;
      }
      
      try {
        const parts = record.studyTime.split(":");
        if (parts.length !== 2) {
          console.warn("Formato de tempo inválido:", record.studyTime);
          return sum;
        }
        
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        if (isNaN(hours) || isNaN(minutes)) {
          console.warn("Valores de tempo não numéricos:", { hours, minutes, original: record.studyTime });
          return sum;
        }
        
        return sum + (hours * 60 + minutes);
      } catch (error) {
        console.error("Erro ao processar tempo de estudo:", error, record);
        return sum;
      }
    }, 0);
    
    // Média de tempo por sessão
    const avgTimePerSession = records.length > 0 
      ? Math.round(totalTimeInMinutes / records.length) 
      : 0;
    
    // Total de questões e acertos
    const totalQuestions = records.reduce((sum, r) => sum + (r.totalExercises || 0), 0);
    const totalCorrect = records.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
    
    // Taxa de acerto
    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    // Média de tempo por dia
    const avgTimePerDay = records.length > 0 ? Math.round(totalTimeInMinutes / [...new Set(records.map(r => r.date.split('T')[0]))].length) : 0;

    // Série temporal de estudos por dia
    const studiesByDay = records.reduce((acc, record) => {
      const date = record.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, time: 0, questions: 0, correct: 0 };
      }
      acc[date].count += 1;
      
      try {
        const parts = record.studyTime.split(":");
        if (parts.length === 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            acc[date].time += hours * 60 + minutes;
          }
        }
      } catch (e) {
        console.warn("Erro ao processar tempo para série temporal:", e);
      }
      
      acc[date].questions += (record.totalExercises || 0);
      acc[date].correct += (record.correctAnswers || 0);
      return acc;
    }, {});
    
    const timeSeriesData = Object.values(studiesByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calcula a sequência atual de dias com estudo
    let streak = 0;
    if (timeSeriesData.length > 0) {
      const sortedDates = timeSeriesData.map(item => new Date(item.date)).sort((a, b) => b - a);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let checkDate = new Date(today);
      for (let date of sortedDates) {
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (date.getTime() < checkDate.getTime()) {
          break;
        }
      }
    }

    // Distribuição de estudo por tipo
    const studyTypeDistribution = records.reduce((acc, record) => {
      const type = record.studyType || "Outros";
      if (!acc[type]) {
        acc[type] = 0;
      }
      const [hours, minutes] = record.studyTime.split(":").map(Number);
      acc[type] += hours * 60 + (minutes || 0);
      return acc;
    }, {});
    
    return {
      totalTimeInMinutes,
      avgTimePerSession,
      totalQuestions,
      totalCorrect,
      accuracyRate,
      timeSeriesData,
      streak,
      avgTimePerDay,
      studyTypeDistribution,
      totalSessions: records.length,
      uniqueDays: [...new Set(records.map(r => r.date.split('T')[0]))].length
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
    if (!records || !Array.isArray(records) || records.length === 0) {
      console.warn("Nenhum registro para processamento de gráficos:", records);
      return {
        studyData: [],
        studyTypeData: [],
        cycleProgress: [],
        studyByDayOfWeek: Array(7).fill().map((_, i) => ({
          name: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i],
          value: 0,
          questions: 0,
          correct: 0,
          sessions: 0
        }))
      };
    }
    
    // Dados de tempo por disciplina
    const studyData = records.reduce((acc, record) => {
      if (!record || !record.subject || !record.studyTime) {
        console.warn("Registro inválido ignorado:", record);
        return acc;
      }
      
      const subject = record.subject;
      const existing = acc.find((item) => item.subject === subject);
      
      // Processar o tempo com tratamento seguro
      let timeInMinutes = 0;
      try {
        const parts = record.studyTime.split(":");
        if (parts.length === 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            timeInMinutes = hours * 60 + minutes;
          }
        }
      } catch (e) {
        console.warn("Erro ao processar tempo para disciplina:", e);
      }

      if (existing) {
        existing.studyTime += timeInMinutes;
        existing.sessions += 1;
        existing.displayTime = formatMinutesToHoursMinutes(existing.studyTime);
        
        // Adicionar dados de questões se existirem
        if (record.totalExercises) {
          existing.questions = (existing.questions || 0) + record.totalExercises;
          existing.correctAnswers = (existing.correctAnswers || 0) + (record.correctAnswers || 0);
        }
      } else {
        acc.push({ 
          subject: subject, 
          studyTime: timeInMinutes, 
          sessions: 1,
          displayTime: formatMinutesToHoursMinutes(timeInMinutes),
          questions: record.totalExercises || 0,
          correctAnswers: record.correctAnswers || 0
        });
      }
      return acc;
    }, []);

    // Ordena por tempo de estudo (decrescente)
    studyData.sort((a, b) => b.studyTime - a.studyTime);
    
    // Calcular taxa de acerto para cada disciplina
    studyData.forEach(item => {
      item.accuracyRate = item.questions > 0 ? Math.round((item.correctAnswers / item.questions) * 100) : 0;
    });
    
    // Dados de tipos de estudo
    const studyTypeData = records.reduce((acc, record) => {
      if (!record || !record.studyTime) {
        return acc;
      }
      
      const type = record.studyType || "Outros";
      const existingType = acc.find((item) => item.studyType === type);
      
      // Processar o tempo com tratamento seguro
      let timeInMinutes = 0;
      try {
        const parts = record.studyTime.split(":");
        if (parts.length === 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            timeInMinutes = hours * 60 + minutes;
          }
        }
      } catch (e) {
        console.warn("Erro ao processar tempo para tipo de estudo:", e);
      }
      
      if (existingType) {
        existingType.count += 1;
        existingType.time += timeInMinutes;
      } else {
        acc.push({ 
          studyType: type, 
          count: 1,
          time: timeInMinutes
        });
      }
      return acc;
    }, []);

    // Distribuição de estudo por dia da semana
    const dayMap = {
      0: "Dom", 
      1: "Seg", 
      2: "Ter", 
      3: "Qua", 
      4: "Qui", 
      5: "Sex", 
      6: "Sáb"
    };
    
    const studyByDayOfWeek = Array(7).fill().map((_, i) => ({
      name: dayMap[i],
      value: 0,
      questions: 0,
      correct: 0,
      sessions: 0
    }));
    
    records.forEach(record => {
      if (!record || !record.date || !record.studyTime) {
        return;
      }
      
      try {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn("Data inválida:", record.date);
          return;
        }
        
        const dayOfWeek = date.getDay();
        
        // Processar o tempo com tratamento seguro
        let timeInMinutes = 0;
        try {
          const parts = record.studyTime.split(":");
          if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            
            if (!isNaN(hours) && !isNaN(minutes)) {
              timeInMinutes = hours * 60 + minutes;
            }
          }
        } catch (e) {
          console.warn("Erro ao processar tempo para dia da semana:", e);
        }
        
        studyByDayOfWeek[dayOfWeek].value += timeInMinutes;
        studyByDayOfWeek[dayOfWeek].questions += (record.totalExercises || 0);
        studyByDayOfWeek[dayOfWeek].correct += (record.correctAnswers || 0);
        studyByDayOfWeek[dayOfWeek].sessions += 1;
      } catch (error) {
        console.error("Erro ao processar registro para dia da semana:", error, record);
      }
    });
    
    // Progresso do ciclo
    const cycleProgress = Array.isArray(cycle) ? cycle.map(item => {
      if (!item || !item.subject) {
        console.warn("Item do ciclo inválido:", item);
        return null;
      }
      
      // Filtro mais inteligente que aceita correspondências parciais ou exatas
      const relatedRecords = records.filter(r => {
        if (!r || !r.subject) return false;
        
        // Correspondência exata (case-sensitive)
        if (r.subject === item.subject) return true;
        
        // Correspondência exata (case-insensitive)
        if (r.subject.toLowerCase() === item.subject.toLowerCase()) return true;
        
        // Verificar se o nome da matéria do ciclo está contido no registro
        if (r.subject.toLowerCase().includes(item.subject.toLowerCase())) return true;
        
        // Verificar se o registro está contido no nome da matéria do ciclo
        if (item.subject.toLowerCase().includes(r.subject.toLowerCase())) return true;
        
        // Sem correspondência
        return false;
      });
      
      console.log("Registros para", item.subject, ":", relatedRecords);
      const totalTime = relatedRecords.reduce((sum, r) => {
        if (!r || !r.studyTime) return sum;
        
        // Processar o tempo com tratamento seguro
        try {
          const parts = r.studyTime.split(":");
          if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            
            if (!isNaN(hours) && !isNaN(minutes)) {
              return sum + (hours * 60 + minutes);
            }
          }
        } catch (e) {
          console.warn("Erro ao processar tempo para progresso do ciclo:", e);
        }
        
        return sum;
      }, 0);
      
      // Porcentagem de progresso estimada
      // Log para depuração
      console.log("Item do ciclo:", item, "Tempo total acumulado:", totalTime);
      
      // Validar o targetTime
      let targetTime = 600; // 10 horas em minutos como padrão
      
      if (item.targetTime !== undefined && item.targetTime !== null) {
        if (typeof item.targetTime === 'number' && !isNaN(item.targetTime) && item.targetTime > 0) {
          targetTime = item.targetTime;
        } else {
          console.warn("Valor inválido para targetTime:", item.targetTime, "usando padrão:", targetTime);
        }
      } else {
        console.warn("targetTime não definido para:", item.subject, "usando padrão:", targetTime);
      }
      
      // Se estamos filtrando por rodada, a meta de tempo é por rodada, não o total acumulado
      if (isRoundFilter) {
        console.log(`Ajustando meta para ${item.subject} em rodada específica: meta original = ${targetTime} minutos`);
      }
      
      // Calcula a porcentagem de progresso, limitando a 100% no máximo
      const progressPercent = Math.min(Math.floor((totalTime / targetTime) * 100), 100);
      
      // Identificar os nomes das matérias relacionadas para exibição
      const relatedSubjects = [...new Set(relatedRecords.map(r => r.subject))];
      
      return {
        subject: item.subject,
        totalTime,
        targetTime,
        progressPercent,
        displayTime: formatMinutesToHoursMinutes(totalTime),
        relatedSubjects: relatedSubjects.length > 0 ? relatedSubjects : null
      };
    }).filter(Boolean) : [];
    
    return {
      studyData,
      studyTypeData,
      cycleProgress,
      studyByDayOfWeek
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
      const currentData = chartData.studyData.find(item => item.subject === subject) || { 
        subject, 
        studyTime: 0, 
        sessions: 0, 
        questions: 0,
        correctAnswers: 0
      };
      
      const prevData = comparisonChartData.studyData.find(item => item.subject === subject) || { 
        subject, 
        studyTime: 0, 
        sessions: 0,
        questions: 0,
        correctAnswers: 0
      };
      
      const timeChange = currentData.studyTime - prevData.studyTime;
      const percentChange = prevData.studyTime > 0 
        ? Math.round((timeChange / prevData.studyTime) * 100) 
        : currentData.studyTime > 0 ? 100 : 0;
      
      return {
        subject,
        current: currentData.studyTime,
        previous: prevData.studyTime,
        currentDisplay: formatMinutesToHoursMinutes(currentData.studyTime),
        previousDisplay: formatMinutesToHoursMinutes(prevData.studyTime),
        change: timeChange,
        percentChange: percentChange,
        changeDisplay: `${percentChange > 0 ? '+' : ''}${percentChange}%`,
        positive: percentChange >= 0,
        currentSessions: currentData.sessions,
        previousSessions: prevData.sessions,
        currentQuestions: currentData.questions,
        previousQuestions: prevData.questions,
        currentCorrect: currentData.correctAnswers,
        previousCorrect: prevData.correctAnswers,
        currentAccuracy: currentData.questions > 0 ? Math.round((currentData.correctAnswers / currentData.questions) * 100) : 0,
        previousAccuracy: prevData.questions > 0 ? Math.round((prevData.correctAnswers / prevData.questions) * 100) : 0
      };
    });
    
    // Comparação por dia da semana
    const dayOfWeekComparison = Array(7).fill().map((_, i) => {
      const current = chartData.studyByDayOfWeek[i];
      const previous = comparisonChartData.studyByDayOfWeek[i];
      
      return {
        name: current.name,
        current: current.value,
        previous: previous.value,
        currentDisplay: formatMinutesToHoursMinutes(current.value),
        previousDisplay: formatMinutesToHoursMinutes(previous.value),
        change: current.value - previous.value,
        percentChange: previous.value > 0 
          ? Math.round(((current.value - previous.value) / previous.value) * 100) 
          : current.value > 0 ? 100 : 0
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
      dataIndex: "studyType", 
      key: "studyType",
      render: (text) => {
        let color = 'default';
        switch(text) {
          case 'Teoria': color = 'purple'; break;
          case 'Exercícios': color = 'green'; break;
          case 'Revisão': color = 'orange'; break;
          case 'Simulado': color = 'red'; break;
          default: color = 'default';
        }
        return <Tag color={color}>{text || 'Outros'}</Tag>;
      }
    },
    { 
      title: "Tempo", 
      dataIndex: "studyTime", 
      key: "studyTime",
      sorter: (a, b) => {
        try {
          const getMinutes = (timeStr) => {
            if (!timeStr) return 0;
            
            const parts = timeStr.split(":");
            if (parts.length !== 2) return 0;
            
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes)) return 0;
            
            return hours * 60 + minutes;
          };
          
          return getMinutes(a.studyTime) - getMinutes(b.studyTime);
        } catch (e) {
          console.warn("Erro ao ordenar por tempo:", e);
          return 0;
        }
      }
    },
    { 
      title: "Questões", 
      dataIndex: "totalExercises", 
      key: "totalExercises",
      sorter: (a, b) => (a.totalExercises || 0) - (b.totalExercises || 0)
    },
    { 
      title: "Acertos", 
      dataIndex: "correctAnswers", 
      key: "correctAnswers",
      render: (text, record) => {
        if (!text || !record.totalExercises) return text || 0;
        const percentage = Math.round((text / record.totalExercises) * 100);
        return (
          <AntTooltip title={`${percentage}% de acerto`}>
            <span>{text} <Progress type="circle" percent={percentage} width={20} /></span>
          </AntTooltip>
        );
      },
      sorter: (a, b) => (a.correctAnswers || 0) - (b.correctAnswers || 0)
    },
    { 
      title: "Período", 
      dataIndex: "studyPeriod", 
      key: "studyPeriod",
      filters: [
        { text: 'Manhã', value: 'Manhã' },
        { text: 'Tarde', value: 'Tarde' },
        { text: 'Noite', value: 'Noite' }
      ],
      onFilter: (value, record) => record.studyPeriod === value,
      render: (text) => {
        let color = text === 'Manhã' ? 'gold' : text === 'Tarde' ? 'blue' : 'purple';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    { 
      title: "Ciclo", 
      dataIndex: "cycle", 
      key: "cycle" 
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
    <div style={{ padding: "20px", minHeight: "100vh" }}>
      <div style={{ 
        background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <Title level={2} style={{ textAlign: "center", color: "#fff", margin: 0 }}>
          <BookOutlined /> Painel de Estudos Profissional
          {cycleRound !== "all" && (
            <Tag color="blue" style={{ marginLeft: 10, verticalAlign: "middle", fontSize: 14 }}>
              Rodada {cycleRound} {cycleRounds.find(r => r.number.toString() === cycleRound)?.isComplete ? '(completa)' : '(atual)'}
            </Tag>
          )}
        </Title>
        <Paragraph style={{ textAlign: "center", color: "#fff", opacity: 0.8, marginBottom: 0 }}>
          Analise seu desempenho, compare períodos e potencialize sua performance acadêmica
        </Paragraph>
      </div>

      {/* Filtros e Tabs para navegação */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        tabBarGutter={8}
        className="dashboard-tabs"
        tabBarExtraContent={
          <Space>
            <Button 
              type={compareMode ? "primary" : "default"}
              icon={<SwapOutlined />} 
              onClick={() => setCompareMode(!compareMode)}
            >
              {compareMode ? "Desativar Comparação" : "Ativar Comparação"}
            </Button>
          </Space>
        }
      >
        <TabPane tab={<span><FundOutlined /> Dashboard</span>} key="1">
          {/* Filtros */}
          <Card 
            title={<><FileSearchOutlined /> Filtros e Configurações</>} 
            style={{ marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
          >
            <Row gutter={[16,16]}>
              <Col xs={24} md={6}>
                <Text strong>Disciplina</Text>
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
              </Col>
              
              <Col xs={24} md={6}>
                <Text strong>Período</Text>
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
              </Col>
              
              {/* Seletor de rodada do ciclo */}
              {cycleRounds.length > 0 && (
                <Col xs={24} md={6}>
                  <Text strong>Rodada do Ciclo</Text>
                  <Select
                    style={{ width: "100%" }}
                    value={cycleRound}
                    onChange={setCycleRound}
                    placeholder="Selecione uma rodada"
                  >
                    <Option value="all">Todas as rodadas</Option>
                    {cycleRounds.map(round => (
                      <Option key={round.number} value={round.number.toString()}>
                        {round.displayName} {round.id > 1 ? '' : `(Versão: ${round.id})`} {round.isComplete ? '(completa)' : '(atual)'}
                      </Option>
                    ))}
                  </Select>
                  {cycleRound !== "all" && cycleRounds.find(r => r.number.toString() === cycleRound) && (
                    <div style={{ fontSize: "12px", marginTop: "5px", color: "#8c8c8c" }}>
                      <Text type="secondary">
                        {new Date(cycleRounds.find(r => r.number.toString() === cycleRound).startDate).toLocaleDateString()} 
                        {" até "}
                        {new Date(cycleRounds.find(r => r.number.toString() === cycleRound).endDate).toLocaleDateString()}
                      </Text>
                    </div>
                  )}
                </Col>
              )}
              
              <Col xs={24} md={6}>
                <Text strong>Intervalo específico</Text>
                <RangePicker 
                  style={{ width: "100%" }} 
                  onChange={setDateRange}
                  placeholder={['Data inicial', 'Data final']}
                />
              </Col>

              {compareMode && (
                <Col xs={24} md={6}>
                  <Text strong>Comparar com</Text>
                  <Select
                    style={{ width: "100%" }}
                    value={comparisonPeriod}
                    onChange={setComparisonPeriod}
                    placeholder="Período de comparação"
                  >
                    <Option value="previousPeriod">Período anterior</Option>
                    <Option value="sameLastYear">Mesmo período ano anterior</Option>
                  </Select>
                </Col>
              )}
            </Row>

            {compareMode && comparisonRecords.length === 0 && (
              <Alert
                message="Sem dados para comparação"
                description="Não foram encontrados registros para o período de comparação selecionado."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
            
            {cycleRound !== "all" && cycleRounds.length > 0 && (
              <Alert
                message="Dados filtrados por rodada do ciclo"
                description={`Você está visualizando apenas os dados da Rodada ${cycleRound}${cycleRounds.find(r => r.number.toString() === cycleRound)?.isComplete ? ' (completa)' : ' (atual)'}. Todos os gráficos e estatísticas foram ajustados para mostrar apenas os registros desta rodada.`}
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {compareMode && comparisonRecords.length > 0 && (
              <Alert
                message="Modo de comparação ativado"
                description={`Comparando com ${comparisonPeriod === 'previousPeriod' ? 'período anterior' : 'mesmo período do ano anterior'} (${comparisonRecords.length} registros).`}
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

      {/* Estatísticas principais */}
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
            <Statistic
              title={<span style={{ fontSize: "14px", color: "#8c8c8c" }}><BookOutlined /> Total de Sessões</span>}
              value={derivedMetrics.totalSessions}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
              suffix={<small>sessões</small>}
              prefix={compareMode && comparisonMetrics ? (
                <Badge 
                  count={derivedMetrics.totalSessions > comparisonMetrics.totalSessions ? '+' : '-'} 
                  style={{ 
                    backgroundColor: derivedMetrics.totalSessions >= comparisonMetrics.totalSessions ? '#52c41a' : '#ff4d4f',
                    marginRight: '5px'
                  }}
                />
              ) : null}
            />
            {compareMode && comparisonMetrics && (
              <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "5px" }}>
                <span style={{ 
                  color: derivedMetrics.totalSessions > comparisonMetrics.totalSessions ? '#52c41a' : 
                          derivedMetrics.totalSessions < comparisonMetrics.totalSessions ? '#ff4d4f' : '#8c8c8c'
                }}>
                  {derivedMetrics.totalSessions > comparisonMetrics.totalSessions ? '+' : ''}
                  {derivedMetrics.totalSessions - comparisonMetrics.totalSessions} ({comparisonMetrics.totalSessions} antes)
                </span>
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <Progress percent={Math.min(filteredRecords.length * 2, 100)} size="small" status="active" showInfo={false} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
            <Statistic
              title={<span style={{ fontSize: "14px", color: "#8c8c8c" }}><ClockCircleOutlined /> Tempo Total</span>}
              value={Math.floor(derivedMetrics.totalTimeInMinutes / 60)}
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
              suffix={<span>h {derivedMetrics.totalTimeInMinutes % 60}m</span>}
              prefix={compareMode && comparisonMetrics ? (
                <Badge 
                  count={derivedMetrics.totalTimeInMinutes > comparisonMetrics.totalTimeInMinutes ? '+' : '-'} 
                  style={{ 
                    backgroundColor: derivedMetrics.totalTimeInMinutes >= comparisonMetrics.totalTimeInMinutes ? '#52c41a' : '#ff4d4f',
                    marginRight: '5px'
                  }}
                />
              ) : null}
            />
            {compareMode && comparisonMetrics && (
              <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "5px" }}>
                <span style={{ 
                  color: derivedMetrics.totalTimeInMinutes > comparisonMetrics.totalTimeInMinutes ? '#52c41a' : 
                          derivedMetrics.totalTimeInMinutes < comparisonMetrics.totalTimeInMinutes ? '#ff4d4f' : '#8c8c8c'
                }}>
                  {derivedMetrics.totalTimeInMinutes > comparisonMetrics.totalTimeInMinutes ? '+' : ''}
                  {formatMinutesToHoursMinutes(derivedMetrics.totalTimeInMinutes - comparisonMetrics.totalTimeInMinutes)}
                </span>
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <Progress 
                percent={Math.min(derivedMetrics.totalTimeInMinutes / 60, 100)} 
                size="small" 
                status="active" 
                showInfo={false} 
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
            <Statistic
              title={<span style={{ fontSize: "14px", color: "#8c8c8c" }}><TrophyOutlined /> Taxa de Acertos</span>}
              value={derivedMetrics.accuracyRate}
              valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
              suffix="%"
              prefix={compareMode && comparisonMetrics ? (
                <Badge 
                  count={derivedMetrics.accuracyRate > comparisonMetrics.accuracyRate ? '+' : '-'} 
                  style={{ 
                    backgroundColor: derivedMetrics.accuracyRate >= comparisonMetrics.accuracyRate ? '#52c41a' : '#ff4d4f',
                    marginRight: '5px'
                  }}
                />
              ) : null}
            />
            {compareMode && comparisonMetrics && (
              <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "5px" }}>
                <span style={{ 
                  color: derivedMetrics.accuracyRate > comparisonMetrics.accuracyRate ? '#52c41a' : 
                          derivedMetrics.accuracyRate < comparisonMetrics.accuracyRate ? '#ff4d4f' : '#8c8c8c'
                }}>
                  {derivedMetrics.accuracyRate > comparisonMetrics.accuracyRate ? '+' : ''}
                  {derivedMetrics.accuracyRate - comparisonMetrics.accuracyRate}% ({comparisonMetrics.accuracyRate}% antes)
                </span>
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <Progress 
                percent={derivedMetrics.accuracyRate} 
                size="small" 
                status="active" 
                strokeColor={{ from: '#faad14', to: '#fa8c16' }}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}>
            <Statistic
              title={<span style={{ fontSize: "14px", color: "#8c8c8c" }}><FireOutlined /> Sequência Atual</span>}
              value={derivedMetrics.streak}
              valueStyle={{ color: "#f5222d", fontWeight: "bold" }}
              suffix={<small>dias</small>}
              prefix={<FireOutlined />}
            />
            {compareMode && comparisonMetrics && (
              <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "5px" }}>
                <span style={{ 
                  color: derivedMetrics.streak > comparisonMetrics.streak ? '#52c41a' : 
                          derivedMetrics.streak < comparisonMetrics.streak ? '#ff4d4f' : '#8c8c8c'
                }}>
                  {derivedMetrics.streak > comparisonMetrics.streak ? '+' : ''}
                  {derivedMetrics.streak - comparisonMetrics.streak} ({comparisonMetrics.streak} antes)
                </span>
              </div>
            )}
            <div style={{ marginTop: "10px" }}>
              <Progress 
                percent={Math.min(derivedMetrics.streak * 10, 100)} 
                size="small" 
                status="active" 
                strokeColor={{ from: '#ff4d4f', to: '#ff7a45' }}
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Métricas secundárias */}
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col xs={24} md={8}>
          <Card 
            bordered={false} 
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
            title={
              <span>
                <BarChartOutlined /> Sessões por Dia da Semana
              </span>
            }
            extra={
              <Radio.Group 
                value={chartView} 
                onChange={(e) => setChartView(e.target.value)} 
                size="small"
                style={{ display: compareMode ? 'inline-block' : 'none' }}
              >
                <Radio.Button value="bar">Barras</Radio.Button>
                <Radio.Button value="compare">Comparar</Radio.Button>
              </Radio.Group>
            }
          >
            {chartView === 'bar' || !compareMode ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.studyByDayOfWeek} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <Tooltip formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]} />
                  <Bar dataKey="value" fill="#8884d8" name="Tempo" radius={[4, 4, 0, 0]}>
                    {chartData.studyByDayOfWeek.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={combinedChartData.dayOfWeekComparison} 
                  barSize={30}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${Math.floor(value / 60)}h ${value % 60}m`, 
                      name === "current" ? "Período atual" : "Período anterior"
                    ]} 
                  />
                  <Legend payload={[
                    { value: 'Período atual', type: 'square', color: COMPARISON_COLORS.current },
                    { value: 'Período anterior', type: 'square', color: COMPARISON_COLORS.previous }
                  ]} />
                  <Bar dataKey="previous" fill={COMPARISON_COLORS.previous} name="previous" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="current" fill={COMPARISON_COLORS.current} name="current" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            bordered={false} 
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
            title={
              <span>
                <LineChartOutlined /> Tendência de Estudos
              </span>
            }
          >
            {derivedMetrics.timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={derivedMetrics.timeSeriesData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                  />
                  <YAxis tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <Tooltip 
                    formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]}
                    labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString('pt-BR')}`}
                  />
                  <Area type="monotone" dataKey="time" stroke="#1890ff" fillOpacity={1} fill="url(#colorTime)" name="Tempo" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Nenhum dado disponível para o período selecionado" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            bordered={false} 
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
            title={
              <span>
                <PieChartOutlined /> Tipos de Estudo
              </span>
            }
          >
            {chartData.studyTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.studyTypeData}
                    dataKey="time"
                    nameKey="studyType"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    label={({studyType}) => studyType}
                  >
                    {chartData.studyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Nenhum dado disponível para o período selecionado" />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* Gráficos principais */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={compareMode ? 24 : 12}>
          <Card 
            title={
              <span>
                <BarChartOutlined /> Tempo de Estudo por Disciplina
              </span>
            }
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}
            extra={
              compareMode ? (
                <Radio.Group 
                  value={chartView} 
                  onChange={(e) => setChartView(e.target.value)} 
                  size="small"
                >
                  <Radio.Button value="bar">Barras</Radio.Button>
                  <Radio.Button value="compare">Comparar</Radio.Button>
                </Radio.Group>
              ) : null
            }
          >
            {(chartView === 'bar' || !compareMode) && chartData.studyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={chartData.studyData} 
                  layout="vertical"
                  margin={{top: 5, right: 30, left: 50, bottom: 5}}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <YAxis type="category" dataKey="subject" width={120} />
                  <Tooltip 
                    formatter={(value) => [`${Math.floor(value / 60)}h ${value % 60}m`, "Tempo de estudo"]} 
                    labelFormatter={(value) => `Disciplina: ${value}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="studyTime" 
                    fill="#1890ff" 
                    name="Tempo de Estudo" 
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.studyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : compareMode && chartView === 'compare' && combinedChartData ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  layout="vertical"
                  data={combinedChartData.subjectComparison.filter(item => item.current > 0 || item.previous > 0)}
                  margin={{top: 5, right: 30, left: 50, bottom: 5}}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                  <YAxis dataKey="subject" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "current") return [`${Math.floor(value / 60)}h ${value % 60}m`, "Período atual"];
                      if (name === "previous") return [`${Math.floor(value / 60)}h ${value % 60}m`, "Período anterior"];
                      return [`${value}%`, "Variação"];
                    }}
                    labelFormatter={(value) => `Disciplina: ${value}`}
                  />
                  <Legend payload={[
                    { value: 'Período atual', type: 'rect', color: COMPARISON_COLORS.current },
                    { value: 'Período anterior', type: 'rect', color: COMPARISON_COLORS.previous },
                    { value: 'Variação (%)', type: 'line', color: COMPARISON_COLORS.neutral }
                  ]}/>
                  <Bar dataKey="previous" fill={COMPARISON_COLORS.previous} name="previous" barSize={20} />
                  <Bar dataKey="current" fill={COMPARISON_COLORS.current} name="current" barSize={20} />
                  <Scatter 
                    dataKey="percentChange" 
                    fill={COMPARISON_COLORS.neutral} 
                    name="percentChange"
                    shape={(props) => {
                      const { cx, cy, value } = props;
                      const color = value >= 0 ? COMPARISON_COLORS.positive : COMPARISON_COLORS.negative;
                      return (
                        <g>
                          <text 
                            x={cx + 5} 
                            y={cy} 
                            dy={4} 
                            fontSize={11} 
                            fontWeight="bold" 
                            fill={color}
                          >
                            {value >= 0 ? `+${value}%` : `${value}%`}
                          </text>
                        </g>
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Nenhum dado disponível para o período selecionado" />
            )}
          </Card>
        </Col>
        
        {!compareMode && (
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span>
                  <ThunderboltOutlined /> Progresso do Ciclo de Estudos
                </span>
              }
              style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}
            >
                      
              
              {chartData.cycleProgress.length > 0 ? (
                <div style={{ height: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                  {chartData.cycleProgress.map((item, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <Text strong>{item.subject}</Text>
                        <div>
                          <Text type="secondary">
                            {item.displayTime} / {formatMinutesToHoursMinutes(item.targetTime)}
                            {cycleRound !== "all" && (
                              <Tooltip title="Os dados mostram o progresso específico desta rodada em relação à meta por rodada">
                                <InfoCircleOutlined style={{ marginLeft: "8px", color: "#1890ff" }} />
                              </Tooltip>
                            )}
                          </Text>
                        </div>
                      </div>
                      <Progress 
                        percent={item.progressPercent} 
                        strokeColor={
                          item.progressPercent < 30 ? '#ff4d4f' :
                          item.progressPercent < 70 ? '#faad14' : '#52c41a'
                        }
                        status={item.progressPercent >= 100 ? 'success' : 'active'}
                        format={percent => percent + '%'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="Nenhum dado disponível sobre o ciclo de estudos" />
              )}
            </Card>
          </Col>
        )}
        
        {compareMode && combinedChartData && (
          <Col xs={24}>
            <Card 
              title={<span><SwapOutlined /> Análise Comparativa de Desempenho</span>}
              style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}
            >
              <div style={{ marginBottom: '20px' }}>
                <Alert
                  message="Resumo da comparação"
                  description={
                    <div style={{ marginTop: '10px' }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Variação no tempo de estudo"
                            value={derivedMetrics.totalTimeInMinutes - (comparisonMetrics?.totalTimeInMinutes || 0)}
                            precision={0}
                            valueStyle={{ 
                              color: derivedMetrics.totalTimeInMinutes >= (comparisonMetrics?.totalTimeInMinutes || 0) 
                                ? '#52c41a' : '#ff4d4f' 
                            }}
                            prefix={
                              derivedMetrics.totalTimeInMinutes >= (comparisonMetrics?.totalTimeInMinutes || 0) 
                                ? <ArrowUpOutlined /> : <ArrowUpOutlined rotate={180} />
                            }
                            suffix="min"
                          />
                          <Text type="secondary">
                            {Math.abs(Math.round((derivedMetrics.totalTimeInMinutes - (comparisonMetrics?.totalTimeInMinutes || 0)) / 
                            (comparisonMetrics?.totalTimeInMinutes || 1) * 100))}% de variação
                          </Text>
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Variação em dias de estudo"
                            value={derivedMetrics.uniqueDays - (comparisonMetrics?.uniqueDays || 0)}
                            precision={0}
                            valueStyle={{ 
                              color: derivedMetrics.uniqueDays >= (comparisonMetrics?.uniqueDays || 0) 
                                ? '#52c41a' : '#ff4d4f' 
                            }}
                            prefix={
                              derivedMetrics.uniqueDays >= (comparisonMetrics?.uniqueDays || 0) 
                                ? <ArrowUpOutlined /> : <ArrowUpOutlined rotate={180} />
                            }
                            suffix="dias"
                          />
                          <Text type="secondary">
                            {Math.abs(Math.round((derivedMetrics.uniqueDays - (comparisonMetrics?.uniqueDays || 0)) / 
                            (comparisonMetrics?.uniqueDays || 1) * 100))}% de variação
                          </Text>
                        </Col>
                        <Col xs={24} md={8}>
                          <Statistic
                            title="Variação na taxa de acertos"
                            value={derivedMetrics.accuracyRate - (comparisonMetrics?.accuracyRate || 0)}
                            precision={1}
                            valueStyle={{ 
                              color: derivedMetrics.accuracyRate >= (comparisonMetrics?.accuracyRate || 0) 
                                ? '#52c41a' : '#ff4d4f' 
                            }}
                            prefix={
                              derivedMetrics.accuracyRate >= (comparisonMetrics?.accuracyRate || 0) 
                                ? <ArrowUpOutlined /> : <ArrowUpOutlined rotate={180} />
                            }
                            suffix="%"
                          />
                          <Text type="secondary">
                            Período atual: {derivedMetrics.accuracyRate}% / Anterior: {comparisonMetrics?.accuracyRate || 0}%
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              </div>

              <Table
                dataSource={combinedChartData.subjectComparison.filter(item => item.current > 0 || item.previous > 0)}
                columns={[
                  {
                    title: "Disciplina",
                    dataIndex: "subject",
                    key: "subject",
                    render: text => <Tag color="blue">{text}</Tag>,
                  },
                  {
                    title: "Período Atual",
                    dataIndex: "currentDisplay",
                    key: "current",
                    sorter: (a, b) => a.current - b.current,
                  },
                  {
                    title: "Período Anterior",
                    dataIndex: "previousDisplay",
                    key: "previous",
                    sorter: (a, b) => a.previous - b.previous,
                  },
                  {
                    title: "Variação",
                    dataIndex: "changeDisplay",
                    key: "change",
                    render: (text, record) => (
                      <span style={{ color: record.positive ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                        {text}
                      </span>
                    ),
                    sorter: (a, b) => a.percentChange - b.percentChange,
                  },
                  {
                    title: "Acertos Atual",
                    key: "currentAccuracy",
                    render: (_, record) => (
                      record.currentQuestions > 0 ? 
                        <span>{record.currentAccuracy}% ({record.currentCorrect}/{record.currentQuestions})</span> : 
                        <span>-</span>
                    ),
                  },
                  {
                    title: "Acertos Anterior",
                    key: "previousAccuracy",
                    render: (_, record) => (
                      record.previousQuestions > 0 ? 
                        <span>{record.previousAccuracy}% ({record.previousCorrect}/{record.previousQuestions})</span> : 
                        <span>-</span>
                    ),
                  }
                ]}
                pagination={false}
                size="small"
                style={{ marginTop: '20px' }}
              />
            </Card>
          </Col>
        )}
      </Row>
      
      </TabPane>
      <TabPane tab={<span><HistoryOutlined /> Registros</span>} key="2">
        <Card 
          title={<span><BookOutlined /> Histórico Detalhado de Estudos</span>}
          extra={
            <Text type="secondary">
              Total: {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
            </Text>
          }
          style={{ marginBottom: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
        >
          <Table 
            dataSource={filteredRecords} 
            columns={columns} 
            rowKey={(record, index) => index}
            pagination={{ 
              pageSize: 10,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros`,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
            style={{ overflowX: 'auto' }}
            size="middle"
          />
        </Card>
      </TabPane>
      </Tabs>

      {/* Botões de ação */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Button 
          type="primary" 
          size="large" 
          icon={<SettingOutlined />}
          onClick={() => setIsCycleModalVisible(true)} 
          style={{ 
            marginRight: "15px", 
            borderRadius: "6px",
            boxShadow: "0 2px 0 rgba(0,0,0,0.05)",
            height: "40px",
            fontWeight: "500"
          }}
        >
          Gerenciar Ciclo de Estudos
        </Button>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ 
            borderRadius: "6px",
            boxShadow: "0 2px 0 rgba(0,0,0,0.05)",
            height: "40px",
            fontWeight: "500",
            background: "#1890ff",
            color: "#fff"
          }}
        >
          Adicionar Novo Estudo
        </Button>
      </div>

      {/* Cartões de dicas */}
      <Row gutter={[16, 16]} style={{ marginTop: "30px" }}>
        <Col xs={24} md={8}>
          <Card 
            title={<span style={{ color: "#1890ff" }}><TrophyOutlined /> Dica de Estudo</span>}
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
          >
            <Paragraph>
              <strong>Técnica Pomodoro</strong>: Estude por 25 minutos e descanse por 5 minutos. 
              Após 4 ciclos, faça uma pausa maior de 15-30 minutos. 
              Esta técnica ajuda a manter o foco e prevenir a fadiga mental.
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title={<span style={{ color: "#52c41a" }}><CheckCircleOutlined /> Disciplina Recomendada</span>}
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
          >
            {chartData.cycleProgress.length > 0 ? (
              <Paragraph>
                Baseado nos seus dados de progresso, considere focar em <Tag color="blue">
                  {chartData.cycleProgress.sort((a, b) => a.progressPercent - b.progressPercent)[0]?.subject || "Nenhuma disciplina"}
                </Tag> que está com o menor progresso no ciclo atual.
              </Paragraph>
            ) : (
              <Empty description="Adicione disciplinas ao seu ciclo" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title={<span style={{ color: "#fa8c16" }}><ArrowUpOutlined /> Estatísticas de Melhoria</span>}
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)" }}
          >
            {filteredRecords.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <Text>Média de tempo por sessão:</Text>
                  <Text strong>{Math.floor(derivedMetrics.avgTimePerSession / 60)}h {derivedMetrics.avgTimePerSession % 60}m</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <Text>Média de questões por sessão:</Text>
                  <Text strong>{Math.round(derivedMetrics.totalQuestions / filteredRecords.length)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Regularidade semanal:</Text>
                  <Text strong>{chartData.studyByDayOfWeek.filter(day => day.value > 0).length}/7 dias</Text>
                </div>
              </div>
            ) : (
              <Empty description="Sem dados suficientes para análise" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}