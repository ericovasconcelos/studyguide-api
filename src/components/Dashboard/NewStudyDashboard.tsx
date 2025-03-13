import React, { useMemo, useState } from 'react';
import { Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  BookOutlined,
  FireOutlined
} from '@ant-design/icons';
import { formatMinutesToHoursMinutes } from '../../utils/timeUtils';
import { Study, StudyCycle, StudyMetrics } from './types';
import MetricCard from './components/MetricCard';
import StudyTimeChart from './components/StudyTimeChart';
import AccuracyChart from './components/AccuracyChart';
import WeeklyVolumeChart from './components/WeeklyVolumeChart';
import MonthlyProgressChart from './components/MonthlyProgressChart';
import DashboardFilters from './components/DashboardFilters';

// Cores para os gráficos
const COLORS = [
  '#1890ff', '#52c41a', '#fa8c16', '#722ed1', 
  '#eb2f96', '#13c2c2', '#faad14', '#ff4d4f'
];

interface DashboardProps {
  studyRecords: Study[];
  studyCycle?: StudyCycle;
  studyCycles?: StudyCycle[];
  setIsModalVisible?: (visible: boolean) => void;
  setIsCycleModalVisible?: (visible: boolean) => void;
}

export const NewStudyDashboard: React.FC<DashboardProps> = ({
  studyRecords,
  studyCycle,
  studyCycles,
  setIsModalVisible,
  setIsCycleModalVisible
}) => {
  // Estados
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [selectedCycleId, setSelectedCycleId] = useState<string | number>('all');
  const [selectedRound, setSelectedRound] = useState<number>(0);

  // Lista de matérias únicas
  const uniqueSubjects = useMemo(() => {
    const subjects = studyRecords.map(record => record.subject);
    return Array.from(new Set(subjects));
  }, [studyRecords]);

  // Lista de rodadas únicas
  const uniqueRounds = useMemo(() => {
    const rounds = studyRecords
      .map(record => record.round)
      .filter((round): round is number => round !== undefined);
    return Array.from(new Set(rounds)).sort((a, b) => a - b);
  }, [studyRecords]);

  // Cálculo de métricas
  const calculateMetrics = (records: Study[]): StudyMetrics => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      return {
        totalTimeInMinutes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        avgTimePerDay: 0,
        studyDays: 0,
        currentStreak: 0,
        subjectPerformance: {}
      };
    }

    // Agrupa registros por data para contar dias únicos
    const dates = records.map(r => r.date.split('T')[0]);
    const uniqueDates = Array.from(new Set(dates));

    // Calcula streak atual
    const sortedDates = uniqueDates.sort();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const previousDate = i > 0 ? sortedDates[i - 1] : null;
      
      if (i === sortedDates.length - 1 && date !== today) {
        break;
      }
      
      if (previousDate) {
        const diffDays = Math.floor(
          (new Date(date).getTime() - new Date(previousDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 1) break;
      }
      
      currentStreak++;
    }

    // Agrupa métricas por matéria
    const subjectPerformance: StudyMetrics['subjectPerformance'] = {};
    records.forEach(record => {
      if (!subjectPerformance[record.subject]) {
        subjectPerformance[record.subject] = {
          timeSpent: 0,
          questions: 0,
          correctAnswers: 0,
          accuracy: 0
        };
      }
      
      subjectPerformance[record.subject].timeSpent += record.timeSpent;
      subjectPerformance[record.subject].questions += record.questions || 0;
      subjectPerformance[record.subject].correctAnswers += record.correctAnswers || 0;
    });

    // Calcula accuracy para cada matéria
    Object.values(subjectPerformance).forEach(subject => {
      subject.accuracy = subject.questions > 0 
        ? (subject.correctAnswers / subject.questions) * 100 
        : 0;
    });

    const totalTime = records.reduce((sum, record) => sum + record.timeSpent, 0);
    const avgTime = uniqueDates.length > 0 
      ? Math.round(totalTime / uniqueDates.length) 
      : 0;

    return {
      totalTimeInMinutes: totalTime,
      totalQuestions: records.reduce((sum, record) => sum + (record.questions || 0), 0),
      totalCorrect: records.reduce((sum, record) => sum + (record.correctAnswers || 0), 0),
      avgTimePerDay: avgTime,
      studyDays: uniqueDates.length,
      currentStreak,
      subjectPerformance
    };
  };

  // Filtra registros baseado nos filtros selecionados
  const filteredRecords = useMemo(() => {
    return studyRecords.filter(record => {
      // Filtro de matéria
      if (subjectFilter !== 'all' && record.subject !== subjectFilter) {
        return false;
      }
      
      // Filtro de ciclo
      if (selectedCycleId !== 'all' && record.cycleId !== selectedCycleId) {
        return false;
      }

      // Filtro de rodada
      if (selectedRound !== 0 && record.round !== selectedRound) {
        return false;
      }
      
      // Filtro de data
      if (dateRange && dateRange[0] && dateRange[1]) {
        const recordDate = new Date(record.date);
        const startDate = dateRange[0].toDate();
        const endDate = dateRange[1].toDate();
        
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [studyRecords, subjectFilter, selectedCycleId, selectedRound, dateRange]);

  // Calcula métricas com os registros filtrados
  const metrics = useMemo(() => {
    const result = calculateMetrics(filteredRecords);
    console.log('Métricas calculadas:', result); // Debug
    return result;
  }, [filteredRecords]);

  return (
    <div className="study-dashboard p-4" style={{ background: '#f0f2f5' }}>
      <DashboardFilters
        subjects={uniqueSubjects}
        selectedSubject={subjectFilter}
        onSubjectChange={setSubjectFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        studyCycles={studyCycles}
        selectedCycleId={selectedCycleId}
        onCycleChange={setSelectedCycleId}
        rounds={uniqueRounds}
        selectedRound={selectedRound}
        onRoundChange={setSelectedRound}
      />

      {/* Seção de Métricas Principais */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Tempo Total"
            value={formatMinutesToHoursMinutes(metrics.totalTimeInMinutes)}
            subtitle={`${metrics.studyDays} dias de estudo`}
            icon={<ClockCircleOutlined />}
            iconColor="#1890ff"
            tooltip="Tempo total de estudo no período"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Sequência Atual"
            value={`${metrics.currentStreak} dias`}
            subtitle="Mantenha o ritmo!"
            icon={<FireOutlined />}
            iconColor="#fa8c16"
            tooltip="Sequência atual de dias estudando"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Questões"
            value={metrics.totalQuestions}
            subtitle={metrics.totalQuestions > 0 
              ? `${Math.round((metrics.totalCorrect / metrics.totalQuestions) * 100)}% de acerto`
              : 'Nenhuma questão resolvida'
            }
            icon={<CheckCircleOutlined />}
            iconColor="#52c41a"
            tooltip="Total de questões resolvidas e taxa de acerto"
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="Média Diária"
            value={formatMinutesToHoursMinutes(metrics.avgTimePerDay)}
            subtitle="por dia de estudo"
            icon={<BookOutlined />}
            iconColor="#722ed1"
            tooltip="Média de tempo de estudo por dia"
          />
        </Col>
      </Row>

      {/* Seção de Gráficos de Progresso */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} lg={12}>
          <WeeklyVolumeChart studyRecords={filteredRecords} />
        </Col>
        <Col xs={24} lg={12}>
          <MonthlyProgressChart studyRecords={filteredRecords} />
        </Col>
      </Row>

      {/* Seção de Gráficos de Distribuição */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <StudyTimeChart
            subjectPerformance={metrics.subjectPerformance}
            colors={COLORS}
          />
        </Col>

        <Col xs={24} lg={12}>
          <AccuracyChart
            subjectPerformance={metrics.subjectPerformance}
            colors={COLORS}
          />
        </Col>
      </Row>
    </div>
  );
};

export default NewStudyDashboard; 