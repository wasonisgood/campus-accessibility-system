import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SpeechControls from './SpeechControls';

const MonthlyTrendChart = ({ data }) => {
  // Calculate important metrics
  const total = data.reduce((sum, month) => sum + month.total, 0);
  const maxMonth = data.reduce((max, month) => month.total > max.total ? month : max, data[0]);
  const minMonth = data.reduce((min, month) => month.total < min.total ? month : min, data[0]);
  
  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, month) => sum + month.total, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, month) => sum + month.total, 0) / secondHalf.length;
  
  const trendDirection = secondHalfAvg > firstHalfAvg ? '上升' : '下降';
  const trendPercentage = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1);

  // Prepare speech segments
  const speechSegments = [
    {
      title: '圖表概覽',
      text: `月度問題趨勢分析顯示了各月份不同嚴重程度問題的數量變化。全年總計${total}個問題。`,
      type: 'heading'
    },
    {
      title: '趨勢分析',
      text: `整體趨勢${trendDirection}了${trendPercentage}%。`,
      type: 'stat'
    },
    {
      title: '最高峰',
      text: `${maxMonth.name}的問題數最多，有${maxMonth.total}個問題。`,
      type: 'detail'
    },
    {
      title: '最低點',
      text: `${minMonth.name}的問題數最少，有${minMonth.total}個問題。`,
      type: 'detail'
    },
    ...data.map(month => ({
      title: `${month.name}數據`,
      text: `${month.name}總共有${month.total}個問題，其中嚴重問題${month.critical}個，主要問題${month.major}個，中度問題${month.moderate}個，輕微問題${month.minor}個。`,
      type: 'detail'
    }))
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2 className="chart-title">月度問題趨勢</h2>
        <SpeechControls 
          segments={speechSegments}
          title="月度趨勢語音導覽"
        />
      </div>
      <div className="chart-container large">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="critical" name="嚴重" stackId="a" fill="#EF4444" />
            <Bar dataKey="major" name="主要" stackId="a" fill="#F97316" />
            <Bar dataKey="moderate" name="中度" stackId="a" fill="#F59E0B" />
            <Bar dataKey="minor" name="輕微" stackId="a" fill="#84CC16" />
            <Line type="monotone" dataKey="total" name="總計" stroke="#3B82F6" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyTrendChart;