/**
 * 租户认证配置类型与默认值
 * 存储在 TenantConfig.auth JSON 字段中
 */

// ====== 地区配置 ======
export type RegionCode = string;

export interface RegionConfig {
  code: RegionCode;
  name: string;
  flag: string;
  defaultPhonePrefix: string;
  /** OTP 发送方式优先级 */
  otpMethods: ("sms" | "voice" | "whatsapp")[];
  /** 注册是否强制手机验证 */
  requirePhoneVerification: boolean;
}

// ====== 登录模式 ======
export type LoginMode = "password" | "otp" | "both";

// ====== 表单字段 ======
export interface AuthFormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "password" | "select" | "checkbox" | "date";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

// ====== 注册 Flow 步骤 ======
export type RegisterFlowStep = 
  | "basic_info"      // 基本信息（邮箱/手机）
  | "password"        // 设置密码
  | "profile"         // 补充资料
  | "otp"             // OTP 验证
  | "agreements"      // 协议确认
  | "kyc_start";      // 开始 KYC

// ====== 完整配置 ======
export interface AuthConfig {
  /** 当前地区 */
  region: RegionCode;
  
  /** 支持的注册方式 */
  registerMethods: ("email" | "phone")[];
  
  /** 支持的登录方式 */
  loginMethods: ("email" | "phone")[];
  
  /** 登录模式：密码 / OTP / 两者皆可 */
  loginModes: LoginMode[];
  
  /** 注册表单字段（动态配置） */
  registerFields: AuthFormField[];
  
  /** 登录表单字段 */
  loginFields: AuthFormField[];
  
  /** 注册 Flow 步骤配置（后端下发） */
  registerFlowSteps: RegisterFlowStep[];
  
  /** 注册时是否需要邮箱验证 */
  emailVerificationRequired: boolean;
  
  /** 注册时是否需要手机验证 */
  phoneVerificationRequired: boolean;
  
  /** 是否允许跳过验证（开发模式） */
  allowSkipVerification: boolean;
  
  /** 是否启用 2FA */
  twoFactorEnabled: boolean;
  
  /** 2FA 类型 */
  twoFactorType: "sms" | "email" | "app";
  
  /** 注册协议列表 */
  agreements: { id: string; title: string; required: boolean }[];
  
  /** 密码策略 */
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
  };
}

// ====== 地区默认值 ======

/** 根据 ISO 3166-1 alpha-2 代码生成国旗 emoji */
function flagEmoji(code: string): string {
  const cp = code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...cp);
}

/** 快捷创建 RegionConfig */
function r(code: string, name: string, prefix: string, otp: ("sms" | "voice" | "whatsapp")[] = ["sms"], requirePhone = false): RegionConfig {
  return { code, name, flag: flagEmoji(code), defaultPhonePrefix: prefix, otpMethods: otp, requirePhoneVerification: requirePhone };
}

