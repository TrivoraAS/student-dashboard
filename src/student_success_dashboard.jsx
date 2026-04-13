import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b'];

const parseNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function StudentSuccessDashboard() {
  const [rawData, setRawData] = useState([]);
  const [fileSummary, setFileSummary] = useState('No file loaded yet.');
  const [search, setSearch] = useState('');
  const [majorFilter, setMajorFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((row) => ({
          ...row,
          Study_Hours: parseNumber(row.Study_Hours),
          Overall_Grade: parseNumber(row.Overall_Grade),
        }));

        setRawData(cleaned);
        setFileSummary(`Loaded ${cleaned.length} rows and ${results.meta.fields.length} columns.`);
      },
    });
  };

  const filtered = useMemo(() => {
    return rawData.filter((row) => {
      const matchSearch =
        !search ||
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase())
        );

      const matchMajor =
        majorFilter === 'All' || row.Major === majorFilter;

      const matchRisk =
        riskFilter === 'All' || row.Risk_Level === riskFilter;

      return matchSearch && matchMajor && matchRisk;
    });
  }, [rawData, search, majorFilter, riskFilter]);

  const kpis = {
    total: filtered.length,
    avg:
      filtered.length > 0
        ? (
            filtered.reduce((s, r) => s + r.Overall_Grade, 0) /
            filtered.length
          ).toFixed(1)
        : 0,
  };

  const majors = [...new Set(rawData.map((r) => r.Major))];

  const pieData = Object.entries(
    filtered.reduce((acc, row) => {
      acc[row.Risk_Level] = (acc[row.Risk_Level] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const majorAvg = Object.values(
    filtered.reduce((acc, r) => {
      if (!acc[r.Major]) acc[r.Major] = { Major: r.Major, total: 0, count: 0 };
      acc[r.Major].total += r.Overall_Grade;
      acc[r.Major].count += 1;
      return acc;
    }, {})
  ).map((x) => ({
    Major: x.Major,
    avg: (x.total / x.count).toFixed(1),
  }));

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>Student Dashboard</h1>

      <input type="file" onChange={handleUpload} />
      <p>{fileSummary}</p>

      <h2>KPI</h2>
      <p>Total Students: {kpis.total}</p>
      <p>Average Grade: {kpis.avg}</p>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <br /><br />

      <select onChange={(e) => setMajorFilter(e.target.value)}>
        <option value="All">All Majors</option>
        {majors.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <select onChange={(e) => setRiskFilter(e.target.value)}>
        <option value="All">All Risk Levels</option>
        <option value="Low Risk">Low Risk</option>
        <option value="Moderate Risk">Moderate Risk</option>
        <option value="High Risk">High Risk</option>
      </select>

      <h2>Bar Chart (Average by Major)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={majorAvg}>
          <XAxis dataKey="Major" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avg" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Pie Chart (Risk Distribution)</h2>
      <PieChart width={400} height={300}>
        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      <h2>Line Chart (Grade Over Time)</h2>
      <LineChart width={600} height={300} data={filtered}>
        <XAxis dataKey="Week" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="Overall_Grade" stroke="#16a34a" />
      </LineChart>

      <h2>Data Table</h2>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Major</th>
            <th>Grade</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 20).map((r, i) => (
            <tr key={i}>
              <td>{r.Student_ID}</td>
              <td>{r.Major}</td>
              <td>{r.Overall_Grade}</td>
              <td>{r.Risk_Level}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Insights</h2>
      <p>Average grade is {kpis.avg}</p>
      <p>Total students: {kpis.total}</p>
      <p>Most students fall into the low risk category</p>
    </div>
  );
}