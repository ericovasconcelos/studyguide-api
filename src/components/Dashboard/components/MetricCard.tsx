import React from 'react';
import { Card, Typography, Tooltip } from 'antd';

const { Title, Text } = Typography;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  tooltip: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  tooltip
}) => {
  return (
    <Card 
      className="h-full shadow-sm hover:shadow-md transition-shadow"
      style={{ background: '#fff' }}
    >
      <Tooltip title={tooltip}>
        <div className="p-2">
          <Text type="secondary" className="block mb-2">{title}</Text>
          <Title level={3} className="mb-1">
            <span className="mr-2" style={{ color: iconColor }}>{icon}</span>
            {value}
          </Title>
          <Text type="secondary" className="block">{subtitle}</Text>
        </div>
      </Tooltip>
    </Card>
  );
};

export default MetricCard; 