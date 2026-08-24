import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import ReactApexChart from 'react-apexcharts';
import UsersAnalyticsTab from './UsersAnalyticsTab';
import CategoryAnalyticsTab from './CategoryAnalyticsTab';

const SCREEN_NAMES = {
    "login": "تسجيل الدخول",
    "home": "الرئيسية",
    "search": "البحث",
    "my_ads": "إعلاناتي",
    "my_account": "حسابي",
    "ad_details": "تفاصيل الإعلان",
    "categories_tab": "الأقسام (شريط التنقل)",
    "add_ad_wizard": "إضافة إعلان: التصنيف الرئيسي",
    "add_ad_subcategories": "إضافة إعلان: القسم الفرعي",
    "add_ad_city": "إضافة إعلان: المدينة",
    "add_ad_region": "إضافة إعلان: المنطقة",
    "add_ad_map": "إضافة إعلان: الخريطة",
    "add_ad_basic_info": "إضافة إعلان: معلومات أساسية",
    "add_ad_details": "إضافة إعلان: التفاصيل",
    "add_ad_images": "إضافة إعلان: الصور",
    "add_ad_reels": "إضافة إعلان: الفيديو",
    "add_ad_preview": "إضافة إعلان: المعاينة",
    "premium_chat_screen": "المحادثات المميزة",
    "premium_inbox_screen": "صندوق الوارد المميز",
    "Categories": "التصنيفات"
};

const getScreenName = (s) => {
    if (s === 'Unknown' || !s) return 'شاشة غير معروفة';
    return SCREEN_NAMES[s] || s;
};

