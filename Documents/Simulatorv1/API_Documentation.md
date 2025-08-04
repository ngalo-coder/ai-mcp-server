# Virtual Patient Simulation Backend API Documentation

## Overview
This document provides a comprehensive guide to all backend APIs available in the Virtual Patient Simulation system, along with detailed instructions for frontend implementation.

## Base Configuration
- **Base URL**: `http://localhost:5002` (development) or your production URL
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`

## Authentication APIs (`/api/auth`)

### 1. User Registration
**Endpoint**: `POST /api/auth/register`
**Access**: Public

```typescript
// Request Body
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Frontend Implementation
const register = async (userData: RegisterRequest) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### 2. User Login
**Endpoint**: `POST /api/auth/login`
**Access**: Public

```typescript
// Request Body
interface LoginRequest {
  email: string;
  password: string;
}

// Response
interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// Frontend Implementation
const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  
  return data;
};
```

### 3. Forgot Password
**Endpoint**: `POST /api/auth/forgot-password`
**Access**: Public

```typescript
// Request Body
interface ForgotPasswordRequest {
  email: string;
}

// Frontend Implementation
const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};
```

### 4. Reset Password
**Endpoint**: `PATCH /api/auth/reset-password/:token`
**Access**: Public

```typescript
// Request Body
interface ResetPasswordRequest {
  password: string;
}

// Frontend Implementation
const resetPassword = async (token: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return response.json();
};
```

## Simulation APIs (`/api/simulation`)

### 1. Get Cases
**Endpoint**: `GET /api/simulation/cases`
**Access**: Protected
**Query Parameters**: `program_area`, `specialty`, `specialized_area`, `page`, `limit`

```typescript
interface PatientCase {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_time: string;
  program_area: string;
  specialized_area: string;
  patient_age: number;
  patient_gender: string;
  chief_complaint: string;
  presenting_symptoms: string[];
  tags: string[];
}

// Frontend Implementation
const getCases = async (filters?: {
  program_area?: string;
  specialty?: string;
  specialized_area?: string;
  page?: number;
  limit?: number;
}): Promise<{ cases: PatientCase[]; currentPage: number; totalPages: number; totalCases: number }> => {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/simulation/cases?${queryParams.toString()}`
  );
  return response.json();
};
```

### 2. Get Case Categories
**Endpoint**: `GET /api/simulation/case-categories`
**Access**: Protected
**Query Parameters**: `program_area`

```typescript
interface CaseCategories {
  program_areas: string[];
  specialties: string[];
  specialized_areas: string[];
}

// Frontend Implementation
const getCaseCategories = async (programArea?: string): Promise<CaseCategories> => {
  const queryParams = programArea ? `?program_area=${programArea}` : '';
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/simulation/case-categories${queryParams}`
  );
  return response.json();
};
```

### 3. Start Simulation
**Endpoint**: `POST /api/simulation/start`
**Access**: Protected

```typescript
// Request Body
interface StartSimulationRequest {
  caseId: string;
}

// Response
interface StartSimulationResponse {
  sessionId: string;
  initialPrompt: string;
  patientName?: string;
  speaks_for?: string;
}

// Frontend Implementation
const startSimulation = async (caseId: string): Promise<StartSimulationResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/start`, {
    method: 'POST',
    body: JSON.stringify({ caseId })
  });
  return response.json();
};
```

### 4. Ask Question (Streaming)
**Endpoint**: `GET /api/simulation/ask`
**Access**: Protected
**Query Parameters**: `sessionId`, `question`

```typescript
// Frontend Implementation using EventSource
const streamSimulationAsk = (
  sessionId: string,
  question: string,
  onChunk: (chunk: string, speaks_for?: string) => void,
  onDone: () => void,
  onError?: (error: any) => void,
  onSessionEnd?: (summary: string) => void
) => {
  const token = localStorage.getItem('authToken');
  const queryParams = new URLSearchParams({ sessionId, question, token: token || '' });
  const eventSource = new EventSource(`${API_BASE_URL}/api/simulation/ask?${queryParams.toString()}`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'chunk':
          onChunk(data.content, data.speaks_for);
          break;
        case 'done':
          eventSource.close();
          onDone();
          break;
        case 'session_end':
          if (onSessionEnd) onSessionEnd(data.summary);
          eventSource.close();
          break;
      }
    } catch (err) {
      if (onError) onError(err);
      eventSource.close();
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => eventSource.close(); // Cleanup function
};
```

### 5. End Session
**Endpoint**: `POST /api/simulation/end`
**Access**: Protected

```typescript
// Request Body
interface EndSessionRequest {
  sessionId: string;
}

