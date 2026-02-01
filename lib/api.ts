const API_BASE_URL = 'https://api.jinma.tech/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    referralCode: string;
    role: string;
    emailVerified: boolean;
  };
}

/** Login response when 2FA is required (no token until verify-2fa) */
export interface Login2FARequiredResponse {
  requires2FA: true;
  tempToken: string;
  methods: ('totp' | 'email')[];
  user: LoginResponse['user'];
}

export interface TwoFAStatusResponse {
  twoFactorEnabled: boolean;
  twoFactorTotpEnabled: boolean;
  twoFactorEmailEnabled: boolean;
  methods: ('totp' | 'email')[];
}

export interface TOTPSetupResponse {
  secret: string;
  qrCode: string;
}

export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  referredBy: string | null;
  role: string;
  isActive: boolean;
  isTradingActive: boolean;
  tradingActivatedAt: string | null;
  grade: string;
  personalTurnover: number;
  createdAt: string;
}

export interface SignupOTPResponse {
  email: string;
}

export interface WalletResponse {
  wallet: {
    id: string;
    mainBalance: number;
    movementBalance: number;
    totalBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalTransferred: number;
    createdAt: string;
    // Transfer lock info
    transferLock: {
      isLocked: boolean;
      lockEndsAt: string | null;
      lockRemainingMs: number;
      lockDurationDays: number;
      lastMainToMovementTransfer: string | null;
    };
    // Transfer fee info
    transferFee: {
      feePercent: number;
      flatFee: number;
      minAmount: number;
      isEnabled: boolean;
      message: string;
    };
  };
}

export interface TransferResponse {
  id: string;
  direction: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  createdAt: string;
  newBalances: {
    mainBalance: number;
    movementBalance: number;
  };
  lockTriggered?: boolean;
  lockDurationDays?: number;
}

