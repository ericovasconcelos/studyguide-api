import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { Study } from '../types';
import { formatMinutesToHoursMinutes } from '../../../utils/timeUtils';
import styled from 'styled-components';

const { Text } = Typography;

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 0;
  overflow-x: auto;
  width: 100%;
`;

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(80px, 1fr)) 100px;
  gap: 4px;
  align-items: center;
  min-width: min-content;
`;

const HeaderCell = styled.div`
  text-align: center;
  color: #666;
  font-weight: bold;
  padding: 0 4px;
`;

const HeaderRow = styled(WeekRow)`
  margin-bottom: 8px;
`;

const DayCell = styled.div<{ size: number }>`
  position: relative;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${props => Math.min(Math.max(props.size * 80, 20), 45)}px;
    height: ${props => Math.min(Math.max(props.size * 80, 20), 45)}px;
    background-color: ${props => props.size === 0 ? '#f0f0f0' : '#e6f4ff'};
    border-radius: 50%;
    z-index: 0;
  }
`;

const DayText = styled(Text)<{ isCurrentWeek?: boolean }>`
  position: relative;
  z-index: 1;
  font-weight: ${props => props.isCurrentWeek ? 'bold' : 'normal'};
  color: ${props => props.isCurrentWeek ? '#1890ff' : 'inherit'};
  font-size: 12px;
`;

const TotalCell = styled.div`
  padding: 0 8px;
  border-left: 1px solid #f0f0f0;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

interface WeeklyVolumeChartProps {
  studyRecords: Study[];
  selectedSubject?: string;
  selectedCycleId?: string | number;
  selectedRound?: number;
}

interface WeekData {
  startDate: Date;
  days: {
    date: string;
    timeSpent: number;
    studies: Array<{
      subject: string;
      timeSpent: number;
    }>;
  }[];
  total: number;
}

const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({ 
  studyRecords,
  selectedSubject,
  selectedCycleId,
  selectedRound
}) => {
  const filteredRecords = useMemo(() => {
    return studyRecords.filter(record => {
      if (selectedSubject && record.subject !== selectedSubject) return false;
      if (selectedCycleId && record.cycleId !== selectedCycleId) return false;
      if (selectedRound && record.round !== selectedRound) return false;
      return true;
    });
  }, [studyRecords, selectedSubject, selectedCycleId, selectedRound]);

  const weeksData = useMemo(() => {
    const now = new Date();
    const today = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - today + (today === 0 ? -6 : 1)); // Ajusta para começar na segunda
    startOfWeek.setHours(0, 0, 0, 0);

    // Encontra a data mais antiga dos registros
    const oldestRecord = filteredRecords.reduce((oldest, record) => {
      const recordDate = new Date(record.date);
      return recordDate < oldest ? recordDate : oldest;
    }, now);

    const weeks: WeekData[] = [];
    let currentStart = new Date(startOfWeek);

    while (currentStart >= oldestRecord) {
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentStart);
        date.setDate(currentStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = filteredRecords.filter(r => r.date.startsWith(dateStr));
        const timeSpent = dayRecords.reduce((sum, r) => sum + r.timeSpent, 0);
        
        // Agrupa estudos por matéria
        const studiesBySubject = dayRecords.reduce((acc, record) => {
          const existing = acc.find(s => s.subject === record.subject);
          if (existing) {
            existing.timeSpent += record.timeSpent;
          } else {
            acc.push({ subject: record.subject, timeSpent: record.timeSpent });
          }
          return acc;
        }, [] as Array<{ subject: string; timeSpent: number; }>);
        
        return { 
          date: dateStr, 
          timeSpent,
          studies: studiesBySubject
        };
      });

      const total = weekDays.reduce((sum, day) => sum + day.timeSpent, 0);

      weeks.push({
        startDate: new Date(currentStart),
        days: weekDays,
        total
      });

      // Move para a semana anterior
      currentStart.setDate(currentStart.getDate() - 7);
    }

    return weeks;
  }, [filteredRecords]);

  // Encontra o maior tempo diário para calcular proporções
  const maxDayTime = useMemo(() => {
    return Math.max(
      ...filteredRecords.map(r => r.timeSpent),
      60 // Mínimo de 1 hora para evitar círculos muito pequenos
    );
  }, [filteredRecords]);

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const formatTooltip = (day: WeekData['days'][0], weekDay: string) => {
    if (day.timeSpent === 0) return `${weekDay} - Nenhum estudo registrado`;
    
    return `${weekDay} - ${day.date}
${day.studies.map(study => 
  `${study.subject}: ${formatMinutesToHoursMinutes(study.timeSpent)}`
).join('\n')}
Total: ${formatMinutesToHoursMinutes(day.timeSpent)}`;
  };

  return (
    <Card 
      title="Volume Semanal" 
      className="shadow-sm"
      style={{ background: '#fff' }}
    >
      <GridContainer>
        <HeaderRow>
          {weekDays.map(day => (
            <HeaderCell key={day}>{day}</HeaderCell>
          ))}
          <HeaderCell>Total</HeaderCell>
        </HeaderRow>

        {weeksData.map((week, weekIndex) => (
          <WeekRow key={week.startDate.toISOString()}>
            {week.days.map((day, dayIndex) => (
              <DayCell 
                key={day.date} 
                size={day.timeSpent / maxDayTime}
                title={formatTooltip(day, weekDays[dayIndex])}
              >
                <DayText isCurrentWeek={weekIndex === 0}>
                  {formatMinutesToHoursMinutes(day.timeSpent)}
                </DayText>
              </DayCell>
            ))}
            <TotalCell>
              <DayText isCurrentWeek={weekIndex === 0}>
                {formatMinutesToHoursMinutes(week.total)}
              </DayText>
            </TotalCell>
          </WeekRow>
        ))}
      </GridContainer>
    </Card>
  );
};

export default WeeklyVolumeChart; 