// Response
interface SessionEndResponse {
  sessionEnded: boolean;
  evaluation: string;
  history: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
}

// Frontend Implementation
const endSession = async (sessionId: string): Promise<SessionEndResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/simulation/end`, {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
  return response.json();
};
```

### 6. Get Performance Metrics
**Endpoint**: `GET /api/simulation/performance-metrics/session/:sessionId`
**Access**: Protected

```typescript
interface PerformanceMetrics {
  session_ref: string;
  case_ref: string;
  metrics: {
    overall_score: number;
    performance_label: string;
    clinical_reasoning: number;
    communication: number;
    efficiency: number;
    evaluation_summary: string;
  };
  raw_evaluation_text: string;
  evaluated_at: Date;
}

// Frontend Implementation
const getPerformanceMetrics = async (sessionId: string): Promise<PerformanceMetrics> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/simulation/performance-metrics/session/${sessionId}`
  );
  return response.json();
};
```

## User Queue Management APIs (`/api/users`)

### 1. Start Queue Session
**Endpoint**: `POST /api/users/queue/session/start`
**Access**: Protected

```typescript
// Frontend Implementation
const startQueueSession = async () => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/users/queue/session/start`, {
    method: 'POST'
  });
  return response.json();
};
```

### 2. Get Next Case in Queue
**Endpoint**: `POST /api/users/queue/session/:sessionId/next`
**Access**: Protected

```typescript
// Frontend Implementation
const getNextCaseInQueue = async (sessionId: string) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/queue/session/${sessionId}/next`,
    { method: 'POST' }
  );
  return response.json();
};
```

### 3. Mark Case Status
**Endpoint**: `POST /api/users/cases/:originalCaseIdString/status`
**Access**: Protected

```typescript
// Request Body
interface MarkCaseStatusRequest {
  status: 'completed' | 'skipped' | 'in_progress';
}

// Frontend Implementation
const markCaseStatus = async (caseId: string, status: string) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/cases/${caseId}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status })
    }
  );
  return response.json();
};
```

### 4. Get Case History
**Endpoint**: `GET /api/users/cases/history/:userId?`
**Access**: Protected

```typescript
// Frontend Implementation
const getCaseHistory = async (userId?: string) => {
  const endpoint = userId 
    ? `/api/users/cases/history/${userId}`
    : '/api/users/cases/history';
  
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`);
  return response.json();
};
```

## Clinician Progress APIs (`/api/progress`)

### 1. Get Clinician Progress
**Endpoint**: `GET /api/progress/:userId`
**Access**: Protected

```typescript
interface ClinicianProgressResponse {
  userId: string;
  totalCasesCompleted: number;
  overallAverageScore: number;
  specialtyProgress: Array<{
    specialty: string;
    casesCompleted: number;
    averageScore: number;
    lastCompletedAt: Date;
  }>;
  recentPerformance: Array<{
    caseId: string;
    caseTitle: string;
    score: number;
    completedAt: Date;
  }>;
}

// Frontend Implementation
const fetchClinicianProgress = async (userId: string): Promise<ClinicianProgressResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/progress/${userId}`);
  return response.json();
};
```

### 2. Get Progress Recommendations
**Endpoint**: `GET /api/progress/recommendations/:userId`
**Access**: Protected

```typescript
interface ProgressRecommendation {
  recommendedCases: Array<{
    caseId: string;
    title: string;
    specialty: string;
    difficulty: string;
    reason: string;
  }>;
  improvementAreas: string[];
  nextMilestones: string[];
}

// Frontend Implementation
const fetchProgressRecommendations = async (userId: string): Promise<ProgressRecommendation> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/progress/recommendations/${userId}`
  );
  return response.json();
};
```

### 3. Update Progress After Case
**Endpoint**: `POST /api/progress/update`
**Access**: Protected

```typescript
// Request Body
interface UpdateProgressRequest {
  userId: string;
  caseId: string;
  performanceMetricsId: string;
}

// Frontend Implementation
const updateProgressAfterCase = async (data: UpdateProgressRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/progress/update`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Admin APIs (`/api/admin`)

### 1. Get System Statistics
**Endpoint**: `GET /api/admin/stats`
**Access**: Admin only
**Query Parameters**: `startDate`, `endDate`

