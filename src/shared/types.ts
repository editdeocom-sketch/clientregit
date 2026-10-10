export type Currency = 'INR' | 'USD'

export const CURRENCIES: Currency[] = ['INR', 'USD']

export const CURRENCY_SYMBOL: Record<Currency, string> = { INR: '₹', USD: '$' }

export type ProjectStatus =
  | 'enquiry'
  | 'in_progress'
  | 'review'
  | 'revision'
  | 'delivered'
  | 'cancelled'

export const PROJECT_STATUSES: ProjectStatus[] = [
  'enquiry',
  'in_progress',
  'review',
  'revision',
  'delivered',
  'cancelled'
]

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  enquiry: 'Enquiry',
  in_progress: 'In Progress',
  review: 'In Review',
  revision: 'Revision',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'cancelled'
]

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
}

export type Priority = 'low' | 'normal' | 'high'

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High'
}

export type FileKind = 'folder' | 'premiere' | 'after_effects' | 'resolve' | 'final_cut' | 'other'

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  folder: 'Folder',
  premiere: 'Premiere Pro',
  after_effects: 'After Effects',
  resolve: 'DaVinci Resolve',
  final_cut: 'Final Cut Pro',
  other: 'File'
}

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
  tags: string[]
  color: string
  currency: Currency | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface ClientInput {
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  tags?: string[]
  color?: string
  currency?: Currency | null
}

export interface Project {
  id: string
  client_id: string
  client_name?: string
  title: string
  description: string
  status: ProjectStatus
  priority: Priority
  deadline: string | null
  delivered_at: string | null
  quoted_amount: number | null
  currency: Currency
  created_at: string
  updated_at: string
}

export interface ProjectInput {
  client_id: string
  title: string
  description?: string
  status?: ProjectStatus
  priority?: Priority
  deadline?: string | null
  quoted_amount?: number | null
  currency?: Currency
}

export interface ProjectFile {
  id: string
  project_id: string
  path: string
  label: string
  kind: FileKind
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  done: boolean
  due_date: string | null
  position: number
  assignee_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  due_date?: string | null
  assignee_id?: string | null
}

export interface TaskPatch {
  title?: string
  done?: boolean
  due_date?: string | null
  assignee_id?: string | null
}

