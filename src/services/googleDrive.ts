import { getAccessToken } from '../firebase';
import { DriveReportFile } from '../types/market';

/**
 * Service for Google Drive integration
 * Uses REST API with client-side Bearer token obtained from Firebase Auth with OAuth scopes
 */

export const listDriveReports = async (): Promise<DriveReportFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive erişimi için lütfen önce Google ile giriş yapın.');
  }

  const query = encodeURIComponent("name contains 'Piyasa_Raporu_' or name contains 'Kuyumcu_Doviz_'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,webViewLink,size)&orderBy=createdTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive dosyaları listelenemedi: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.files || [];
};

export const uploadReportToDrive = async (
  title: string,
  content: string,
  mimeType: 'text/markdown' | 'application/json' | 'text/plain' = 'text/markdown'
): Promise<DriveReportFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive erişimi için lütfen önce Google ile giriş yapın.');
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: title,
    mimeType: mimeType,
    description: 'RADAR Konsolide Finans Terminali tarafından oluşturulmuş piyasa raporu.',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,webViewLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rapor Drive'a yüklenemedi: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

export const deleteFileFromDrive = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive erişimi için lütfen önce Google ile giriş yapın.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Dosya silinemedi: ${response.statusText} - ${errorText}`);
  }
};
