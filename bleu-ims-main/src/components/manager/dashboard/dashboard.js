import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Sidebar from "../../sidebar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
  AreaChart, Area
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen,
  faFlask,
  faCubes,
  faBox,
  faArrowTrendUp,
  faArrowTrendDown,
  faExclamationTriangle,
  faHistory,
  faRobot,
  faFileExport,
  faChevronLeft,
  faChevronRight,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { FaChevronDown, FaBell } from "react-icons/fa";
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { getAuthHeaders } from './AuthContext';

const revenueData = [
  { name: 'Jan', income: 5000, expense: 3000 },
  { name: 'Feb', income: 14000, expense: 10000 },
  { name: 'Mar', income: 15000, expense: 12000 },
  { name: 'Apr', income: 11000, expense: 9000 },
  { name: 'May', income: 13000, expense: 7000 },
  { name: 'June', income: 18000, expense: 10000 },
  { name: 'July', income: 18000, expense: 13000 },
];

const salesData = [
  { name: 'Mon', sales: 60 },
  { name: 'Tue', sales: 95 },
  { name: 'Wed', sales: 70 },
  { name: 'Thu', sales: 25 },
  { name: 'Fri', sales: 60 },
  { name: 'Sat', sales: 68 },
  { name: 'Sun', sales: 63 },
];