export interface ProjectFileInput {
  path: string
  label?: string
  kind?: FileKind
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface InvoiceItemInput {
  description: string
  quantity: number
  rate: number
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  paid_at: string
  method: string
  reference: string
  notes: string
}

export interface PaymentInput {
  amount: number
  paid_at?: string
  method?: string
  reference?: string
  notes?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client_name?: string
  project_id: string | null
  project_title?: string | null
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  currency: Currency
  subtotal: number
  tax_percent: number
  tax_amount: number
  discount: number
  total: number
  notes: string
  created_at: string
  updated_at: string
  items: InvoiceItem[]
  payments: Payment[]
  amount_paid: number
  balance: number
}

export interface InvoiceInput {
  client_id: string
  project_id?: string | null
  issue_date: string
  due_date?: string | null
  status?: InvoiceStatus
  currency: Currency
  tax_percent?: number
  discount?: number
  notes?: string
  items: InvoiceItemInput[]
}

export interface AppSettings {
  business_name: string
  business_tagline: string
  business_email: string
  business_phone: string
  business_address: string
  business_tax_id: string
  currency: Currency
  tax_percent: number
  invoice_prefix: string
  invoice_next: number
  invoice_terms: string
  theme: 'light' | 'dark'
}

export type SettingsPatch = Partial<AppSettings>

export interface DashboardStats {
  active_projects: number
  overdue_deadlines: number
  unpaid: Record<Currency, number>
  revenue_month: Record<Currency, number>
}

export interface MonthPoint {
  month: string
  INR: number
  USD: number
}

export interface ClientIncome {
  client_id: string
  client_name: string
  INR: number
  USD: number
}

export interface StatusCount {
  status: ProjectStatus
  count: number
}

export interface CalendarEvent {
  date: string
  kind: 'deadline' | 'invoice_due'
  id: string
  title: string
  subtitle: string
  status: string
  route: string
}

export type BackupTable =
  | 'clients'
  | 'projects'
  | 'project_files'
  | 'invoices'
  | 'invoice_items'
  | 'payments'

export interface BackupPayload {
  app: 'clientregit'
  version: number
  exported_at: string
  settings: AppSettings
  clients: unknown[]
  projects: unknown[]
  project_files: unknown[]
  invoices: unknown[]
  invoice_items: unknown[]
  payments: unknown[]
}

export interface ClientListOptions {
  q?: string
  includeArchived?: boolean
}

export interface ProjectListOptions {
  q?: string
  client_id?: string
  status?: ProjectStatus
  includeDone?: boolean
}

export interface InvoiceListOptions {
  q?: string
  status?: InvoiceStatus
  client_id?: string
}

export interface BackupImportResult {
  counts: Record<BackupTable | 'settings', number>
}

export interface ExportResult {
  path: string | null
}

export type InvoicePrintFormat = 'print' | 'pdf'

export type LicenseStatus =
  | 'trial'
  | 'trial_expired'
  | 'activated'
  | 'license_expired'
  | 'team_online_required'
  | 'seat_unavailable'

export type LicenseType = 'perpetual' | 'subscription'

export interface LicenseState {
  status: LicenseStatus
  trial_days_left: number
  trial_ends_at: string | null
  email: string | null
  license_key: string | null
  license_type: LicenseType | null
  license_expires_at: string | null
  last_validated_at: string | null
  site_url: string
  is_team: boolean
  seats: number | null
  seats_used: number | null
}

export interface LicenseSignInInput {
  email: string
  password: string
}

export interface LicenseActivateInput {
  email?: string
  password?: string
  licenseKey: string
}

export interface TeamMember {
  user_id: string
  email: string | null
  role: 'leader' | 'member'
}

export interface TeamStatus {
  inTeam: boolean
  teamName: string | null
  role: 'leader' | 'member' | null
  memberCount: number
  lastSyncAt: string | null
  syncing: boolean
  lastError: string | null
}

export interface Api {
  clients: {
    list(options?: ClientListOptions): Promise<Client[]>
    get(id: string): Promise<Client | null>
    create(input: ClientInput): Promise<Client>
    update(id: string, input: ClientInput): Promise<Client>
    setArchived(id: string, archived: boolean): Promise<void>
    remove(id: string): Promise<void>
    totals(id: string): Promise<{ projects: number; invoiced: number; paid: number }>
  }
  projects: {
    list(options?: ProjectListOptions): Promise<Project[]>
    get(id: string): Promise<Project | null>
    create(input: ProjectInput): Promise<Project>
    update(id: string, input: ProjectInput): Promise<Project>
    remove(id: string): Promise<void>
    files(projectId: string): Promise<ProjectFile[]>
    addFile(projectId: string, input: ProjectFileInput): Promise<ProjectFile>
    removeFile(fileId: string): Promise<void>
  }
  invoices: {
    list(options?: InvoiceListOptions): Promise<Invoice[]>
    get(id: string): Promise<Invoice | null>
    previewNumber(): Promise<string>
    create(input: InvoiceInput): Promise<Invoice>
    update(id: string, input: InvoiceInput): Promise<Invoice>
    setStatus(id: string, status: InvoiceStatus): Promise<void>
    remove(id: string): Promise<void>
    addPayment(id: string, input: PaymentInput): Promise<Invoice>
    removePayment(paymentId: string): Promise<Invoice | null>
    preview(id: string): Promise<void>
    print(id: string, format: InvoicePrintFormat): Promise<ExportResult>
  }
  tasks: {
    list(projectId: string): Promise<Task[]>
    create(projectId: string, input: TaskInput): Promise<Task>
    update(id: string, patch: TaskPatch): Promise<Task>
    remove(id: string): Promise<void>
  }
  license: {
    getState(): Promise<LicenseState>
    signIn(input: LicenseSignInInput): Promise<{ email: string }>
    activate(input: LicenseActivateInput): Promise<LicenseState>
    deactivate(): Promise<LicenseState>
  }
  team: {
    status(): Promise<TeamStatus>
    roster(): Promise<TeamMember[]>
    syncNow(): Promise<TeamStatus>
    onSynced(cb: () => void): () => void
  }
  settings: {
    get(): Promise<AppSettings>
    patch(patch: SettingsPatch): Promise<AppSettings>
  }
  dashboard: {
    stats(): Promise<DashboardStats>
    revenue(months: number, currency: Currency): Promise<MonthPoint[]>
    incomeByClient(currency: Currency, limit: number): Promise<ClientIncome[]>
    statusCounts(): Promise<StatusCount[]>
    upcoming(days: number): Promise<CalendarEvent[]>
  }
  calendar: {
    range(start: string, end: string): Promise<CalendarEvent[]>
  }
  backup: {
    exportJson(): Promise<ExportResult>
    importJson(mode: 'replace' | 'merge'): Promise<BackupImportResult | null>
    exportCsv(table: BackupTable): Promise<ExportResult>
    openDataFolder(): Promise<void>
  }
  files: {
    pick(properties: Array<'openFile' | 'openDirectory'>): Promise<string[]>
    openPath(path: string): Promise<{ ok: boolean; error: string }>
    reveal(path: string): Promise<void>
    openExternal(url: string): Promise<void>
  }
}
