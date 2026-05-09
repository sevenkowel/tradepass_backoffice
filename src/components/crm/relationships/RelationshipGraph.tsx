"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// ==================== Types ====================

interface GraphNode {
  id: string;
  name: string;
  uid: string;
  email: string;
  phone: string;
  registrationDate: string;
  lastLogin: string;
  kycStatus: "verified" | "pending" | "rejected" | "expired";
  riskLevel: "low" | "medium" | "high";
  country: string;
  type: "center" | "shared_ip" | "shared_device" | "same_id";
  val?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: "shared_ip" | "shared_device" | "same_id";
  label: string;
}

interface RelationshipGraphProps {
  centerUser?: GraphNode;
  relatedUsers?: GraphNode[];
  links?: GraphLink[];
}

// ==================== Mock Data ====================

const MOCK_CENTER_USER: GraphNode = {
  id: "TP100001",
  name: "John Doe",
  uid: "TP100001",
  email: "john.doe@example.com",
  phone: "+62 812-3456-7890",
  registrationDate: "2025-01-15",
  lastLogin: "2026-05-08 14:32:15",
  kycStatus: "verified",
  riskLevel: "low",
  country: "Indonesia",
  type: "center",
  val: 40,
};

const MOCK_RELATED_USERS: GraphNode[] = [
  // 共享IP用户 (5个)
  {
    id: "TP100002",
    name: "Alice Smith",
    uid: "TP100002",
    email: "alice.smith@example.com",
    phone: "+62 813-2345-6789",
    registrationDate: "2025-02-20",
    lastLogin: "2026-05-07 09:15:42",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_ip",
    val: 30,
  },
  {
    id: "TP100003",
    name: "Bob Johnson",
    uid: "TP100003",
    email: "bob.johnson@example.com",
    phone: "+62 814-3456-7890",
    registrationDate: "2025-03-10",
    lastLogin: "2026-05-08 11:22:33",
    kycStatus: "pending",
    riskLevel: "medium",
    country: "Indonesia",
    type: "shared_ip",
    val: 30,
  },
  {
    id: "TP100004",
    name: "Carol Williams",
    uid: "TP100004",
    email: "carol.williams@example.com",
    phone: "+62 815-4567-8901",
    registrationDate: "2025-04-05",
    lastLogin: "2026-05-06 16:45:21",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_ip",
    val: 30,
  },
  {
    id: "TP100005",
    name: "David Brown",
    uid: "TP100005",
    email: "david.brown@example.com",
    phone: "+62 816-5678-9012",
    registrationDate: "2025-05-12",
    lastLogin: "2026-05-08 08:30:55",
    kycStatus: "rejected",
    riskLevel: "high",
    country: "Indonesia",
    type: "shared_ip",
    val: 30,
  },
  {
    id: "TP100006",
    name: "Emma Davis",
    uid: "TP100006",
    email: "emma.davis@example.com",
    phone: "+62 817-6789-0123",
    registrationDate: "2025-06-18",
    lastLogin: "2026-05-07 13:18:47",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_ip",
    val: 30,
  },

  // 贡献设备用户 (7个)
  {
    id: "TP100007",
    name: "Frank Wilson",
    uid: "TP100007",
    email: "frank.wilson@example.com",
    phone: "+62 818-7890-1234",
    registrationDate: "2025-07-22",
    lastLogin: "2026-05-08 10:05:12",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100008",
    name: "Grace Taylor",
    uid: "TP100008",
    email: "grace.taylor@example.com",
    phone: "+62 819-8901-2345",
    registrationDate: "2025-08-14",
    lastLogin: "2026-05-07 15:42:38",
    kycStatus: "pending",
    riskLevel: "medium",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100009",
    name: "Henry Anderson",
    uid: "TP100009",
    email: "henry.anderson@example.com",
    phone: "+62 820-9012-3456",
    registrationDate: "2025-09-03",
    lastLogin: "2026-05-08 12:55:29",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100010",
    name: "Irene Thomas",
    uid: "TP100010",
    email: "irene.thomas@example.com",
    phone: "+62 821-0123-4567",
    registrationDate: "2025-10-11",
    lastLogin: "2026-05-06 14:20:15",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100011",
    name: "Jack Jackson",
    uid: "TP100011",
    email: "jack.jackson@example.com",
    phone: "+62 822-1234-5678",
    registrationDate: "2025-11-25",
    lastLogin: "2026-05-08 09:38:44",
    kycStatus: "expired",
    riskLevel: "high",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100012",
    name: "Kelly White",
    uid: "TP100012",
    email: "kelly.white@example.com",
    phone: "+62 823-2345-6789",
    registrationDate: "2025-12-08",
    lastLogin: "2026-05-07 17:12:53",
    kycStatus: "verified",
    riskLevel: "low",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },
  {
    id: "TP100013",
    name: "Larry Harris",
    uid: "TP100013",
    email: "larry.harris@example.com",
    phone: "+62 824-3456-7890",
    registrationDate: "2026-01-15",
    lastLogin: "2026-05-08 07:45:31",
    kycStatus: "pending",
    riskLevel: "medium",
    country: "Indonesia",
    type: "shared_device",
    val: 30,
  },

  // 同名同证件用户 (3个)
  {
    id: "TP100014",
    name: "John Doe II",
    uid: "TP100014",
    email: "john.doe2@example.com",
    phone: "+62 825-4567-8901",
    registrationDate: "2025-03-28",
    lastLogin: "2026-05-07 11:28:19",
    kycStatus: "verified",
    riskLevel: "high",
    country: "Indonesia",
    type: "same_id",
    val: 30,
  },
  {
    id: "TP100015",
    name: "John Doe III",
    uid: "TP100015",
    email: "john.doe3@example.com",
    phone: "+62 826-5678-9012",
    registrationDate: "2025-07-14",
    lastLogin: "2026-05-06 20:15:42",
    kycStatus: "rejected",
    riskLevel: "high",
    country: "Indonesia",
    type: "same_id",
    val: 30,
  },
  {
    id: "TP100016",
    name: "John Doe IV",
    uid: "TP100016",
    email: "john.doe4@example.com",
    phone: "+62 827-6789-0123",
    registrationDate: "2025-11-02",
    lastLogin: "2026-05-08 06:52:37",
    kycStatus: "pending",
    riskLevel: "medium",
    country: "Indonesia",
    type: "same_id",
    val: 30,
  },
];

