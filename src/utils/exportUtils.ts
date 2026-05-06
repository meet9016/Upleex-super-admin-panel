import { api } from './axiosInstance';
import endPointApi from './endPointApi';

type ExportFormat = 'xlsx' | 'pdf';

interface ExportConfig {
  endpoint: string;
  format: ExportFormat;
  /** Base filename prefix (e.g. "vendors") */
  prefix: string;
  /** Optional query params / filters */
  filters?: Record<string, any>;
}

/**
 * Triggers a browser file download from a Blob response.
 */
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Builds a URLSearchParams string from a filters object, skipping empty values.
 */
const buildQueryString = (filters: Record<string, any> = {}): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

/**
 * Extracts a filename from the `Content-Disposition` response header,
 */
const resolveFilename = (
  headers: Record<string, string>,
  prefix: string,
  ext: string
): string => {
  const disposition = headers['content-disposition'];
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) return match[1].trim();
  }
  return `${prefix}_${new Date().toISOString().split('T')[0]}.${ext}`;
};

/**
 * Generic export handler used by all specific export functions.
 * Hits the given endpoint with optional filters and downloads the file.
 */
export const exportData = async ({
  endpoint,
  format,
  prefix,
  filters = {},
}: ExportConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const qs = buildQueryString(filters);
    const url = qs ? `${endpoint}?${qs}` : endpoint;

    const response = await api.get(url, { responseType: 'blob' });

    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    const filename = resolveFilename(response.headers as any, prefix, ext);
    downloadFile(response.data, filename);

    return {
      success: true,
      message: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} exported to ${format.toUpperCase()} successfully`,
    };
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || `Failed to export ${prefix} to ${format.toUpperCase()}`
    );
  }
};

// ─── Named wrappers (backward-compatible) ─────────────────────────────────────
// All existing imports across the codebase continue to work unchanged.

export const exportVendorsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorsExcel, format: 'xlsx', prefix: 'vendors', filters });

export const exportVendorsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorsPDF, format: 'pdf', prefix: 'vendors', filters });

export const exportVendorWalletsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorWalletsExcel, format: 'xlsx', prefix: 'vendor_wallets', filters });

export const exportVendorWalletsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorWalletsPDF, format: 'pdf', prefix: 'vendor_wallets', filters });

export const exportWalletTransactionsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportWalletTransactionsExcel, format: 'xlsx', prefix: 'wallet_transactions', filters });

export const exportWalletTransactionsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportWalletTransactionsPDF, format: 'pdf', prefix: 'wallet_transactions', filters });

export const exportVendorReportToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorReportExcel, format: 'xlsx', prefix: 'vendor_report', filters });

export const exportVendorReportToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: (endPointApi as any).exportVendorReportPDF, format: 'pdf', prefix: 'vendor_report', filters });