const COLORS = ['#7FB5B5', '#A3C1C1', '#D1E0E0', '#B0D6D6', '#8AB8B8', '#6E9A9A'];

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">{payload.category}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Count: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("Admin");

  // Dashboard metrics state
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [notAvailable, setNotAvailable] = useState(0);

  // New sections state
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [aiStockAnalysis, setAiStockAnalysis] = useState([]);
  const [inventoryByCategory, setInventoryByCategory] = useState([]);
  const [stockLevelsTrend, setStockLevelsTrend] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [currentAuditSection, setCurrentAuditSection] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Audit sections
  const auditSections = ['Ingredients', 'Materials', 'Merchandise'];

  // URLs for backend endpoints
  const PRODUCT_COUNT_URL = "http://127.0.0.1:8001/is_products/count";
  const INGREDIENT_STOCK_STATUS_URL = "http://127.0.0.1:8002/ingredients/ingredients/stock-status-counts";
  const MATERIAL_STOCK_STATUS_URL = "http://127.0.0.1:8003/materials/materials/stock-status-counts";
  const MERCH_STOCK_STATUS_URL = "http://127.0.0.1:8004/merchandise/merchandise/stock-status-counts";
  const INVENTORY_BY_CATEGORY_URL = "http://127.0.0.1:8001/is_products/inventory-by-category";
 
  // Mock data for demonstration
  const mockLowStockItems = [
    { id: 1, name: 'Vanilla Syrup', category: 'Syrups & Seasonings', inStock: 1, reorderLevel: 5, lastRestocked: '2024-06-15', status: 'Critical' },
    { id: 2, name: 'Coffee Beans', category: 'Raw Ingredients', inStock: 3, reorderLevel: 10, lastRestocked: '2024-06-10', status: 'Low' },
    { id: 3, name: 'Sugar Packets', category: 'Condiments', inStock: 2, reorderLevel: 8, lastRestocked: '2024-06-12', status: 'Critical' }
  ];

  const mockRecentActivities = [
    { id: 1, action: 'CREATE', item: 'Added new ingredient: Cinnamon Powder', user: 'John Doe', timestamp: '2024-06-18 10:30 AM', category: 'Ingredients' },
    { id: 2, action: 'UPDATE', item: 'Updated stock quantity for Coffee Beans', user: 'Jane Smith', timestamp: '2024-06-18 09:15 AM', category: 'Ingredients' },
    { id: 3, action: 'DELETE', item: 'Removed expired Vanilla Extract', user: 'Mike Johnson', timestamp: '2024-06-17 04:45 PM', category: 'Ingredients' },
    { id: 4, action: 'CREATE', item: 'Added new material: Paper Cups 16oz', user: 'Sarah Wilson', timestamp: '2024-06-17 02:20 PM', category: 'Materials' }
  ];

  const mockAiAnalysis = [
    { 
      id: 1, 
      insight: 'Based on Current Usage Trends, Coffee Beans Are Predicted to Stock Out in 14 Days. Consider Restocking Soon.',
      type: 'warning',
      confidence: 85
    },
    { 
      id: 2, 
      insight: 'Milk and Sugar Usage Are Highly With High Intermediate Risk of Stock-Out',
      type: 'info',
      confidence: 78
    }
  ];

  const mockStockLevelsTrend = [
    { date: 'Mon', stockLevel: 60 },
    { date: 'Tue', stockLevel: 78 },
    { date: 'Wed', stockLevel: 95 },
    { date: 'Thu', stockLevel: 85 },
    { date: 'Fri', stockLevel: 70 },
    { date: 'Sat', stockLevel: 20 },
    { date: 'Sun', stockLevel: 65 }
  ];

  const mockAuditData = {
    ingredients: [
      { id: 1, name: 'Vanilla Syrup', category: 'Syrups & Seasonings', unit: 'Bottle', quantityCountered: 5, unitCost: 'PHP 300', totalValue: 'PHP 1500', notes: 'Out of Stock Quality' },
      { id: 2, name: 'Coffee Beans', category: 'Raw Ingredients', unit: 'Kg', quantityCountered: 10, unitCost: 'PHP 250', totalValue: 'PHP 2500', notes: 'Good condition' }
    ],
    materials: [
      { id: 1, name: 'Paper Cups 12oz', category: 'Cups & Containers', unit: 'Pack', quantityCountered: 25, unitCost: 'PHP 150', totalValue: 'PHP 3750', notes: 'New stock' },
      { id: 2, name: 'Napkins', category: 'Disposables', unit: 'Pack', quantityCountered: 15, unitCost: 'PHP 80', totalValue: 'PHP 1200', notes: 'Regular stock' }
    ],
    merchandise: [
      { id: 1, name: 'Coffee Mug', category: 'Drinkware', unit: 'Piece', quantityCountered: 8, unitCost: 'PHP 400', totalValue: 'PHP 3200', notes: 'Limited edition' },
      { id: 2, name: 'T-Shirt', category: 'Apparel', unit: 'Piece', quantityCountered: 12, unitCost: 'PHP 500', totalValue: 'PHP 6000', notes: 'Medium size' }
    ]
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = getAuthHeaders();

        // Fetch total products count
        const prodRes = await fetch(PRODUCT_COUNT_URL, { headers });
        const prodData = prodRes.ok ? await prodRes.json() : { count: 0 };
        setTotalProducts(prodData.count || 0);

        // Fetch stock status counts from all three services
        const [ingRes, matRes, merchRes] = await Promise.all([
          fetch(INGREDIENT_STOCK_STATUS_URL, { headers }),
          fetch(MATERIAL_STOCK_STATUS_URL, { headers }),
          fetch(MERCH_STOCK_STATUS_URL, { headers }),
        ]);

        // Process stock status data
        const ingData = ingRes.ok ? await ingRes.json() : {};
        const matData = matRes.ok ? await matRes.json() : {};
        const merchData = merchRes.ok ? await merchRes.json() : {};

        // Aggregate stock counts
        const totalAvailable = (ingData.available || 0) + (matData.available || 0) + (merchData.available || 0);
        const totalLowStock = (ingData.low_stock || 0) + (matData.low_stock || 0) + (merchData.low_stock || 0);
        const totalNotAvailable = (ingData.not_available || 0) + (matData.not_available || 0) + (merchData.not_available || 0);

        setAvailableStock(totalAvailable);
        setLowStock(totalLowStock);
        setNotAvailable(totalNotAvailable);

        // Fetch inventory by category
        const categoryRes = await fetch(INVENTORY_BY_CATEGORY_URL, { headers });
        const categoryData = categoryRes.ok ? await categoryRes.json() : [];
        setInventoryByCategory(categoryData);

        
        // Set mock data for new sections (replace with actual API calls)
        setLowStockItems(mockLowStockItems);
        setRecentActivities(mockRecentActivities);
        setAiStockAnalysis(mockAiAnalysis);
        setStockLevelsTrend(mockStockLevelsTrend);
        setAuditData(mockAuditData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set mock data as fallback
        setLowStockItems(mockLowStockItems);
        setRecentActivities(mockRecentActivities);
        setAiStockAnalysis(mockAiAnalysis);
        setStockLevelsTrend(mockStockLevelsTrend);
        setAuditData(mockAuditData);
      }
    };

    fetchDashboardData();
  }, []);

  const formatValue = (value, format) => {
    return format === "currency"
      ? `₱${value.toLocaleString()}`
      : value.toLocaleString();
  };

  const handleAuditNavigation = (direction) => {
    if (direction === 'next' && currentAuditSection < auditSections.length - 1) {
      setCurrentAuditSection(currentAuditSection + 1);
    } else if (direction === 'prev' && currentAuditSection > 0) {
      setCurrentAuditSection(currentAuditSection - 1);
    }
  };

  const getCurrentAuditData = () => {
    const section = auditSections[currentAuditSection].toLowerCase();
    return auditData[section] || [];
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
    alert('PDF export functionality would be implemented here');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical': return '#ff6b6b';
      case 'low': return '#ffa726';
      case 'good': return '#66bb6a';
      default: return '#78909c';
    }
  };

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return '+';
      case 'UPDATE': return '✓';
      case 'DELETE': return '×';
      default: return '•';
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <Header pageTitle="Dashboard" />
        <div className="dashboard-contents">
          {/* Hello Section */}
          <div className="dashboard-hello">
            <h2>Hello!</h2>
            <p>Here's Your Latest Inventory Overview</p>
          </div>

          {/* Dashboard Cards */}
           <div className="dashboard-cards dashboard-cards-clean">
            <div className="card-products">
              <div className="card-text">
                <div className="card-title">Total Items</div>
                <div className="card-value">{totalProducts}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
            </div>

            <div className="card-ingredients">
              <div className="card-text">
                <div className="card-title">Low Stock Items</div>
                <div className="card-value">{lowStock}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
            </div>

            <div className="card-materials">
              <div className="card-text">
                <div className="card-title">Available Items</div>
                <div className="card-value">{availableStock}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faCubes} />
              </div>
            </div>

            <div className="card-merchandise">
              <div className="card-text">
                <div className="card-title">Out of Stock Items</div>
                <div className="card-value">{notAvailable}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts">
            <div className="chart-box">
              <div className="chart-header">
                <span>Inventory By Category</span>
                <span className="chart-subtitle">Distribution of Items by Category</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={inventoryByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#4B929D"
                    labelLine={false}
                    label={({ percent, category }) => `${(percent * 100).toFixed(0)}%`}
                    onClick={(data, index) => setActiveIndex(index)}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                  >
                    {inventoryByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={activeIndex === index ? '#4B929D' : '#898989'}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <div className="chart-header">
                <span>Stock Levels Trend</span>
                <span className="chart-subtitle">30-Day Inventory Stock Level History</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stockLevelsTrend}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7FB5B5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7FB5B5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stockLevel" 
                    stroke="#4B929D" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorStock)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Items Section */}
          <div className="dashboard-section low-stock-section">
            <div className="section-header">
              <div className="section-title">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>Low Stock Items</span>
              </div>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="section-content">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Items</th>
                    <th>Category</th>
                    <th>In Stock</th>
                    <th>Reorder Level</th>
                    <th>Last Restocked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.inStock}</td>
                      <td>{item.reorderLevel}</td>
                      <td>{item.lastRestocked}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(item.status),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="dashboard-section recent-activities-section">
            <div className="section-header">
              <div className="section-title">
                <FontAwesomeIcon icon={faHistory} />
                <span>Recent Activities</span>
              </div>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="section-content">
              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <span className="action-badge">
                        {getActionIcon(activity.action)}
                      </span>
                    </div>
                    <div className="activity-details">
                      <div className="activity-text">{activity.item}</div>
                      <div className="activity-meta">
                        <span className="activity-user">{activity.user}</span>
                        <span className="activity-time">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Stock Analysis Section */}
          <div className="dashboard-section ai-analysis-section">
            <div className="section-header">
              <div className="section-title">
                <FontAwesomeIcon icon={faRobot} />
                <span>AI Stock Analysis</span>
              </div>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="section-content">
              <div className="analysis-list">
                {aiStockAnalysis.map((analysis) => (
                  <div key={analysis.id} className="analysis-item">
                    <div className="analysis-icon">
                      <FontAwesomeIcon 
                        icon={analysis.type === 'warning' ? faExclamationTriangle : faRobot} 
                        color={analysis.type === 'warning' ? '#ff9800' : '#4B929D'}
                      />
                    </div>
                    <div className="analysis-content">
                      <div className="analysis-text">{analysis.insight}</div>
                      <div className="analysis-confidence">
                        Confidence: {analysis.confidence}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Report Section */}
          <div className="dashboard-section audit-report-section">
            <div className="section-header">
              <div className="section-title">
                <FontAwesomeIcon icon={faFileExport} />
                <span>Audit Report</span>
                <button className="info-btn">ℹ</button>
              </div>
              <div className="audit-controls">
                <button className="view-all-btn" onClick={exportToPDF}>
                  <FontAwesomeIcon icon={faDownload} />
                  Export PDF
                </button>
              </div>
            </div>
            <div className="section-content">
              <div className="audit-navigation">
                <button 
                  className="nav-btn"
                  onClick={() => handleAuditNavigation('prev')}
                  disabled={currentAuditSection === 0}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className="audit-section-title">
                  {auditSections[currentAuditSection]}
                </span>
                <button 
                  className="nav-btn"
                  onClick={() => handleAuditNavigation('next')}
                  disabled={currentAuditSection === auditSections.length - 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Items</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    
                    
                  </tr>
                </thead>
                <tbody>
                  {getCurrentAuditData().map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.unit}</td>
                      <td>{item.quantityCountered}</td>
                     
                     
                     
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
