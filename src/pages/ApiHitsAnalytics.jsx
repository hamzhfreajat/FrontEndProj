import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApiHitsAnalytics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Details Modal State
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [detailedData, setDetailedData] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.sooq-com.com/api';

    useEffect(() => {
        const fetchData = async () => {
            try {
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
    }, [API_URL]);

    const fetchDetails = async (endpointName) => {
        setSelectedEndpoint(endpointName);
        setDetailsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/tracking/api_hits/${encodeURIComponent(endpointName)}?limit=100`);
            setDetailedData(response.data);
        } catch (err) {
            console.error("Error fetching detailed API hits data:", err);
            alert("Failed to load detailed data for " + endpointName);
        } finally {
            setDetailsLoading(false);
        }
    };

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
                            <tr 
                                key={index} 
                                style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                                onClick={() => fetchDetails(row.endpoint_name)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Click to view IP details"
                            >
                                <td style={{ padding: '12px', color: '#007bff' }}>{row.endpoint_name}</td>
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
            
            {/* Modal for displaying detailed IP logs */}
            {selectedEndpoint && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '8px', width: '80%', maxWidth: '900px',
                        maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Detailed Requests: {selectedEndpoint}</h3>
                            <button onClick={() => setSelectedEndpoint(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                        </div>
                        
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Loading IP records...</div>
                            ) : detailedData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>No records found.</div>
                            ) : (
                                <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f4f6f8', textAlign: 'left' }}>
                                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>IP Address</th>
                                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Time</th>
                                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Response (ms)</th>
                                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Status</th>
                                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>User Agent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailedData.map((log, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{log.ip_address}</td>
                                                <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                <td style={{ padding: '10px' }}>{log.response_time_ms}</td>
                                                <td style={{ padding: '10px', color: log.status_code === 200 ? 'green' : 'red' }}>{log.status_code}</td>
                                                <td style={{ padding: '10px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.user_agent}>
                                                    {log.user_agent || 'Unknown'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiHitsAnalytics;