export const defaultRegions: RegionConfig[] = [
  // === 热门地区 (东南亚 + 中东 + 南亚) ===
  r("VN", "Vietnam", "+84", ["sms", "voice", "whatsapp"]),
  r("TH", "Thailand", "+66", ["sms", "whatsapp"]),
  r("ID", "Indonesia", "+62", ["sms", "whatsapp"]),
  r("MY", "Malaysia", "+60", ["sms", "whatsapp"]),
  r("SG", "Singapore", "+65", ["sms", "whatsapp"]),
  r("PH", "Philippines", "+63", ["sms", "whatsapp"]),
  r("AE", "United Arab Emirates", "+971", ["sms", "voice", "whatsapp"], true),
  r("IN", "India", "+91", ["sms", "whatsapp"]),

  // === 东亚 ===
  r("CN", "China", "+86"),
  r("HK", "Hong Kong", "+852"),
  r("TW", "Taiwan", "+886"),
  r("MO", "Macau", "+853"),
  r("JP", "Japan", "+81", ["sms", "voice"]),
  r("KR", "South Korea", "+82", ["sms", "voice"]),
  r("MN", "Mongolia", "+976"),

  // === 南亚 ===
  r("BD", "Bangladesh", "+880"),
  r("PK", "Pakistan", "+92"),
  r("LK", "Sri Lanka", "+94"),
  r("NP", "Nepal", "+977"),
  r("MM", "Myanmar", "+95"),
  r("KH", "Cambodia", "+855"),
  r("LA", "Laos", "+856"),
  r("BT", "Bhutan", "+975"),
  r("MV", "Maldives", "+960"),

  // === 中亚 ===
  r("KZ", "Kazakhstan", "+7"),
  r("UZ", "Uzbekistan", "+998"),
  r("TJ", "Tajikistan", "+992"),
  r("KG", "Kyrgyzstan", "+996"),
  r("TM", "Turkmenistan", "+993"),

  // === 西亚/中东 ===
  r("TR", "Turkey", "+90", ["sms", "whatsapp"]),
  r("IR", "Iran", "+98"),
  r("IQ", "Iraq", "+964"),
  r("IL", "Israel", "+972"),
  r("SA", "Saudi Arabia", "+966"),
  r("QA", "Qatar", "+974"),
  r("KW", "Kuwait", "+965"),
  r("OM", "Oman", "+968"),
  r("BH", "Bahrain", "+973"),
  r("JO", "Jordan", "+962"),
  r("LB", "Lebanon", "+961"),
  r("YE", "Yemen", "+967"),
  r("SY", "Syria", "+963"),
  r("AF", "Afghanistan", "+93"),

  // === 欧洲 ===
  r("GB", "United Kingdom", "+44"),
  r("DE", "Germany", "+49"),
  r("FR", "France", "+33"),
  r("IT", "Italy", "+39"),
  r("ES", "Spain", "+34"),
  r("PT", "Portugal", "+351"),
  r("NL", "Netherlands", "+31"),
  r("BE", "Belgium", "+32"),
  r("CH", "Switzerland", "+41"),
  r("AT", "Austria", "+43"),
  r("SE", "Sweden", "+46"),
  r("NO", "Norway", "+47"),
  r("DK", "Denmark", "+45"),
  r("FI", "Finland", "+358"),
  r("IS", "Iceland", "+354"),
  r("IE", "Ireland", "+353"),
  r("PL", "Poland", "+48"),
  r("CZ", "Czech Republic", "+420"),
  r("SK", "Slovakia", "+421"),
  r("HU", "Hungary", "+36"),
  r("RO", "Romania", "+40"),
  r("BG", "Bulgaria", "+359"),
  r("HR", "Croatia", "+385"),
  r("SI", "Slovenia", "+386"),
  r("RS", "Serbia", "+381"),
  r("BA", "Bosnia and Herzegovina", "+387"),
  r("ME", "Montenegro", "+382"),
  r("MK", "North Macedonia", "+389"),
  r("AL", "Albania", "+355"),
  r("GR", "Greece", "+30"),
  r("CY", "Cyprus", "+357"),
  r("MT", "Malta", "+356"),
  r("EE", "Estonia", "+372"),
  r("LV", "Latvia", "+371"),
  r("LT", "Lithuania", "+370"),
  r("BY", "Belarus", "+375"),
  r("UA", "Ukraine", "+380"),
  r("MD", "Moldova", "+373"),
  r("RU", "Russia", "+7"),

  // === 北美 ===
  r("US", "United States", "+1"),
  r("CA", "Canada", "+1"),
  r("MX", "Mexico", "+52", ["sms", "whatsapp"]),
  r("GT", "Guatemala", "+502"),
  r("CR", "Costa Rica", "+506"),
  r("PA", "Panama", "+507"),
  r("HN", "Honduras", "+504"),
  r("SV", "El Salvador", "+503"),
  r("NI", "Nicaragua", "+505"),
  r("BZ", "Belize", "+501"),
  r("JM", "Jamaica", "+1-876"),
  r("HT", "Haiti", "+509"),
  r("CU", "Cuba", "+53"),
  r("DO", "Dominican Republic", "+1-809"),

  // === 南美 ===
  r("BR", "Brazil", "+55", ["sms", "whatsapp"]),
  r("AR", "Argentina", "+54"),
  r("CL", "Chile", "+56"),
  r("CO", "Colombia", "+57"),
  r("PE", "Peru", "+51"),
  r("VE", "Venezuela", "+58"),
  r("EC", "Ecuador", "+593"),
  r("BO", "Bolivia", "+591"),
  r("PY", "Paraguay", "+595"),
  r("UY", "Uruguay", "+598"),
  r("GY", "Guyana", "+592"),
  r("SR", "Suriname", "+597"),

  // === 非洲 ===
  r("ZA", "South Africa", "+27"),
  r("EG", "Egypt", "+20"),
  r("NG", "Nigeria", "+234"),
  r("KE", "Kenya", "+254"),
  r("GH", "Ghana", "+233"),
  r("MA", "Morocco", "+212"),
  r("TZ", "Tanzania", "+255"),
  r("ET", "Ethiopia", "+251"),
  r("UG", "Uganda", "+256"),
  r("DZ", "Algeria", "+213"),
  r("TN", "Tunisia", "+216"),
  r("LY", "Libya", "+218"),
  r("SD", "Sudan", "+249"),
  r("SN", "Senegal", "+221"),
  r("ML", "Mali", "+223"),
  r("BF", "Burkina Faso", "+226"),
  r("GN", "Guinea", "+224"),
  r("SL", "Sierra Leone", "+232"),
  r("LR", "Liberia", "+231"),
  r("CI", "Ivory Coast", "+225"),
  r("TG", "Togo", "+228"),
  r("BJ", "Benin", "+229"),
  r("NE", "Niger", "+227"),
  r("CM", "Cameroon", "+237"),
  r("TD", "Chad", "+235"),
  r("CF", "Central African Republic", "+236"),
  r("CG", "Congo", "+242"),
  r("CD", "DR Congo", "+243"),
  r("GA", "Gabon", "+241"),
  r("GQ", "Equatorial Guinea", "+240"),
  r("ST", "Sao Tome and Principe", "+239"),
  r("AO", "Angola", "+244"),
  r("MZ", "Mozambique", "+258"),
  r("ZW", "Zimbabwe", "+263"),
  r("ZM", "Zambia", "+260"),
  r("MW", "Malawi", "+265"),
  r("BW", "Botswana", "+267"),
  r("NA", "Namibia", "+264"),
  r("SZ", "Eswatini", "+268"),
  r("LS", "Lesotho", "+266"),
  r("MU", "Mauritius", "+230"),
  r("MG", "Madagascar", "+261"),
  r("SC", "Seychelles", "+248"),
  r("KM", "Comoros", "+269"),
  r("DJ", "Djibouti", "+253"),
  r("ER", "Eritrea", "+291"),
  r("SO", "Somalia", "+252"),
  r("RW", "Rwanda", "+250"),
  r("BI", "Burundi", "+257"),
  r("SS", "South Sudan", "+211"),
  r("GM", "Gambia", "+220"),
  r("GW", "Guinea-Bissau", "+245"),
  r("CV", "Cape Verde", "+238"),
  r("MR", "Mauritania", "+222"),

  // === 大洋洲 ===
  r("AU", "Australia", "+61"),
  r("NZ", "New Zealand", "+64"),
  r("FJ", "Fiji", "+679"),
  r("PG", "Papua New Guinea", "+675"),
  r("SB", "Solomon Islands", "+677"),
  r("VU", "Vanuatu", "+678"),
  r("WS", "Samoa", "+685"),
  r("TO", "Tonga", "+676"),
  r("KI", "Kiribati", "+686"),
  r("NR", "Nauru", "+674"),
  r("TV", "Tuvalu", "+688"),
  r("FM", "Micronesia", "+691"),
  r("MH", "Marshall Islands", "+692"),
  r("PW", "Palau", "+680"),
];

