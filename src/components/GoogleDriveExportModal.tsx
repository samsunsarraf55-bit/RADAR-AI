import React, { useState, useEffect } from 'react';
import { SourcesMap, DriveReportFile } from '../types/market';
import {
  listDriveReports,
  uploadReportToDrive,
  deleteFileFromDrive,
} from '../services/googleDrive';
import { User } from 'firebase/auth';
import {
  HardDrive,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileCode,
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface GoogleDriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  user: User | null;
  onLogin: () => void;
}

export const GoogleDriveExportModal: React.FC<GoogleDriveExportModalProps> = ({
  isOpen,
  onClose,
  sources,
  user,
  onLogin,
}) => {
  const [files, setFiles] = useState<DriveReportFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [fileToDelete, setFileToDelete] = useState<DriveReportFile | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const driveFiles = await listDriveReports();
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Drive listing error:', err);
      setMessage({ type: 'error', text: err?.message || 'Drive dosyaları alınamadı.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchFiles();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Generate Report Content
  const generateReportContent = () => {
    const timestamp = new Date().toLocaleString('tr-TR');
    
    if (format === 'json') {
      const reportObj = {
        title: 'Finans & Kuyumcu Döviz Konsolide Piyasa Raporu',
        generatedAt: new Date().toISOString(),
        firmCount: Object.keys(sources).length,
        sources: sources,
      };
      return JSON.stringify(reportObj, null, 2);
    }

    // Markdown format
    let md = `# Finans & Piyasa Terminal Raporu\n\n`;
    md += `**Rapor Tarihi:** ${timestamp}\n`;
    md += `**Konsolide Firma Sayısı:** 6 Firma (Samsun & Serbest Piyasa)\n\n`;
    md += `## 1. Firma Bazlı Fiyat Listesi\n\n`;

    Object.entries(sources).forEach(([key, s]) => {
      md += `### ${s.sourceName} (${s.category?.toUpperCase() || 'GENEL'})\n`;
      md += `*Adres: ${s.location || '-'} | Tel: ${s.phone || '-'}*\n\n`;
      md += `| Ürün | Alış (₺) | Satış (₺) |\n`;
      md += `| :--- | :---: | :---: |\n`;
      s.data?.forEach((item) => {
        md += `| ${item.name} | ${item.buy.toFixed(2)} | ${item.sell.toFixed(2)} |\n`;
      });
      md += `\n`;
    });

    md += `## 2. Otomatik Piyasa ve Arbitraj Notu\n`;
    md += `Bu rapor RADAR Konsolide Finans Terminali uygulaması aracılığıyla Google Drive hesabınıza güvenle arşivlenmiştir.\n`;
    return md;
  };

  // Perform upload after confirmation
  const handleConfirmUpload = async () => {
    setShowUploadConfirm(false);
    setUploading(true);
    setMessage(null);

    const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName =
      format === 'markdown'
        ? `Piyasa_Raporu_${nowStr}.md`
        : `Kuyumcu_Doviz_${nowStr}.json`;
    const mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
    const content = generateReportContent();

    try {
      const createdFile = await uploadReportToDrive(fileName, content, mimeType);
      setMessage({
        type: 'success',
        text: `"${createdFile.name}" başarıyla Google Drive hesabınıza kaydedildi!`,
      });
      await fetchFiles();
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Google Drive raporu yüklenemedi.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Perform delete after confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    const target = fileToDelete;
    setFileToDelete(null);
    setLoading(true);

    try {
      await deleteFileFromDrive(target.id);
      setMessage({
        type: 'success',
        text: `"${target.name}" Google Drive'dan başarıyla silindi.`,
      });
      await fetchFiles();
    } catch (err: any) {
      console.error('Drive delete error:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Dosya silinemedi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Google Drive Piyasa Arşivi</h3>
              <p className="text-xs text-slate-400">Güncel kurları ve portföy durumunu Google Drive'a kaydedin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Notification Alert Message */}
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* If user not logged in */}
          {!user ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Google Girişi Gerekli</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Google Drive'a piyasa raporu kaydedebilmek veya eski arşivlerinizi görüntülemek için Google ile giriş yapmanız gerekmektedir.
                </p>
              </div>
              <button
                onClick={onLogin}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
              >
                Google ile Giriş Yap & Drive'ı Bağla
              </button>
            </div>
          ) : (
            <>
              {/* Export Panel */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>Yeni Piyasa Snapshot Raporu Oluştur</span>
                  </div>
                  <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setFormat('markdown')}
                      className={`px-2.5 py-0.5 rounded transition ${
                        format === 'markdown'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Markdown (.md)
                    </button>
                    <button
                      onClick={() => setFormat('json')}
                      className={`px-2.5 py-0.5 rounded transition ${
                        format === 'json'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      JSON (.json)
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Şu anki 6 firmanın tüm altın (has, 22 ayar, çeyrek, vb.) ve döviz kurları,
                  saat ve tarih bilgisiyle Google Drive hesabınıza dosya olarak aktarılacaktır.
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowUploadConfirm(true)}
                    disabled={uploading}
                    className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploading ? 'Yükleniyor...' : "Google Drive'a Kaydet"}</span>
                  </button>
                </div>
              </div>

              {/* Existing Drive Reports List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Drive'daki Kayıtlı Raporlar ({files.length})</span>
                  </div>
                  <button
                    onClick={fetchFiles}
                    disabled={loading}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Listeyi Yenile"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Google Drive dosyaları taranıyor...
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                    Henüz Google Drive'a kaydedilmiş piyasa raporunuz bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-900 text-amber-400 shrink-0">
                            {file.name.endsWith('.json') ? (
                              <FileCode className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(file.createdTime).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition"
                              title="Drive'da Aç"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                            title="Drive'dan Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

      </div>

      {/* Confirmation Modal for Upload (as mandated by Workspace skill) */}
      <ConfirmationModal
        isOpen={showUploadConfirm}
        title="Google Drive'a Dosya Yükle"
        message="6 firmanın altın ve döviz fiyatlarını içeren yeni bir rapor Google Drive hesabınıza yüklenecektir. Bu işlemi onaylıyor musunuz?"
        confirmLabel="Evet, Yükle"
        cancelLabel="İptal"
        isDestructive={false}
        onConfirm={handleConfirmUpload}
        onCancel={() => setShowUploadConfirm(false)}
      />

      {/* Confirmation Modal for Deletion (as mandated by Workspace skill) */}
      <ConfirmationModal
        isOpen={Boolean(fileToDelete)}
        title="Dosyayı Google Drive'dan Sil"
        message={`"${fileToDelete?.name}" adlı rapor kalıcı olarak Google Drive hesabınızdan silinecektir. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFileToDelete(null)}
      />

    </div>
  );
};