```typescript
interface SystemStats {
  totalUsers: number;
  totalCases: number;
  totalSessions: number;
  recentUsers: number;
  activeUsers: number;
  recentSessions: number;
  casesBySpecialty: Array<{ _id: string; count: number }>;
  userGrowth: Array<{ _id: { year: number; month: number }; count: number }>;
  generatedAt: string;
  dateRange?: { startDate: string; endDate: string };
}

// Frontend Implementation
const fetchSystemStats = async (dateRange?: { startDate: string; endDate: string }): Promise<SystemStats> => {
  const queryParams = dateRange 
    ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    : '';
  
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/stats${queryParams}`);
  return response.json();
};
```

### 2. Get All Users
**Endpoint**: `GET /api/admin/users`
**Access**: Admin only
**Query Parameters**: `page`, `limit`, `search`

```typescript
interface UsersResponse {
  users: Array<{
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Frontend Implementation
const fetchUsers = async (options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UsersResponse> => {
  const queryParams = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/users?${queryParams.toString()}`
  );
  return response.json();
};
```

### 3. Get All Cases (Admin)
**Endpoint**: `GET /api/admin/cases`
**Access**: Admin only
**Query Parameters**: `page`, `limit`, `specialty`, `programArea`

```typescript
// Frontend Implementation
const fetchAdminCases = async (options?: {
  page?: number;
  limit?: number;
  specialty?: string;
  programArea?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/cases?${queryParams.toString()}`
  );
  return response.json();
};
```

### 4. Delete User
**Endpoint**: `DELETE /api/admin/users/:userId`
**Access**: Admin only

```typescript
// Frontend Implementation
const deleteUser = async (userId: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

### 5. Delete Case
**Endpoint**: `DELETE /api/admin/cases/:caseId`
**Access**: Admin only

```typescript
// Frontend Implementation
const deleteCase = async (caseId: string) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/cases/${caseId}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

### 6. Create Admin User
**Endpoint**: `POST /api/admin/users/admin`
**Access**: Admin only

```typescript
// Request Body
interface CreateAdminRequest {
  username: string;
  email: string;
  password: string;
}

// Frontend Implementation
const createAdminUser = async (userData: CreateAdminRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/admin`, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### 7. Update User Role
**Endpoint**: `PUT /api/admin/users/:userId/role`
**Access**: Admin only

```typescript
// Request Body
interface UpdateRoleRequest {
  role: 'user' | 'admin';
}

// Frontend Implementation
const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  });
  return response.json();
};
```

### 8. Update Case
**Endpoint**: `PUT /api/admin/cases/:caseId`
**Access**: Admin only

```typescript
// Request Body
interface UpdateCaseRequest {
  programArea?: string;
  specialty?: string;
}

// Frontend Implementation
const updateCase = async (caseId: string, data: UpdateCaseRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/cases/${caseId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 9. Get Users with Scores
**Endpoint**: `GET /api/admin/users/scores`
**Access**: Admin only

```typescript
interface UserWithScores {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  totalCases: number;
  averageScore: number;
  excellentCount: number;
  excellentRate: number;
}

// Frontend Implementation
const fetchUsersWithScores = async (): Promise<UserWithScores[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users/scores`);
  return response.json();
};
```

## Program Management APIs (`/api/admin`)

### 1. Get Program Areas
**Endpoint**: `GET /api/admin/program-areas`
**Access**: Public

```typescript
// Frontend Implementation
const fetchProgramAreas = async (): Promise<{ programAreas: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/program-areas`);
  return response.json();
};
```

### 2. Get Specialties
**Endpoint**: `GET /api/admin/specialties`
**Access**: Public

```typescript
// Frontend Implementation
const fetchSpecialties = async (): Promise<{ specialties: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/specialties`);
  return response.json();
};
```

### 3. Add Program Area
**Endpoint**: `POST /api/admin/program-areas`
**Access**: Admin only

```typescript
// Request Body
interface AddProgramAreaRequest {
  name: string;
  description?: string;
}

