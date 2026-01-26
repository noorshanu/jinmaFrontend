const API_BASE_URL ='https://api.jinma.tech/api';

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
  };
}

export interface TransferResponse {
  id: string;
  direction: string;
  amount: number;
  status: string;
  createdAt: string;
  newBalances: {
    mainBalance: number;
    movementBalance: number;
  };
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
    status: string;
    createdAt: string;
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
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
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

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    token: string,
    amount: number,
    transactionHash: string,
    senderAddress: string
  ): Promise<ApiResponse<DepositResponse>> {
    return this.request<DepositResponse>('/wallet/deposit/walletconnect', {
      method: 'POST',
      body: JSON.stringify({ token, amount, transactionHash, senderAddress }),
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

  // Withdrawal endpoints
  async getWithdrawalSettings(): Promise<ApiResponse<WithdrawalSettingsResponse>> {
    return this.request<WithdrawalSettingsResponse>('/withdrawal/settings');
  }

  async createWithdrawal(
    amount: number,
    walletAddress: string
  ): Promise<ApiResponse<WithdrawalResponse>> {
    return this.request<WithdrawalResponse>('/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount, walletAddress }),
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
}

export const apiClient = new ApiClient(API_BASE_URL);
