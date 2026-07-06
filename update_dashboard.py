import re
import os

with open("src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variables
state_vars = """    const [activeTab, setActiveTab] = useState('telemetry');
    const [userSankeySearchEmail, setUserSankeySearchEmail] = useState('');
    const [userSankeyData, setUserSankeyData] = useState(null);
    const [userSankeyLoading, setUserSankeyLoading] = useState(false);
    const [userSankeyError, setUserSankeyError] = useState(null);"""

content = re.sub(
    r"    const \[activeTab, setActiveTab\] = useState\('telemetry'\);",
    state_vars,
    content
)

# 2. Add search handler
search_handler = """        fetchData();
    }, []);

    const fetchUserSankey = async () => {
        if (!userSankeySearchEmail) {
            setUserSankeyData(null);
            setUserSankeyError(null);
            sankeyDrawn.current = false;
            return;
        }
        setUserSankeyLoading(true);
        setUserSankeyError(null);
        try {
            const API_URL = 'https://api.sooq-com.com/api';
            const res = await axios.get(`${API_URL}/telemetry/user-sankey?email=${encodeURIComponent(userSankeySearchEmail)}`);
            setUserSankeyData(res.data.sankey);
            sankeyDrawn.current = false; // force redraw
        } catch (err) {
            console.error("Error fetching user sankey", err);
            setUserSankeyError("لم يتم العثور على مسار لهذا المستخدم.");
            setUserSankeyData(null);
        } finally {
            setUserSankeyLoading(false);
        }
    };"""

content = re.sub(
    r"        fetchData\(\);\n    \}, \[\]\);",
    search_handler,
    content
)

# 3. Modify Sankey useEffect dependencies and data source
# Find the start of useEffect
sankey_effect_start = """    // Re-render sankey chart when telemetry changes or component mounts
    useEffect(() => {
        if (!sankeyContainerRef.current) return;
        if (sankeyDrawn.current) return;

        if (!categories || categories.length === 0) {
            return; // Wait for categories to load
        }"""

sankey_effect_start_new = """    // Re-render sankey chart when telemetry changes or component mounts
    useEffect(() => {
        if (!sankeyContainerRef.current) return;
        if (sankeyDrawn.current) return;

        if (!categories || categories.length === 0) {
            return; // Wait for categories to load
        }
        
        const activeSankeyData = userSankeyData || (telemetry && telemetry.sankey ? telemetry.sankey : null);
        if (!activeSankeyData) return;
"""
content = content.replace(sankey_effect_start, sankey_effect_start_new)

# Replace 'telemetry.sankey' with 'activeSankeyData' inside the sankey processing logic.
# Only replace within the sankey processing block to avoid messing up other telemetry usages.
# It appears around line 277: `if (telemetry && telemetry.sankey && telemetry.sankey.nodes) {`
# We'll use regex to target the specific blocks.
content = re.sub(r'telemetry && telemetry\.sankey && telemetry\.sankey\.nodes', r'activeSankeyData && activeSankeyData.nodes', content)
content = re.sub(r'telemetry\.sankey\.nodes\.forEach', r'activeSankeyData.nodes.forEach', content)
content = re.sub(r'telemetry && telemetry\.sankey && telemetry\.sankey\.links', r'activeSankeyData && activeSankeyData.links', content)
content = re.sub(r'telemetry\.sankey\.links\.forEach', r'activeSankeyData.links.forEach', content)
content = re.sub(r'!telemetry \|\| !telemetry\.sankey \|\| !telemetry\.sankey\.nodes', r'!activeSankeyData || !activeSankeyData.nodes', content)

# Change useEffect dependency array from `[telemetry, categories, activeTab]` to include `userSankeyData`
content = re.sub(
    r"    \}, \[telemetry, categories, activeTab\]\);",
    r"    }, [telemetry, categories, activeTab, userSankeyData]);",
    content
)

# 4. Add UI for search above sankey
ui_search = """                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>خريطة تنقلات المستخدم (User Flow - Sankey Diagram)</h3>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
                                                يوضح هذا الرسم كيف يتنقل المستخدمون داخل التطبيق بين الأقسام والإعلانات. السماكة تدل على حجم الزيارات.
                                                <br/>
                                                <em>ملاحظة: يمكنك البحث عن مستخدم معين عبر بريده الإلكتروني لرؤية مساره الخاص.</em>
                                            </p>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input 
                                                type="email" 
                                                placeholder="ابحث بواسطة البريد الإلكتروني..." 
                                                value={userSankeySearchEmail}
                                                onChange={(e) => setUserSankeySearchEmail(e.target.value)}
                                                style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '4px', width: '300px' }}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchUserSankey()}
                                            />
                                            <button 
                                                onClick={fetchUserSankey}
                                                disabled={userSankeyLoading}
                                                style={{ padding: '8px 16px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: userSankeyLoading ? 'not-allowed' : 'pointer' }}
                                            >
                                                {userSankeyLoading ? 'جاري البحث...' : 'بحث'}
                                            </button>
                                            {userSankeyData && (
                                                <button 
                                                    onClick={() => { setUserSankeySearchEmail(''); setUserSankeyData(null); setUserSankeyError(null); sankeyDrawn.current = false; }}
                                                    style={{ padding: '8px 16px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    إلغاء البحث
                                                </button>
                                            )}
                                        </div>
                                        {userSankeyError && <p style={{ color: '#EF4444', margin: 0 }}>{userSankeyError}</p>}
                                    </div>"""

# Replace the original header UI
old_ui_header = """                                <div className="card tracking-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>خريطة تنقلات المستخدم (User Flow - Sankey Diagram)</h3>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
                                            يوضح هذا الرسم كيف يتنقل المستخدمون داخل التطبيق بين الأقسام والإعلانات. السماكة تدل على حجم الزيارات.
                                        </p>
                                    </div>"""

content = content.replace(old_ui_header, ui_search)

with open("src/pages/Dashboard.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard.jsx updated successfully!")