// Frontend Implementation
const addProgramArea = async (data: AddProgramAreaRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/program-areas`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 4. Add Specialty
**Endpoint**: `POST /api/admin/specialties`
**Access**: Admin only

```typescript
// Request Body
interface AddSpecialtyRequest {
  name: string;
  description?: string;
}

// Frontend Implementation
const addSpecialty = async (data: AddSpecialtyRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/specialties`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Case Contribution APIs (`/api/contribute`)

### 1. Get Form Data
**Endpoint**: `GET /api/contribute/form-data`
**Access**: Public

```typescript
interface ContributionFormData {
  specialties: string[];
  modules: Record<string, string[]>;
  programAreas: string[];
  difficulties: string[];
  locations: string[];
  genders: string[];
  emotionalTones: string[];
}

// Frontend Implementation
const getContributionFormData = async (): Promise<ContributionFormData> => {
  const response = await fetch(`${API_BASE_URL}/api/contribute/form-data`);
  return response.json();
};
```

### 2. Submit Case
**Endpoint**: `POST /api/contribute/submit`
**Access**: Protected (requires contributor eligibility)

```typescript
// Request Body
interface SubmitCaseRequest {
  caseData: {
    case_metadata: {
      title: string;
      specialty: string;
      program_area: string;
      difficulty: string;
      location: string;
    };
    patient_persona: {
      name: string;
      age: number;
      gender: string;
      chief_complaint: string;
      emotional_tone: string;
    };
    clinical_dossier: {
      hidden_diagnosis: string;
    };
    initial_prompt: string;
  };
}

// Frontend Implementation
const submitCase = async (caseData: SubmitCaseRequest['caseData']) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute/submit`, {
    method: 'POST',
    body: JSON.stringify({ caseData })
  });
  return response.json();
};
```

### 3. Save Draft
**Endpoint**: `POST /api/contribute/draft`
**Access**: Protected (requires contributor eligibility)

```typescript
// Frontend Implementation
const saveDraft = async (caseData: any) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute/draft`, {
    method: 'POST',
    body: JSON.stringify({ caseData })
  });
  return response.json();
};
```

### 4. Get My Cases
**Endpoint**: `GET /api/contribute/my-cases`
**Access**: Protected

```typescript
interface ContributedCase {
  _id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  caseData: {
    case_metadata: {
      title: string;
      specialty: string;
      case_id: string;
    };
  };
  submittedAt?: Date;
  createdAt: Date;
  reviewComments?: string;
}

// Frontend Implementation
const getMyCases = async (): Promise<ContributedCase[]> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/contribute/my-cases`);
  return response.json();
};
```

## Performance Tracking APIs (`/api/performance`)

### 1. Record Evaluation
**Endpoint**: `POST /api/performance/record-evaluation`
**Access**: Protected

```typescript
// Request Body
interface RecordEvaluationRequest {
  userId: string;
  userEmail: string;
  userName: string;
  sessionId: string;
  caseId: string;
  caseTitle: string;
  specialty: string;
  module?: string;
  programArea: string;
  overallRating: 'Excellent' | 'Good' | 'Needs Improvement';
  criteriaScores: Record<string, number>;
  totalScore: number;
  duration: number;
  messagesExchanged: number;
}

// Frontend Implementation
const recordEvaluation = async (data: RecordEvaluationRequest) => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/record-evaluation`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 2. Get Performance Summary
**Endpoint**: `GET /api/performance/summary/:userId`
**Access**: Protected

```typescript
interface PerformanceSummary {
  userId: string;
  name: string;
  email: string;
  overallStats: {
    totalEvaluations: number;
    excellentCount: number;
    goodCount: number;
    needsImprovementCount: number;
    excellentRate: string;
  };
  specialtyStats: Record<string, {
    totalCases: number;
    excellentCount: number;
    averageScore: number;
  }>;
  contributorStatus: {
    isEligible: boolean;
    eligibleSpecialties: string[];
    qualificationDate?: Date;
    eligibilityCriteria: Record<string, any>;
  };
  contributionStats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
  };
  recentEvaluations: Array<{
    caseTitle: string;
    specialty: string;
    rating: string;
    score: number;
    completedAt: Date;
  }>;
}

// Frontend Implementation
const getPerformanceSummary = async (userId: string): Promise<PerformanceSummary> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/performance/summary/${userId}`);
  return response.json();
};
```

### 3. Check Contributor Eligibility
**Endpoint**: `GET /api/performance/eligibility/:userId/:specialty`
**Access**: Protected

```typescript
interface EligibilityCheck {
  eligible: boolean;
  specialty: string;
  criteria: {
    excellentCount: number;
    recentExcellent: boolean;
    consistentPerformance: boolean;
    qualificationMet: boolean;
  };
  requirements: {
    excellentRatingsNeeded: number;
    needsRecentExcellent: boolean;
    needsConsistentPerformance: boolean;
  };
}

// Frontend Implementation
const checkEligibility = async (userId: string, specialty: string): Promise<EligibilityCheck> => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/performance/eligibility/${userId}/${specialty}`
  );
  return response.json();
};
```