const HeatmapChart = ({ data, title, color, getScreenNameProp }) => {
    const resolveName = getScreenNameProp || getScreenName;
    const screens = ['All', ...new Set(data.map(d => d.screen || 'Unknown'))];
    const [selectedScreen, setSelectedScreen] = useState('All');
    
    const filteredData = selectedScreen === 'All' 
        ? data 
        : data.filter(d => (d.screen || 'Unknown') === selectedScreen);

    const seriesData = {};
    filteredData.forEach(item => {
        const s = item.screen || 'Unknown';
        if (!seriesData[s]) seriesData[s] = [];
        seriesData[s].push([item.x, item.y]);
    });
    
    const series = Object.keys(seriesData).map(s => ({ name: s, data: seriesData[s] }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h4 style={{ textAlign: 'center', color: color, marginBottom: '10px' }}>{title}</h4>
            
            <select 
                value={selectedScreen} 
                onChange={e => setSelectedScreen(e.target.value)}
                style={{ padding: '8px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #CBD5E1', width: '250px', textAlign: 'center', backgroundColor: '#fff', fontFamily: 'inherit' }}
            >
                {screens.map(s => <option key={s} value={s}>{s === 'All' ? 'جميع الشاشات' : resolveName(s)}</option>)}
            </select>

            <div style={{
                width: '300px', 
                height: '600px', 
                border: '12px solid #1E293B', 
                borderRadius: '36px', 
                padding: '20px 5px 5px 5px', 
                position: 'relative',
                backgroundColor: '#F8FAFC',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                {/* Phone Notch */}
                <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', width: '100px', height: '24px', backgroundColor: '#1E293B', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }}></div>
                
                <ReactApexChart 
                    options={{
                        chart: { type: 'scatter', toolbar: { show: false }, zoom: { type: 'xy' }, fontFamily: 'inherit' },
                        xaxis: { min: 0, max: 400, tickAmount: 4, labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                        yaxis: { min: 0, max: 900, reversed: true, tickAmount: 5, labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                        grid: { show: true, strokeDashArray: 4, borderColor: '#e2e8f0' },
                        markers: { size: selectedScreen === 'All' ? 4 : 8, opacity: 0.7 },
                        legend: { show: false },
                        tooltip: {
                            custom: function({series, seriesIndex, dataPointIndex, w}) {
                                const dp = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                                return `<div style="padding: 10px; text-align: right;" dir="rtl">
                                    <b>الشاشة:</b> ${resolveName(w.globals.initialSeries[seriesIndex].name)}<br/>
                                    <span dir="ltr"><b>X:</b> ${dp[0]}</span><br/>
                                    <span dir="ltr"><b>Y:</b> ${dp[1]}</span>
                                </div>`;
                            }
                        }
                    }} 
                    series={series} 
                    type="scatter" height="100%" 
                />
            </div>
        </div>
    );
};

const LocationStatsChart = ({ data }) => {
    const [activeCityIndex, setActiveCityIndex] = useState(0);

    if (!data || data.length === 0) {
        return <div className="empty-state" style={{ minHeight: '100px', width: '100%' }}>لا توجد بيانات جغرافية متاحة حالياً...</div>;
    }

    const activeLoc = data[activeCityIndex];
    const total = activeLoc.regions ? activeLoc.regions.length : 0;
    const zero = activeLoc.regions ? activeLoc.regions.filter(r => r.count === 0).length : 0;
    const under10 = activeLoc.regions ? activeLoc.regions.filter(r => r.count > 0 && r.count < 10).length : 0;
    const under20 = activeLoc.regions ? activeLoc.regions.filter(r => r.count >= 10 && r.count < 20).length : 0;
    const active = total - zero - under10 - under20;

    const sortedRegions = [...(activeLoc.regions || [])].sort((a, b) => b.count - a.count);
    const chartRegions = sortedRegions.slice(0, 50); // Show top 50 for performance and UI cleanlines
    const chartHeight = Math.max(400, chartRegions.length * 28);

    const chartOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        colors: ['#3B82F6'],
        xaxis: { categories: chartRegions.map(r => r.name), labels: { style: { fontSize: '12px', fontFamily: 'inherit' } } },
        yaxis: { labels: { style: { fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' } } },
        dataLabels: {
            enabled: true,
            offsetX: 30,
            style: { fontSize: '13px', colors: ['#0F172A'], fontFamily: 'inherit' },
            formatter: (val) => val + ' إعلان'
        },
        tooltip: { y: { formatter: (val) => val + ' إعلان' } },
        grid: { show: true, strokeDashArray: 4, borderColor: '#e2e8f0', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } }
    };

    const chartSeries = [{ name: 'الإعلانات', data: chartRegions.map(r => r.count) }];

    return (
        <div style={{ width: '100%', direction: 'rtl' }}>
            {/* City Selector Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                {data.map((loc, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveCityIndex(idx)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: activeCityIndex === idx ? '#3B82F6' : '#F1F5F9',
                            color: activeCityIndex === idx ? 'white' : '#475569',
                            fontWeight: '600',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'inherit'
                        }}
                    >
                        {loc.city}
                        <span style={{ 
                            backgroundColor: activeCityIndex === idx ? 'rgba(255,255,255,0.2)' : '#E2E8F0', 
                            padding: '2px 8px', 
                            borderRadius: '9999px', 
                            fontSize: '12px' 
                        }}>
                            {loc.total_ads}
                        </span>
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '8px' }}>إجمالي المناطق</div>
                    <div style={{ color: '#0F172A', fontSize: '24px', fontWeight: 'bold' }}>{total}</div>
                </div>
                <div style={{ backgroundColor: '#FEF2F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECACA', textAlign: 'center' }}>
                    <div style={{ color: '#DC2626', fontSize: '13px', marginBottom: '8px' }}>مناطق خالية (0 إعلان)</div>
                    <div style={{ color: '#991B1B', fontSize: '24px', fontWeight: 'bold' }}>{zero}</div>
                </div>
                <div style={{ backgroundColor: '#FFFBEB', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                    <div style={{ color: '#D97706', fontSize: '13px', marginBottom: '8px' }}>تفاعل ضعيف (أقل من 20)</div>
                    <div style={{ color: '#B45309', fontSize: '24px', fontWeight: 'bold' }}>{under10 + under20}</div>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                    <div style={{ color: '#16A34A', fontSize: '13px', marginBottom: '8px' }}>مناطق نشطة (+20 إعلان)</div>
                    <div style={{ color: '#15803D', fontSize: '24px', fontWeight: 'bold' }}>{active}</div>
                </div>
            </div>

            {/* Chart Container */}
            <div style={{ 
                border: '1px solid #E2E8F0', 
                borderRadius: '16px', 
                padding: '24px', 
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '18px', fontWeight: 'bold' }}>أكثر المناطق كثافة بالإعلانات</h4>
                <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '14px' }}>يتم عرض أعلى 50 منطقة في {activeLoc.city}</p>
                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }} className="custom-scrollbar">
                    <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={chartHeight} />
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
    const [categories, setCategories] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('telemetry');
    const [userSankeySearchEmail, setUserSankeySearchEmail] = useState('');
    const [userSankeyData, setUserSankeyData] = useState(null);
    const [userFrictionData, setUserFrictionData] = useState(null);
    const [userSankeyLoading, setUserSankeyLoading] = useState(false);
    const [userSankeyError, setUserSankeyError] = useState(null);
    const sankeyContainerRef = React.useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Adjust base URL if needed based on your environment
                // Hardcode API URL to production as requested
                const API_URL = 'https://staging.sooq-com.com/api';
                const [resInsights, resTelemetry, resCategories, resAdvanced] = await Promise.all([
                    axios.get(`${API_URL}/tracking/insights`).catch(() => ({ data: null })),
                    axios.get(`${API_URL}/telemetry/analytics`).catch(() => ({ data: null })),
                    axios.get(`${API_URL}/categories`).catch(() => ({ data: null })),
                    axios.get(`${API_URL}/telemetry/advanced-analytics`).catch(() => ({ data: null }))
                ]);
                
                if (resInsights.data) setInsights(resInsights.data);
                if (resTelemetry.data) setTelemetry(resTelemetry.data);
                if (resCategories.data) setCategories(resCategories.data);
                if (resAdvanced.data) setAdvancedAnalytics(resAdvanced.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchUserSankey = async () => {
        if (!userSankeySearchEmail) {
            setUserSankeyData(null);
            setUserFrictionData(null);
            setUserSankeyError(null);
            sankeyDrawn.current = false;
            return;
        }
        setUserSankeyLoading(true);
        setUserSankeyError(null);
        try {
            const API_URL = 'https://staging.sooq-com.com/api';
            const res = await axios.get(`${API_URL}/telemetry/user-sankey?email=${encodeURIComponent(userSankeySearchEmail)}`);
            setUserSankeyData(res.data.sankey);
            if (res.data.friction_metrics) setUserFrictionData(res.data.friction_metrics);
            sankeyDrawn.current = false; // force redraw
        } catch (err) {
            console.error("Error fetching user sankey", err);
            setUserSankeyError("لم يتم العثور على بيانات لهذا المستخدم.");
            setUserSankeyData(null);
            setUserFrictionData(null);
        } finally {
            setUserSankeyLoading(false);
        }
    };

    const sankeyDrawn = useRef(false);

    // Re-render sankey chart when telemetry changes or component mounts
    useEffect(() => {
        if (!sankeyContainerRef.current) return;
        if (sankeyDrawn.current) return;

        if (!categories || categories.length === 0) {
            return; // Wait for categories to load
        }
        
        const activeSankeyData = userSankeyData || (telemetry && telemetry.sankey ? telemetry.sankey : null);
        if (!activeSankeyData) return;


        const nodesMap = new Map();
        const edges = [];

        // Normalize Arabic text to handle variations in hamza and taa marbuta
        const normalizeArabic = (text) => {
            if (!text) return text;
            return text.toString().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
        };

        // PRECOMPUTE LOOKUP TABLES FOR O(1) PERFORMANCE
        const nodeNameToIdx = new Map();
        const normalizedNameToIdx = new Map();
        
        if (activeSankeyData && activeSankeyData.nodes) {
            activeSankeyData.nodes.forEach((n, idx) => {
                nodeNameToIdx.set(n.name, idx);
                if (n.name) {
                    nodeNameToIdx.set(n.name.toString(), idx);
                    normalizedNameToIdx.set(normalizeArabic(n.name), idx);
                }
            });
        }
        
        const linkMap = new Map();
        if (activeSankeyData && activeSankeyData.links) {
            activeSankeyData.links.forEach(l => {
                linkMap.set(`${l.source}-${l.target}`, l.value);
            });
        }

        const getFlowValue = (sourceName, targetName) => {
            if (!activeSankeyData || !activeSankeyData.nodes) return 0;
            
            let sIdx = nodeNameToIdx.get(sourceName);
            if (sIdx === undefined && sourceName != null) sIdx = nodeNameToIdx.get(sourceName.toString());
            if (sIdx === undefined && sourceName != null) sIdx = normalizedNameToIdx.get(normalizeArabic(sourceName));
            
            let tIdx = nodeNameToIdx.get(targetName);
            if (tIdx === undefined && targetName != null) tIdx = nodeNameToIdx.get(targetName.toString());
            if (tIdx === undefined && targetName != null) tIdx = normalizedNameToIdx.get(normalizeArabic(targetName));
            
            if (sIdx === undefined || tIdx === undefined) return 0;
            
            return linkMap.get(`${sIdx}-${tIdx}`) || 0;
        };

        // Add static outer journey nodes
        nodesMap.set("login", "Login");
        nodesMap.set("home", "Home");
        nodesMap.set("search", "Search");
        nodesMap.set("my_ads", "My Ads");
        nodesMap.set("my_account", "My Account");
        nodesMap.set("ad_details", "Ads details");
        nodesMap.set("categories_tab", "الأقسام (Tab)");

        // Add Ad flow nodes
        const addAdNodes = {
            "add_ad_wizard": "التصنيف",
            "add_ad_subcategories": "القسم الفرعي",
            "add_ad_city": "المدينة",
            "add_ad_region": "المنطقة",
            "add_ad_map": "الخريطة",
            "add_ad_basic_info": "معلومات أساسية",
            "add_ad_details": "التفاصيل",
            "add_ad_images": "الصور",
            "add_ad_reels": "الفيديو",
            "add_ad_preview": "المعاينة"
        };
        
        Object.entries(addAdNodes).forEach(([key, title]) => {
            nodesMap.set(key, title);
        });

        // Add edges helper
        const addEdge = (source, target, altSource = null, altTarget = null) => {
            let val = getFlowValue(source, target);
            if (altSource) val += getFlowValue(altSource, target);
            if (altTarget) val += getFlowValue(source, altTarget);
            if (altSource && altTarget) val += getFlowValue(altSource, altTarget);
            
            // Add case-insensitive home fallbacks
            if (source === 'home' || altSource === 'home') {
                val += getFlowValue('Home', target);
                if (altTarget) val += getFlowValue('Home', altTarget);
            }
            
            if (val > 0) {
                edges.push({ source, target, value: val });
            }
        };

        // Outer journey edges
        addEdge("login", "home");
        addEdge("login", "my_ads");
        addEdge("login", "my_account");
        addEdge("login", "categories_tab", "Login", "Categories");
        addEdge("home", "search");
        addEdge("home", "my_ads");
        addEdge("home", "my_account");
        addEdge("home", "categories_tab", "Home", "Categories");

        // Connect to Add Ad flow
        addEdge("home", "add_ad_images");
        addEdge("my_account", "add_ad_images");
        addEdge("my_ads", "add_ad_images");

        // Connect Add Ad internal steps dynamically based on actual flow
        // Users might skip steps (like the map), so we allow any forward jump
        const addAdTrip = [
            "add_ad_images",
            "add_ad_reels",
            "add_ad_wizard",
            "add_ad_subcategories",
            "add_ad_city",
            "add_ad_region",
            "add_ad_map",
            "add_ad_details",
            "add_ad_basic_info",
            "add_ad_preview"
        ];
        
        for (let i = 0; i < addAdTrip.length; i++) {
            for (let j = i + 1; j < addAdTrip.length; j++) {
                addEdge(addAdTrip[i], addAdTrip[j]);
            }
        }
        
        // Connect the end of the trip to a terminal node to avoid cycles (Sankey charts crash on cycles)
        nodesMap.set("ad_published_return", "عودة بعد إضافة الإعلان");
        
        let previewReturnVal = getFlowValue("add_ad_preview", "home") + getFlowValue("add_ad_preview", "my_ads");
        if (previewReturnVal > 0) {
            edges.push({ source: "add_ad_preview", target: "ad_published_return", value: previewReturnVal });
        }

        // Flatten categories from API
        const allCategories = [];
        const extractCategories = (list) => {
            list.forEach(c => {
                allCategories.push(c);
                if (c.children && Array.isArray(c.children)) {
                    extractCategories(c.children);
                }
            });
        };
        extractCategories(categories);

        // Filter for Real Estate categories (ID 2 = Sale, ID 3 = Rent)
        const realEstateRoots = allCategories.filter(c => c.id === 2 || c.id === 3);

        if (realEstateRoots.length === 0) {
            realEstateRoots.push(...allCategories.filter(c => c.name && c.name.includes('عقارات')));
        }

        // Track leaf nodes to connect them to "ad_details"
        const leafNodes = new Set();

        const processCategoryLevel = (parentCat, currentSuffix, visited = new Set()) => {
            if (visited.has(parentCat.id)) return;
            visited.add(parentCat.id);
            
            const children = allCategories.filter(c => c.parent_id === parentCat.id);
            
            if (children.length === 0) {
                // If it has no children, it's a leaf node
                leafNodes.add(parentCat.id.toString());
                return;
            }
            
            children.forEach(child => {
                // Only add suffix if it's not already explicitly clear
                const childSuffix = child.name.includes('للبيع') || child.name.includes('للايجار') || child.name.includes('للإيجار') ? '' : currentSuffix;
                nodesMap.set(child.id.toString(), child.name + childSuffix);
                
                addEdge(parentCat.id.toString(), child.id.toString(), parentCat.name, child.name);
                
                // Track direct jumps from Categories tab or Search to any subcategory!
                addEdge("categories_tab", child.id.toString(), "Categories", child.name);
                addEdge("search", child.id.toString(), "Search", child.name);
                
                // Recurse to find further descendents (great-grandchildren, etc.)
                processCategoryLevel(child, childSuffix, new Set(visited));
            });
        };

        realEstateRoots.forEach(rootCat => {
            nodesMap.set(rootCat.id.toString(), rootCat.name);
            
            // Connect Home to Real Estate Roots
            addEdge("home", rootCat.id.toString(), null, rootCat.name);
            // Connect Search to Real Estate Roots
            addEdge("search", rootCat.id.toString(), "Search", rootCat.name);
            // Connect Categories Tab to Real Estate Roots
            addEdge("categories_tab", rootCat.id.toString(), "Categories", rootCat.name);

            // Determine root suffix
            const rootSuffix = rootCat.id === 2 ? ' (للبيع)' : rootCat.id === 3 ? ' (للايجار)' : '';
            
            // Start recursive traversal
            processCategoryLevel(rootCat, rootSuffix);
        });

        // Add drop_off node
        nodesMap.set("drop_off", "تصفح الأقسام (بدون النقر على إعلان)");

        // Connect all Real Estate leaf nodes directly to "Ads details"
        leafNodes.forEach(leafId => {
            let val = getFlowValue(leafId, "ad_details");
            let altVal = getFlowValue(nodesMap.get(leafId), "ad_details");
            
            if (val + altVal > 0) {
                addEdge(leafId, "ad_details", nodesMap.get(leafId), null);
            }
        });
        
        // Also allow search to connect directly to ad details if they find an ad
        addEdge("search", "ad_details");

        // BALANCE THE GRAPH TO PREVENT CULLING:
        // Sankey charts will completely delete branches that are "dead ends" (e.g. users who didn't click an ad).
        // To prevent this mathematical culling and force the chart to render all visits, we route dropped-off traffic.
        const nodeFlows = {};
        edges.forEach(e => {
            nodeFlows[e.target] = (nodeFlows[e.target] || 0) + e.value;
            nodeFlows[e.source] = (nodeFlows[e.source] || 0) - e.value;
        });
        
        Object.keys(nodeFlows).forEach(nodeId => {
            if (!["drop_off", "ad_details", "home", "login", "search"].includes(nodeId)) {
                if (nodeFlows[nodeId] > 0) {
                    // Node has excess incoming traffic. Route it to the drop-off bucket.
                    edges.push({ source: nodeId, target: "drop_off", value: nodeFlows[nodeId] });
                }
            }
        });

        // CRITICAL PERFORMANCE FIX: Strip out any nodes that don't have edges.
        // ApexSankey will infinite loop / crash the browser if given hundreds of unconnected nodes!
        const usedNodeIds = new Set();
        edges.forEach(e => {
            usedNodeIds.add(e.source);
            usedNodeIds.add(e.target);
        });

        const apexSankeyData = {
            nodes: Array.from(nodesMap.entries())
                      .filter(([id, _]) => usedNodeIds.has(id))
                      .map(([id, title]) => ({ id, title })),
            edges: edges
        };

        const attemptRender = () => {
            if (window.ApexSankey) {
                try {
                    sankeyDrawn.current = true;
                    
                    if (apexSankeyData.edges.length === 0) {
                        sankeyContainerRef.current.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: #6B7280; font-family: inherit;">
                                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                                <h3 style="font-size: 20px; margin: 0 0 8px 0; color: #374151;">لا توجد بيانات تتبع حتى الآن</h3>
                                <p style="margin: 0; text-align: center; max-width: 400px; line-height: 1.6;">
                                    لم يتم تسجيل أي تفاعلات من المستخدمين. قم بتشغيل تطبيق الهاتف (Flutter) وتصفح الإعلانات والأقسام لتبدأ مسارات البيانات بالظهور هنا.
                                </p>
                            </div>
                        `;
                        return;
                    }

                    // Force a completely fresh DOM node for the charting library
                    // Added overflowX auto and minimum width so the chart doesn't squish nodes horizontally
                    sankeyContainerRef.current.innerHTML = '<div style="width:100%; height:100%; overflow-x: auto; padding-bottom: 20px;"><div id="fresh-sankey-wrapper" style="min-width: 1400px; height:100%;" dir="ltr"></div></div>';
                    const freshContainer = sankeyContainerRef.current.querySelector('#fresh-sankey-wrapper');
                    
                    const containerWidth = Math.max(sankeyContainerRef.current.clientWidth || 800, 1400);
                    const sankey = new window.ApexSankey(freshContainer, {
                        width: containerWidth,
                        height: 750
                    });
                    sankey.render(apexSankeyData);
                } catch (e) {
                    console.error("ApexSankey render error", e);
                }
            } else {
                setTimeout(attemptRender, 100);
            }
        };

        attemptRender();
    }, [telemetry, loading, categories, userSankeyData]);

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>جاري تحميل البيانات الحية...</div>;
    }

    const treemapSeries = insights?.real_estate_stats?.map(cat => ({
        name: cat.name,
        data: cat.children ? cat.children.map(child => ({
            x: child.name,
            y: child.count
        })) : []
    })) || [];

    const treemapOptions = {
        chart: {
            type: 'treemap',
            toolbar: { show: true },
            fontFamily: 'inherit'
        },
        legend: {
            show: true,
            position: 'top'
        },
        title: {
            text: ''
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '14px',
            },
            formatter: function(text, op) {
                return [text, op.value + ' إعلان'];
            }
        },
        plotOptions: {
            treemap: {
                enableShades: true,
                shadeIntensity: 0.5,
                distributed: false, // Ensures each series gets a different color
            }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
    };

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>
            {/* Top Level Navigation Tabs - Premium Redesign */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }} dir="rtl">
                <div style={{ 
                    display: 'inline-flex', 
                    backgroundColor: '#F1F5F9', 
                    padding: '6px', 
                    borderRadius: '16px', 
                    gap: '8px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <button 
                        onClick={() => setActiveTab('telemetry')}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: activeTab === 'telemetry' ? '#FFFFFF' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            color: activeTab === 'telemetry' ? '#3B82F6' : '#64748B',
                            fontWeight: activeTab === 'telemetry' ? '700' : '600',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'telemetry' ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>📊</span> تحليلات التتبع (Telemetry)
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: activeTab === 'users' ? '#FFFFFF' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            color: activeTab === 'users' ? '#3B82F6' : '#64748B',
                            fontWeight: activeTab === 'users' ? '700' : '600',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'users' ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>👥</span> تفاعل المستخدمين (Users)
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: activeTab === 'categories' ? '#FFFFFF' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            color: activeTab === 'categories' ? '#3B82F6' : '#64748B',
                            fontWeight: activeTab === 'categories' ? '700' : '600',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'categories' ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>📑</span> تحليلات الأقسام (Categories)
                    </button>
                </div>
            </div>

            <div className="dashboard-content" style={{ display: 'block' }}>
                {activeTab === 'users' ? (
                    <UsersAnalyticsTab data={advancedAnalytics?.users} />
                ) : activeTab === 'categories' ? (
                    <CategoryAnalyticsTab data={advancedAnalytics?.categories} />
                ) : (
                    <>
                    {telemetry && (
                        <div className="telemetry-section" style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '20px' }}>إحصائيات التتبع والتحليلات (Telemetry)</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                                


                                {/* Sankey Chart is hardcoded, so it should always display regardless of telemetry data */}
                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>خريطة تنقلات المستخدم (User Flow - Sankey Diagram)</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
                                            يوضح هذا الرسم البياني الشامل كافة التنقلات بين الشاشات. سماكة الخط تدل على حجم الانتقال من صفحة إلى أخرى، مما يكشف بدقة عن سلوك المستخدم وتصفحه الحقيقي للتطبيق (مثلاً: الصفحة الرئيسية ← التصنيفات ← تفاصيل الإعلان).
                                        </p>
                                    </div>
                                    <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                                        <div style={{ flex: 1, maxWidth: '400px' }}>
                                            <input 
                                                type="email" 
                                                placeholder="ابحث بالبريد الإلكتروني للمستخدم..." 
                                                value={userSankeySearchEmail}
                                                onChange={(e) => setUserSankeySearchEmail(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && fetchUserSankey()}
                                                style={{ width: '100%', padding: '10px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '1rem', outline: 'none' }}
                                                dir="ltr"
                                            />
                                        </div>
                                        <button 
                                            onClick={fetchUserSankey}
                                            disabled={userSankeyLoading}
                                            style={{ padding: '10px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: userSankeyLoading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '500' }}
                                        >
                                            {userSankeyLoading ? 'جاري البحث...' : 'بحث عن مستخدم'}
                                        </button>
                                        <button 
                                            onClick={() => { setUserSankeySearchEmail(''); setUserSankeyData(null); setUserFrictionData(null); }}
                                            style={{ padding: '10px 24px', background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}
                                        >
                                            إلغاء التصفية
                                        </button>
                                    </div>
                                    {userSankeyError && (
                                        <div style={{ padding: '12px', background: '#FEE2E2', color: '#EF4444', borderRadius: '6px', marginBottom: '16px' }}>
                                            {userSankeyError}
                                        </div>
                                    )}
                                    <div style={{ height: 750, marginTop: 16 }} dir="ltr" ref={sankeyContainerRef}>
                                    </div>
                                </div>
                                
                                {/* Friction Metrics Section */}
                                {(userFrictionData || telemetry.friction_metrics) && (
                                    <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1E293B' }}>مشاكل وعوائق الاستخدام (UX Friction) {userFrictionData ? `(للمستخدم المختار)` : ''}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }} dir="ltr">
                                            {(() => {
                                                const activeFriction = userFrictionData || telemetry.friction_metrics;
                                                const categoryMap = new Map();
                                                if (categories) {
                                                    const flatten = (list) => {
                                                        list.forEach(c => {
                                                            categoryMap.set(c.id.toString(), c.name);
                                                            if (c.children) flatten(c.children);
                                                        });
                                                    };
                                                    flatten(categories);
                                                }
                                                const resolveScreenName = (s) => {
                                                    if (s === 'Unknown' || !s) return 'شاشة غير معروفة';
                                                    if (categoryMap.has(s.toString())) return categoryMap.get(s.toString());
                                                    
                                                    const SCREEN_NAMES = {
                                                        'home': 'الرئيسية',
                                                        'categories': 'الأقسام',
                                                        'add_ad': 'إضافة إعلان',
                                                        'messages': 'الرسائل',
                                                        'profile': 'حسابي',
                                                        'search': 'البحث'
                                                    };
                                                    
                                                    return SCREEN_NAMES[s] || s;
                                                };

                                                return (
                                                    <>
                                                        {/* Rage Taps Scatter Plot */}
                                                        <div>
                                                            <HeatmapChart 
                                                                data={activeFriction.rage_taps || []} 
                                                                title="أماكن النقر المتكرر بغضب (Rage Taps Heatmap)" 
                                                                color="#DC2626" 
                                                                getScreenNameProp={resolveScreenName}
                                                            />
                                                        </div>

                                                        {/* Dead Clicks Scatter Plot */}
                                                        <div>
                                                            <HeatmapChart 
                                                                data={activeFriction.dead_clicks || []} 
                                                                title="أماكن النقرات الميتة (Dead Clicks Heatmap)" 
                                                                color="#EA580C" 
                                                                getScreenNameProp={resolveScreenName}
                                                            />
                                                        </div>

                                                        {/* Form Abandonment */}
                                                        <div>
                                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>التخلي عن تعبئة النماذج (Form Abandonment)</h4>
                                                            {(!activeFriction.form_abandonment || activeFriction.form_abandonment.length === 0) ? (
                                                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#94A3B8' }}>لا توجد بيانات متاحة</div>
                                                            ) : (
                                                                <ReactApexChart 
                                                                    options={{
                                                                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                                                                        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'bottom' } } },
                                                                        colors: ['#F59E0B'],
                                                                        xaxis: { categories: activeFriction.form_abandonment.map(r => r.form_field ? (r.form_field.length > 20 ? r.form_field.substring(0, 20) + '...' : r.form_field) : 'Unknown') },
                                                                        dataLabels: { enabled: true, textAnchor: 'start', offsetX: 0, style: { colors: ['#fff'] } },
                                                                        yaxis: { labels: { maxWidth: 150, style: { fontSize: '11px' } } }
                                                                    }} 
                                                                    series={[{ name: 'المرات', data: activeFriction.form_abandonment.map(r => r.count) }]} 
                                                                    type="bar" height={Math.max(250, activeFriction.form_abandonment.length * 25 + 50)} 
                                                                />
                                                            )}
                                                        </div>

                                                        {/* U-Turns */}
                                                        <div>
                                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>التراجع الفوري (U-Turns)</h4>
                                                            {(!activeFriction.u_turns || activeFriction.u_turns.length === 0) ? (
                                                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#94A3B8' }}>لا توجد بيانات متاحة</div>
                                                            ) : (
                                                                <ReactApexChart 
                                                                    options={{
                                                                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                                                                        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'bottom' } } },
                                                                        colors: ['#84CC16'],
                                                                        xaxis: { categories: activeFriction.u_turns.map(r => r.screen ? (r.screen.length > 20 ? r.screen.substring(0, 20) + '...' : r.screen) : 'Unknown') },
                                                                        dataLabels: { enabled: true, textAnchor: 'start', offsetX: 0, style: { colors: ['#fff'] } },
                                                                        yaxis: { labels: { maxWidth: 150, style: { fontSize: '11px' } } }
                                                                    }} 
                                                                    series={[{ name: 'المرات', data: activeFriction.u_turns.map(r => r.count) }]} 
                                                                    type="bar" height={Math.max(250, activeFriction.u_turns.length * 25 + 50)} 
                                                                />
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* Form Abandonment */}
                                            <div>
                                                <h4 style={{ textAlign: 'center', color: '#D97706' }}>النماذج المتروكة (Form Abandonment)</h4>
                                                <ReactApexChart 
                                                    options={{
                                                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                                                        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'bottom' } } },
                                                        colors: ['#F59E0B'],
                                                        xaxis: { categories: telemetry.friction_metrics.form_abandonment.map(r => r.form_field ? (r.form_field.length > 20 ? r.form_field.substring(0, 20) + '...' : r.form_field) : 'Unknown') },
                                                        dataLabels: { enabled: true, textAnchor: 'start', offsetX: 0, style: { colors: ['#fff'] } },
                                                        yaxis: { labels: { maxWidth: 150, style: { fontSize: '11px' } } }
                                                    }} 
                                                    series={[{ name: 'المرات', data: telemetry.friction_metrics.form_abandonment.map(r => r.count) }]} 
                                                    type="bar" height={Math.max(250, telemetry.friction_metrics.form_abandonment.length * 25 + 50)} 
                                                />
                                            </div>

                                            {/* U-Turns */}
                                            <div>
                                                <h4 style={{ textAlign: 'center', color: '#65A30D' }}>العودة السريعة (U-Turns)</h4>
                                                <ReactApexChart 
                                                    options={{
                                                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
                                                        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'bottom' } } },
                                                        colors: ['#84CC16'],
                                                        xaxis: { categories: telemetry.friction_metrics.u_turns.map(r => r.screen ? (r.screen.length > 20 ? r.screen.substring(0, 20) + '...' : r.screen) : 'Unknown') },
                                                        dataLabels: { enabled: true, textAnchor: 'start', offsetX: 0, style: { colors: ['#fff'] } },
                                                        yaxis: { labels: { maxWidth: 150, style: { fontSize: '11px' } } }
                                                    }} 
                                                    series={[{ name: 'المرات', data: telemetry.friction_metrics.u_turns.map(r => r.count) }]} 
                                                    type="bar" height={Math.max(250, telemetry.friction_metrics.u_turns.length * 25 + 50)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                            </div>
                        </div>
                    )}

                    <div className="card tracking-card mt-4 mb-4" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '16px', textAlign: 'right' }}>توزيع إعلانات فئات العقارات</h3>
                        <div style={{ display: 'block', width: '100%' }} dir="ltr">
                            {treemapSeries.length > 0 ? (
                                <div style={{ width: '100%', minHeight: '500px' }}>
                                    <ReactApexChart options={treemapOptions} series={treemapSeries} type="treemap" height={550} />
                                </div>
                            ) : (
                                <div className="empty-state" style={{ minHeight: '60px', width: '100%' }}>لا توجد بيانات فئات متاحة حالياً...</div>
                            )}
                        </div>
                    </div>

                    <div className="card tracking-card mt-4">
                        <h3>توزيع الإعلانات المباشر (توزيع المحافظات والمناطق)</h3>
                        <div style={{ display: 'block', width: '100%', padding: '10px 0' }} dir="ltr">
                            <LocationStatsChart data={insights?.location_stats} />
                        </div>
                    </div>
                    </>
                )}
            </div>

            <style jsx>{`
        .page-header {
          margin-bottom: 32px;
        }
        
        /* Force ApexSankey Tooltip to correctly render Arabic text Right-to-Left */
        :global(.apexcharts-tooltip), :global(.sankey-tooltip) {
            direction: rtl !important;
            text-align: right !important;
        }
        
        .location-stats-list {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .location-item {
          background: #f9fbfc;
          border: 1px solid #eef2f6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .cat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }
        .loc-city-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #ddd;
        }
        .loc-city-name {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-dark);
        }
        .loc-city-count.badge {
          background: rgba(0, 117, 255, 0.1);
          color: var(--primary-color);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .loc-regions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-summary-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: #666;
          background: #f1f5f9;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .stat-summary-row span {
          display: flex;
          gap: 4px;
        }
        .loc-region-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .loc-reg-name {
          color: #555;
        }
        .loc-reg-count {
          font-weight: 600;
          color: #888;
          font-size: 0.85rem;
        }

        .empty-state {
          height: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .location-stats-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
