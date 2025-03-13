import React from "react";
import { Card, Statistic, Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Text } = Typography;

function StatisticCard({ 
  title, 
  value, 
  prefix, 
  suffix, 
  icon, 
  color = "#1890ff",
  compareValue = null,
  previousValue = null,
  increasing = true,
  precision = 0,
  formatter = null,
  style = {},
  valueStyle = {}
}) {
  // Calcular mudança percentual
  const calculateChange = () => {
    if (previousValue === null || previousValue === 0) return null;
    const change = value - previousValue;
    const percentChange = previousValue !== 0 
      ? Math.round((change / previousValue) * 100) 
      : value > 0 ? 100 : 0;
    
    return {
      raw: change,
      percent: percentChange,
      display: `${percentChange > 0 ? '+' : ''}${percentChange}%`,
      positive: percentChange >= 0
    };
  };

  const change = compareValue ? null : calculateChange();
  
  return (
    <Card 
      bordered={false} 
      className="stat-card" 
      style={{ 
        "--start-color": color,
        "--end-color": color === "#3366CC" ? "#4C9AFF" : color === "#36B37E" ? "#00875A" : color === "#FFAB00" ? "#FF8B00" : color === "#6554C0" ? "#8777D9" : color,
        background: `linear-gradient(135deg, var(--start-color) 0%, var(--end-color) 100%)`,
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
        ...style
      }}
    >
      <div className="stat-icon-bg" style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.15, fontSize: "120px", color: "#fff" }}>
        {icon}
      </div>
      <Statistic
        title={<Text strong style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "16px" }}>{title}</Text>}
        value={value}
        precision={precision}
        formatter={formatter}
        valueStyle={{ 
          color: "#fff", 
          fontSize: "28px", 
          fontWeight: "bold",
          ...valueStyle
        }}
        prefix={prefix}
        suffix={suffix}
      />
      
      {compareValue && (
        <div style={{ marginTop: "8px" }}>
          <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px" }}>
            {compareValue}
          </Text>
        </div>
      )}
      
      {change !== null && (
        <div style={{ marginTop: "8px" }}>
          <Text style={{ 
            color: change.positive ? "rgba(255, 255, 255, 0.85)" : "#ffccc7", 
            fontSize: "13px" 
          }}>
            {change.positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {change.display}
            <span style={{ marginLeft: "5px", opacity: 0.85 }}>{`(${previousValue} antes)`}</span>
          </Text>
        </div>
      )}
    </Card>
  );
}

export default StatisticCard;