### 4. Get Leaderboard
**Endpoint**: `GET /api/performance/leaderboard`
**Access**: Protected
**Query Parameters**: `specialty`, `limit`

```typescript
interface LeaderboardEntry {
  userId: string;
  name: string;
  totalCases: number;
  excellentCount: number;
  excellentRate: string;
  averageScore: string;
  isContributor: boolean;
}

// Frontend Implementation
const getLeaderboard = async (options?: {
  specialty?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> => {
  const queryParams = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/performance/leaderboard?${queryParams.toString()}`
  );
  return response.json();
};
```

## Admin Contribution Management APIs (`/api/admin`)

### 1. Get Contributed Cases
**Endpoint**: `GET /api/admin/contributed-cases`
**Access**: Admin only
**Query Parameters**: `status`, `page`, `limit`, `specialty`

```typescript
// Frontend Implementation
const getContributedCases = async (options?: {
  status?: string;
  page?: number;
  limit?: number;
  specialty?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
  }
  
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/contributed-cases?${queryParams.toString()}`
  );
  return response.json();
};
```

### 2. Approve Case
**Endpoint**: `POST /api/admin/contributed-cases/:caseId/approve`
**Access**: Admin only

```typescript
// Request Body
interface ApproveCaseRequest {
  reviewerId: string;
  reviewerName: string;
  reviewComments?: string;
}

// Frontend Implementation
const approveCase = async (caseId: string, reviewData: ApproveCaseRequest) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/contributed-cases/${caseId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify(reviewData)
    }
  );
  return response.json();
};
```

### 3. Reject Case
**Endpoint**: `POST /api/admin/contributed-cases/:caseId/reject`
**Access**: Admin only

```typescript
// Request Body
interface RejectCaseRequest {
  reviewerId: string;
  reviewerName: string;
  reviewComments: string;
}

// Frontend Implementation
const rejectCase = async (caseId: string, reviewData: RejectCaseRequest) => {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/contributed-cases/${caseId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify(reviewData)
    }
  );
  return response.json();
};
```

## Utility Functions for Frontend Implementation

### 1. Authenticated Fetch Wrapper
```typescript
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    console.error("Error accessing localStorage for authToken", e);
    return null;
  }
};

const handleAuthFailure = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  headers.append('Content-Type', 'application/json');

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      handleAuthFailure();
      throw new Error('Unauthorized: Please login again.');
    }
    
    return response;
  } catch (error) {
    throw new Error(`Network error: ${(error as Error).message}`);
  }
};
```

### 2. Error Handling
```typescript
class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (error: any) => {
  if (error instanceof ApiError) {
    // Handle specific API errors
    console.error(`API Error ${error.status}: ${error.message}`);
    return error.message;
  } else {
    // Handle network or other errors
    console.error('Unexpected error:', error);
    return 'An unexpected error occurred. Please try again.';
  }
};
```

### 3. React Hook Example
```typescript
import { useState, useEffect } from 'react';

const useApi = <T>(apiCall: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
};

// Usage example
const CasesList = () => {
  const { data: cases, loading, error } = useApi(() => getCases());
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {cases?.cases.map(case => (
        <div key={case.id}>{case.title}</div>
      ))}
    </div>
  );
};
```

## Environment Configuration

### Frontend Environment Variables
```env
# .env file
VITE_API_URL=http://localhost:5002
VITE_NODE_ENV=development
```

### CORS Configuration
The backend is configured to accept requests from:
- `https://kuiga.online`
- `https://simuatech.netlify.app`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`

## Health Check
**Endpoint**: `GET /health`
**Access**: Public

```typescript
// Frontend Implementation
const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};
```

## Notes for Frontend Developers

1. **Authentication**: All protected endpoints require a Bearer token in the Authorization header
2. **Error Handling**: Implement proper error handling for 401 (unauthorized), 403 (forbidden), 404 (not found), and 500 (server error) responses
3. **Loading States**: Show loading indicators during API calls
4. **Pagination**: Many list endpoints support pagination - implement proper pagination controls
5. **Real-time Updates**: Use EventSource for streaming responses (simulation ask endpoint)
6. **Token Management**: Implement token refresh logic if your backend supports it
7. **Offline Handling**: Consider implementing offline capabilities where appropriate
8. **Rate Limiting**: Be mindful of API rate limits and implement appropriate retry logic

This documentation provides a complete reference for implementing frontend applications that interact with the Virtual Patient Simulation backend APIs.