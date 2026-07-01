import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Clock, User, Monitor, ChevronDown, ChevronUp } from 'lucide-react';

const ErrorLogs = () => {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        const fetchErrors = async () => {
            try {
                // Adjust to your actual production URL
                const API_URL = 'https://api.sooq-com.com/api';
                const response = await axios.get(`${API_URL}/telemetry/errors`);
                setErrors(response.data);
            } catch (err) {
                console.error("Failed to fetch errors:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchErrors();
    }, []);

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading error logs...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e53e3e' }}>
                <AlertCircle size={28} />
                سجل الأخطاء (Error Logs)
            </h1>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }} dir="rtl">
                    <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #edf2f7' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#4a5568' }}><Clock size={16} style={{ verticalAlign: 'middle', marginLeft: '8px' }}/>الوقت</th>
                            <th style={{ padding: '12px 16px', color: '#4a5568' }}><User size={16} style={{ verticalAlign: 'middle', marginLeft: '8px' }}/>المستخدم</th>
                            <th style={{ padding: '12px 16px', color: '#4a5568' }}><Monitor size={16} style={{ verticalAlign: 'middle', marginLeft: '8px' }}/>الشاشة</th>
                            <th style={{ padding: '12px 16px', color: '#4a5568' }}>الخطأ (Error)</th>
                            <th style={{ padding: '12px 16px', color: '#4a5568' }}>تفاصيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {errors.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>لا يوجد أخطاء مسجلة</td>
                            </tr>
                        ) : (
                            errors.map(err => (
                                <React.Fragment key={err.id}>
                                    <tr 
                                        onClick={() => toggleRow(err.id)}
                                        style={{ 
                                            borderBottom: '1px solid #edf2f7', 
                                            cursor: 'pointer',
                                            backgroundColor: expandedRow === err.id ? '#fff5f5' : 'white',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: '12px 16px' }} dir="ltr">{new Date(err.timestamp).toLocaleString()}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {err.user_name || 'زائر'} <br/>
                                            <span style={{ fontSize: '0.85em', color: '#718096' }} dir="ltr">{err.user_phone || err.user_id}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ background: '#edf2f7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9em' }}>
                                                {err.screen_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#e53e3e', fontWeight: '500', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {err.error_message}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {expandedRow === err.id ? <ChevronUp /> : <ChevronDown />}
                                        </td>
                                    </tr>
                                    {expandedRow === err.id && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '0', borderBottom: '1px solid #edf2f7' }}>
                                                <div style={{ padding: '16px', backgroundColor: '#2d3748', color: '#f7fafc', margin: '0' }} dir="ltr">
                                                    <h4 style={{ marginTop: '0', color: '#fc8181' }}>Full Error Stack Trace</h4>
                                                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', overflowX: 'auto', margin: '0' }}>
                                                        {err.stack_trace || "No stack trace available"}
                                                    </pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ErrorLogs;
