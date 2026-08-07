import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApiHitsAnalytics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';
                const response = await axios.get(`${API_URL}/tracking/api_hits`);
                setData(response.data);
            } catch (err) {
                console.error("Error fetching API hits data:", err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>OO OUS O U,OO-U.USU,...</div>;
    }

    if (error) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;
    }

    return (
        <div style={{ padding: '24px' }}>
            <h2>API Hits Analytics</h2>
            <p>Overview of requests made to tracked API endpoints.</p>

            <table className="users-table" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f6f8', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Endpoint Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Total Hits</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Unique IPs</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Avg. Response Time (ms)</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Error Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No data available.</td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{row.endpoint_name}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.total_hits}</td>
                                <td style={{ padding: '12px' }}>{row.unique_ips}</td>
                                <td style={{ padding: '12px' }}>{row.average_response_time_ms}</td>
                                <td style={{ padding: '12px', color: row.error_rate_percent > 0 ? 'red' : 'green' }}>
                                    {row.error_rate_percent}%
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ApiHitsAnalytics;
