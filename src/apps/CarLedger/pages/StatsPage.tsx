import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCarLedgerStore } from '../CarLedgerStore';

interface StatsPageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

export const StatsPage: React.FC<StatsPageProps> = ({ store }) => {
  const [months, setMonths] = useState<number>(3);

  const chartData = useMemo(() => store.getChartData(months), [store, months]);

  const { totalCost, totalMileage, avgEfficiency, fuelCount } = useMemo(() => {
    let tCost = 0;
    let tMileage = 0;
    let effSum = 0;
    let effCount = 0;

    chartData.forEach(d => {
      tCost += d.totalCost;
      tMileage += d.mileage;
      if (d.efficiency > 0) {
        effSum += d.efficiency;
        effCount++;
      }
    });

    // To count fuel records, match fuel dates with the months in chartData
    const monthsSet = new Set(chartData.map(d => d.month));
    const fCount = store.fuels.filter(f => monthsSet.has(f.date.substring(0, 7))).length;

    return {
      totalCost: tCost,
      totalMileage: tMileage,
      avgEfficiency: effCount > 0 ? (effSum / effCount).toFixed(1) : '0.0',
      fuelCount: fCount
    };
  }, [chartData, store.fuels]);

  const formatKRW = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';
  const formatKM = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + 'km';
  const formatEfficiency = (value: number) => value.toFixed(1) + 'km/L';

  return (
    <div className="cl-page">
      <div className="cl-stats-filters">
        <button className={`cl-stats-filter-btn ${months === 1 ? 'active' : ''}`} onClick={() => setMonths(1)}>이번 달</button>
        <button className={`cl-stats-filter-btn ${months === 3 ? 'active' : ''}`} onClick={() => setMonths(3)}>최근 3개월</button>
        <button className={`cl-stats-filter-btn ${months === 12 ? 'active' : ''}`} onClick={() => setMonths(12)}>올해</button>
      </div>

      <div className="cl-stats-summary">
        <div className="cl-stats-summary-card">
          <div className="cl-stats-summary-label">총 비용</div>
          <div className="cl-stats-summary-value">{new Intl.NumberFormat('ko-KR').format(totalCost)}원</div>
        </div>
        <div className="cl-stats-summary-card">
          <div className="cl-stats-summary-label">총 주행</div>
          <div className="cl-stats-summary-value">{new Intl.NumberFormat('ko-KR').format(totalMileage)}km</div>
        </div>
        <div className="cl-stats-summary-card">
          <div className="cl-stats-summary-label">평균 연비</div>
          <div className="cl-stats-summary-value">{avgEfficiency}km/L</div>
        </div>
        <div className="cl-stats-summary-card">
          <div className="cl-stats-summary-label">주유 횟수</div>
          <div className="cl-stats-summary-value">{fuelCount}회</div>
        </div>
      </div>

      {chartData.length === 0 || chartData.every(d => d.totalCost === 0 && d.mileage === 0) ? (
        <div className="cl-empty" style={{ marginTop: '40px' }}>
          <p>데이터가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="cl-chart-card">
            <div className="cl-chart-title">월간 비용 추세</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide={true} />
                <Tooltip formatter={(value: number) => formatKRW(value as number)} />
                <Bar dataKey="fuelCost" stackId="a" fill="#22c55e" name="주유" />
                <Bar dataKey="maintenanceCost" stackId="a" fill="#f59e0b" name="정비" />
                <Bar dataKey="expenseCost" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="지출" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cl-chart-card">
            <div className="cl-chart-title">주행거리 추세</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide={true} />
                <Tooltip formatter={(value: number) => formatKM(value as number)} />
                <Line type="monotone" dataKey="mileage" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="주행거리" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="cl-chart-card">
            <div className="cl-chart-title">연비 추세</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide={true} />
                <Tooltip formatter={(value: number) => formatEfficiency(value as number)} />
                <Line type="monotone" dataKey="efficiency" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} name="연비" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