const MOCK_LINKS: GraphLink[] = [
  // 共享IP连接
  { source: "TP100001", target: "TP100002", type: "shared_ip", label: "Shared IP: 103.45.67.89" },
  { source: "TP100001", target: "TP100003", type: "shared_ip", label: "Shared IP: 103.45.67.89" },
  { source: "TP100001", target: "TP100004", type: "shared_ip", label: "Shared IP: 203.56.78.90" },
  { source: "TP100001", target: "TP100005", type: "shared_ip", label: "Shared IP: 203.56.78.90" },
  { source: "TP100001", target: "TP100006", type: "shared_ip", label: "Shared IP: 178.67.89.01" },

  // 贡献设备连接
  { source: "TP100001", target: "TP100007", type: "shared_device", label: "Shared Device: iPhone 15 Pro" },
  { source: "TP100001", target: "TP100008", type: "shared_device", label: "Shared Device: iPhone 15 Pro" },
  { source: "TP100001", target: "TP100009", type: "shared_device", label: "Shared Device: Samsung Galaxy S24" },
  { source: "TP100001", target: "TP100010", type: "shared_device", label: "Shared Device: Samsung Galaxy S24" },
  { source: "TP100001", target: "TP100011", type: "shared_device", label: "Shared Device: MacBook Pro 16" },
  { source: "TP100001", target: "TP100012", type: "shared_device", label: "Shared Device: MacBook Pro 16" },
  { source: "TP100001", target: "TP100013", type: "shared_device", label: "Shared Device: iPad Air" },

  // 同名同证件连接
  { source: "TP100001", target: "TP100014", type: "same_id", label: "Same Name & ID Document" },
  { source: "TP100001", target: "TP100015", type: "same_id", label: "Same Name & ID Document" },
  { source: "TP100001", target: "TP100016", type: "same_id", label: "Same Name & ID Document" },
];

// ==================== Constants ====================

const NODE_COLORS = {
  center: "#3b82f6",
  shared_ip: "#f59e0b",
  shared_device: "#10b981",
  same_id: "#ef4444",
};

const LINK_COLORS = {
  shared_ip: "#f59e0b",
  shared_device: "#10b981",
  same_id: "#ef4444",
};

const LINK_DASH = {
  shared_ip: [5, 5],
  shared_device: [],
  same_id: [2, 2],
};

const KYC_ICONS = {
  verified: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  expired: AlertTriangle,
};

const KYC_COLORS = {
  verified: "text-emerald-600",
  pending: "text-amber-600",
  rejected: "text-red-600",
  expired: "text-orange-600",
};

const RISK_COLORS = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

// ==================== Component ====================

export default function RelationshipGraph({
  centerUser = MOCK_CENTER_USER,
  relatedUsers = MOCK_RELATED_USERS,
  links = MOCK_LINKS,
}: Partial<RelationshipGraphProps> = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["shared_ip", "shared_device", "same_id"])
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  
  // 确保只在客户端渲染
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 所有节点
  const allNodes = [centerUser, ...relatedUsers];

  // 筛选连线
  const filteredLinks = links.filter((link) => selectedTypes.has(link.type));

  // 搜索高亮
  const searchedNodes = new Set(
    allNodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((n) => n.id)
  );

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 切换筛选类型
  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 简单的 Canvas 绘制（演示用，实际应该使用力导向布局）
  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制占位符
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Sans-Serif";
    ctx.textAlign = "center";
    ctx.fillText("Relationship Graph Placeholder", canvas.width / 2, canvas.height / 2);
    ctx.fillText("ForceGraph2D component is loading...", canvas.width / 2, canvas.height / 2 + 30);
  }, [isClient]);

  // 如果不在客户端，返回 loading
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="h-[700px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading relationship graph...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      <div className="flex items-center gap-4">
        {/* 搜索 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, UID, or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* 筛选 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {[
            { key: "shared_ip", label: "Shared IP (5)", color: "bg-amber-100 text-amber-700" },
            { key: "shared_device", label: "Shared Device (7)", color: "bg-emerald-100 text-emerald-700" },
            { key: "same_id", label: "Same ID (3)", color: "bg-red-100 text-red-700" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTypes.has(key)
                  ? color
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 全屏 */}
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-600" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Center User</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Shared IP (5 users)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Shared Device (7 users)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Same Name/ID (3 users)</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-medium">Total:</span>
          <span>{allNodes.length} nodes</span>
          <span className="mx-1">|</span>
          <span>{filteredLinks.length} links</span>
        </div>
      </div>

      {/* 图谱 - 使用 Canvas 占位 */}
      <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          className="w-full"
        />

        {/* 提示信息 */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700 mb-2">Relationship Graph Component</p>
            <p className="text-sm text-slate-500 mb-4">
              This is a simplified version. ForceGraph2D has SSR compatibility issues.
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>✓ Search functionality: {searchTerm || "(empty)"}</p>
              <p>✓ Filter: {Array.from(selectedTypes).join(", ")}</p>
              <p>✓ Total nodes: {allNodes.length}</p>
              <p>✓ Total links: {filteredLinks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