export interface TransferHistoryResponse {
  transfers: Array<{
    id: string;
    direction: string;
    amount: number;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PlatformWalletResponse {
  address: string;
  network: string;
  supportedTokens: string[];
}

export interface DepositResponse {
  deposit: {
    id: string;
    depositType: string;
    token: string;
    requestedAmount: number;
    approvedAmount?: number | null;
    status: string;
    transactionHash?: string | null;
    createdAt: string;
  };
}

export interface WalletActivityItem {
  type: 'deposit' | 'transfer' | 'admin_credit';
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  depositType?: string;
  direction?: string;
  status?: string;
  adminDisplayName?: string;
  note?: string | null;
}

export interface WalletActivityResponse {
  activities: WalletActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DepositHistoryResponse {
  deposits: Array<{
    id: string;
    depositType: string;
    token: string;
    requestedAmount: number;
    approvedAmount: number | null;
    status: string;
    transactionUrl: string | null;
    transactionHash: string | null;
    adminNote: string | null;
    createdAt: string;
    processedAt: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WithdrawalSettingsResponse {
  settings: {
    isWithdrawalOpen: boolean;
    isWithdrawalEnabled: boolean;
    nextWithdrawalDate: string | null;
    withdrawalEndDate: string | null;
    minAmount: number;
    maxAmount: number;
    feePercent: number;
    flatFee: number;
    message: string;
  };
}

export interface WithdrawalResponse {
  withdrawal: {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    walletAddress: string;
    network: string;
    token: string;
    status: string;
    createdAt: string;
  };
}

export interface WithdrawalHistoryResponse {
  withdrawals: Array<{
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    walletAddress: string;
    network: string;
    token: string;
    status: string;
    adminNote: string | null;
    rejectionReason: string | null;
    transactionHash: string | null;
    createdAt: string;
    approvedAt: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Signal types
export interface Signal {
  id: string;
  type: 'DAILY' | 'REFERRAL' | 'WELCOME';
  timeSlot: 'MORNING' | 'EVENING' | 'REFERRAL' | 'WELCOME' | 'CUSTOM';
  /** When set by admin (e.g. "09:00"), display as "9:00 AM UTC" on user side */
  customTime?: string | null;
  title: string;
  description?: string;
  commitPercent: number;
  createdAt: string;
  expiresAt: string;
  timeRemaining: number; // seconds
}

export interface SignalLimits {
  dailySignalsUsed: number;
  dailySignalsRemaining: number;
  referralSignalsUsed: number;
  referralSignalsRemaining: number;
  maxDailySignals: number;
  maxReferralSignals: number;
}

export interface AvailableSignalsResponse {
  signals: Signal[];
  limits: SignalLimits;
}

export interface SignalHistoryItem {
  id: string;
  signal: {
    id: string;
    title: string;
    type: 'DAILY' | 'REFERRAL' | 'WELCOME';
    timeSlot: 'MORNING' | 'EVENING' | 'REFERRAL' | 'WELCOME' | 'CUSTOM';
  } | null;
  committedAmount: number;
  outcome: 'PENDING' | 'PROFIT' | 'LOSS' | 'CANCELLED';
  resultAmount: number;
  profitPercent?: number;
  confirmedAt: string;
  settledAt: string | null;
  movementBalanceBefore: number;
  movementBalanceAfter: number;
}

export interface SignalHistoryResponse {
  history: SignalHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConfirmSignalResponse {
  id: string;
  signal: {
    id: string;
    title: string;
    type: string;
    expiresAt: string;
  };
  committedAmount: number;
  outcome: string;
  confirmedAt: string;
  settlesAt: string;
  movementBalanceBefore: number;
  lockedBalance: number;
  availableBalance: number;
}

export interface SignalUsageResponse {
  id: string;
  signal: {
    id: string;
    title: string;
    type: string;
    timeSlot: string;
    expiresAt: string;
  } | null;
  committedAmount: number;
  outcome: 'PENDING' | 'PROFIT' | 'LOSS' | 'CANCELLED';
  resultAmount: number;
  profitPercent: number;
  confirmedAt: string;
  settledAt: string | null;
  movementBalanceBefore: number;
  movementBalanceAfter: number;
}

// Grade types
export interface GradeInfo {
  name: string;
  level: number;
  minTurnover: number;
  salary: number;
  isCurrent: boolean;
  isEligible: boolean;
  isUnlocked: boolean;
}

export interface GradeStatusResponse {
  currentGrade: string;
  currentSalary: number;
  personalTurnover: number;
  eligibleGrade: string;
  eligibleSalary: number;
  canUpgrade: boolean;
  hasPendingRequest: boolean;
  pendingRequestGrade: string | null;
  nextGrade: string | null;
  nextGradeMinTurnover: number | null;
  nextGradeSalary: number | null;
  salaryStartDate: string | null;
  grades: GradeInfo[];
}

export interface GradeRequest {
  id: string;
  requestedGrade: string;
  currentGrade: string;
  personalTurnover: number;
  requiredTurnover: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  processedBy: { id: string; name: string } | null;
  processedAt: string | null;
  requestedAt: string;
}

export interface SalaryPayment {
  id: string;
  grade: string;
  amount: number;
  month: number;
  year: number;
  status: 'PENDING' | 'PAID' | 'SKIPPED';
  paidAt: string | null;
  note: string | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting – throw with a known message so callers can retry quietly
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Don't log to console: 429 (rate limit) or Failed to fetch (network) – callers handle retry
        const msg = error.message;
        const isRateLimit = msg.includes('Too many requests');
        const isNetworkError = msg === 'Failed to fetch' || msg.includes('NetworkError');
        if (!isRateLimit && !isNetworkError) {
          console.error('API Error:', msg);
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  async sendSignupOTP(
    email: string,
    password: string,
    referralCode: string,
    firstName: string,
    lastName: string
  ): Promise<ApiResponse<SignupOTPResponse>> {
    return this.request<SignupOTPResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, referralCode, firstName, lastName }),
    });
  }

  async verifySignupOTP(
    email: string,
    otp: string,
    password: string,
    referralCode: string,
    firstName: string,
    lastName: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, password, referralCode, firstName, lastName }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse | Login2FARequiredResponse>> {
    return this.request<LoginResponse | Login2FARequiredResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verify2FA(tempToken: string, code: string, method: 'totp' | 'email'): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code, method }),
    });
  }

  async send2FAEmailOTP(tempToken: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/2fa/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({ tempToken }),
    });
  }

  async get2FAStatus(): Promise<ApiResponse<TwoFAStatusResponse>> {
    return this.request<TwoFAStatusResponse>('/auth/2fa/status');
  }

  async setupTOTP(): Promise<ApiResponse<TOTPSetupResponse>> {
    return this.request<TOTPSetupResponse>('/auth/2fa/totp/setup');
  }

  async verifyTOTPSetup(code: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/2fa/totp/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async enableEmail2FA(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/2fa/email/enable', {
      method: 'POST',
    });
  }

  async disable2FA(password: string, method?: 'totp' | 'email' | 'all'): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password, method: method ?? 'all' }),
    });
  }

  async sendPasswordResetOTP(email: string): Promise<ApiResponse<null>> {
    return this.request<null>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.request<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.request<null>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Wallet endpoints
  async getWallet(): Promise<ApiResponse<WalletResponse>> {
    return this.request<WalletResponse>('/wallet');
  }

  async getPlatformWallet(): Promise<ApiResponse<PlatformWalletResponse>> {
    return this.request<PlatformWalletResponse>('/wallet/platform-address');
  }

  async createManualDeposit(formData: FormData): Promise<ApiResponse<DepositResponse>> {
    const url = `${this.baseUrl}/wallet/deposit/manual`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  }

  async createWalletConnectDeposit(
    transactionHash: string,
    senderAddress: string,
    chainId?: number
  ): Promise<ApiResponse<DepositResponse>> {
    return this.request<DepositResponse>('/wallet/deposit/walletconnect', {
      method: 'POST',
      body: JSON.stringify({ transactionHash, senderAddress, chainId }),
    });
  }

  async getDepositHistory(page = 1, limit = 10): Promise<ApiResponse<DepositHistoryResponse>> {
    return this.request<DepositHistoryResponse>(`/wallet/deposits?page=${page}&limit=${limit}`);
  }

  async transferBetweenWallets(
    direction: 'main_to_movement' | 'movement_to_main',
    amount: number,
    note?: string
  ): Promise<ApiResponse<TransferResponse>> {
    return this.request<TransferResponse>('/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ direction, amount, note }),
    });
  }

  async getTransferHistory(page = 1, limit = 10): Promise<ApiResponse<TransferHistoryResponse>> {
    return this.request<TransferHistoryResponse>(`/wallet/transfers?page=${page}&limit=${limit}`);
  }

  async getWalletActivity(page = 1, limit = 20): Promise<ApiResponse<WalletActivityResponse>> {
    return this.request<WalletActivityResponse>(`/wallet/activity?page=${page}&limit=${limit}`);
  }

  // Withdrawal endpoints
  async getWithdrawalSettings(): Promise<ApiResponse<WithdrawalSettingsResponse>> {
    return this.request<WithdrawalSettingsResponse>('/withdrawal/settings');
  }

  async sendWithdrawalOTP(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/withdrawal/send-otp', {
      method: 'POST',
    });
  }

  async createWithdrawal(
    amount: number,
    walletAddress: string,
    network: string,
    otp: string
  ): Promise<ApiResponse<WithdrawalResponse>> {
    return this.request<WithdrawalResponse>('/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount, walletAddress, network, otp }),
    });
  }

  async getWithdrawalHistory(page = 1, limit = 10): Promise<ApiResponse<WithdrawalHistoryResponse>> {
    return this.request<WithdrawalHistoryResponse>(`/withdrawal/history?page=${page}&limit=${limit}`);
  }

  async cancelWithdrawal(withdrawalId: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/withdrawal/${withdrawalId}`, {
      method: 'DELETE',
    });
  }

  // Referral endpoints
  async getReferralStats(): Promise<ApiResponse<{
    referralCode: string;
    referralEarnings: number;
    totalReferrals: number;
    activeReferrals: number;
    bonusPercent: number;
    referralUrl: string;
    recentBonuses: Array<{
      id: string;
      referee: { name: string; email: string } | null;
      bonusAmount: number;
      bonusPercent: number;
      basedOnAmount: number;
      level: number;
      createdAt: string;
    }>;
  }>> {
    return this.request('/referral/stats');
  }

  async getDownline(): Promise<ApiResponse<{
    downline: Array<{
      id: string;
      name: string;
      email: string;
      joinedAt: string;
      isTradingActive: boolean;
      referralEarnings: number;
      totalReferrals: number;
    }>;
  }>> {
    return this.request('/referral/downline');
  }

  // Signal endpoints
  async getAvailableSignals(): Promise<ApiResponse<AvailableSignalsResponse>> {
    return this.request<AvailableSignalsResponse>('/signals/available');
  }

  async getSignalHistory(page = 1, limit = 20): Promise<ApiResponse<SignalHistoryResponse>> {
    return this.request<SignalHistoryResponse>(`/signals/history?page=${page}&limit=${limit}`);
  }

  async confirmSignal(signalId: string): Promise<ApiResponse<ConfirmSignalResponse>> {
    return this.request<ConfirmSignalResponse>(`/signals/${signalId}/confirm`, {
      method: 'POST',
    });
  }

  async getSignalUsage(usageId: string): Promise<ApiResponse<SignalUsageResponse>> {
    return this.request<SignalUsageResponse>(`/signals/usage/${usageId}`);
  }

  // Grade endpoints
  async getGradeStatus(): Promise<ApiResponse<GradeStatusResponse>> {
    return this.request<GradeStatusResponse>('/grades/status');
  }

  async requestGradeUpgrade(): Promise<ApiResponse<{ request: GradeRequest }>> {
    return this.request<{ request: GradeRequest }>('/grades/request-upgrade', {
      method: 'POST',
    });
  }

  async getGradeRequestHistory(): Promise<ApiResponse<{ requests: GradeRequest[] }>> {
    return this.request<{ requests: GradeRequest[] }>('/grades/requests');
  }

  async getSalaryHistory(): Promise<ApiResponse<{ payments: SalaryPayment[] }>> {
    return this.request<{ payments: SalaryPayment[] }>('/grades/salary-history');
  }

  // User profile
  async getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>('/user/profile');
  }

  // Chat (1:1 with admin)
  async getChatConversation(): Promise<
    ApiResponse<{ id: string; user: string; adminParticipant: string | null; createdAt: string }>
  > {
    return this.request('/chat/conversation');
  }

  async getChatMessages(
    conversationId: string,
    opts?: { before?: string; limit?: number }
  ): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    const params = new URLSearchParams({ conversationId });
    if (opts?.before) params.set('before', opts.before);
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    return this.request<{ messages: ChatMessage[] }>(`/chat/messages?${params}`);
  }

  async sendChatMessage(
    conversationId: string,
    content: string,
    opts?: { type?: 'text' | 'image'; attachment?: { url: string; publicId?: string; mimeType?: string; originalName?: string } }
  ): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content,
        type: opts?.type ?? 'text',
        attachment: opts?.attachment,
      }),
    });
  }

  async uploadChatImage(file: File): Promise<
    ApiResponse<{ url: string; publicId: string; mimeType?: string; originalName?: string }>
  > {
    const url = `${this.baseUrl}/chat/upload`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  type: 'text' | 'image' | 'video' | 'file' | 'cls_signal';
  content: string;
  attachment: { url: string; publicId?: string; mimeType?: string; originalName?: string } | null;
  signal: {
    id: string;
    title: string;
    commitPercent: number;
    outcomeType: string;
    profitMinPercent?: number;
    profitMaxPercent?: number;
    expiresAt: string;
    status: string;
  } | null;
  createdAt: string;
}

export const apiClient = new ApiClient(API_BASE_URL);
