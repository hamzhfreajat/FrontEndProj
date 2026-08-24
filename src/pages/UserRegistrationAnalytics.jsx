import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UsersAnalyticsTab from './UsersAnalyticsTab';

const UserRegistrationAnalytics = () => {
    const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = 'https://staging.sooq-com.com/api';
                const { data } = await axios.get(`${API_URL}/telemetry/advanced-analytics`);
                setAdvancedAnalytics(data);
            } catch (err) {
                console.error("Error fetching user registration data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
    }

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '24px', color: '#1E293B', fontWeight: 'bold' }}>إحصائيات المستخدمين</h2>
            <UsersAnalyticsTab data={advancedAnalytics?.users} />
        </div>
    );
};

export default UserRegistrationAnalytics;