// ====== 默认配置 ======
export const defaultAuthConfig: AuthConfig = {
  region: "VN",
  registerMethods: ["email", "phone"],
  loginMethods: ["email", "phone"],
  loginModes: ["both"], // 默认支持密码+OTP
  registerFields: [
    { name: "name", label: "姓名", type: "text", required: true, placeholder: "请输入您的姓名" },
    { name: "email", label: "邮箱", type: "email", required: true, placeholder: "your@email.com" },
    { name: "phone", label: "手机号", type: "tel", required: false, placeholder: "+84 9xx xxx xxx" },
    { name: "password", label: "密码", type: "password", required: true, placeholder: "至少8位字符" },
  ],
  loginFields: [
    { name: "email", label: "邮箱", type: "email", required: true, placeholder: "your@email.com" },
    { name: "password", label: "密码", type: "password", required: true, placeholder: "请输入密码" },
  ],
  // 后端下发的注册 Flow 步骤
  registerFlowSteps: ["basic_info", "password", "profile", "otp", "agreements"],
  emailVerificationRequired: true,
  phoneVerificationRequired: false,
  allowSkipVerification: true,
  twoFactorEnabled: false,
  twoFactorType: "sms",
  agreements: [
    { id: "terms", title: "服务条款", required: true },
    { id: "privacy", title: "隐私政策", required: true },
    { id: "risk", title: "风险披露声明", required: true },
  ],
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
};

/**
 * 解析租户的 auth 配置
 */
export function parseAuthConfig(authJson: string | null | undefined): AuthConfig {
  if (!authJson) return defaultAuthConfig;
  try {
    const parsed = JSON.parse(authJson) as Partial<AuthConfig>;
    return { ...defaultAuthConfig, ...parsed };
  } catch {
    return defaultAuthConfig;
  }
}
